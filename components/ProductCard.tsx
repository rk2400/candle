import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link 
      href={`/products/${product._id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300"
    >
      <div className="relative h-72 w-full overflow-hidden bg-stone-100">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            No image
          </div>
        )}
        
        {product.category && (
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur text-stone-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {product.category}
            </span>
          </div>
        )}

        {/* Quick Add Overlay (Optional, for now just a badge) */}
        <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-2 rounded-full shadow-sm">
            View Details
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-serif font-medium text-stone-900 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-stone-500 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-medium text-stone-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <span className="text-sm font-medium text-primary-600 group-hover:underline">
            Shop Now &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
