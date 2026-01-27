import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { withAuth, AuthRequest } from '@/lib/middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';

// Validation schema for payment submission
const paymentSubmissionSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  upiReferenceNumber: z.string()
    .min(10, 'UPI Reference Number must be at least 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'UPI Reference must be alphanumeric'),
  paymentScreenshot: z.string().optional(), // base64 encoded image
});

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, upiReferenceNumber, paymentScreenshot } = paymentSubmissionSchema.parse(body);

    // Fetch order and verify ownership
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId.toString() !== req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized - not your order' }, { status: 403 });
    }

    // Check if payment is still pending
    if (order.paymentStatus !== 'PAYMENT_PENDING') {
      return NextResponse.json(
        { error: `Cannot submit payment. Current status: ${order.paymentStatus}` },
        { status: 400 }
      );
    }

    // Prevent duplicate submissions (one submission per order)
    if (order.upiReferenceNumber) {
      return NextResponse.json(
        { error: 'Payment already submitted for this order. Please wait for admin verification.' },
        { status: 400 }
      );
    }

    // Update order with payment submission details
    order.paymentStatus = 'PAYMENT_SUBMITTED';
    order.upiReferenceNumber = upiReferenceNumber.toUpperCase();
    order.paymentSubmittedAt = new Date();
    
    if (paymentScreenshot) {
      order.paymentScreenshot = paymentScreenshot;
    }

    await order.save();

    // Send email notification to user about payment submission
    const user = await User.findById(req.user?.userId);
    const userEmail = req.user?.email || user?.email || '';
    const userName = user?.name || 'Customer';
    
    if (userEmail) {
      await emailService.sendPaymentNotification(userEmail, 'submitted', {
        orderId: order._id.toString(),
        userName,
        totalAmount: order.totalAmount,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for verification. You will receive an email confirmation shortly.',
      order: {
        id: order._id,
        paymentStatus: order.paymentStatus,
        upiReferenceNumber: order.upiReferenceNumber,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Payment submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit payment' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handler);
