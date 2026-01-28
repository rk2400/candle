import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { z } from 'zod';

const lockSchema = z.object({
  locked: z.boolean(),
});

async function handler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    if (req.method === 'PUT') {
      const body = await req.json();
      const data = lockSchema.parse(body);

      const user = await User.findByIdAndUpdate(
        params.id,
        { locked: data.locked },
        { new: true, runValidators: true }
      );

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    if (req.method === 'GET') {
      const user = await User.findById(params.id).select('name email phone createdAt locked');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
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

