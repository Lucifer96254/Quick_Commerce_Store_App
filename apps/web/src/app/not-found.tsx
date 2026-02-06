import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 text-8xl">🔍</div>
        <h1 className="mb-3 text-4xl font-bold text-gray-900">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="mb-8 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#FC8019] text-white font-semibold rounded-lg hover:bg-[#e06e0a] transition-colors inline-block"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
