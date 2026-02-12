"use client";

import {
    ArrowUpDown,
    SortAsc,
    SortDesc,
    Filter,
    Pin,
    X,
    FileText,
    FileType2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileTypeColor } from "@/lib/utils/fileTypes";

export type SortField = "name" | "date" | "size" | "type";
export type SortDirection = "asc" | "desc";
export type FileTypeFilter = "all" | "PDF" | "Word" | "PPTX";

interface SortFilterBarProps {
    sortField: SortField;
    sortDirection: SortDirection;
    onSortChange: (field: SortField) => void;
    onDirectionToggle: () => void;
    filterPinned: boolean;
    onFilterPinnedToggle: () => void;
    filterType: FileTypeFilter;
    onFilterTypeChange: (type: FileTypeFilter) => void;
}

export function SortFilterBar({
    sortField,
    sortDirection,
    onSortChange,
    onDirectionToggle,
    filterPinned,
    onFilterPinnedToggle,
    filterType,
    onFilterTypeChange,
}: SortFilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground mr-0.5 sm:mr-1 shrink-0">Sort:</span>
                {(["date", "name", "size", "type"] as SortField[]).map((field) => (
                    <button
                        key={field}
                        onClick={() => onSortChange(field)}
                        className={cn(
                            "rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0",
                            sortField === field
                                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                    </button>
                ))}
                <button
                    onClick={onDirectionToggle}
                    className="ml-0.5 sm:ml-1 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                    title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                    {sortDirection === "asc" ? (
                        <SortAsc className="h-3.5 w-3.5" />
                    ) : (
                        <SortDesc className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <Filter className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    (filterPinned || filterType !== "all") ? "text-primary" : "text-muted-foreground"
                )} />

                {(["PDF", "Word", "PPTX"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => onFilterTypeChange(filterType === type ? "all" : type)}
                        className={cn(
                            "rounded-md px-2 py-1 text-[10px] font-semibold transition-all ring-1 ring-inset shrink-0",
                            filterType === type
                                ? getFileTypeColor(type)
                                : "text-muted-foreground/60 ring-transparent hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {type}
                    </button>
                ))}

                <div className="h-3.5 w-px bg-border mx-0.5 shrink-0" />

                <button
                    onClick={onFilterPinnedToggle}
                    className={cn(
                        "flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0",
                        filterPinned
                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                >
                    <Pin className="h-3 w-3" />
                    Pinned
                </button>
                {(filterPinned || filterType !== "all") && (
                    <button
                        onClick={() => { onFilterPinnedToggle(); if (filterType !== "all") onFilterTypeChange("all"); }}
                        className="ml-0.5 sm:ml-1 rounded-md p-1 text-muted-foreground/60 hover:text-destructive transition-colors shrink-0"
                        title="Clear all filters"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
