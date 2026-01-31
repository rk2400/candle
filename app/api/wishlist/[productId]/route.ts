 import { NextRequest, NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Wishlist from '@/lib/models/Wishlist';
 import { withAuth, AuthRequest } from '@/lib/middleware';
 
 async function handler(req: AuthRequest, { params }: { params: { productId: string } }) {
   try {
     await connectDB();
 
     if (!req.user || req.user.type !== 'user' || !req.user.userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
 
     if (req.method === 'DELETE') {
       await Wishlist.deleteOne({ userId: req.user.userId, productId: params.productId });
       return NextResponse.json({ success: true });
     }
 
     return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
   } catch (error: any) {
     console.error('Wishlist delete error:', error);
     return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 400 });
   }
 }
 
 export const DELETE = withAuth(handler);
 
