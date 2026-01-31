 import { NextRequest, NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Wishlist from '@/lib/models/Wishlist';
 import Product from '@/lib/models/Product';
 import { withAuth, AuthRequest } from '@/lib/middleware';
 import mongoose from 'mongoose';
 
 async function handler(req: AuthRequest) {
   try {
     await connectDB();
 
     if (!req.user || req.user.type !== 'user' || !req.user.userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
 
     if (req.method === 'GET') {
       const items = await Wishlist.find({ userId: req.user.userId })
         .populate('productId', 'name description price discountPrice images stock category')
         .sort({ createdAt: -1 })
         .lean();
       return NextResponse.json({ items });
     }
 
     if (req.method === 'POST') {
       const { productId } = await req.json();
       if (!productId) {
         return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
       }
       const pid = new mongoose.Types.ObjectId(productId);
       const exists = await Product.findById(pid);
       if (!exists) {
         return NextResponse.json({ error: 'Product not found' }, { status: 404 });
       }
       await Wishlist.updateOne(
         { userId: req.user.userId, productId: pid },
         { $setOnInsert: { userId: req.user.userId, productId: pid } },
         { upsert: true }
       );
       return NextResponse.json({ success: true }, { status: 201 });
     }
 
     return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
   } catch (error: any) {
     console.error('Wishlist route error:', error);
     return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 400 });
   }
 }
 
 export const GET = withAuth(handler);
 export const POST = withAuth(handler);
 
