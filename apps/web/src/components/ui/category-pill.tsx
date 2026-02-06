import Link from 'next/link';
import Image from 'next/image';

interface CategoryPillProps {
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  fruits: '🍎',
  vegetables: '🥬',
  dairy: '🥛',
  bakery: '🍞',
  meat: '🥩',
  seafood: '🐟',
  snacks: '🍿',
  beverages: '🧃',
  'personal-care': '🧴',
  household: '🧹',
  baby: '👶',
  frozen: '🧊',
  spices: '🌶️',
  oils: '🛢️',
  rice: '🍚',
  atta: '🌾',
};

function getEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] || '🛒';
}

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 md:w-[88px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-swiggy-gray-50 ring-1 ring-gray-100 transition-transform hover:scale-105 md:h-16 md:w-16">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            width={48}
            height={48}
            className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
          />
        ) : (
          <span className="text-2xl md:text-3xl">{getEmoji(category.slug)}</span>
        )}
      </div>
      <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-swiggy-gray-700 md:text-xs">
        {category.name}
      </span>
    </Link>
  );
}
