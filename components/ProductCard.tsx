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
    stock?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = !product.stock || product.stock === 0;
  
  return (
    <Link 
      href={`/products/${product._id}`}
      className={`group block bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
    >
      <div className="relative h-72 w-full overflow-hidden bg-stone-100">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
              isOutOfStock ? 'grayscale' : ''
            }`}
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

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span className="bg-red-600 text-white text-lg font-bold px-6 py-3 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Add Overlay (Optional, for now just a badge) */}
        {!isOutOfStock && (
          <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-2 rounded-full shadow-sm">
              View Details
            </span>
          </div>
        )}
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
            {typeof (product as any).discountPrice === 'number' && (product as any).discountPrice < product.price ? (
              <span className="flex items-center gap-2">
                <span className="text-stone-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                <span>₹{(product as any).discountPrice.toLocaleString('en-IN')}</span>
              </span>
            ) : (
              <>₹{product.price.toLocaleString('en-IN')}</>
            )}
          </span>
          <span className="text-sm font-medium text-primary-600 group-hover:underline">
            Shop Now &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
