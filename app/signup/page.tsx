'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthTabs from '@/components/AuthTabs';
import { createAccount, login } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validatePhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone);
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits starting with 6, 7, 8, or 9';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await createAccount(formData.name, formData.email, formData.phone);
      await login(formData.email);
      toast.success('Account created! We sent an OTP to your email.');
      router.push(`/login?email=${encodeURIComponent(formData.email)}&step=otp`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=2000&auto=format&fit=crop" 
          alt="Signup Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex flex-col justify-between p-12 text-white">
          <Link href="/" className="text-2xl font-serif tracking-wide">AuraFarm</Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-serif mb-4 text-white/80 ">Join Our Community</h2>
            <p className="text-stone-200 text-lg">Create an account to track orders, save favorites, and receive early access to new collections.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-serif text-stone-900">Create Account</h1>
            <p className="text-stone-500 mt-2">Sign up for a free account to get started.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary-500 transition-colors ${errors.name ? 'border-red-500' : 'border-stone-200'}`}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary-500 transition-colors ${errors.email ? 'border-red-500' : 'border-stone-200'}`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary-500 transition-colors ${errors.phone ? 'border-red-500' : 'border-stone-200'}`}
                placeholder="9876543210"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="pt-6 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700 underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
