import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { productSchema } from '@/lib/validations';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const products = await Product.find().sort({ createdAt: -1 });
      return NextResponse.json({ products });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const data = productSchema.parse(body);

      const product = await Product.create(data);
      return NextResponse.json({ product }, { status: 201 });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const POST = withAdminAuth(handler);



