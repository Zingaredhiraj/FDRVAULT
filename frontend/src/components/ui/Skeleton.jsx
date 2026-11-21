import React from 'react';

/**
 * Single skeleton bar
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    />
  );
}

/**
 * Table skeleton — rows × cols grid of bars
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-4 py-4 border-t border-slate-100 dark:border-slate-800"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3 flex-1 ${c === 0 ? 'max-w-[120px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Row of KPI card skeletons
 */
export function SkeletonKpiStrip({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full-page loading state: header + KPI strip + table
 */
export function SkeletonPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 animate-pulse">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>

      {/* KPI strip */}
      <SkeletonKpiStrip count={4} />

      {/* Filter / toolbar row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="ml-auto h-9 w-24 rounded-xl" />
      </div>

      {/* Table */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
