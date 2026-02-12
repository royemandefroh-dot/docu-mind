"use client";

import { UploadCloud, Loader2, CheckCircle2, XCircle, FileText, FileSpreadsheet, Presentation, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ingestDocument } from "@/lib/actions/ingest";

type Status = "idle" | "processing" | "success" | "error";

const ACCEPTED_TYPES: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
};
const ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx";
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function getFileTypeLabel(file: File): string {
    if (ACCEPTED_TYPES[file.type]) return ACCEPTED_TYPES[file.type];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "docx") return "Word";
    if (ext === "pptx") return "PowerPoint";
    return "Unknown";
}

function isAcceptedFile(file: File): boolean {
    if (ACCEPTED_TYPES[file.type]) return true;
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext === "pdf" || ext === "docx" || ext === "pptx";
}

interface DragDropZoneProps {
    onUploadComplete?: () => void;
}

export function DragDropZone({ onUploadComplete }: DragDropZoneProps = {}) {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        if (!isAcceptedFile(file)) {
            setStatus("error");
            setMessage("Only PDF, Word (.docx), and PowerPoint (.pptx) files are accepted.");
            setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
            return;
        }

        if (file.size > MAX_SIZE_BYTES) {
            setStatus("error");
            setMessage(`File exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller file.`);
            setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
            return;
        }

        const typeLabel = getFileTypeLabel(file);
        setStatus("processing");
        setProgress(0);
        setMessage(`Uploading ${typeLabel} "${file.name}"...`);

        const progressInterval = setInterval(() => {
            setProgress((p) => Math.min(p + Math.random() * 15, 90));
        }, 300);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await ingestDocument(formData);
            clearInterval(progressInterval);

            if (result.success) {
                setProgress(100);
                setStatus("success");
                setMessage(result.message);
                router.refresh();
                if (onUploadComplete) {
                    setTimeout(() => onUploadComplete(), 1200);
                }
            } else {
                setStatus("error");
                setMessage(result.message);
            }
        } catch {
            clearInterval(progressInterval);
            setStatus("error");
            setMessage("An unexpected error occurred. Please try again.");
        }

        setTimeout(() => {
            setStatus("idle");
            setMessage("");
            setProgress(0);
        }, 3000);
    }, [router, onUploadComplete]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        },
        [processFile]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                processFile(files[0]);
            }
            e.target.value = "";
        },
        [processFile]
    );

    const handleClick = useCallback(() => {
        if (status !== "processing") {
            fileInputRef.current?.click();
        }
    }, [status]);

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={handleFileSelect}
            />

            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "group relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-6 sm:p-12 text-center transition-all duration-500 ease-out cursor-pointer",
                    "border-border/60 bg-card/30",
                    "shadow-sm hover:shadow-xl",
                    status === "processing"
                        ? "pointer-events-none border-primary/40 bg-primary/5"
                        : "hover:border-primary/50 hover:bg-primary/5",
                    isDragging
                        ? "border-primary bg-primary/10 shadow-[0_0_80px_-20px_var(--primary-color)] scale-[1.02]"
                        : ""
                )}
            >
                <div
                    className={cn(
                        "mb-3 sm:mb-4 flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full transition-all duration-500",
                        status === "processing"
                            ? "bg-primary text-primary-foreground animate-pulse"
                            : status === "success"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : status === "error"
                                    ? "bg-destructive/20 text-destructive"
                                    : cn(
                                        "bg-secondary group-hover:bg-primary group-hover:text-primary-foreground",
                                        isDragging
                                            ? "bg-primary text-primary-foreground scale-110"
                                            : "text-muted-foreground"
                                    )
                    )}
                >
                    {status === "processing" ? (
                        <Loader2 className="h-7 w-7 sm:h-10 sm:w-10 animate-spin" />
                    ) : status === "success" ? (
                        <CheckCircle2 className="h-7 w-7 sm:h-10 sm:w-10" />
                    ) : status === "error" ? (
                        <XCircle className="h-7 w-7 sm:h-10 sm:w-10" />
                    ) : (
                        <UploadCloud className="h-7 w-7 sm:h-10 sm:w-10 transition-transform duration-500 group-hover:-translate-y-1" />
                    )}
                </div>

                <h3
                    className={cn(
                        "mb-1.5 sm:mb-2 text-base sm:text-xl font-semibold tracking-tight transition-colors",
                        status === "success"
                            ? "text-emerald-400"
                            : status === "error"
                                ? "text-destructive"
                                : "text-foreground group-hover:text-primary"
                    )}
                >
                    {status === "processing"
                        ? "Uploading..."
                        : status === "success"
                            ? "Queued for Processing!"
                            : status === "error"
                                ? "Upload Failed"
                                : "Upload Documents"}
                </h3>

                <p className="mb-3 sm:mb-4 max-w-md text-xs sm:text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
                    {message ||
                        "Drag & drop your documents here, or click to browse. Max 5MB per file."}
                </p>

                {status === "idle" && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4 sm:mb-5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
                            <FileText className="h-3 w-3" /> PDF
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                            <FileSpreadsheet className="h-3 w-3" /> DOCX
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-400 ring-1 ring-inset ring-orange-500/20">
                            <Presentation className="h-3 w-3" /> PPTX
                        </span>
                    </div>
                )}

                {status === "idle" && (
                    <button
                        type="button"
                        className="relative overflow-hidden rounded-full bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                    >
                        <span className="relative z-10">Select Files</span>
                    </button>
                )}

                {status === "processing" && (
                    <div className="mt-2 h-1.5 w-32 sm:w-48 overflow-hidden rounded-full bg-primary/20">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div
                    className={cn(
                        "pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500",
                        isDragging ? "opacity-100" : "group-hover:opacity-30"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl" />
                </div>
            </div>
        </div>
    );
}
