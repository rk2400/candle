import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/lib/contexts/UserContext';
import { CartProvider } from '@/lib/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LittleFlame - Handcrafted Candles',
  description: 'Beautiful handcrafted candles for your home',
  icons: {
    icon: '/Logos/color_icon.png',
    apple: '/Logos/color_icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <CartProvider>
            <Header />
              {children}
              <Footer />
            <ToastProvider />
            <Script
              id="razorpay-checkout-js"
              src="https://checkout.razorpay.com/v1/checkout.js"
              strategy="lazyOnload"
            />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
