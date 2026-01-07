import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';
import { adminConfig } from './config';

export interface AuthRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(handler: (req: AuthRequest, ctx?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx?: any): Promise<NextResponse> => {
    // Try cookie first, fallback to Authorization header (Bearer)
    let token = req.cookies.get('token')?.value;
    console.log('[middleware/withAuth] Cookies:', req.cookies.toString ? req.cookies.toString() : req.cookies);
    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      console.log('[middleware/withAuth] Authorization header:', authHeader ? '[present]' : '[missing]');
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      console.log('[middleware/withAuth] No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[middleware/withAuth] Token found, verifying...');
    const payload = verifyToken(token);

    if (!payload) {
      console.log('[middleware/withAuth] Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[middleware/withAuth] Token payload:', payload);
    (req as AuthRequest).user = payload;
    return handler(req as AuthRequest, ctx);
  };
}

export function withAdminAuth(handler: (req: AuthRequest, ctx?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx?: any): Promise<NextResponse> => {
    // Try cookie first, fallback to Authorization header (Bearer)
    let token = req.cookies.get('token')?.value;
    console.log('[middleware/withAdminAuth] Cookies:', req.cookies.toString ? req.cookies.toString() : req.cookies);
    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      console.log('[middleware/withAdminAuth] Authorization header:', authHeader ? '[present]' : '[missing]');
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      console.log('[middleware/withAdminAuth] No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[middleware/withAdminAuth] Token found, verifying...');
    const payload = verifyToken(token);

    if (!payload) {
      console.log('[middleware/withAdminAuth] Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin by comparing email with ADMIN_EMAIL or token type
    const isAdmin = (payload.email || '').toLowerCase() === adminConfig.email.toLowerCase() || payload.type === 'admin';
    console.log('[middleware/withAdminAuth] isAdmin check:', isAdmin, 'payload.type=', payload.type, 'adminEmail=', adminConfig.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    (req as AuthRequest).user = payload;
    return handler(req as AuthRequest, ctx);
  };
}

