'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getAdminOrders, updateOrderStatus, sendOrderEmail } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (error: any) {
      if (error.message.includes('Unauthorized') || error.message.includes('Admin')) {
        router.push('/admin/login');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleSendEmail(orderId: string) {
    try {
      await sendOrderEmail(orderId);
      toast.success('Email sent!');
    } catch (error: any) {
      toast.error(error.message);
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
        <h1 className="text-4xl font-bold mb-8">Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order._id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold">{order._id}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.userId?.name || order.userId?.email || 'N/A'} • {order.userId?.email || ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{order.totalAmount}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                      order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'PACKED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <p className="text-gray-700">
                    {order.products.map((p: any) => `${p.name} (x${p.quantity})`).join(', ')}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    className="input flex-1 min-w-[150px]"
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                  <button
                    onClick={() => handleSendEmail(order._id)}
                    className="btn btn-secondary"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

