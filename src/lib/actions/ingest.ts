"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IngestResponse } from "@/types/documents";
import { revalidatePath } from "next/cache";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 500;

const ACCEPTED_MIME_TYPES: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

function getFileExtension(fileName: string): string {
    return fileName.split(".").pop()?.toLowerCase() || "";
}

function isAcceptedFile(file: File): boolean {
    if (ACCEPTED_MIME_TYPES[file.type]) return true;
    const ext = getFileExtension(file.name);
    return ext === "pdf" || ext === "docx" || ext === "pptx";
}

function resolveFileType(file: File): string {
    if (ACCEPTED_MIME_TYPES[file.type]) return ACCEPTED_MIME_TYPES[file.type];
    return getFileExtension(file.name);
}

function sanitizeText(raw: string): string {
    return raw
        .replace(/\0/g, "")
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/\uFFFD/g, "")
        .replace(/[\uFFF0-\uFFFF]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

function splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        let chunkEnd = end;
        if (end < text.length) {
            const lastNewline = text.lastIndexOf("\n", end);
            const lastPeriod = text.lastIndexOf(". ", end);
            const lastSpace = text.lastIndexOf(" ", end);
            if (lastNewline > start + CHUNK_SIZE * 0.5) chunkEnd = lastNewline + 1;
            else if (lastPeriod > start + CHUNK_SIZE * 0.5) chunkEnd = lastPeriod + 2;
            else if (lastSpace > start + CHUNK_SIZE * 0.5) chunkEnd = lastSpace + 1;
        }
        chunks.push(text.slice(start, chunkEnd).trim());
        start = chunkEnd - CHUNK_OVERLAP;
        if (start < 0) start = 0;
        if (chunkEnd >= text.length) break;
    }
    return chunks.filter((c) => c.length > 0);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    let rawText = "";
    try {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text;
    } catch {
        rawText = "";
    }

    if (!rawText || rawText.trim().length < 50) {
        try {
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker("eng");
            const { data: ocrData } = await worker.recognize(buffer);
            await worker.terminate();
            rawText = ocrData.text;
        } catch {
            rawText = "";
        }
    }

    return rawText;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
}

async function extractPptxText(buffer: Buffer): Promise<string> {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    const slideFiles = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
            const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
            return numA - numB;
        });

    const textParts: string[] = [];

    for (let i = 0; i < slideFiles.length; i++) {
        const xml = await zip.files[slideFiles[i]].async("text");
        const texts: string[] = [];
        const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
            const text = match[1]
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .trim();
            if (text) texts.push(text);
        }

        if (texts.length > 0) {
            textParts.push(`--- Slide ${i + 1} ---\n${texts.join(" ")}`);
        }
    }

    return textParts.join("\n\n");
}

