"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthTabs() {
  const pathname = usePathname() || '';
  const active = pathname.includes('/signup') ? 'signup' : 'login';

  return (
    <div className="tabs mb-4">
      <Link
        href="/login"
        className={`tab-item ${active === 'login' ? 'tab-item-active' : ''}`}
      >
        Login
      </Link>
      <Link
        href="/signup"
        className={`tab-item ${active === 'signup' ? 'tab-item-active' : ''}`}
      >
        Sign Up
      </Link>
    </div>
  );
}
