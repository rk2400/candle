import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import EmailTemplate from '@/lib/models/EmailTemplate';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

async function handler(
  req: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const orderId = params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be cancelled
    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    if (order.orderStatus === 'DELIVERED') {
      return NextResponse.json({ error: 'Cannot cancel a delivered order' }, { status: 400 });
    }

    const body = await req.json();
    const { reason } = cancelOrderSchema.parse(body);

    // Restore stock for all products in the order
    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
    }

    // Update order status
    const oldStatus = order.orderStatus;
    order.orderStatus = 'CANCELLED';
    if (reason) {
      order.adminPaymentNote = `Cancelled: ${reason}`;
    }
    await order.save();

    // Send cancellation email to user
    const user = await User.findById(order.userId);
    if (user) {
      const templateType = 'ORDER_CANCELLED';
      const foundTemplate = await EmailTemplate.findOne({ type: templateType });
      
      // Use template subject and body, with fallback defaults
      let subject = foundTemplate?.subject ?? `Order Cancelled - LittleFlame`;
      let body = foundTemplate?.body ?? `
        <h2>Hello {{userName}}!</h2>
        <p>We're sorry to inform you that your order has been cancelled.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <h3>Order Summary:</h3>
        {{products}}
        <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
        <p>If you have any questions or concerns, please contact our support team.</p>
        <p>Thank you for your understanding.</p>
      `;

      // Add cancellation reason to body if provided (insert after status line)
      if (reason) {
        body = body.replace(
          '<p><strong>Status:</strong> {{status}}</p>',
          `<p><strong>Status:</strong> {{status}}</p>\n        <p><strong>Reason:</strong> ${reason}</p>`
        );
      }

      // Replace variables in subject if any
      const userName = user.name || user.email.split('@')[0];
      subject = subject
        .replace(/\{\{orderId\}\}/g, order._id.toString())
        .replace(/\{\{userName\}\}/g, userName)
        .replace(/\{\{status\}\}/g, 'CANCELLED')
        .replace(/\{\{totalAmount\}\}/g, `₹${order.totalAmount.toFixed(2)}`);

      await emailService.sendOrderEmail(
        user.email,
        { subject, body },
        {
          orderId: order._id.toString(),
          userName: userName,
          status: 'CANCELLED',
          products: order.products.map((p: any) => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price * p.quantity,
          })),
          totalAmount: order.totalAmount,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully. Stock restored and customer notified.',
      order: {
        id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 400 }
    );
  }
}

export const POST = withAdminAuth(handler);
