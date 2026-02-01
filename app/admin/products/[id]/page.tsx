'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getProduct, updateProduct } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const params = useParams();
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
    scentTop: '',
    scentMiddle: '',
    scentBase: '',
    vesselDetails: '',
    careInstructions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const product = await getProduct(params.id as string);
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          discountPrice: typeof product.discountPrice === 'number' ? product.discountPrice.toString() : '',
          images: Array.isArray(product.images) ? product.images : [],
          status: product.status,
          stock: (product.stock || 0).toString(),
          category: product.category,
          scentTop: Array.isArray(product.scentNotes?.top) ? product.scentNotes.top.join('\n') : '',
          scentMiddle: Array.isArray(product.scentNotes?.middle) ? product.scentNotes.middle.join('\n') : '',
          scentBase: Array.isArray(product.scentNotes?.base) ? product.scentNotes.base.join('\n') : '',
          vesselDetails: product.vesselDetails || '',
          careInstructions: Array.isArray(product.careInstructions) ? product.careInstructions.join('\n') : '',
        });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const images = (formData.images || []).map((url) => url.trim()).filter(Boolean);
      if (images.length === 0) {
        throw new Error('Please add at least one valid image URL');
      }
      await updateProduct(params.id as string, {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stock: parseInt(formData.stock),
        images,
        scentNotes: {
          top: formData.scentTop
            ? formData.scentTop.split('\n').map((s) => s.trim()).filter(Boolean)
            : [],
          middle: formData.scentMiddle
            ? formData.scentMiddle.split('\n').map((s) => s.trim()).filter(Boolean)
            : [],
          base: formData.scentBase
            ? formData.scentBase.split('\n').map((s) => s.trim()).filter(Boolean)
            : [],
        },
        vesselDetails: formData.vesselDetails,
        careInstructions: formData.careInstructions
          ? formData.careInstructions.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      toast.success('Product updated!');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message);
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
        <h1 className="text-4xl font-bold mb-8">Edit Product</h1>
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
            <label className="block text-sm font-medium mb-2">Scent Notes - Top</label>
            <textarea
              value={formData.scentTop}
              onChange={(e) => setFormData({ ...formData, scentTop: e.target.value })}
              className="input"
              rows={3}
            />
            <p className="text-xs text-stone-500 mt-1">One note per line</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Scent Notes - Middle</label>
            <textarea
              value={formData.scentMiddle}
              onChange={(e) => setFormData({ ...formData, scentMiddle: e.target.value })}
              className="input"
              rows={3}
            />
            <p className="text-xs text-stone-500 mt-1">One note per line</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Scent Notes - Base</label>
            <textarea
              value={formData.scentBase}
              onChange={(e) => setFormData({ ...formData, scentBase: e.target.value })}
              className="input"
              rows={3}
            />
            <p className="text-xs text-stone-500 mt-1">One note per line</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vessel & Dimensions</label>
            <textarea
              value={formData.vesselDetails}
              onChange={(e) => setFormData({ ...formData, vesselDetails: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Care Instructions</label>
            <textarea
              value={formData.careInstructions}
              onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
              className="input"
              rows={4}
            />
            <p className="text-xs text-stone-500 mt-1">One instruction per line</p>
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
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
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