async function processDocumentInline(
    docId: string,
    userId: string,
    filePath: string,
    fileName: string,
    fileType: string
) {
    const supabase = getSupabaseAdmin();

    await supabase
        .from("documents")
        .update({ status: "processing" })
        .eq("id", docId);

    const { data, error } = await supabase.storage
        .from("user_uploads")
        .download(filePath);

    if (error || !data) {
        throw new Error(`Failed to download file: ${error?.message || "No data"}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    switch (fileType) {
        case "docx":
            rawText = await extractDocxText(buffer);
            break;
        case "pptx":
            rawText = await extractPptxText(buffer);
            break;
        case "pdf":
        default:
            rawText = await extractPdfText(buffer);
            break;
    }

    if (!rawText || rawText.trim().length === 0) {
        const typeLabel = fileType === "docx" ? "Word document" : fileType === "pptx" ? "PowerPoint" : "PDF";
        throw new Error(`Could not extract text from "${fileName}". The ${typeLabel} may be empty or corrupted.`);
    }

    const cleanText = sanitizeText(rawText);
    const chunks = splitTextIntoChunks(cleanText);

    const chunkRows = chunks.map((text: string, i: number) => ({
        document_id: docId,
        user_id: userId,
        chunk_index: i,
        content: text,
    }));

    for (let i = 0; i < chunkRows.length; i += BATCH_SIZE) {
        const batch = chunkRows.slice(i, i + BATCH_SIZE);
        const { error: chunkError } = await supabase.from("document_chunks").insert(batch);
        if (chunkError) {
            throw new Error(`Failed to save chunks: ${chunkError.message}`);
        }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
        const combinedText = chunks.slice(0, 10).join("\n").slice(0, 5000);
        const groq = createGroq({ apiKey });
        const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];
        let summary: string | null = null;

        for (const modelName of models) {
            try {
                const result = await generateText({
                    model: groq(modelName),
                    system: "You are a document summarizer. Generate exactly 3 concise sentences that capture the key information of the document. Do not include any preamble — just output the 3 sentences directly.",
                    prompt: `Summarize this document:\n\n${combinedText}`,
                    maxOutputTokens: 200,
                    temperature: 0.3,
                });
                summary = result.text.trim();
                if (summary) break;
            } catch {
                continue;
            }
        }

        if (summary) {
            await supabase.from("documents").update({ summary }).eq("id", docId);
        }
    }

    await supabase
        .from("documents")
        .update({ status: "completed", status_message: null })
        .eq("id", docId);

    return { chunks: chunks.length };
}

export async function ingestDocument(
    formData: FormData
): Promise<IngestResponse> {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, message: "You must be signed in to upload." };
    }

    const file = formData.get("file") as File | null;

    if (!file) {
        return { success: false, message: "No file was provided." };
    }

    if (!isAcceptedFile(file)) {
        return {
            success: false,
            message: "Only PDF, Word (.docx), and PowerPoint (.pptx) files are supported.",
        };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            success: false,
            message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
        };
    }

    const fileType = resolveFileType(file);

    try {
        const supabase = getSupabaseAdmin();

        const { data: existingDocs } = await supabase
            .from("documents")
            .select("id, file_name")
            .eq("user_id", userId)
            .eq("file_name", file.name)
            .limit(1);

        if (existingDocs && existingDocs.length > 0) {
            return {
                success: false,
                message: `A file named "${file.name}" has already been uploaded. Please rename the file or delete the existing one first.`,
            };
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueName = `${randomUUID()}_${safeName}`;
        const storagePath = `${userId}/${uniqueName}`;

        const { error: uploadError } = await supabase.storage
            .from("user_uploads")
            .upload(storagePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            return { success: false, message: `Upload failed: ${uploadError.message}` };
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("user_uploads").getPublicUrl(storagePath);

        const { data: dbRecord, error: dbError } = await supabase
            .from("documents")
            .insert({
                user_id: userId,
                file_name: file.name,
                file_url: publicUrl,
                file_size: file.size,
                file_type: file.type,
                file_path: storagePath,
                status: "queued",
            })
            .select("id")
            .single();

        if (dbError || !dbRecord) {
            await supabase.storage.from("user_uploads").remove([storagePath]);
            return {
                success: false,
                message: `Database error: ${dbError?.message || "Unknown"}`,
            };
        }

        try {
            await processDocumentInline(
                dbRecord.id,
                userId,
                storagePath,
                file.name,
                fileType
            );
        } catch (procError) {
            await supabase
                .from("documents")
                .update({
                    status: "failed",
                    status_message: procError instanceof Error ? procError.message : "Processing failed",
                })
                .eq("id", dbRecord.id);
        }

        revalidatePath("/dashboard");

        const typeLabel = fileType === "pdf" ? "PDF" : fileType === "docx" ? "Word document" : "PowerPoint";
        return {
            success: true,
            message: `"${file.name}" (${typeLabel}) uploaded and processed!`,
            docId: dbRecord.id,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during upload.",
        };
    }
}
