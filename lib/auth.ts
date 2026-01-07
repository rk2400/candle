import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authConfig } from './config';

export interface JWTPayload {
  userId?: string;
  adminId?: string;
  email: string;
  type: 'user' | 'admin';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiry });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

