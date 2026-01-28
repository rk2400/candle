'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// Header and Footer are provided by `app/layout.tsx`
import { getOrders } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placedBanner, setPlacedBanner] = useState(false);

  function statusLabel(s: string) {
    if (s === 'DELIVERED') return 'Delivered';
    if (s === 'SHIPPED') return 'Shipped';
    if (s === 'PACKED') return 'Packed';
    if (s === 'CANCELLED') return 'Cancelled';
    return 'Order Placed';
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
          router.push('/login');
        } else {
          toast.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [router]);

  function PlacedBannerHandler({ onPlaced }: { onPlaced: () => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
      if (searchParams.get('placed') === '1') {
        onPlaced();
        toast.success('Order placed successfully!');
        router.replace('/orders');
      }
    }, [searchParams]);
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h1 className="text-4xl font-serif text-stone-900 mb-8">My Orders</h1>
        <Suspense>
          <PlacedBannerHandler onPlaced={() => setPlacedBanner(true)} />
        </Suspense>
        {placedBanner && (
          <div className="mb-6 p-4 rounded-lg border border-green-100 bg-green-50 text-green-700 text-sm">
            Order placed successfully!
          </div>
        )}
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-stone-100">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-stone-500 text-lg mb-6">No orders yet.</p>
            <Link href="/products" className="btn btn-primary inline-flex">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block p-6 bg-white rounded-xl shadow-sm border border-stone-100 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-serif text-xl text-stone-900">Order #{String(order._id).toUpperCase()}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                        order.orderStatus === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-100' :
                        order.orderStatus === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        order.orderStatus === 'PACKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        order.orderStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        {statusLabel(order.orderStatus)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-stone-500 mb-4">
                      <div>
                        <span className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Date</span>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Total</span>
                        <span className="font-medium text-stone-900">₹{order.totalAmount}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Items</span>
                      <p className="text-stone-700">
                        {order.products.map((p: any) => `${p.name} (x${p.quantity})`).join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                    View Details <span className="ml-2">&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
