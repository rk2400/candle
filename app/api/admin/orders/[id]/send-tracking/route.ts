 import { NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Order from '@/lib/models/Order';
 import EmailTemplate from '@/lib/models/EmailTemplate';
 import User from '@/lib/models/User';
 import { withAdminAuth, AuthRequest } from '@/lib/middleware';
 import { emailService } from '@/lib/email';
 import { z } from 'zod';
 
 const trackingSchema = z.object({
   trackingLink: z.string().url(),
   carrier: z.string().optional(),
   note: z.string().optional(),
 });
 
 async function handler(req: AuthRequest, { params }: { params: { id: string } }) {
   try {
     await connectDB();
 
     if (req.method === 'POST') {
       const body = await req.json();
       const data = trackingSchema.parse(body);
 
       const order = await Order.findById(params.id);
       if (!order) {
         return NextResponse.json({ error: 'Order not found' }, { status: 404 });
       }
 
       const user = await User.findById(order.userId);
       if (!user) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
       }
 
       const template = await EmailTemplate.findOne({ type: 'ORDER_TRACKING' });
       const subject = template?.subject || `Your Order is On the Way - Tracking Info`;
       const bodyHtml = (template?.body || `
         <h2>Hello {{userName}},</h2>
         <p>Your order is on the way!</p>
         <p><strong>Order ID:</strong> {{orderId}}</p>
         <p><strong>Carrier:</strong> {{carrier}}</p>
         <p><strong>Tracking Link:</strong> <a href="{{trackingLink}}">Track your shipment</a></p>
         {{noteBlock}}
         <p>Thank you for shopping with LittleFlame!</p>
       `)
         .replace('{{userName}}', user.name || 'Customer')
         .replace('{{orderId}}', String(order._id).toUpperCase())
         .replace('{{carrier}}', data.carrier || '—')
         .replace('{{trackingLink}}', data.trackingLink)
         .replace('{{noteBlock}}', data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : '');
 
      await emailService.sendEmail({
         to: user.email || '',
         subject,
         html: bodyHtml,
       });
 
       return NextResponse.json({ success: true, message: 'Tracking email sent' });
     }
 
     return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
   } catch (error: any) {
     return NextResponse.json(
       { error: error.message || 'Failed to send tracking email' },
       { status: 400 }
     );
   }
 }
 
 export const POST = withAdminAuth(handler);
 
