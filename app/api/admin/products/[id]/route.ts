import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { productSchema } from '@/lib/validations';

async function handler(
  req: AuthRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const product = await Product.findById(params.id);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const data = productSchema.parse(body);

      const product = await Product.findByIdAndUpdate(
        params.id,
        data,
        { new: true, runValidators: true }
      );

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ product });
    }

    if (req.method === 'DELETE') {
      const product = await Product.findByIdAndDelete(params.id);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const PUT = withAdminAuth(handler);
export const DELETE = withAdminAuth(handler);



