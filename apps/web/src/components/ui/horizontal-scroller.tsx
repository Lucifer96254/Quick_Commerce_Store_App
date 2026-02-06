'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
}

export function HorizontalScroller({ children, className = '', showArrows = true }: HorizontalScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="group relative">
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-transform hover:scale-110 md:group-hover:block"
        >
          <ChevronLeft className="h-4 w-4 text-swiggy-gray-700" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex gap-3 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
      >
        {children}
      </div>

      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-transform hover:scale-110 md:group-hover:block"
        >
          <ChevronRight className="h-4 w-4 text-swiggy-gray-700" />
        </button>
      )}
    </div>
  );
}
