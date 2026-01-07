import Link from 'next/link';
import { getProductsFromDb } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

async function getProducts(searchParams: any) {
  const products = await getProductsFromDb({ 
    status: 'active',
    category: searchParams.category,
    search: searchParams.search
  });
  return products || [];
}

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string; search?: string } }) {
  const products = await getProducts(searchParams);
  const currentCategory = searchParams.category || 'All';
  const searchTerm = searchParams.search;

  const categories = ['All Scents', 'Floral', 'Woody', 'Fresh', 'Seasonal'];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <span className="text-primary-600 font-medium tracking-widest uppercase text-sm mb-4 block">Our Collection</span>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Curated Scents'}
          </h1>
          <p className="max-w-2xl mx-auto text-stone-600 text-lg leading-relaxed">
            Explore our hand-poured candles, each designed to evoke a specific memory or feeling. 
            From fresh mornings to cozy evenings, find your perfect match.
          </p>
        </div>
      </div>

      {/* Filter/Sort Bar */}
      <div className="border-b border-stone-200 bg-white sticky top-0 z-30 opacity-95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-6 text-sm font-medium text-stone-500 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = cat === 'All Scents' ? !searchParams.category : searchParams.category === cat;
              return (
                <Link 
                  key={cat}
                  href={cat === 'All Scents' ? '/products' : `/products?category=${cat}`}
                  className={`${isActive ? 'text-stone-900 border-b-2 border-primary-500 pb-1' : 'hover:text-primary-600 transition-colors'} whitespace-nowrap`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
          <div className="text-sm text-stone-500">
            Showing {products.length} products
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-block p-4 rounded-full bg-stone-100 mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-2">No products found</h3>
            <p className="text-stone-500">
              {searchTerm 
                ? `We couldn't find any matches for "${searchTerm}".` 
                : 'Check back soon for our new collection.'}
            </p>
            {searchTerm && (
              <Link href="/products" className="text-primary-600 hover:underline mt-4 inline-block">
                Clear Search
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
