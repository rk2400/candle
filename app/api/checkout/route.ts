import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { withAuth, AuthRequest } from '@/lib/middleware';
import { checkoutSchema } from '@/lib/validations';
import Razorpay from 'razorpay';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.parse(body);
    const { products, couponCode } = parsed as any;

    // Fetch products and calculate total
    const productIds = products.map((p: any) => p.productId);
    const dbProducts = await Product.find({
      _id: { $in: productIds },
      status: 'active',
    });

    if (dbProducts.length !== products.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
    }

    // Check stock availability and reduce stock
    const orderItems = [];
    for (const item of products) {
      const product = dbProducts.find(
        (p) => p._id.toString() === item.productId
      );
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Check stock
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Only ${product.stock} available.` },
          { status: 400 }
        );
      }

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      });
    }

    const subtotalAmount = orderItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    let discountAmount = 0;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
      const { default: Coupon } = await import('@/lib/models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.active) {
        const now = new Date();
        const withinStart = !coupon.validFrom || now >= coupon.validFrom;
        const withinEnd = !coupon.validTo || now <= coupon.validTo;
        const notExceeded = typeof coupon.usageLimit !== 'number' || (coupon.usedCount ?? 0) < coupon.usageLimit;
        const meetsMin = typeof coupon.minSubtotal !== 'number' || subtotalAmount >= coupon.minSubtotal;
        if (withinStart && withinEnd && notExceeded && meetsMin) {
          if (coupon.type === 'percentage') {
            discountAmount = Math.floor((subtotalAmount * coupon.value) / 100);
            if (typeof coupon.maxDiscount === 'number') {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
          } else {
            discountAmount = Math.floor(coupon.value);
          }
          discountAmount = Math.max(0, Math.min(discountAmount, subtotalAmount));
        }
      }
    }
    const totalAmount = subtotalAmount - discountAmount;

    // Create order
    // Fetch user's saved address to snapshot with the order
    const user = await User.findById(req.user.userId).lean();
    const orderPayload: any = {
      userId: req.user.userId,
      products: orderItems,
      totalAmount,
      subtotalAmount,
      discountAmount,
      couponCode: couponCode || undefined,
      paymentStatus: 'PENDING',
      orderStatus: 'CREATED',
    };

    if (user && user.address) {
      orderPayload.address = {
        full: user.address.full || '',
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        pincode: user.address.pincode || '',
      };
    }

    const order = await Order.create(orderPayload);

    // Create Razorpay Order
    let razorpayOrderId = '';
    // Use env vars or defaults for dev
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      const razorpay = new Razorpay({
        key_id,
        key_secret,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // amount in paise
        currency: 'INR',
        receipt: order._id.toString(),
      });
      razorpayOrderId = razorpayOrder.id;
    } else {
      // Fallback/Mock for development if keys missing
      console.warn('Razorpay keys missing, using mock order ID');
      razorpayOrderId = `order_mock_${order._id.toString()}`;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        razorpayOrderId,
        totalAmount: order.totalAmount,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        products: order.products,
      },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handler);
