import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validations';
import { emailService } from '@/lib/email';
import { adminConfig, appConfig } from '@/lib/config';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = contactSchema.parse(body);

    // Send email notification to admin/support
    const supportEmail = process.env.SUPPORT_EMAIL || adminConfig.email;
    const subject = `New Contact Form Submission from ${name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${appConfig.name} - Contact Form</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">New Contact Form Submission</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #f97316;">${email}</a></p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
            <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
            <p style="margin: 0; white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              You can reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to support/admin
    const emailSent = await emailService.sendEmail({
      to: supportEmail,
      subject,
      html,
      replyTo: email,
    });

    // Send confirmation email to the user
    const userConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${appConfig.name}</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Thank You for Contacting Us!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <div style="margin: 20px 0; padding: 15px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          <p>Our team typically responds within 24-48 hours during business days.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            If you have any urgent questions, please call us at +91 9876543210 or email us at littleflame.official@gmail.com
          </p>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
          Thank you for your interest in ${appConfig.name}! 🕯️
        </p>
      </div>
    `;

    await emailService.sendEmail({
      to: email,
      subject: `We've Received Your Message - ${appConfig.name}`,
      html: userConfirmationHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
