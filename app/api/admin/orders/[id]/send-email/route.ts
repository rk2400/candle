import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import EmailTemplate from '@/lib/models/EmailTemplate';
import User from '@/lib/models/User';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { emailService } from '@/lib/email';

async function handler(
  req: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const order = await Order.findById(params.id)
      .populate('userId', 'email');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let templateType: any = 'ORDER_CREATED';
    if (order.orderStatus === 'PACKED') templateType = 'ORDER_PACKED';
    else if (order.orderStatus === 'SHIPPED') templateType = 'ORDER_SHIPPED';
    else if (order.orderStatus === 'DELIVERED') templateType = 'ORDER_DELIVERED';

    const foundTemplate = await EmailTemplate.findOne({ type: templateType });
    const subject =
      foundTemplate?.subject ?? `Order ${order.orderStatus} - AuraFarm`;
    const body =
      foundTemplate?.body ??
      `
          <h2>Hello {{userName}}!</h2>
          <p>Your order status update!</p>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Status:</strong> {{status}}</p>
          <h3>Order Summary:</h3>
          {{products}}
          <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
        `;

    const sent = await emailService.sendOrderEmail(
      user.email,
      { subject, body },
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

    if (sent) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 400 }
    );
  }
}

export const POST = withAdminAuth(handler);



