 'use client';
 
 import { useEffect, useState } from 'react';
 import Link from 'next/link';
 import AdminHeader from '@/components/AdminHeader';
 import toast from 'react-hot-toast';
 import { getAdminProducts } from '@/lib/api-client';
 import { adminDeleteReview } from '@/lib/api-client';
 
 export default function AdminReviewsPage() {
   const [productReviews, setProductReviews] = useState<Record<string, any[]>>({});
   const [products, setProducts] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     loadData();
   }, []);
 
   async function loadData() {
     try {
       const prods = await getAdminProducts();
       setProducts(prods);
       const entries: Record<string, any[]> = {};
       for (const p of prods) {
         try {
           const res = await fetch(`/api/products/${p._id}/reviews`, { cache: 'no-store' });
           const data = await res.json();
           entries[p._id] = data.reviews || [];
         } catch {
           entries[p._id] = [];
         }
       }
       setProductReviews(entries);
     } catch (e: any) {
       toast.error(e.message || 'Failed to load reviews');
     } finally {
       setLoading(false);
     }
   }
 
   async function handleDelete(id: string) {
     try {
       await adminDeleteReview(id);
       toast.success('Review deleted');
       loadData();
     } catch (e: any) {
       toast.error(e.message || 'Failed to delete review');
     }
   }
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-xl">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-gray-50">
       <AdminHeader />
 
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold">Product Reviews</h1>
           <Link href="/admin/products" className="btn btn-secondary">Back to Products</Link>
         </div>
 
         {products.length === 0 ? (
           <div className="card p-6">
             <p className="text-gray-600">No products found.</p>
           </div>
         ) : (
           <div className="space-y-6">
             {products.map((p: any) => {
               const reviews = productReviews[p._id] || [];
               return (
                 <div key={p._id} className="card p-6">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h2 className="text-xl font-serif">{p.name}</h2>
                       <p className="text-gray-500 text-sm">Total reviews: {reviews.length}</p>
                     </div>
                     <Link href={`/products/${p._id}`} className="text-primary-600 underline">View Product</Link>
                   </div>
 
                   {reviews.length === 0 ? (
                     <p className="text-gray-600">No reviews yet.</p>
                   ) : (
                     <div className="space-y-3">
                       {reviews.map((r: any) => (
                         <div key={r._id} className="border p-3 rounded-md flex justify-between items-center">
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="font-medium">{r.userId?.name || 'Customer'}</span>
                               <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                             </div>
                             <div className="flex items-center text-yellow-500">
                               {Array.from({ length: 5 }).map((_, i) => (
                                 <svg key={i} className={`w-4 h-4 ${i < r.rating ? '' : 'opacity-30'}`} viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M11.48 3.5a1 1 0 011.04 0l3.06 1.86 3.49.54a1 1 0 01.56 1.72l-2.52 2.6.62 3.55a1 1 0 01-1.48 1.04L12 13.9l-3.25 1.91a1 1 0 01-1.48-1.04l.62-3.55-2.52-2.6a1 1 0 01.56-1.72l3.49-.54 3.06-1.86z"/>
                                 </svg>
                               ))}
                             </div>
                             {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
                           </div>
                           <button onClick={() => handleDelete(r._id)} className="btn bg-red-500 text-white hover:bg-red-600">Delete</button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}
       </main>
     </div>
   );
 }
 
