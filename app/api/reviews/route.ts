 import { NextRequest, NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Review from '@/lib/models/Review';
 import Order from '@/lib/models/Order';
 import Product from '@/lib/models/Product';
 import { withAuth, AuthRequest } from '@/lib/middleware';
 import { z } from 'zod';
 import mongoose from 'mongoose';
 
 const reviewSchema = z.object({
   productId: z.string().min(1),
   orderId: z.string().min(1),
   rating: z.number().int().min(1).max(5),
   comment: z.string().max(1000).optional(),
 });
 
 async function handler(req: AuthRequest) {
   try {
     await connectDB();
 
     if (req.method === 'POST') {
       if (!req.user || req.user.type !== 'user' || !req.user.userId) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
 
       const body = await req.json();
       const data = reviewSchema.parse(body);
 
       const productId = new mongoose.Types.ObjectId(data.productId);
       const orderId = new mongoose.Types.ObjectId(data.orderId);
       const userId = new mongoose.Types.ObjectId(req.user.userId);
 
       const order = await Order.findOne({ _id: orderId, userId }).lean();
       if (!order) {
         return NextResponse.json({ error: 'Order not found' }, { status: 404 });
       }
 
       if (order.orderStatus !== 'DELIVERED') {
         return NextResponse.json({ error: 'Rating allowed only after delivery' }, { status: 400 });
       }
 
       const hasProduct = (order.products || []).some((p: any) => String(p.productId) === String(productId));
       if (!hasProduct) {
         return NextResponse.json({ error: 'Product not part of the order' }, { status: 400 });
       }
 
       const existing = await Review.findOne({ productId, userId, orderId });
       if (existing) {
         return NextResponse.json({ error: 'You already rated this item for this order' }, { status: 400 });
       }
 
       const review = await Review.create({
         productId,
         userId,
         orderId,
         rating: data.rating,
         comment: data.comment || '',
       });
 
       return NextResponse.json({ review }, { status: 201 });
     }
 
     return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
   } catch (error: any) {
     console.error('Create review error:', error);
     return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 400 });
   }
 }
 
 export const POST = withAuth(handler);
 
