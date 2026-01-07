import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailTemplate from '@/lib/models/EmailTemplate';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { emailTemplateSchema } from '@/lib/validations';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const templates = await EmailTemplate.find().sort({ type: 1 });
      return NextResponse.json({ templates });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const data = emailTemplateSchema.parse(body);

      const template = await EmailTemplate.findOneAndUpdate(
        { type: data.type },
        data,
        { upsert: true, new: true, runValidators: true }
      );

      return NextResponse.json({ template }, { status: 201 });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Email templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const POST = withAdminAuth(handler);


