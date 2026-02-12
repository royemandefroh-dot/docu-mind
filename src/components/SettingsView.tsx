"use client";

import { useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import {
    User,
    HardDrive,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteAllDocuments } from "@/lib/actions/documents";
import type { StorageUsage } from "@/lib/actions/documents";
import type { SupabaseDocument } from "@/types/documents";

interface SettingsViewProps {
    storageUsage: StorageUsage;
    documents: SupabaseDocument[];
    onDeleteAll?: () => void;
}

export function SettingsView({ storageUsage, documents, onDeleteAll }: SettingsViewProps) {
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleDeleteAll = () => {
        startTransition(async () => {
            const result = await deleteAllDocuments();
            if (result.success) {
                setToast({ type: "success", msg: "All documents deleted successfully." });
                setDeleteConfirm(false);
                onDeleteAll?.();
            } else {
                setToast({ type: "error", msg: result.message });
            }
            setTimeout(() => setToast(null), 4000);
        });
    };

    const topDocs = [...documents]
        .sort((a, b) => b.file_size - a.file_size)
        .slice(0, 5);

    const usagePercent = storageUsage.totalBytes > 0
        ? Math.round((storageUsage.usedBytes / storageUsage.totalBytes) * 100)
        : 0;

    return (
        <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {toast && (
                <div className={cn(
                    "fixed top-20 right-3 sm:right-6 left-3 sm:left-auto z-50 flex items-center gap-2 rounded-xl px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium shadow-lg animate-in slide-in-from-right-4 duration-300",
                    toast.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                )}>
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    {toast.msg}
                </div>
            )}

            <SettingsSection
                icon={User}
                title="Profile"
                description="Your account information from Clerk"
            >
                <div className="space-y-3">
                    <InfoRow label="Name" value={user?.fullName || user?.firstName || "N/A"} />
                    <InfoRow
                        label="Email"
                        value={user?.primaryEmailAddress?.emailAddress || "N/A"}
                    />
                    <InfoRow
                        label="Username"
                        value={user?.username || "N/A"}
                    />
                    <InfoRow
                        label="User ID"
                        value={user?.id || "N/A"}
                        mono
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                icon={HardDrive}
                title="Storage"
                description={`${formatBytes(storageUsage.usedBytes)} of ${formatBytes(storageUsage.totalBytes)} used (${usagePercent}%)`}
            >
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden mb-4">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700",
                            usagePercent >= 90
                                ? "bg-destructive"
                                : usagePercent >= 70
                                    ? "bg-amber-500"
                                    : "bg-primary"
                        )}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>

                {topDocs.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                            Largest files
                        </p>
                        <div className="space-y-1.5">
                            {topDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
                                >
                                    <span className="text-xs text-foreground truncate max-w-[200px]">
                                        {doc.file_name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        {formatBytes(doc.file_size)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                icon={AlertTriangle}
                title="Danger Zone"
                description="Irreversible actions"
                danger
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-foreground">Delete All Documents</p>
                        <p className="text-xs text-muted-foreground">
                            Permanently remove all {documents.length} document{documents.length !== 1 ? "s" : ""} and
                            their chunks from storage.
                        </p>
                    </div>
                    {!deleteConfirm ? (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive transition-all hover:bg-destructive/20 active:scale-95"
                        >
                            Delete All
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary/80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={isPending}
                                className="rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground transition-all hover:bg-destructive/90 active:scale-95 disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    "Confirm Delete"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </SettingsSection>
        </div>
    );
}

function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
    danger,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div className={cn(
            "rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden",
            danger ? "border-destructive/30" : "border-border/50"
        )}>
            <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
                <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    danger
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-[11px] text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn(
                "text-xs text-foreground",
                mono && "font-mono text-[11px] text-muted-foreground"
            )}>
                {value}
            </span>
        </div>
    );
}
