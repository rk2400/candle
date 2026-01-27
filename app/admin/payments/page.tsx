'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import toast from 'react-hot-toast';

interface PendingPayment {
  _id: string;
  userId: string;
  totalAmount: number;
  upiReferenceNumber: string;
  paymentScreenshot?: string;
  paymentSubmittedAt: string;
  products: Array<{ name: string; quantity: number; price: number }>;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [action, setAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      const res = await fetch('/api/admin/payments', {
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin/login');
          return;
        }
        throw new Error(data.error);
      }

      setPayments(data.orders);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification() {
    if (!selectedPayment) return;

    if (!action) {
      toast.error('Select approve or reject');
      return;
    }

    setVerifying(selectedPayment._id);
    try {
      const res = await fetch(`/api/admin/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          adminNote: adminNote.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      setSelectedPayment(null);
      setAdminNote('');
      loadPayments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setVerifying(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Payment Verification</h1>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
            {payments.length} Pending
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-gray-500 text-lg">No pending payments for verification</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {payments.map((payment) => (
              <div key={payment._id} className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Order ID</p>
                    <p className="font-mono font-bold">{payment._id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Amount</p>
                    <p className="text-lg font-bold">₹{payment.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">UPI Reference</p>
                    <p className="font-mono font-semibold">{payment.upiReferenceNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Submitted At</p>
                    <p className="text-sm">{new Date(payment.paymentSubmittedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Products */}
                <div className="mb-4">
                  <p className="text-gray-600 text-sm font-semibold mb-2">Products:</p>
                  <ul className="text-sm space-y-1">
                    {payment.products.map((p, i) => (
                      <li key={i} className="text-gray-700">
                        {p.name} x {p.quantity} @ ₹{p.price.toFixed(2)} each
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot */}
                {payment.paymentScreenshot && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm font-semibold mb-2">Payment Screenshot:</p>
                    <img
                      src={payment.paymentScreenshot}
                      alt="Payment Screenshot"
                      className="max-w-sm max-h-48 rounded border border-gray-200"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setAction('approve');
                      setAdminNote('');
                    }}
                    className="btn btn-primary flex-1"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setAction('reject');
                      setAdminNote('');
                    }}
                    className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Verification Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {action === 'approve' ? '✓ Approve Payment' : '✗ Reject Payment'}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Order ID: <span className="font-mono font-bold">{selectedPayment._id}</span></p>
              <p className="text-sm text-gray-600">Amount: <span className="font-bold">₹{selectedPayment.totalAmount.toFixed(2)}</span></p>
              <p className="text-sm text-gray-600">UTR: <span className="font-mono">{selectedPayment.upiReferenceNumber}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add verification notes..."
                className="input w-full h-20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleVerification}
                disabled={verifying === selectedPayment._id}
                className={`btn flex-1 ${
                  action === 'approve'
                    ? 'btn-primary'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {verifying === selectedPayment._id ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
