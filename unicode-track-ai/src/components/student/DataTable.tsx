"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Filter rows...",
  filterKey,
  className,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  filterKey?: (row: T) => string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q && filterKey
      ? data.filter((row) => filterKey(row).toLowerCase().includes(q))
      : data;

    if (!sortCol) return base;
    const col = columns.find((c) => String(c.key) === sortCol);
    if (!col || !col.sortValue) return base;
    const getVal = col.sortValue;
    return [...base].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, query, filterKey, sortCol, sortAsc, columns]);

  const toggleSort = (key: string) => {
    if (sortCol === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(key);
      setSortAsc(true);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] overflow-hidden",
        className
      )}
    >
      {filterKey && (
        <div className="p-3.5 border-b border-[var(--neutral-border)] flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="w-4 h-4 text-[var(--neutral-muted)] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-bg)] pl-9 pr-3 py-1.5 text-sm text-[var(--neutral-text)] placeholder:text-[var(--neutral-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <span className="text-xs text-[var(--neutral-muted)] tabular-nums shrink-0">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--neutral-border)] bg-[var(--neutral-surface)]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-[var(--neutral-muted)] whitespace-nowrap",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.sortable && col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(String(col.key))}
                      className="inline-flex items-center gap-1 hover:text-[var(--neutral-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded cursor-pointer"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-[var(--neutral-border)] last:border-b-0 transition-colors hover:bg-[var(--primary-soft)]/50",
                  idx % 2 === 1 ? "bg-[var(--neutral-bg)]/60" : "bg-[var(--neutral-card)]"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "px-4 py-3 text-[var(--neutral-text)] align-middle",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
