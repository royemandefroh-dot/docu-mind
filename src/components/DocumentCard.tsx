"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    FileText,
    MoreHorizontal,
    Download,
    Trash2,
    Loader2,
    MessageSquare,
    Pin,
    Archive,
    Pencil,
    FolderInput,
    CheckSquare,
    Square,
    Clock,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { getFileTypeColor } from "@/lib/utils/fileTypes";
import type { DocumentStatus } from "@/types/documents";
import { motion, AnimatePresence } from "framer-motion";

function StatusBadge({ status }: { status?: DocumentStatus | null }) {
    if (!status || status === "completed") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Ready
            </span>
        );
    }

    const config = {
        queued: {
            icon: Clock,
            label: "Queued",
            className: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
        },
        processing: {
            icon: Loader2,
            label: "Processing",
            className: "bg-blue-500/10 text-blue-400 ring-blue-500/20 animate-pulse",
        },
        failed: {
            icon: AlertCircle,
            label: "Failed",
            className: "bg-destructive/10 text-destructive ring-destructive/20",
        },
    }[status];

    if (!config) return null;
    const Icon = config.icon;

    return (
        <span className={cn("z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset", config.className)}>
            <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
            {config.label}
        </span>
    );
}

interface DocumentCardProps {
    id: string;
    title: string;
    size: string;
    dateISO: string;
    tags: string[];
    summary?: string | null;
    status?: DocumentStatus | null;
    type?: "pdf" | "doc" | "image";
    isStarred?: boolean;
    isArchived?: boolean;
    onDelete?: (id: string) => void;
    onStar?: (id: string, starred: boolean) => void;
    onArchive?: (id: string) => void;
    onRestore?: (id: string) => void;
    onRename?: (id: string, newName: string) => void;
    isDeleting?: boolean;
    viewMode?: "grid" | "list";
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (id: string) => void;
}

