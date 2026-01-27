import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { couponSchema } from '@/lib/validations';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      return NextResponse.json({ coupons });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const data = couponSchema.parse(body);

      const doc: any = {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        active: typeof data.active === 'boolean' ? data.active : true,
        validFrom: data.validFrom ? new Date(data.validFrom as any) : undefined,
        validTo: data.validTo ? new Date(data.validTo as any) : undefined,
        minSubtotal: data.minSubtotal,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
      };

      const exists = await Coupon.findOne({ code: doc.code });
      if (exists) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }

      const coupon = await Coupon.create(doc);
      return NextResponse.json({ coupon });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const POST = withAdminAuth(handler);

