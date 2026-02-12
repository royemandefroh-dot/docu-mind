"use client";

import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type SidebarView } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DragDropZone } from "@/components/DragDropZone";
import { DocumentCard } from "@/components/DocumentCard";
import { SortFilterBar, type SortField, type SortDirection, type FileTypeFilter } from "@/components/SortFilterBar";
import { SettingsView } from "@/components/SettingsView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getFileTypeLabel, getFileTypeSortOrder } from "@/lib/utils/fileTypes";
import {
    deleteDocument,
    archiveDocument,
    restoreDocument,
    toggleStar,
    renameDocument,
} from "@/lib/actions/documents";
import type { StorageUsage } from "@/lib/actions/documents";
import type { SupabaseDocument } from "@/types/documents";
import type { Project } from "@/types/documents";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
    FileText,
    Upload,
    Sparkles,
    FolderOpen,
    Archive,
    Pin,
    CheckCircle2,
    XCircle,
    LogOut,
    Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/nextjs";

type ViewMode = "grid" | "list";

interface DashboardClientProps {
    documents: SupabaseDocument[];
    storageUsage: StorageUsage;
    projects: Project[];
}

export function DashboardClient({ documents: initialDocs, storageUsage: initialStorageUsage, projects }: DashboardClientProps) {
    const router = useRouter();
    const { signOut } = useClerk();
    const [documents, setDocuments] = useState(initialDocs);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeView, setActiveView] = useState<SidebarView>("workspace");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [filterPinned, setFilterPinned] = useState(false);
    const [filterType, setFilterType] = useState<FileTypeFilter>("all");
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [, startTransition] = useTransition();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const uploadRef = useRef<HTMLDivElement>(null);

    const currentStorageUsage: StorageUsage = {
        usedBytes: documents.reduce((sum, d) => sum + d.file_size, 0),
        totalBytes: initialStorageUsage.totalBytes,
    };

    useKeyboardShortcuts({
        onSearch: useCallback(() => {
            searchInputRef.current?.focus();
        }, []),
    });

    const showToast = useCallback((type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const handleQuickUpload = useCallback(() => {
        if (activeView !== "workspace") {
            setActiveView("workspace");
        }
        setTimeout(() => {
            uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            const fileInput = uploadRef.current?.querySelector("input[type='file']") as HTMLInputElement | null;
            fileInput?.click();
        }, 100);
    }, [activeView]);

    const handleBack = useCallback(() => {
        setActiveView("workspace");
    }, []);



    const handleDeleteAll = useCallback(() => {
        setDocuments([]);
        showToast("success", "All documents deleted.");
    }, [showToast]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint for sidebar collapse
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        setDocuments(initialDocs);
    }, [initialDocs]);

    useEffect(() => {
        const hasProcessing = documents.some(d => d.status === "queued" || d.status === "processing");
        if (!hasProcessing) return;
        const interval = setInterval(() => router.refresh(), 5000);
        return () => clearInterval(interval);
    }, [documents, router]);

    useEffect(() => {
        const channel = supabaseBrowser
            .channel("documents-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "documents" },
                (payload) => {
                    const newDoc = payload.new as SupabaseDocument;
                    setDocuments((prev) => {
                        if (prev.some((d) => d.id === newDoc.id)) return prev;
                        return [newDoc, ...prev];
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "documents" },
                (payload) => {
                    const updated = payload.new as SupabaseDocument;
                    setDocuments((prev) =>
                        prev.map((d) =>
                            d.id === updated.id ? { ...d, ...updated } : d
                        )
                    );
                    if (updated.status === "completed") {
                        showToast("success", `"${updated.file_name}" processed successfully!`);
                    } else if (updated.status === "failed") {
                        showToast("error", `Processing failed for "${updated.file_name}"`);
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "documents" },
                (payload) => {
                    const deletedId = (payload.old as { id?: string })?.id;
                    if (deletedId) {
                        setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [showToast]);

    const handleDelete = useCallback(
        (docId: string) => {
            setDeletingIds((prev) => new Set(prev).add(docId));
            startTransition(async () => {
                const result = await deleteDocument(docId);
                if (result.success) {
                    setDocuments((prev) => prev.filter((d) => d.id !== docId));
                    showToast("success", "Document deleted.");
                } else {
                    showToast("error", result.message);
                }
                setDeletingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(docId);
                    return next;
                });
            });
        },
        [showToast]
    );

    const handleArchive = useCallback(
        (docId: string) => {
            startTransition(async () => {
                const result = await archiveDocument(docId);
                if (result.success) {
                    setDocuments((prev) =>
                        prev.map((d) => (d.id === docId ? { ...d, is_archived: true } : d))
                    );
                    showToast("success", "Document archived.");
                } else {
                    showToast("error", result.message);
                }
            });
        },
        [showToast]
    );

    const handleRestore = useCallback(
        (docId: string) => {
            startTransition(async () => {
                const result = await restoreDocument(docId);
                if (result.success) {
                    setDocuments((prev) =>
                        prev.map((d) => (d.id === docId ? { ...d, is_archived: false } : d))
                    );
                    showToast("success", "Document restored.");
                } else {
                    showToast("error", result.message);
                }
            });
        },
        [showToast]
    );

    const handleStar = useCallback(
        (docId: string, starred: boolean) => {
            setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, is_starred: starred } : d))
            );
            startTransition(async () => {
                const result = await toggleStar(docId, starred);
                if (!result.success) {
                    setDocuments((prev) =>
                        prev.map((d) => (d.id === docId ? { ...d, is_starred: !starred } : d))
                    );
                    showToast("error", result.message);
                }
            });
        },
        [showToast]
    );

    const handleRename = useCallback(
        (docId: string, newName: string) => {
            const oldName = documents.find((d) => d.id === docId)?.file_name;
            setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, file_name: newName } : d))
            );
            startTransition(async () => {
                const result = await renameDocument(docId, newName);
                if (!result.success) {
                    setDocuments((prev) =>
                        prev.map((d) => (d.id === docId ? { ...d, file_name: oldName ?? newName } : d))
                    );
                    showToast("error", result.message);
                }
            });
        },
        [documents, showToast]
    );

    const getFilteredDocs = useCallback(() => {
        let docs = [...documents];

        if (typeof activeView === "string") {
            switch (activeView) {
                case "workspace":
                    docs = docs.filter((d) => !d.is_archived);
                    break;
                case "recent": {
                    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                    docs = docs.filter(
                        (d) =>
                            !d.is_archived &&
                            new Date(d.last_opened_at || d.created_at).getTime() > thirtyDaysAgo
                    );
                    break;
                }
                case "starred":
                    docs = docs.filter((d) => d.is_starred && !d.is_archived);
                    break;
                case "archived":
                    docs = docs.filter((d) => d.is_archived);
                    break;
                case "settings":
                    return [];
            }
        } else if (activeView.type === "project") {
            docs = docs.filter(
                (d) => d.project_id === activeView.projectId && !d.is_archived
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            docs = docs.filter(
                (d) =>
                    d.file_name.toLowerCase().includes(q) ||
                    (d.summary && d.summary.toLowerCase().includes(q))
            );
        }

        if (filterPinned) docs = docs.filter((d) => d.is_starred);

        if (filterType !== "all") {
            docs = docs.filter((d) => getFileTypeLabel(d.file_type || "") === filterType);
        }

        docs.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case "name":
                    cmp = a.file_name.localeCompare(b.file_name);
                    break;
                case "date":
                    cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    break;
                case "size":
                    cmp = b.file_size - a.file_size;
                    break;
                case "type":
                    cmp = getFileTypeSortOrder(a.file_type || "") - getFileTypeSortOrder(b.file_type || "");
                    break;
            }
            return sortDirection === "asc" ? -cmp : cmp;
        });


        docs.sort((a, b) => {
            if (a.is_starred && !b.is_starred) return -1;
            if (!a.is_starred && b.is_starred) return 1;
            return 0;
        });

        return docs;
    }, [documents, activeView, searchQuery, filterPinned, filterType, sortField, sortDirection]);

    const filteredDocs = getFilteredDocs();

    const activeDocs = documents.filter((d) => !d.is_archived);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const docCounts = {
        total: activeDocs.length,
        recent: activeDocs.filter(
            (d) => new Date(d.last_opened_at || d.created_at).getTime() > thirtyDaysAgo
        ).length,
        pinned: activeDocs.filter((d) => d.is_starred).length,
        archived: documents.filter((d) => d.is_archived).length,
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isSettings = activeView === "settings";
    const isArchived = activeView === "archived";

    const getEmptyState = () => {
        if (typeof activeView === "string") {
            switch (activeView) {
                case "starred":
                    return {
                        icon: Pin,
                        title: "No pinned documents",
                        desc: "Pin documents to keep them at the top of your workspace",
                    };
                case "archived":
                    return {
                        icon: Archive,
                        title: "No archived documents",
                        desc: "Archived documents will appear here",
                    };
                case "recent":
                    return {
                        icon: Sparkles,
                        title: "No recent activity",
                        desc: "Documents you've opened recently will show up here",
                    };
                default:
                    return null;
            }
        }
        if (activeView.type === "project") {
            return {
                icon: FolderOpen,
                title: `No documents in "${activeView.projectName}"`,
                desc: "Move documents to this project from the workspace",
            };
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-transparent" suppressHydrationWarning>
            {toast && (
                <div
                    className={cn(
                        "fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-right-4 duration-300",
                        toast.type === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md"
                            : "bg-destructive/10 text-destructive border border-destructive/20 backdrop-blur-md"
                    )}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    {toast.msg}
                </div>
            )}

            <Sidebar
                storageUsed={currentStorageUsage.usedBytes}
                storageTotal={currentStorageUsage.totalBytes}
                activeView={activeView}
                onNavigate={setActiveView}
                projects={projects}
                docCounts={docCounts}
                isCollapsed={isSidebarCollapsed}
                onToggle={setIsSidebarCollapsed}
                isMobile={isMobile}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className={cn(
                "flex-1 transition-all duration-300 ease-in-out",
                isMobile ? "pl-0" : (isSidebarCollapsed ? "pl-20" : "pl-64")
            )}>
                <div className="flex h-screen flex-col">
                    <Header
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchInputRef={searchInputRef}
                        activeView={activeView}
                        docCount={filteredDocs.length}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onQuickUpload={handleQuickUpload}
                        onBack={handleBack}
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                    />

                    <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
                        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {isSettings ? (
                                <SettingsView
                                    storageUsage={currentStorageUsage}
                                    documents={documents}
                                    onDeleteAll={handleDeleteAll}
                                />
                            ) : (
                                <>
                                    {(activeView === "workspace" ||
                                        (typeof activeView === "object" && activeView.type === "project")) && (
                                            <div ref={uploadRef} className="relative mb-6 sm:mb-10 space-y-0">
                                                {/* Top-right controls — positioned on parent, outside overflow-hidden */}
                                                <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                                                    <ThemeToggle className="h-9 w-9 rounded-xl bg-background/40 backdrop-blur-md border border-border/30 hover:bg-background/60" />
                                                    <button
                                                        onClick={() => signOut({ redirectUrl: "/" })}
                                                        className="flex h-9 items-center gap-2 rounded-xl bg-background/40 backdrop-blur-md border border-border/30 px-3 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground transition-all"
                                                        title="Sign out"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Sign Out</span>
                                                    </button>
                                                </div>
                                                <div className="relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-br from-primary/30 via-indigo-500/20 to-primary/10 border border-border dark:border-white/10 border-b-0 px-4 sm:px-8 py-6 sm:py-10 text-center">
                                                    <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
                                                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[400px] rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
                                                    <div className="relative z-10">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary backdrop-blur-sm mb-4">
                                                            <Sparkles className="h-3 w-3" />
                                                            AI Powered Document Analysis
                                                        </span>
                                                        <h2 className="font-heading text-xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                                            Upload. Analyze.{" "}
                                                            <span className="text-gradient">Understand.</span>
                                                        </h2>
                                                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                                                            Drag & drop your documents to unlock powerful AI insights instantly.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="rounded-b-2xl sm:rounded-b-3xl border border-border dark:border-white/10 border-t-0 bg-card/30 backdrop-blur-sm px-4 sm:px-8 py-5 sm:py-8">
                                                    <DragDropZone />
                                                    <a
                                                        href="/dashboard/plans"
                                                        className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors group"
                                                    >
                                                        <Zap className="h-3 w-3 text-primary/40 group-hover:text-primary" />
                                                        <span>Need larger uploads? <strong className="font-semibold text-muted-foreground/80 group-hover:text-primary">Upgrade to Pro</strong> for 25MB files & 500MB storage</span>
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                    {filteredDocs.length > 0 && (
                                        <SortFilterBar
                                            sortField={sortField}
                                            sortDirection={sortDirection}
                                            onSortChange={(field) => {
                                                if (field === sortField) {
                                                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                                                } else {
                                                    setSortField(field);
                                                    setSortDirection(field === "name" ? "asc" : "desc");
                                                }
                                            }}
                                            onDirectionToggle={() =>
                                                setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                                            }
                                            filterPinned={filterPinned}
                                            onFilterPinnedToggle={() => setFilterPinned((p) => !p)}
                                            filterType={filterType}
                                            onFilterTypeChange={setFilterType}
                                        />
                                    )}

                                    {filteredDocs.length > 0 ? (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={viewMode}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                                className={cn(
                                                    viewMode === "grid"
                                                        ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                                        : "flex flex-col gap-2"
                                                )}
                                            >
                                                {filteredDocs.map((doc, index) => (
                                                    <motion.div
                                                        key={doc.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            delay: Math.min(index * 0.04, 0.4),
                                                            ease: [0.25, 0.1, 0.25, 1],
                                                        }}
                                                    >
                                                        <DocumentCard
                                                            id={doc.id}
                                                            title={doc.file_name}
                                                            size={formatFileSize(doc.file_size)}
                                                            dateISO={doc.created_at}
                                                            tags={[
                                                                getFileTypeLabel(doc.file_type || ""),
                                                            ]}
                                                            summary={doc.summary}
                                                            status={doc.status}
                                                            isStarred={doc.is_starred}
                                                            isArchived={doc.is_archived}
                                                            onDelete={handleDelete}
                                                            onStar={handleStar}
                                                            onArchive={isArchived ? undefined : handleArchive}
                                                            onRestore={isArchived ? handleRestore : undefined}
                                                            onRename={handleRename}
                                                            isDeleting={deletingIds.has(doc.id)}
                                                            viewMode={viewMode}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        </AnimatePresence>
                                    ) : (
                                        (() => {
                                            const empty = getEmptyState();
                                            const EmptyIcon = empty?.icon ?? FileText;
                                            return (
                                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-6">
                                                        <EmptyIcon className="h-10 w-10 text-primary/60" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                                        {empty?.title || (searchQuery ? "No matching documents" : "No documents yet")}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground max-w-md mb-8">
                                                        {empty?.desc ||
                                                            (searchQuery
                                                                ? `No results for "${searchQuery}". Try a different search term.`
                                                                : "Upload your first PDF document to get started with AI-powered document analysis.")}
                                                    </p>
                                                    {!searchQuery &&
                                                        activeView === "workspace" && (
                                                            <Button
                                                                onClick={handleQuickUpload}
                                                                className="flex items-center gap-2 px-6 py-6 text-sm font-medium shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95"
                                                            >
                                                                <Upload className="h-4 w-4" />
                                                                Upload Document
                                                            </Button>
                                                        )}
                                                    {(filterPinned || filterType !== "all") && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setFilterPinned(false);
                                                                setFilterType("all");
                                                            }}
                                                            className="flex items-center gap-2 mt-4 text-sm"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Clear Filters & Show All Documents
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
