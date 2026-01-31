 import { NextRequest, NextResponse } from 'next/server';
 import connectDB from '@/lib/db';
 import Review from '@/lib/models/Review';
 import User from '@/lib/models/User';
 
 export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
   try {
     await connectDB();
     const productId = params.id;
     if (!productId) {
       return NextResponse.json({ error: 'Product ID missing' }, { status: 400 });
     }
 
     const reviews = await Review.find({ productId })
       .sort({ createdAt: -1 })
       .limit(50)
       .populate('userId', 'name')
       .lean();
 
     const agg = await Review.aggregate([
       { $match: { productId: new (await import('mongoose')).default.Types.ObjectId(productId) } },
       { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
     ]);
 
     const avgRating = agg[0]?.avg || 0;
     const ratingCount = agg[0]?.count || 0;
 
     return NextResponse.json({ reviews, avgRating, ratingCount });
   } catch (error: any) {
     console.error('Get product reviews error:', error);
     return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
   }
 }
 
