'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import { getAdminCoupons, deleteCoupon } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch (err: any) {
      if (err.message.includes('Unauthorized') || err.message.includes('Admin')) {
        router.push('/admin/login');
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      load();
    } catch (err: any) {
      toast.error(err.message);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Coupons</h1>
          <Link href="/admin/coupons/new" className="btn btn-primary">Create Coupon</Link>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No coupons yet.</p>
            <Link href="/admin/coupons/new" className="btn btn-primary">Create First Coupon</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div key={c._id} className="card p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{c.code}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mb-4">
                  {c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}
                </p>
                <div className="text-sm text-stone-500 space-y-1 mb-4">
                  {c.validFrom && <p>From: {new Date(c.validFrom).toLocaleDateString()}</p>}
                  {c.validTo && <p>To: {new Date(c.validTo).toLocaleDateString()}</p>}
                  {typeof c.minSubtotal === 'number' && <p>Min Subtotal: ₹{c.minSubtotal}</p>}
                  {typeof c.maxDiscount === 'number' && <p>Max Discount: ₹{c.maxDiscount}</p>}
                  {typeof c.usageLimit === 'number' && <p>Usage Limit: {c.usedCount}/{c.usageLimit}</p>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/coupons/${c._id}`} className="btn btn-secondary flex-1">Edit</Link>
                  <button onClick={() => handleDelete(c._id)} className="btn bg-red-500 text-white hover:bg-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

