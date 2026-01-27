import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { withAdminAuth } from '@/lib/middleware';

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB();

    const [totalOrders, totalRevenue, totalProducts, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Product.countDocuments({ status: 'active' }),
      User.countDocuments(),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: revenue,
        totalProducts,
        totalUsers,
        ordersByStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
});



