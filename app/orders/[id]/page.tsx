'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Header and Footer are provided by `app/layout.tsx`
import { getOrder } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function statusLabel(s: string) {
    if (s === 'DELIVERED') return 'Delivered';
    if (s === 'SHIPPED') return 'Shipped';
    if (s === 'PACKED') return 'Packed';
    if (s === 'CANCELLED') return 'Cancelled';
    return 'Order Placed';
  }

  function estimatedDelivery(createdAt: string) {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function currentStepIndex(o: any) {
    const steps = ['Payment Pending', 'Payment Submitted', 'Paid', 'Packed', 'Shipped', 'Delivered'];
    let idx = 0;
    if (o.paymentStatus === 'PAYMENT_PENDING') idx = 0;
    else if (o.paymentStatus === 'PAYMENT_SUBMITTED') idx = 1;
    else if (o.paymentStatus === 'PAYMENT_REJECTED') idx = 1;
    else if (o.paymentStatus === 'PAID') {
      if (o.orderStatus === 'CREATED') idx = 2;
      else if (o.orderStatus === 'PACKED') idx = 3;
      else if (o.orderStatus === 'SHIPPED') idx = 4;
      else if (o.orderStatus === 'DELIVERED') idx = 5;
      else if (o.orderStatus === 'CANCELLED') idx = 2;
    }
    return { idx, steps };
  }

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await getOrder(params.id as string);
        setOrder(data);
      } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
          router.push('/login');
        } else {
          toast.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif text-stone-900 mb-4">Order not found</h2>
        <Link href="/orders" className="text-primary-600 hover:text-primary-700 underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-2">Order Details</h1>
                <p className="text-stone-500 font-mono text-sm">#{String(order._id).toUpperCase()}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${
                order.orderStatus === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-100' :
                order.orderStatus === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                order.orderStatus === 'PACKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                order.orderStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                'bg-stone-100 text-stone-600 border border-stone-200'
              }`}>
                {statusLabel(order.orderStatus)}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-stone-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Ordered on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-stone-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18M3 7h18M3 21h18M3 11h18M3 15h18" />
              </svg>
              Estimated delivery by {estimatedDelivery(order.createdAt)}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h3 className="text-lg font-serif text-stone-900 mb-4">Order Progress</h3>
            {(() => {
              const { idx, steps } = currentStepIndex(order);
              const cancelled = order.orderStatus === 'CANCELLED';
              let currentLabel = '';
              if (cancelled) currentLabel = 'Cancelled';
              else if (order.paymentStatus === 'PAYMENT_REJECTED') currentLabel = 'Payment Rejected';
              else currentLabel = steps[idx];
              return (
                <div>
                  <div className="flex items-center gap-2">
                    {steps.map((label: string, i: number) => (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border ${
                            i < idx
                              ? 'bg-primary-600 text-white border-primary-600'
                              : i === idx && !cancelled
                              ? 'bg-white text-primary-600 border-primary-600'
                              : 'bg-white text-stone-400 border-stone-300'
                          }`}
                          aria-label={label}
                          title={label}
                        >
                          {i < idx ? '✓' : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`h-0.5 flex-1 ${i < idx ? 'bg-primary-600' : 'bg-stone-200'}`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-stone-600">
                    {`Current Status: ${currentLabel}`}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Items */}
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-serif text-stone-900 mb-6">Items Ordered</h2>
            <div className="space-y-6">
              {order.products.map((item: any, index: number) => (
                <div key={index} className="flex gap-6 items-center">
                  <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">No Img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900 text-lg mb-1">{item.name}</p>
                    <p className="text-stone-500 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-stone-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-stone-400 mt-1">₹{item.price} each</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="bg-stone-50 p-6 md:p-8 border-t border-stone-100">
              <h3 className="text-lg font-serif text-stone-900 mb-4">Shipping Address</h3>
              <div className="text-stone-600">
                <p className="font-medium text-stone-900 mb-1">{order.address.full}</p>
                <p>{order.address.street}</p>
                <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-stone-50 p-6 md:p-8 border-t border-stone-100">
            <div className="flex flex-col gap-4 max-w-sm ml-auto">
              <div className="flex justify-between items-center text-stone-600">
                <span>Subtotal</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-stone-200 my-2"></div>
              <div className="flex justify-between items-center text-lg font-serif text-stone-900">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-stone-200">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-stone-500">Payment Status</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${
                    order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' :
                    order.paymentStatus === 'PAYMENT_SUBMITTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    order.paymentStatus === 'PAYMENT_PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {order.paymentStatus === 'PAID' ? '✓ Paid' :
                     order.paymentStatus === 'PAYMENT_SUBMITTED' ? '⏳ Under Verification' :
                     order.paymentStatus === 'PAYMENT_PENDING' ? '⚠ Payment Pending' :
                     '✗ Payment Rejected'}
                  </span>
                </div>
                {order.paymentStatus === 'PAYMENT_PENDING' && (
                  <button
                    onClick={() => router.push(`/payment?orderId=${String(order._id).toUpperCase()}`)}
                    className="w-full mt-3 btn btn-primary"
                  >
                    Complete Payment
                  </button>
                )}
                {order.paymentStatus === 'PAYMENT_REJECTED' && (
                  <button
                    onClick={() => router.push(`/payment?orderId=${String(order._id).toUpperCase()}`)}
                    className="w-full mt-3 btn btn-primary"
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 border-t border-stone-100">
            <div className="bg-stone-50 rounded-lg p-4 md:p-5 border border-stone-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="text-sm text-stone-700">
                  Need to cancel this order? Contact our support team and we’ll help you.
                </div>
                <Link
                  href={`/contact?orderId=${encodeURIComponent(String(order._id).toUpperCase())}&topic=cancel`}
                  className="btn btn-secondary"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/orders" className="text-stone-500 hover:text-stone-900 font-medium transition-colors flex items-center justify-center gap-2">
            <span>&larr;</span> Back to Orders
          </Link>
        </div>
      </main>
    </div>
  );
}
