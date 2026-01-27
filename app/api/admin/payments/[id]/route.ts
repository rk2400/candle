import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import EmailTemplate from '@/lib/models/EmailTemplate';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';

const verificationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().optional(),
});

async function handler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const orderId = params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'PAYMENT_SUBMITTED') {
      return NextResponse.json(
        { error: `Order payment status must be PAYMENT_SUBMITTED. Current: ${order.paymentStatus}` },
        { status: 400 }
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { action, adminNote } = verificationSchema.parse(body);

      // Get user email for notifications
      const user = await User.findById(order.userId);
      const userEmail = user?.email || '';
      const userName = user?.name || 'Customer';

      if (action === 'approve') {
        // Mark payment as PAID
        order.paymentStatus = 'PAID';
        order.adminPaymentNote = adminNote || '';
        await order.save();

        // Send order confirmation email to user using ORDER_CREATED template
        if (userEmail) {
          // Get ORDER_CREATED email template
          const orderTemplate = await EmailTemplate.findOne({ type: 'ORDER_CREATED' });
          const subject = orderTemplate?.subject ?? 'Order Confirmed - LittleFlame';
          const body = orderTemplate?.body ?? `
            <h2>Hello {{userName}}!</h2>
            <p>Your order has been confirmed!</p>
            <p><strong>Order ID:</strong> {{orderId}}</p>
            <p><strong>Status:</strong> {{status}}</p>
            <h3>Order Summary:</h3>
            {{products}}
            <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
            <p>Thank you for your purchase! We'll keep you updated on your order status.</p>
          `;

          await emailService.sendOrderEmail(
            userEmail,
            { subject, body },
            {
              orderId: order._id.toString(),
              userName: user.name || userEmail.split('@')[0],
              status: 'CREATED',
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
          message: 'Payment approved. Order confirmation email sent to customer.',
          order: {
            id: order._id,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
          },
        });
      } else if (action === 'reject') {
        // Mark payment as REJECTED and restore stock
        order.paymentStatus = 'PAYMENT_REJECTED';
        order.adminPaymentNote = adminNote || 'Payment verification failed';
        await order.save();

        // Restore stock for all products in the order
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } },
            { new: true }
          );
        }

        // Send payment rejection email to user
        if (userEmail) {
          await emailService.sendPaymentNotification(userEmail, 'rejected', {
            orderId: order._id.toString(),
            userName,
            totalAmount: order.totalAmount,
            rejectionReason: adminNote || 'Payment could not be verified',
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Payment rejected. Stock restored. Rejection email sent to customer.',
          order: {
            id: order._id,
            paymentStatus: order.paymentStatus,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin payment verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process verification' },
      { status: 400 }
    );
  }
}

export const PUT = withAdminAuth(handler);
