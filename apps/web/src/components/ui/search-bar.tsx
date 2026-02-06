'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-swiggy-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for atta, dal, curd and more"
          className="w-full rounded-xl border border-gray-200 bg-swiggy-gray-50 py-2.5 pl-10 pr-4 text-sm text-swiggy-gray-800 placeholder-swiggy-gray-400 transition-colors focus:border-swiggy-orange focus:bg-white focus:outline-none focus:ring-1 focus:ring-swiggy-orange/30"
        />
      </div>
    </form>
  );
}
