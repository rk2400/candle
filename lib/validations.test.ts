import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from './validations';

describe('Validations', () => {
  describe('loginSchema', () => {
    it('should validate a correct email', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject an invalid email', () => {
      const result = loginSchema.safeParse({ email: 'invalid-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890', // Doesn't start with 6-9
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
