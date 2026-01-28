'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { getAdminOrders, updateOrderStatus, sendOrderEmail, cancelOrder } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await getAdminOrders();
      setOrders(data);
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

  function getPaymentStatusLabel(status: string) {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PAYMENT_SUBMITTED':
        return 'Payment Submitted';
      case 'PAYMENT_PENDING':
        return 'Payment Pending';
      case 'PAYMENT_REJECTED':
        return 'Payment Rejected';
      default:
        return status;
    }
  }

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAYMENT_SUBMITTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAYMENT_PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PAYMENT_REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getOrderStatusLabel(status: string) {
    switch (status) {
      case 'CREATED':
        return 'Order Placed';
      case 'PACKED':
        return 'Packed';
      case 'SHIPPED':
        return 'Shipped';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleSendEmail(orderId: string) {
    try {
      await sendOrderEmail(orderId);
      toast.success('Email sent!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Are you sure you want to cancel this order? This will restore product stock and notify the customer.')) {
      return;
    }

    const reason = prompt('Enter cancellation reason (optional):');
    
    try {
      await cancelOrder(orderId, reason || undefined);
      toast.success('Order cancelled successfully!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message);
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
        <h1 className="text-4xl font-bold mb-8">Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold font-mono text-sm">{String(order._id).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.userId?.name || order.userId?.email || 'N/A'} • {order.userId?.email || ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Status</p>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${
                      order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800 border border-green-200' :
                      order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      order.orderStatus === 'PACKED' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {getOrderStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                </div>

                {/* Payment Details */}
                {order.paymentStatus === 'PAYMENT_SUBMITTED' && order.upiReferenceNumber && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Payment Awaiting Verification</p>
                    <p className="text-xs text-yellow-700">UPI Reference: <span className="font-mono font-semibold">{order.upiReferenceNumber}</span></p>
                    <Link 
                      href="/admin/payments" 
                      className="text-xs text-yellow-800 underline hover:text-yellow-900 mt-1 inline-block"
                    >
                      Verify Payment →
                    </Link>
                  </div>
                )}

                {order.paymentStatus === 'PAYMENT_REJECTED' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 font-semibold mb-1">❌ Payment Rejected</p>
                    {order.adminPaymentNote && (
                      <p className="text-xs text-red-700">Note: {order.adminPaymentNote}</p>
                    )}
                  </div>
                )}

                {order.orderStatus === 'CANCELLED' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 font-semibold mb-1">🚫 Order Cancelled</p>
                    {order.adminPaymentNote && order.adminPaymentNote.includes('Cancelled:') && (
                      <p className="text-xs text-red-700">Reason: {order.adminPaymentNote.replace('Cancelled: ', '')}</p>
                    )}
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <div className="text-gray-700 text-sm">
                    {order.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{p.name} (x{p.quantity})</span>
                        <span className="text-gray-500">₹{(p.price * p.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {order.address && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700">
                      {order.address.full || `${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                  {order.orderStatus !== 'CANCELLED' && (
                    <>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="input flex-1 min-w-[150px]"
                        disabled={order.paymentStatus !== 'PAID' || order.orderStatus === 'DELIVERED'}
                      >
                        <option value="CREATED">Order Placed</option>
                        <option value="PACKED">Packed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                      {order.paymentStatus !== 'PAID' && (
                        <span className="text-xs text-gray-500 self-center px-2">
                          {order.paymentStatus === 'PAYMENT_PENDING' 
                            ? 'Waiting for payment' 
                            : order.paymentStatus === 'PAYMENT_SUBMITTED'
                            ? 'Payment verification pending'
                            : 'Payment rejected'}
                        </span>
                      )}
                      <button
                        onClick={() => handleSendEmail(order._id)}
                        className="btn btn-secondary"
                        disabled={order.paymentStatus !== 'PAID'}
                      >
                        Send Email
                      </button>
                      {order.orderStatus !== 'DELIVERED' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="btn bg-red-500 text-white hover:bg-red-600"
                        >
                          Cancel Order
                        </button>
                      )}
                    </>
                  )}
                  {order.orderStatus === 'CANCELLED' && (
                    <span className="text-sm text-red-600 font-medium">This order has been cancelled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
