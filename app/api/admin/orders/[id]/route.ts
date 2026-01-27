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

      // Prevent updating if order is cancelled
      if (order.orderStatus === 'CANCELLED' && orderStatus !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Cannot update status of a cancelled order' },
          { status: 400 }
        );
      }

      const oldStatus = order.orderStatus;
      order.orderStatus = orderStatus;
      await order.save();

      // Send email if status changed
      if (oldStatus !== orderStatus && order.paymentStatus === 'PAID') {
        const user = await User.findById(order.userId);
        if (user) {
          // Determine template type based on order status
          let templateType: any = 'ORDER_CREATED';
          if (orderStatus === 'CREATED') templateType = 'ORDER_CREATED';
          else if (orderStatus === 'PACKED') templateType = 'ORDER_PACKED';
          else if (orderStatus === 'SHIPPED') templateType = 'ORDER_SHIPPED';
          else if (orderStatus === 'DELIVERED') templateType = 'ORDER_DELIVERED';
          else if (orderStatus === 'CANCELLED') templateType = 'ORDER_CANCELLED';

          // Get email template from database
          const foundTemplate = await EmailTemplate.findOne({ type: templateType });
          
          // Use template subject and body, with fallback defaults
          let subject = foundTemplate?.subject ?? `Order ${orderStatus} - LittleFlame`;
          let body = foundTemplate?.body ?? `
            <h2>Hello {{userName}}!</h2>
            <p>Your order status has been updated!</p>
            <p><strong>Order ID:</strong> {{orderId}}</p>
            <p><strong>Status:</strong> {{status}}</p>
            <h3>Order Summary:</h3>
            {{products}}
            <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
          `;

          // Replace variables in subject if any (e.g., {{orderId}}, {{userName}}, etc.)
          const userName = user.name || user.email.split('@')[0];
          subject = subject
            .replace(/\{\{orderId\}\}/g, order._id.toString())
            .replace(/\{\{userName\}\}/g, userName)
            .replace(/\{\{status\}\}/g, orderStatus)
            .replace(/\{\{totalAmount\}\}/g, `₹${order.totalAmount.toFixed(2)}`);

          // Send email using template
          await emailService.sendOrderEmail(
            user.email,
            { subject, body },
            {
              orderId: order._id.toString(),
              userName: userName,
              status: orderStatus,
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
