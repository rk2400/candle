import nodemailer from 'nodemailer';
import { emailConfig, authConfig, appConfig } from './config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize transporter if SMTP config is available
    if (emailConfig.isConfigured()) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure || emailConfig.port === 465,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });

      // Optional connection verification for clearer diagnostics
      this.transporter.verify().then(() => {
        console.log('Email transporter verified and ready');
      }).catch((err) => {
        console.error('Email transporter verification failed:', err?.message || err);
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If no SMTP configured, log email (mock mode)
      if (!this.transporter) {
        console.log('📧 [MOCK EMAIL]');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.html);
        return true;
      }

      await this.transporter.sendMail({
        from: emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      });

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendOTP(email: string, code: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">${appConfig.name} - Login OTP</h2>
        <p>Your OTP code is:</p>
        <div style="background: #fff7ed; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in ${authConfig.otpExpiryMinutes} minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Your ${appConfig.name} Login OTP`,
      html,
    });
  }

  async sendOrderEmail(
    email: string,
    template: { subject: string; body: string },
    variables: {
      orderId: string;
      userName: string;
      status: string;
      products: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: number;
    }
  ): Promise<boolean> {
    // Replace variables in template
    let html = template.body
      .replace(/\{\{orderId\}\}/g, variables.orderId)
      .replace(/\{\{userName\}\}/g, variables.userName)
      .replace(/\{\{status\}\}/g, variables.status)
      .replace(/\{\{totalAmount\}\}/g, `₹${variables.totalAmount.toFixed(2)}`);

    // Replace products list
    const productsHtml = variables.products
      .map(
        (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${p.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    html = html.replace(
      /\{\{products\}\}/g,
      `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #fff7ed;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
    `
    );

    // Wrap in styled container
    const styledHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${appConfig.name}</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          ${html}
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
          Thank you for shopping with ${appConfig.name}! 🕯️
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: styledHtml,
    });
  }

  async sendPaymentNotification(
    email: string,
    status: 'submitted' | 'approved' | 'rejected',
    variables: {
      orderId: string;
      userName: string;
      totalAmount: number;
      rejectionReason?: string;
    }
  ): Promise<boolean> {
    let subject = '';
    let html = '';

    if (status === 'submitted') {
      subject = `Payment Received - Order #${variables.orderId}`;
      html = `
        <p>Hi ${variables.userName},</p>
        <p>We have received your payment for order <strong>#${variables.orderId}</strong></p>
        <p><strong>Amount: ₹${variables.totalAmount.toFixed(2)}</strong></p>
        <p>Your payment is under verification. We'll confirm the payment within 24 hours and send you an update.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for your patience!</p>
      `;
    } else if (status === 'approved') {
      subject = `Payment Confirmed! - Order #${variables.orderId}`;
      html = `
        <p>Hi ${variables.userName},</p>
        <p>Great news! We have confirmed your payment for order <strong>#${variables.orderId}</strong></p>
        <p><strong>Amount: ₹${variables.totalAmount.toFixed(2)}</strong></p>
        <p>Your order is now confirmed and will be shipped soon. You'll receive tracking details shortly.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for shopping with ${appConfig.name}! 🕯️</p>
      `;
    } else {
      // rejected
      subject = `Payment Could Not Be Verified - Order #${variables.orderId}`;
      html = `
        <p>Hi ${variables.userName},</p>
        <p>We could not verify the payment for order <strong>#${variables.orderId}</strong></p>
        ${variables.rejectionReason ? `<p><strong>Reason:</strong> ${variables.rejectionReason}</p>` : ''}
        <p>The amount <strong>₹${variables.totalAmount.toFixed(2)}</strong> is available for you to pay again.</p>
        <p>Please contact our support team if you have any questions.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for your understanding.</p>
      `;
    }

    const styledHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${appConfig.name}</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          ${html}
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: styledHtml,
    });
  }
}

export const emailService = new EmailService();
