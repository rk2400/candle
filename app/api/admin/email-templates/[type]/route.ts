import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailTemplate from '@/lib/models/EmailTemplate';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';
import { emailTemplateSchema } from '@/lib/validations';

async function handler(
  req: AuthRequest,
  { params }: { params: { type: string } }
) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const template = await EmailTemplate.findOne({ type: params.type });
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const data = emailTemplateSchema.parse({ ...body, type: params.type });

      const template = await EmailTemplate.findOneAndUpdate(
        { type: params.type },
        { subject: data.subject, body: data.body },
        { new: true, runValidators: true }
      );

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      return NextResponse.json({ template });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Email template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
export const PUT = withAdminAuth(handler);



