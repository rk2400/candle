import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/middleware';

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB();

    const userId = req.nextUrl.searchParams.get('userId');

    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate({
        path: 'products.productId',
        select: 'name images',
        model: Product,
      });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
});
