'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useEffect } from 'react';
import { useState } from 'react';

export default function AdminHeader() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { logout } = useUser();

  useEffect(() => {
    // Redirect non-admin users
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || !user.isAdmin) {
    return null;
  }

  return (
    <header className="bg-white/90 backdrop-blur border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={() => setOpen(!open)} aria-label="menu">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin/dashboard" className="text-2xl font-bold text-primary-600">🕯️ AuraFarm Admin</Link>
          </div>

          <nav className={`hidden md:flex gap-4 ${open ? 'block' : ''}`}>
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Dashboard</Link>
            <Link href="/admin/products" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Products</Link>
            <Link href="/admin/orders" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Orders</Link>
            <Link href="/admin/users" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Users</Link>
            <Link href="/admin/emails" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Email Templates</Link>
            <Link href="/" className="text-gray-700 hover:text-primary-600 flex items-center gap-2">Store</Link>
            <button onClick={() => { logout && logout(); router.push('/'); }} className="ml-4 text-sm px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Logout</button>
          </nav>
        </div>
      </div>
    </header>
  );
}


