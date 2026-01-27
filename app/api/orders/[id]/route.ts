import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { withAuth, AuthRequest } from '@/lib/middleware';

async function handler(req: AuthRequest, ctx?: any) {
  try {
    await connectDB();
    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Robust id extraction: prefer route ctx.params but fall back to request path
    const id = ctx?.params?.id || req.nextUrl?.pathname?.split('/').pop();

    if (!id) {
      console.error('Order id missing in request', { ctx });
      return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, userId: req.user.userId }).populate(
      'products.productId',
      'name images description'
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);



