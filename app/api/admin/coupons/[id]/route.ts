import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { couponSchema } from '@/lib/validations';

async function handler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const coupon = await Coupon.findById(params.id);
      if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      return NextResponse.json({ coupon });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const data = couponSchema.parse(body);
      const updated = await Coupon.findByIdAndUpdate(
        params.id,
        {
          code: data.code.toUpperCase(),
          type: data.type,
          value: data.value,
          active: typeof data.active === 'boolean' ? data.active : true,
          validFrom: data.validFrom ? new Date(data.validFrom as any) : undefined,
          validTo: data.validTo ? new Date(data.validTo as any) : undefined,
          minSubtotal: data.minSubtotal,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
        },
        { new: true, runValidators: true }
      );
      if (!updated) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      return NextResponse.json({ coupon: updated });
    }

    if (req.method === 'DELETE') {
      const deleted = await Coupon.findByIdAndDelete(params.id);
      if (!deleted) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      return NextResponse.json({ success: true });
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
export const PUT = withAdminAuth(handler);
export const DELETE = withAdminAuth(handler);

