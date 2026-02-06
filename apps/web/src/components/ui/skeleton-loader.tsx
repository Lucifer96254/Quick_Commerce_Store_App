export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col rounded-xl bg-white ${compact ? 'w-[140px] flex-shrink-0' : ''}`}>
      <div className={`skeleton rounded-t-xl ${compact ? 'h-[120px]' : 'aspect-square'}`} />
      <div className={compact ? 'space-y-1.5 p-2' : 'space-y-2 p-3'}>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton mt-2 h-7 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CategoryPillSkeleton() {
  return (
    <div className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 md:w-[88px]">
      <div className="skeleton h-14 w-14 rounded-full md:h-16 md:w-16" />
      <div className="skeleton h-2 w-12 rounded" />
    </div>
  );
}

export function BannerSkeleton() {
  return <div className="skeleton h-32 w-[280px] flex-shrink-0 rounded-xl md:h-40 md:w-[360px]" />;
}

export function ProductRowSkeleton({ count = 5, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}
