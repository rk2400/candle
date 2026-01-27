import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import EmailTemplate from '@/lib/models/EmailTemplate';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
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

        // Send both PAYMENT_CONFIRMED and ORDER_CONFIRMED emails to user (with robust fallbacks)
        if (userEmail) {
          try {
            // Fetch both email templates
            const paymentTemplate = await EmailTemplate.findOne({ type: 'PAYMENT_CONFIRMED' });
            const orderTemplate = await EmailTemplate.findOne({ type: 'ORDER_CONFIRMED' });

            // Email 1: Payment Confirmed
            if (paymentTemplate) {
              let paymentSubject = paymentTemplate.subject
                .replace(/\{\{orderId\}\}/g, order._id.toString())
                .replace(/\{\{userName\}\}/g, userName)
                .replace(/\{\{totalAmount\}\}/g, `₹${order.totalAmount.toFixed(2)}`);

              let paymentBody = paymentTemplate.body;

              await emailService.sendOrderEmail(
                userEmail,
                { subject: paymentSubject, body: paymentBody },
                {
                  orderId: order._id.toString(),
                  userName,
                  status: 'PAID',
                  products: order.products.map((p: any) => ({
                    name: p.name,
                    quantity: p.quantity,
                    price: p.price * p.quantity,
                  })),
                  totalAmount: order.totalAmount,
                }
              );
            } else {
              // Fallback to a built-in payment approved notification
              await emailService.sendPaymentNotification(userEmail, 'approved', {
                orderId: order._id.toString(),
                userName,
                totalAmount: order.totalAmount,
              });
            }

            // Email 2: Order Confirmed
            if (orderTemplate) {
              let orderSubject = orderTemplate.subject
                .replace(/\{\{orderId\}\}/g, order._id.toString())
                .replace(/\{\{userName\}\}/g, userName)
                .replace(/\{\{status\}\}/g, order.orderStatus)
                .replace(/\{\{totalAmount\}\}/g, `₹${order.totalAmount.toFixed(2)}`);

              let orderBody = orderTemplate.body;

              await emailService.sendOrderEmail(
                userEmail,
                { subject: orderSubject, body: orderBody },
                {
                  orderId: order._id.toString(),
                  userName,
                  status: order.orderStatus,
                  products: order.products.map((p: any) => ({
                    name: p.name,
                    quantity: p.quantity,
                    price: p.price * p.quantity,
                  })),
                  totalAmount: order.totalAmount,
                }
              );
            } else {
              // Fallback to ORDER_CREATED template or default body used in payment gateway verification
              const createdTemplate = await EmailTemplate.findOne({ type: 'ORDER_CREATED' });
              let subject =
                createdTemplate?.subject ?? 'Order Confirmed - LittleFlame';
              let emailBody =
                createdTemplate?.body ??
                `
                  <h2>Hello {{userName}}!</h2>
                  <p>Your order has been confirmed!</p>
                  <p><strong>Order ID:</strong> {{orderId}}</p>
                  <p><strong>Status:</strong> {{status}}</p>
                  <h3>Order Summary:</h3>
                  {{products}}
                  <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
                  <p>Thank you for your purchase! We'll keep you updated on your order status.</p>
                `;

              subject = subject
                .replace(/\{\{orderId\}\}/g, order._id.toString())
                .replace(/\{\{userName\}\}/g, userName)
                .replace(/\{\{status\}\}/g, order.orderStatus)
                .replace(/\{\{totalAmount\}\}/g, `₹${order.totalAmount.toFixed(2)}`);

              await emailService.sendOrderEmail(
                userEmail,
                { subject, body: emailBody },
                {
                  orderId: order._id.toString(),
                  userName,
                  status: order.orderStatus,
                  products: order.products.map((p: any) => ({
                    name: p.name,
                    quantity: p.quantity,
                    price: p.price * p.quantity,
                  })),
                  totalAmount: order.totalAmount,
                }
              );
            }
          } catch (emailError) {
            console.error('Error sending confirmation emails:', emailError);
            // Don't fail the approval if email fails, but log it
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Payment approved. Payment confirmed and order confirmed emails sent to customer.',
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