export function DocumentCard({
    id,
    title,
    size,
    dateISO,
    tags,
    summary,
    status,
    isStarred = false,
    isArchived = false,
    onDelete,
    onStar,
    onArchive,
    onRestore,
    onRename,
    isDeleting,
    viewMode = "grid",
    selectable,
    selected,
    onSelect,
}: DocumentCardProps) {
    const [relativeDate, setRelativeDate] = useState<string>("");
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(title);
    const menuRef = useRef<HTMLDivElement>(null);
    const renameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRelativeDate(formatRelativeTime(dateISO));
        const interval = setInterval(() => {
            setRelativeDate(formatRelativeTime(dateISO));
        }, 60_000);
        return () => clearInterval(interval);
    }, [dateISO]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isRenaming && renameRef.current) {
            renameRef.current.focus();
            renameRef.current.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== title && onRename) {
            onRename(id, trimmed);
        }
        setIsRenaming(false);
    };

    if (viewMode === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className={cn(
                    "group flex items-center gap-2 sm:gap-4 rounded-xl border border-border/60 bg-card/60 dark:bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3 transition-all hover:bg-card dark:hover:bg-white/10 hover:border-border hover:shadow-md",
                    isDeleting && "pointer-events-none opacity-50",
                    selected && "ring-1 ring-primary/50 bg-primary/5 border-primary/20"
                )}
            >
                {selectable && (
                    <button
                        onClick={(e) => { e.preventDefault(); onSelect?.(id); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                    >
                        {selected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                            <Square className="h-4 w-4" />
                        )}
                    </button>
                )}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary ring-1 ring-border dark:ring-white/10">
                    <FileText className="h-5 w-5" />
                </div>

                <Link href={`/dashboard/document/${id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        {isRenaming ? (
                            <input
                                ref={renameRef}
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameSubmit();
                                    if (e.key === "Escape") { setIsRenaming(false); setRenameValue(title); }
                                }}
                                onClick={(e) => e.preventDefault()}
                                className="bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/50 pb-0.5"
                            />
                        ) : (
                            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                        )}
                        <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{size}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>{relativeDate}</span>
                    </div>
                </Link>

                <div className="hidden lg:flex items-center gap-1.5">
                    {tags.slice(0, 2).map((tag) => (
                        <span key={tag} className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", getFileTypeColor(tag))}>
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {onStar && (
                        <button
                            onClick={(e) => { e.preventDefault(); onStar(id, !isStarred); }}
                            className={cn(
                                "rounded-lg p-2 transition-colors",
                                isStarred
                                    ? "text-primary hover:bg-primary/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50 dark:hover:bg-white/5"
                            )}
                        >
                            <Pin className={cn("h-4 w-4", isStarred && "fill-current")} />
                        </button>
                    )}

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/50 dark:hover:bg-white/5 hover:text-foreground transition-colors"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                                className="absolute right-0 bottom-full mb-2 z-50 w-48 overflow-hidden rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur-2xl">
                                {onStar && (
                                    <MenuItem
                                        icon={Pin}
                                        label={isStarred ? "Unpin" : "Pin"}
                                        onClick={() => { onStar(id, !isStarred); setShowMenu(false); }}
                                    />
                                )}
                                {onRename && (
                                    <MenuItem
                                        icon={Pencil}
                                        label="Rename"
                                        onClick={() => { setIsRenaming(true); setShowMenu(false); }}
                                    />
                                )}
                                {onArchive && !isArchived && (
                                    <MenuItem
                                        icon={Archive}
                                        label="Archive"
                                        onClick={() => { onArchive(id); setShowMenu(false); }}
                                    />
                                )}
                                {onRestore && isArchived && (
                                    <MenuItem
                                        icon={FolderInput}
                                        label="Restore"
                                        onClick={() => { onRestore(id); setShowMenu(false); }}
                                    />
                                )}
                                <MenuItem icon={Download} label="Download" onClick={() => setShowMenu(false)} />
                                {onDelete && (
                                    <MenuItem
                                        icon={Trash2}
                                        label="Delete"
                                        danger
                                        onClick={() => { onDelete(id); setShowMenu(false); }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
            className={cn(
                "group relative flex flex-col rounded-2xl border border-border/60 bg-card/80 dark:bg-white/5 backdrop-blur-sm transition-all hover:bg-card dark:hover:bg-white/10 hover:border-border hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20 shadow-sm",
                isDeleting && "pointer-events-none opacity-50",
                selected && "ring-2 ring-primary/50 bg-primary/5"
            )}
        >
            <Link
                href={`/dashboard/document/${id}`}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label={`Open ${title}`}
            />

            <div className="p-4 sm:p-6 flex flex-col flex-1">
                <div className="mb-3 sm:mb-4 flex items-start justify-between">
                    <div className="relative">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary ring-1 ring-border dark:ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner shadow-primary/10">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        {selectable && (
                            <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSelect?.(id); }}
                                className="absolute -top-1 -left-1 z-20 rounded bg-background shadow-sm border border-border"
                            >
                                {selected ? (
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                    <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        )}
                    </div>

                    <div className="relative z-20" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowMenu(!showMenu); }}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/50 dark:hover:bg-white/10 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur-2xl"
                                >
                                    {onStar && (
                                        <MenuItem
                                            icon={Pin}
                                            label={isStarred ? "Unpin" : "Pin"}
                                            onClick={() => { onStar(id, !isStarred); setShowMenu(false); }}
                                        />
                                    )}
                                    {onRename && (
                                        <MenuItem
                                            icon={Pencil}
                                            label="Rename"
                                            onClick={() => { setIsRenaming(true); setShowMenu(false); }}
                                        />
                                    )}
                                    {onArchive && !isArchived && (
                                        <MenuItem
                                            icon={Archive}
                                            label="Archive"
                                            onClick={() => { onArchive(id); setShowMenu(false); }}
                                        />
                                    )}
                                    {onRestore && isArchived && (
                                        <MenuItem
                                            icon={FolderInput}
                                            label="Restore"
                                            onClick={() => { onRestore(id); setShowMenu(false); }}
                                        />
                                    )}
                                    <MenuItem icon={Download} label="Download" onClick={() => setShowMenu(false)} />
                                    {onDelete && (
                                        <MenuItem
                                            icon={Trash2}
                                            label="Delete"
                                            danger
                                            onClick={() => { onDelete(id); setShowMenu(false); }}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mb-3 flex-1">
                    {isRenaming ? (
                        <input
                            ref={renameRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSubmit();
                                if (e.key === "Escape") { setIsRenaming(false); setRenameValue(title); }
                            }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            className="relative z-20 w-full bg-transparent mb-1 font-semibold text-foreground outline-none border-b border-primary/50 pb-0.5"
                        />
                    ) : (
                        <h3
                            className="mb-1 line-clamp-1 text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300"
                            title={title}
                        >
                            {title}
                        </h3>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground/70">
                        <span>{size}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>
                            {relativeDate || "..."}
                        </span>
                    </div>

                    {summary && (
                        <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            {summary}
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/50 dark:border-white/5 pt-3 sm:pt-4">
                    <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        {tags.length > 0 && (
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", getFileTypeColor(tags[0]))}>
                                {tags[0]}
                            </span>
                        )}
                    </div>
                    <div className="relative z-20 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 sm:translate-y-2 sm:group-hover:translate-y-0">
                        {onStar && (
                            <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onStar(id, !isStarred); }}
                                className={cn(
                                    "rounded-lg p-1.5 transition-colors",
                                    isStarred
                                        ? "text-primary hover:bg-primary/10"
                                        : "text-muted-foreground hover:text-primary hover:bg-secondary/50 dark:hover:bg-white/5"
                                )}
                            >
                                <Pin className={cn("h-4 w-4", isStarred && "fill-current")} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MenuItem({
    icon: Icon,
    label,
    onClick,
    danger,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
            className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors rounded-lg",
                danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 dark:hover:bg-white/5"
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}
