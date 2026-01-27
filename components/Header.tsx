"use client";

import Link from 'next/link';
import { useUser } from '@/lib/contexts/UserContext';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, loading, logout } = useUser();
  const { getItemCount, clearCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only show cart count after component has mounted to avoid hydration mismatch
  const cartCount = mounted ? getItemCount() : 0;
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);

  const handleLogout = async () => {
    clearCart();
    await logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const isHomePage = pathname === '/';

  return (
    <div>
      {/* Nav: sticky at very top */}
      <div className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <button className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors" onClick={() => setOpen(!open)} aria-label="menu">
                <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className="text-3xl font-serif font-bold text-stone-900 tracking-tight hover:opacity-80 transition-opacity">
                LittleFlame
              </Link>

              <nav className={`hidden md:flex items-center gap-8 ${open ? 'block' : ''}`}>
                {[
                  { name: 'Home', href: '/' },
                  { name: 'Shop', href: '/products' },
                  { name: 'Our Story', href: '/about' },
                  { name: 'Contact', href: '/contact' },
                ].map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className="text-sm font-medium uppercase tracking-wider text-stone-500 hover:text-primary-600 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              {loading ? (
                <div className="w-20 h-6 bg-stone-100 animate-pulse rounded-full"></div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    {/* Search */}
                    {showSearch ? (
                      <form onSubmit={handleSearch} className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          className="w-40 md:w-60 px-4 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-primary-500 transition-all"
                          autoFocus
                          onBlur={() => !searchQuery && setShowSearch(false)}
                        />
                        <button type="submit" className="absolute right-3 top-1.5 text-stone-400 hover:text-primary-600">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                        </button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setShowSearch(true)}
                        className="text-stone-400 hover:text-primary-600 transition-colors"
                        aria-label="Search"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    )}

                    {user ? (
                      <>
                        <Link
                          href="/cart"
                          className="relative p-1 text-stone-400 hover:text-primary-600 transition-colors"
                          title="Cart"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                              {cartCount}
                            </span>
                          )}
                        </Link>

                        <div className="relative group">
                          <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-primary-600 transition-colors">
                             <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                             </div>
                          </Link>
                        </div>

                        {user.isAdmin && (
                          <Link
                            href="/admin/dashboard"
                            className="text-xs font-bold uppercase tracking-wider text-primary-600 hover:text-primary-700 border border-primary-200 px-3 py-1 rounded-full hover:bg-primary-50 transition-all"
                          >
                            Admin
                          </Link>
                        )}
                        
                        <button
                           onClick={handleLogout}
                           className="hidden md:inline text-sm font-medium text-stone-400 hover:text-red-500 transition-colors"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="hidden md:flex items-center gap-3">
                          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-primary-600 transition-colors">
                            Log In
                          </Link>
                          <Link href="/signup" className="btn btn-primary text-sm px-5 py-2">
                            Sign Up
                          </Link>
                        </div>
                        <button
                          className="md:hidden w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          onClick={() => setAccountOpen(!accountOpen)}
                          aria-label="Account"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        {(open || accountOpen) && (
          <div className="md:hidden border-t border-stone-100 bg-white py-4 animate-fade-in">
            <nav className="flex flex-col gap-1 px-4">
              <Link href="/" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Home</Link>
              <Link href="/products" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Shop</Link>
              <Link href="/about" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Our Story</Link>
              <Link href="/contact" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Contact</Link>
              <div className="border-t border-stone-100 my-2"></div>
              {user ? (
                <>
                  <Link href="/profile" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Account</Link>
                  <button
                    onClick={() => { setAccountOpen(false); handleLogout(); }}
                    className="block text-left w-full px-4 py-3 rounded-lg hover:bg-stone-50 text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Login</Link>
                  <Link href="/signup" className="block px-4 py-3 rounded-lg hover:bg-stone-50 text-stone-600 font-medium">Sign Up</Link>
                </>
              )}
            </nav>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
