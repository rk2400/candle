/**
 * Initialize Email Templates
 * Run this script to create default email templates
 * 
 * Usage: npx ts-node scripts/init-email-templates.ts
 */

import mongoose from 'mongoose';
import EmailTemplate from '../lib/models/EmailTemplate';
import { dbConfig } from '../lib/config';

const defaultTemplates = [
  {
    type: 'ORDER_CREATED',
    subject: 'Order Confirmed - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order has been confirmed!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>Thank you for your purchase! We'll keep you updated on your order status.</p>
    `,
  },
  {
    type: 'ORDER_PACKED',
    subject: 'Your Order is Packed - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Great news! Your order has been packed and is ready to ship.</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
    `,
  },
  {
    type: 'ORDER_SHIPPED',
    subject: 'Your Order is Shipped - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order is on its way!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>You'll receive your order soon!</p>
    `,
  },
  {
    type: 'ORDER_DELIVERED',
    subject: 'Order Delivered - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>Your order has been delivered!</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>Thank you for shopping with LittleFlame! We hope you love your candles.</p>
    `,
  },
  {
    type: 'ORDER_CANCELLED',
    subject: 'Order Cancelled - LittleFlame',
    body: `
      <h2>Hello {{userName}}!</h2>
      <p>We're sorry to inform you that your order has been cancelled.</p>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <h3>Order Summary:</h3>
      {{products}}
      <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
      <p>If you have any questions or concerns, please contact our support team.</p>
      <p>Thank you for your understanding.</p>
    `,
  },
];

async function initTemplates() {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log('Connected to MongoDB');

    for (const template of defaultTemplates) {
      await EmailTemplate.findOneAndUpdate(
        { type: template.type },
        template,
        { upsert: true, new: true }
      );
      console.log(`✓ Template ${template.type} initialized`);
    }

    console.log('\nAll email templates initialized!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing templates:', error);
    process.exit(1);
  }
}

initTemplates();

