"use client";

export function SkeletonCard() {
  return (
    <div className="bg-white overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-navy/5" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-navy/5 rounded w-24" />
        <div className="h-4 bg-navy/5 rounded w-3/4" />
        <div className="h-3 bg-navy/5 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-white border border-navy/10 p-4 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 bg-navy/5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-navy/5 rounded w-3/4" />
        <div className="h-3 bg-navy/5 rounded w-1/2" />
      </div>
      <div className="h-6 bg-navy/5 rounded w-16" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white p-6 animate-pulse">
      <div className="h-8 bg-navy/5 rounded w-12 mb-2" />
      <div className="h-3 bg-navy/5 rounded w-20" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-10 space-y-2">
        <div className="h-8 bg-navy/5 rounded w-64 animate-pulse" />
        <div className="h-4 bg-navy/5 rounded w-48 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
