 'use client';
 
 import { useEffect, useState } from 'react';
 import Link from 'next/link';
 import { getWishlist, removeFromWishlist } from '@/lib/api-client';
 import toast from 'react-hot-toast';
 import { useCart } from '@/lib/contexts/CartContext';
 import { useUser } from '@/lib/contexts/UserContext';
 import { useRouter } from 'next/navigation';
 
 export default function WishlistPage() {
   const [items, setItems] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { addToCart } = useCart();
   const { user } = useUser();
   const router = useRouter();
 
   useEffect(() => {
     loadWishlist();
   }, []);
 
   async function loadWishlist() {
     try {
       const list = await getWishlist();
       setItems(list);
     } catch (e: any) {
       toast.error(e.message || 'Failed to load wishlist');
     } finally {
       setLoading(false);
     }
   }
 
   async function handleRemove(productId: string) {
     try {
       await removeFromWishlist(productId);
       toast.success('Removed from wishlist');
       loadWishlist();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wishlist:updated'));
      }
     } catch (e: any) {
       toast.error(e.message || 'Failed to remove');
     }
   }
 
   function handleAddToCart(p: any) {
     if (!p || !p._id) return;
     if (!user) {
       toast.error('Please login to add items to your cart');
       router.push('/login');
       return;
     }
     const price = typeof p.discountPrice === 'number' && p.discountPrice < p.price ? p.discountPrice : p.price;
     addToCart(
       {
         id: p._id,
         name: p.name,
         price,
         originalPrice: p.price,
         image: Array.isArray(p.images) ? p.images[0] : undefined,
       },
       1
     );
    toast.success('Added to cart');
    removeFromWishlist(p._id)
      .then(() => {
        loadWishlist();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wishlist:updated'));
        }
      })
      .catch(() => {});
   }
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-xl">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="bg-stone-50 min-h-screen">
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-serif">Your Wishlist</h1>
           <Link href="/products" className="btn btn-secondary">Continue Shopping</Link>
         </div>
         {items.length === 0 ? (
           <div className="card p-6 text-center">
             <p className="text-stone-600">No items in your wishlist yet.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {items.map((w: any) => {
               const p = w.productId || {};
               return (
                 <div key={w._id} className="card overflow-hidden">
                   <Link href={`/products/${p._id}`}>
                     <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-56 object-cover" />
                   </Link>
                   <div className="p-4">
                     <Link href={`/products/${p._id}`} className="font-serif text-lg">{p.name}</Link>
                     <div className="mt-2 text-stone-700">
                       {typeof p.discountPrice === 'number' && p.discountPrice < p.price ? (
                         <span className="flex items-center gap-2">
                           <span className="text-stone-400 line-through">₹{p.price}</span>
                           <span className="text-stone-900 font-medium">₹{p.discountPrice}</span>
                         </span>
                       ) : (
                         <span className="text-stone-900 font-medium">₹{p.price}</span>
                       )}
                     </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <button onClick={() => handleAddToCart(p)} className="btn btn-primary w-full">Add to Cart</button>
                      <div className="flex justify-between">
                        <Link href={`/products/${p._id}`} className="btn btn-secondary">View Details</Link>
                        <button onClick={() => handleRemove(p._id)} className="btn btn-secondary">Remove</button>
                      </div>
                    </div>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
       </main>
     </div>
   );
 }
 
