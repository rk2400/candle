"use client";

import { useState } from 'react';
// Header and Footer are provided by `app/layout.tsx`
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or login to complete your purchase.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We currently accept UPI payments. More payment options will be available soon.',
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping typically takes 5-7 business days. You\'ll receive tracking information once your order ships.',
    },
    {
      question: 'Can I cancel or modify my order?',
      answer: 'You can cancel your order within 24 hours of placing it. Contact our support team for assistance.',
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy for unopened products in original packaging. Contact us to initiate a return.',
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you\'ll receive an email with tracking information. You can also view order status in your account.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-8 mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Help & Support</h1>
            <p className="text-gray-600 mt-2">Quick answers and support resources to help you shop with confidence.</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a7d3c1d5b6d5f7f8a3e3b0b3c0f8a5f"
            alt="support"
            className="w-40 h-32 object-cover rounded-md"
          />
        </div>

        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 flex justify-between items-center"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <span className="text-gray-500">{openIndex === index ? '−' : '+'}</span>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-700">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
          <p className="text-gray-700 mb-4">Can't find what you're looking for? Our support team is here to help.</p>
          <Link href="/contact" className="btn btn-primary">Contact Support</Link>
        </div>
      </main>
    </div>
  );
}



