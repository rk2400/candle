'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthTabs from '@/components/AuthTabs';
import { login, verifyOTP } from '@/lib/api-client';
import { useUser } from '@/lib/contexts/UserContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  function QueryInit({ setEmail, setStep }: { setEmail: (v: string) => void; setStep: (v: 'email' | 'otp') => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
      const qEmail = searchParams.get('email');
      const qStep = searchParams.get('step');
      if (qEmail) setEmail(qEmail);
      if (qStep === 'otp') setStep('otp');
    }, [searchParams]);
    return null;
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email);
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyOTP(email, otp);
      toast.success('Login successful!');

      setTimeout(async () => {
        try {
          await refreshUser();
        } catch (e) {
          // ignore
        }
        router.push('/');
        router.refresh();
      }, 300);
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=2000&auto=format&fit=crop" 
          alt="Login Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex flex-col justify-between p-12 text-white">
          <Link href="/" className="text-2xl font-serif tracking-wide">AuraFarm</Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-serif mb-4 text-white/80 ">Welcome Back</h2>
            <p className="text-stone-200 text-lg">Sign in to access your order history, saved addresses, and exclusive member benefits.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-serif text-stone-900">Login</h1>
            <p className="text-stone-500 mt-2">Enter your email to receive a secure login code.</p>
          </div>
          <Suspense>
            <QueryInit setEmail={setEmail} setStep={setStep} />
          </Suspense>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3"
              >
                {loading ? 'Sending Code...' : 'Send Login Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-center text-2xl tracking-[0.5em] font-serif"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-stone-400 mt-2 text-center">
                  We sent a 6-digit code to {email}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-stone-500 hover:text-stone-800"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="pt-6 text-center text-sm text-stone-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-600 font-medium hover:text-primary-700 underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
