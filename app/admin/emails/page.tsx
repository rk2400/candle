'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getEmailTemplates, updateEmailTemplate } from '@/lib/api-client';
import toast from 'react-hot-toast';

const TEMPLATE_TYPES = [
  { value: 'ORDER_CREATED', label: 'Order Created' },
  { value: 'ORDER_PACKED', label: 'Order Packed' },
  { value: 'ORDER_SHIPPED', label: 'Order Shipped' },
  { value: 'ORDER_DELIVERED', label: 'Order Delivered' },
];

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  ORDER_CREATED: {
    subject: 'Order Confirmed - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order has been confirmed!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>Thank you for your purchase! We'll keep you updated on your order status.</p>
    `,
  },
  ORDER_PACKED: {
    subject: 'Your Order is Packed - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Great news! Your order has been packed and is ready to ship.</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
    `,
  },
  ORDER_SHIPPED: {
    subject: 'Your Order is Shipped - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order is on its way!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>You'll receive your order soon!</p>
    `,
  },
  ORDER_DELIVERED: {
    subject: 'Order Delivered - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order has been delivered!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>Thank you for shopping with LittleFlame! We hope you love your candles.</p>
    `,
  },
};

export default function AdminEmailsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [selectedType, setSelectedType] = useState('ORDER_CREATED');
  const [formData, setFormData] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const template = templates[selectedType] || DEFAULT_TEMPLATES[selectedType];
    if (template) {
      setFormData({ subject: template.subject, body: template.body });
    }
  }, [selectedType, templates]);

  async function loadTemplates() {
    try {
      const data = await getEmailTemplates();
      const templateMap: Record<string, any> = {};
      data.forEach((t: any) => {
        templateMap[t.type] = t;
      });
      setTemplates(templateMap);
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

  async function handleSave() {
    setSaving(true);
    try {
      await updateEmailTemplate({
        type: selectedType,
        subject: formData.subject,
        body: formData.body,
      });
      toast.success('Template saved!');
      loadTemplates();
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Email Templates</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="font-semibold mb-4">Template Types</h2>
              <div className="space-y-2">
                {TEMPLATE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedType === type.value
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">
                {TEMPLATE_TYPES.find((t) => t.value === selectedType)?.label}
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input"
                  placeholder="Email subject"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Body (HTML)</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="input font-mono text-sm"
                  rows={15}
                  placeholder="Email body (HTML)"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Available variables: {'{{orderId}}'}, {'{{userName}}'}, {'{{status}}'}, {'{{totalAmount}}'}, {'{{products}}'}
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

