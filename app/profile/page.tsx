'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Header and Footer are provided by `app/layout.tsx`
import { useUser } from '@/lib/contexts/UserContext';
import { getOrders } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadOrders();
    }
  }, [user, userLoading, router]);

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

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h1 className="text-4xl font-serif text-stone-900 mb-8">My Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
              <h2 className="text-xl font-serif text-stone-900 mb-6 border-b border-stone-100 pb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Name</p>
                  <p className="font-medium text-stone-900 text-lg">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-stone-900 text-lg">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-medium text-stone-900 text-lg">{user.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
              <h2 className="text-xl font-serif text-stone-900 mb-6 border-b border-stone-100 pb-4">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
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
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Link
                      key={order._id}
                      href={`/orders/${order._id}`}
                      className="block p-6 border border-stone-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-serif text-lg text-stone-900">Order #{String(order._id).toUpperCase()}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                              order.orderStatus === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-100' :
                              order.orderStatus === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              order.orderStatus === 'PACKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              order.orderStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                              'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <p className="text-sm text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-stone-600 mt-2">
                            {order.products.length} item(s)
                          </p>
                        </div>
                        <div className="text-right sm:text-right w-full sm:w-auto flex justify-between sm:block items-center">
                          <p className="text-xl font-medium text-stone-900 group-hover:text-primary-600 transition-colors">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          <span className="text-sm text-primary-600 font-medium sm:hidden">View Details &rarr;</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
