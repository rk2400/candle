 import { NextRequest, NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Review from '@/lib/models/Review';
 import { withAdminAuth, AuthRequest } from '@/lib/middleware';
 
 async function handler(req: AuthRequest, { params }: { params: { id: string } }) {
   try {
     await connectDB();
 
     if (req.method === 'DELETE') {
       const review = await Review.findByIdAndDelete(params.id);
       if (!review) {
         return NextResponse.json({ error: 'Review not found' }, { status: 404 });
       }
       return NextResponse.json({ success: true });
     }
 
     return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
   } catch (error: any) {
     console.error('Admin delete review error:', error);
     return NextResponse.json({ error: error.message || 'Failed to delete review' }, { status: 400 });
   }
 }
 
 export const DELETE = withAdminAuth(handler);
 
