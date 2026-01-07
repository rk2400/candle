'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, login as sendOTP, verifyOTP } from '@/lib/api-client';
import { useUser } from '@/lib/contexts/UserContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      toast.success('Admin login successful');
      // refresh user context then route
      await refreshUser();
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOTP(email);
      toast.success('OTP sent to admin email');
      setOtpStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      toast.success('Admin authenticated');
      // refresh user and go to dashboard
      await refreshUser();
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="card max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary-600">Admin Login</h1>
          <p className="text-sm text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        <div className="tabs mb-4" role="tablist">
          <button onClick={() => setTab('password')} className={`tab-item ${tab === 'password' ? 'tab-item-active' : ''}`}>Password</button>
          <button onClick={() => setTab('otp')} className={`tab-item ${tab === 'otp' ? 'tab-item-active' : ''}`}>OTP</button>
        </div>

        {tab === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Admin Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="admin@example.com" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Password" required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
        ) : (
          <div>
            {otpStep === 'send' ? (
              <form onSubmit={handleSendOTP}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Admin Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="admin@example.com" required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Enter OTP</label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} className="input text-center text-2xl tracking-widest" maxLength={6} required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                <button type="button" onClick={() => setOtpStep('send')} className="btn btn-secondary w-full mt-2">Change Email</button>
              </form>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => router.push('/')} className="text-primary-600 hover:underline">Back to Store</button>
        </div>
      </div>
    </div>
  );
}



