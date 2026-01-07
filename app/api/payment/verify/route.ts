import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import EmailTemplate from '@/lib/models/EmailTemplate';
import User from '@/lib/models/User';
import { withAuth, AuthRequest } from '@/lib/middleware';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, is_mock } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.userId,
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    // Verify Razorpay signature if provided (and not a mock payment)
    if (razorpay_signature && !is_mock) {
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (key_secret) {
        const generated_signature = crypto
          .createHmac('sha256', key_secret)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');

        if (generated_signature !== razorpay_signature) {
          return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }
      }
    }

    // Mock payment verification - in production, verify with payment gateway
    // For now, we'll simulate successful payment
    const { paymentConfig } = await import('@/lib/config');
    order.paymentStatus = 'COMPLETED';
    order.paymentId = paymentId || razorpay_payment_id || `${paymentConfig.merchantId}_${Date.now()}`;
    await order.save();

    // Get user
    const user = await User.findById(req.user.userId);

    // Get email template
    const foundTemplate = await EmailTemplate.findOne({ type: 'ORDER_CREATED' });
    const subject =
      foundTemplate?.subject ?? 'Order Confirmed - AuraFarm';
    const emailBody =
      foundTemplate?.body ??
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

    // Send order confirmation email
    if (user) {
      await emailService.sendOrderEmail(
        user.email,
        { subject, body: emailBody },
        {
          orderId: order._id.toString(),
          userName: user.email.split('@')[0],
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

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handler);
