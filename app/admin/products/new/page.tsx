'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { createProduct } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    images: [] as string[],
    status: 'active' as 'active' | 'inactive',
    stock: '0',
    category: 'other' as 'floral' | 'fresh' | 'seasonal' | 'woody' | 'other',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const images = (formData.images || []).map((url) => url.trim()).filter(Boolean);
      if (images.length === 0) {
        throw new Error('Please add at least one valid image URL');
      }
      await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stock: parseInt(formData.stock),
        images,
      });
      toast.success('Product created!');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Add New Product</h1>
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Discount Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.discountPrice}
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
              className="input"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="input"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Image URLs</label>
            <div className="space-y-3">
              {(formData.images.length ? formData.images : ['']).map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => {
                      const next = [...(formData.images.length ? formData.images : [''])];
                      next[idx] = e.target.value;
                      setFormData({ ...formData, images: next });
                    }}
                    className="input flex-1"
                    placeholder="https://example.com/image.jpg"
                    required={idx === 0}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const next = [...(formData.images.length ? formData.images : [''])];
                      if (next.length > 1) {
                        next.splice(idx, 1);
                        setFormData({ ...formData, images: next });
                      }
                    }}
                    disabled={(formData.images.length ? formData.images : ['']).length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ''] })}
              >
                Add Image
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="input"
            >
              <option value="floral">Floral</option>
              <option value="fresh">Fresh</option>
              <option value="seasonal">Seasonal</option>
              <option value="woody">Woody</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <Link href="/admin/products" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
