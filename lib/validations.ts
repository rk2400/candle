import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6, 7, 8, or 9')
    .length(10, 'Phone number must be exactly 10 digits'),
});

// Note: Admin authorization is based on ADMIN_EMAIL env variable
// Users with email matching ADMIN_EMAIL automatically get admin privileges

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  status: z.enum(['active', 'inactive']),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  category: z.enum(['floral', 'fresh', 'seasonal', 'woody', 'other']).optional(),
  isBestSeller: z.boolean().optional(),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(['CREATED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const emailTemplateSchema = z.object({
  type: z.enum(['ORDER_CREATED', 'ORDER_PACKED', 'ORDER_SHIPPED', 'ORDER_DELIVERED']),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

export const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  type: z.enum(['percentage', 'flat']),
  value: z.number().min(0),
  active: z.boolean().optional(),
  validFrom: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  validTo: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  minSubtotal: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(0).optional(),
});

export const checkoutSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  couponCode: z.string().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  products: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').trim(),
});
