import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import Coupon from '@/lib/models/Coupon';
import { applyCouponSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, products } = applyCouponSchema.parse(body);

    const productIds = products.map((p: any) => p.productId);
    const dbProducts = await Product.find({
      _id: { $in: productIds },
      status: 'active',
    });
    if (dbProducts.length !== products.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
    }

    const subtotal = products.reduce((sum: number, item: any) => {
      const product = dbProducts.find((p) => p._id.toString() === item.productId);
      if (!product) return sum;
      return sum + product.price * item.quantity;
    }, 0);

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }
    if (!coupon.active) {
      return NextResponse.json({ error: 'Promo code is inactive' }, { status: 400 });
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ error: 'Promo code not yet valid' }, { status: 400 });
    }
    if (coupon.validTo && now > coupon.validTo) {
      return NextResponse.json({ error: 'Promo code expired' }, { status: 400 });
    }
    if (typeof coupon.usageLimit === 'number' && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 });
    }
    if (typeof coupon.minSubtotal === 'number' && subtotal < coupon.minSubtotal) {
      return NextResponse.json({ error: `Minimum order value ₹${coupon.minSubtotal}` }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.floor((subtotal * coupon.value) / 100);
      if (typeof coupon.maxDiscount === 'number') {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = Math.floor(coupon.value);
    }
    discount = Math.max(0, Math.min(discount, subtotal));

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      subtotal,
      totalAfterDiscount: subtotal - discount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to validate promo code' },
      { status: 400 }
    );
  }
}

