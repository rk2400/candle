'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getAdminCoupon, updateCoupon } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'flat',
    value: '0',
    active: true,
    validFrom: '',
    validTo: '',
    minSubtotal: '',
    maxDiscount: '',
    usageLimit: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const coupon = await getAdminCoupon(params.id as string);
        setForm({
          code: coupon.code,
          type: coupon.type,
          value: (coupon.value ?? 0).toString(),
          active: !!coupon.active,
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
          validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().slice(0, 16) : '',
          minSubtotal: typeof coupon.minSubtotal === 'number' ? coupon.minSubtotal.toString() : '',
          maxDiscount: typeof coupon.maxDiscount === 'number' ? coupon.maxDiscount.toString() : '',
          usageLimit: typeof coupon.usageLimit === 'number' ? coupon.usageLimit.toString() : '',
        });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        active: form.active,
      };
      if (form.validFrom) payload.validFrom = new Date(form.validFrom).toISOString();
      if (form.validTo) payload.validTo = new Date(form.validTo).toISOString();
      if (form.minSubtotal) payload.minSubtotal = parseFloat(form.minSubtotal);
      if (form.maxDiscount) payload.maxDiscount = parseFloat(form.maxDiscount);
      if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit);

      await updateCoupon(params.id as string, payload);
      toast.success('Coupon updated');
      router.push('/admin/coupons');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Edit Coupon</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Code</label>
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{form.type === 'percentage' ? 'Percent (%)' : 'Flat Amount (₹)'}</label>
              <input className="input" type="number" min="0" step="1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Valid From</label>
              <input className="input" type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valid To</label>
              <input className="input" type="datetime-local" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Subtotal (₹)</label>
              <input className="input" type="number" min="0" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Discount (₹)</label>
              <input className="input" type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Usage Limit</label>
              <input className="input" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin/coupons" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

