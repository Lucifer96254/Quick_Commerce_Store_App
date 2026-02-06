import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}

export function SectionHeader({ title, subtitle, href, linkText = 'see all' }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between px-1 pb-3">
      <div>
        <h2 className="text-lg font-extrabold text-swiggy-gray-800 md:text-xl">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-swiggy-gray-400 md:text-sm">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-sm font-semibold text-swiggy-orange hover:underline"
        >
          {linkText}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
