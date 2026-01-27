import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import EmailTemplate from '@/lib/models/EmailTemplate';
import User from '@/lib/models/User';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { orderStatusSchema } from '@/lib/validations';
import { emailService } from '@/lib/email';

async function handler(
  req: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const order = await Order.findById(params.id)
        .populate('userId', 'name email phone')
        .populate('products.productId', 'name images description');

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({ order });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { orderStatus } = orderStatusSchema.parse(body);

      const order = await Order.findById(params.id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const oldStatus = order.orderStatus;
      order.orderStatus = orderStatus;
      await order.save();

      // Send email if status changed
      if (oldStatus !== orderStatus && order.paymentStatus === 'PAID') {
        const user = await User.findById(order.userId);
        if (user) {
          let templateType: any = 'ORDER_CREATED';
          if (orderStatus === 'PACKED') templateType = 'ORDER_PACKED';
          else if (orderStatus === 'SHIPPED') templateType = 'ORDER_SHIPPED';
          else if (orderStatus === 'DELIVERED') templateType = 'ORDER_DELIVERED';

          const foundTemplate = await EmailTemplate.findOne({ type: templateType });
          const subject =
            foundTemplate?.subject ?? `Order ${orderStatus} - LittleFlame`;
          const body =
            foundTemplate?.body ??
            `
                <h2>Hello {{userName}}!</h2>
                <p>Your order status has been updated!</p>
                <p><strong>Order ID:</strong> {{orderId}}</p>
                <p><strong>Status:</strong> {{status}}</p>
                <h3>Order Summary:</h3>
                {{products}}
                <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
              `;

          await emailService.sendOrderEmail(
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
        }
      }

      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const PUT = withAdminAuth(handler);
