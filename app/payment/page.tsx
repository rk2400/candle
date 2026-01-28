'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/contexts/UserContext';
import { getOrder } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { generateUPIString, generateQRCodeURL } from '@/lib/upi';

// Access NEXT_PUBLIC_ env vars directly in client component
const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi';
const upiPayeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'LittleFlame';

function PaymentVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upiReference, setUpiReference] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch order details
  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        toast.error('No order specified');
        router.push('/orders');
        return;
      }

      try {
        const orderData = await getOrder(orderId);
        
        if (orderData.paymentStatus === 'PAID') {
          // Order already paid, redirect to order details
          router.push(`/orders/${orderId}`);
          return;
        }

        if (orderData.paymentStatus === 'PAYMENT_SUBMITTED') {
          // Already submitted, show pending message
          setOrder(orderData);
          setOrderLoading(false);
          return;
        }

        setOrder(orderData);
      } catch (err: any) {
        toast.error('Failed to load order');
        router.push('/orders');
      } finally {
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [orderId, router]);

  // Handle payment submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!upiReference.trim()) {
      toast.error('Please enter UPI Reference Number');
      return;
    }

    if (upiReference.length < 10) {
      toast.error('UPI Reference Number must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          upiReferenceNumber: upiReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment');
      }

      toast.success('Payment submitted! Check your email for confirmation.');
      
      // Show success message and redirect after delay
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || orderLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Order not found</p>
          <Link href="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  // Check if already submitted
  if (order.paymentStatus === 'PAYMENT_SUBMITTED') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Payment Under Verification</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been submitted successfully. Please allow up to 24 hours for manual verification.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="font-semibold text-blue-900 mb-2">Order Details</p>
              <p className="text-sm text-blue-800">Order ID: <span className="font-mono font-bold">{order._id}</span></p>
              <p className="text-sm text-blue-800">Amount: <span className="font-bold">₹{order.totalAmount}</span></p>
              <p className="text-sm text-blue-800">UPI Reference: <span className="font-mono">{order.upiReferenceNumber}</span></p>
              <p className="text-sm text-blue-800">Submitted: {new Date(order.paymentSubmittedAt).toLocaleString()}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              You will receive an email confirmation once the payment is verified.
            </p>
            <Link href="/orders" className="btn btn-primary">Back to Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate UPI string and QR code
  const upiString = generateUPIString(
    upiId,
    upiPayeeName,
    order.totalAmount,
    order._id
  );
  const qrCodeURL = generateQRCodeURL(upiString);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-gray-600">Order ID: <span className="font-mono font-bold">{order._id}</span></p>
        <div className="card p-4 mt-4 mb-6">
          <h2 className="text-lg font-bold mb-2">Payment Options</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="radio" checked readOnly />
              <span className="font-medium">UPI (Active)</span>
            </div>
            <div className="flex items-center gap-2 opacity-60">
              <input type="radio" disabled />
              <span className="font-medium">Cash on Delivery (COD)</span>
            </div>
            <p className="text-xs text-stone-600">
              COD is not available at this stage while we streamline early operations. We’ll enable it soon.
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 mb-8">
          <h2 className="text-sm font-bold text-amber-900 mb-2">A quick note from a small business</h2>
          <p className="text-amber-900 text-sm">
            We are in our early stage, so payment verification is manual. Please pay via UPI in Step 1 and then confirm your UPI reference number in Step 2. Your support means a lot—thank you for helping us grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left: UPI QR Code */}
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-4">Step 1: Scan & Pay</h2>
            <div className="bg-gray-100 rounded-lg p-4 mb-4 flex justify-center">
              <img src={qrCodeURL} alt="UPI QR Code" className="w-64 h-64" />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Or pay to:</p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center justify-between">
                  <span className="font-mono font-bold">{upiId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(upiId);
                      toast.success('UPI ID copied!');
                    }}
                    className="text-primary-600 hover:text-primary-700 text-xs font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Amount:</p>
                <div className="bg-green-50 p-3 rounded border border-green-200 font-bold text-green-700">
                  ₹{order.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Submission Form */}
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-4">Step 2: Submit Payment Details</h2>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  UPI Reference Number (UTR) *
                </label>
                <input
                  type="text"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value.toUpperCase())}
                  placeholder="e.g., 408A12345678"
                  className="input w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found in your UPI app after successful payment
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-900">
                  ℹ️ After submission, your payment will be verified manually within 24 hours.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Payment for Verification'}
              </button>

              <Link href={`/orders/${order._id}`} className="btn btn-secondary w-full text-center">
                Cancel
              </Link>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">₹{order.subtotalAmount.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Amount:</span>
              <span className="text-lg">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <PaymentVerificationContent />
    </Suspense>
  );
}
