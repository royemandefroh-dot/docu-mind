"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Send,
    X,
    MessageSquare,
    Loader2,
    Bot,
    User,
    Sparkles,
    Zap,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { getChatMessages } from "@/lib/actions/chat";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatPanelProps {
    docId: string;
    docTitle: string;
    onClose: () => void;
}

export function ChatPanel({ docId, docTitle, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        async function loadHistory() {
            try {
                const saved = await getChatMessages(docId);
                if (saved.length > 0) {
                    setMessages(
                        saved.map((m) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                        }))
                    );
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
            } finally {
                setIsLoadingHistory(false);
            }
        }
        loadHistory();
    }, [docId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    docId,
                }),
            });

            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error(
                    res.status === 401 || res.status === 403 || res.redirected
                        ? "Session expired. Please refresh the page and sign in again."
                        : `Server returned an unexpected response (HTTP ${res.status}). Please try again.`
                );
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.content || "No response received.",
                },
            ]);
        } catch (err) {
            const errMsg =
                err instanceof Error ? err.message : "An error occurred";
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `⚠️ ${errMsg}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 flex w-full sm:max-w-lg flex-col border-l border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 sm:px-5 py-3 sm:py-4 bg-card/50">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                            Chat with Document
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 max-w-[180px] sm:max-w-none">
                            <FileText className="h-3 w-3 shrink-0" />
                            {docTitle}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 sm:space-y-5">
                {isLoadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                        <p className="text-xs text-muted-foreground mt-2">Loading history…</p>
                    </div>
                )}
                {!isLoadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-4">
                            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary/60" />
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                            Ask anything about your document
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                            DocuMind will search through your uploaded document
                            and answer based on its contents.
                        </p>

                        <div className="mt-5 sm:mt-6 space-y-2 w-full max-w-xs">
                            {[
                                "What is this document about?",
                                "Summarize the key points",
                                "What are the main conclusions?",
                            ].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => {
                                        setInput(q);
                                        inputRef.current?.focus();
                                    }}
                                    className="w-full rounded-xl border border-border/60 bg-card/40 px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground active:scale-[0.98]"
                                >
                                    💡 {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-2 sm:gap-3",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === "assistant" && (
                            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 mt-0.5">
                                <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </div>
                        )}
                        <div
                            className={cn(
                                "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-card border border-border/50 text-foreground rounded-bl-md"
                            )}
                        >
                            <ChatMessage content={msg.content} role={msg.role} />
                        </div>
                        {msg.role === "user" && (
                            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground ring-1 ring-border mt-0.5">
                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3 sm:p-4 bg-card/30">
                {messages.length >= 2 && (
                    <a
                        href="/dashboard/plans"
                        className="flex items-center justify-center gap-1.5 mb-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors group"
                    >
                        <Zap className="h-3 w-3 text-primary/60 group-hover:text-primary" />
                        <span>Upgrade for <strong className="font-semibold text-foreground/70 group-hover:text-primary">GPT-4o</strong> & unlimited chats</span>
                    </a>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this document..."
                        disabled={isLoading}
                        className="flex-1 rounded-xl border border-input bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
