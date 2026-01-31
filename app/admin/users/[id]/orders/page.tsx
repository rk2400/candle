 'use client';
 
 import { useEffect, useState } from 'react';
 import { useRouter, useParams } from 'next/navigation';
 import Link from 'next/link';
 import AdminHeader from '@/components/AdminHeader';
import { 
   getAdminUserOrders, 
   getAdminUser, 
   updateOrderStatus, 
   sendOrderEmail, 
  cancelOrder, 
  sendTrackingEmail,
  updateOrderEstimatedDelivery
 } from '@/lib/api-client';
 import toast from 'react-hot-toast';
 
 export default function AdminUserOrdersPage() {
   const router = useRouter();
   const params = useParams() as { id?: string };
   const userId = params?.id || '';
 
   const [orders, setOrders] = useState<any[]>([]);
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);
  const [trackingModalOrderId, setTrackingModalOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<{ trackingLink: string; carrier: string; note: string }>({
    trackingLink: '',
    carrier: '',
    note: '',
  });
  const [sendingTracking, setSendingTracking] = useState(false);
 
   useEffect(() => {
     if (!userId) return;
     loadData();
   }, [userId]);
 
   async function loadData() {
     try {
       const [ordersData, userData] = await Promise.all([
         getAdminUserOrders(userId),
         getAdminUser(userId),
       ]);
       setOrders(ordersData);
       setUser(userData);
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
       loadData();
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
       loadData();
     } catch (error: any) {
       toast.error(error.message);
     }
   }

  async function handleSendTrackingPrompt(orderId: string) {
    const trackingLink = prompt('Enter tracking link (URL):') || '';
    if (!trackingLink) {
      toast.error('Tracking link is required');
      return;
    }
    const carrier = prompt('Enter carrier (optional):') || '';
    const note = prompt('Add a note (optional):') || '';
    try {
      await sendTrackingEmail(orderId, {
        trackingLink,
        carrier: carrier || undefined,
        note: note || undefined,
      });
      toast.success('Tracking email sent!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleEstimatedUpdate(orderId: string, dateStr: string) {
    try {
      await updateOrderEstimatedDelivery(orderId, dateStr);
      toast.success('Estimated delivery updated!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }
  function openTrackingModal(orderId: string) {
    setTrackingModalOrderId(orderId);
    setTrackingForm({ trackingLink: '', carrier: '', note: '' });
  }

  async function handleSendTracking() {
    if (!trackingModalOrderId) return;
    if (!trackingForm.trackingLink) {
      toast.error('Enter a valid tracking link');
      return;
    }
    setSendingTracking(true);
    try {
      await sendTrackingEmail(trackingModalOrderId, {
        trackingLink: trackingForm.trackingLink,
        carrier: trackingForm.carrier || undefined,
        note: trackingForm.note || undefined,
      });
      toast.success('Tracking email sent');
      setTrackingModalOrderId(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSendingTracking(false);
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
         <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold">Orders for User</h1>
           <Link href="/admin/users" className="btn btn-secondary">Back to Users</Link>
         </div>
 
         <div className="mb-6 card p-4">
           <p className="text-sm text-gray-500 mb-1">User</p>
           <p className="font-semibold">{user?.name || 'N/A'}</p>
           <p className="text-sm text-gray-600">{user?.email}</p>
           <p className="text-sm text-gray-600">{user?.phone || ''}</p>
         </div>
 
         {orders.length === 0 ? (
           <div className="text-center py-12">
             <p className="text-gray-500 text-lg">No orders found for this user.</p>
           </div>
         ) : (
           <div className="space-y-4">
             {orders.map((order: any) => (
               <div key={order._id} className="card p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex-1">
                     <p className="text-sm text-gray-500">Order ID</p>
                     <p className="font-semibold font-mono text-sm">{String(order._id).toUpperCase()}</p>
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
 
                 {order.address && (
                   <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                     <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                     <p className="text-sm text-gray-700">
                       {order.address.full || `${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
                     </p>
                   </div>
                 )}
 
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
                       <button
                         onClick={() => handleSendTrackingPrompt(order._id)}
                         className="btn btn-secondary"
                         disabled={order.paymentStatus !== 'PAID'}
                       >
                         Send Tracking Email
                       </button>
                       <div className="flex items-center gap-2">
                         <input
                           type="date"
                           value={order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10) : ''}
                           onChange={(e) => handleEstimatedUpdate(order._id, e.target.value)}
                           className="input"
                           aria-label="Estimated Delivery Date"
                         />
                         <span className="text-xs text-gray-500 self-center">Set estimated delivery</span>
                       </div>
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
 
