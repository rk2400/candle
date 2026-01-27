'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getAdminStats } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats();
        setStats(data);
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
    loadStats();
  }, [router]);

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
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <p className="text-gray-500 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-primary-600">{stats.totalOrders}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm mb-1">Active Products</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/products" className="card p-6 hover:shadow-lg transition-shadow hover:bg-stone-50">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-lg font-semibold mb-2">Products</h3>
              <p className="text-sm text-gray-600">Manage product catalog</p>
            </Link>
            <Link href="/admin/orders" className="card p-6 hover:shadow-lg transition-shadow hover:bg-stone-50">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold mb-2">Orders</h3>
              <p className="text-sm text-gray-600">View and update orders</p>
            </Link>
            <Link href="/admin/users" className="card p-6 hover:shadow-lg transition-shadow hover:bg-stone-50">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-semibold mb-2">Users</h3>
              <p className="text-sm text-gray-600">Manage customers</p>
            </Link>
            <Link href="/admin/coupons" className="card p-6 hover:shadow-lg transition-shadow hover:bg-stone-50">
              <div className="text-3xl mb-3">🎟️</div>
              <h3 className="text-lg font-semibold mb-2">Coupons</h3>
              <p className="text-sm text-gray-600">Create and manage coupons</p>
            </Link>
          </div>
        </div>

        {stats && stats.ordersByStatus && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Orders by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-gray-500 text-sm">CREATED</p>
                <p className="text-2xl font-bold">{stats.ordersByStatus.CREATED || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">PACKED</p>
                <p className="text-2xl font-bold">{stats.ordersByStatus.PACKED || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">SHIPPED</p>
                <p className="text-2xl font-bold">{stats.ordersByStatus.SHIPPED || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">DELIVERED</p>
                <p className="text-2xl font-bold">{stats.ordersByStatus.DELIVERED || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">CANCELLED</p>
                <p className="text-2xl font-bold">{stats.ordersByStatus.CANCELLED || 0}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

