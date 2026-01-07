# AuraFarm - Ecommerce Platform for Candles

A production-ready ecommerce web application built for a small Indian startup selling candles. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## 🚀 Features

### Customer Features
- **Passwordless Authentication**: Email OTP-based login (no passwords stored)
- **Product Browsing**: Browse all available candles with detailed product pages
- **Shopping**: Add to cart and checkout flow
- **UPI Payments**: Mock UPI payment integration (ready for Razorpay/Cashfree)
- **Order Tracking**: View order history and track order status
- **Email Notifications**: Automatic emails on order creation and status updates

### Admin Features
- **Secure Admin Login**: Email + password authentication
- **Product Management**: Add, edit, delete products with image uploads
- **Order Management**: View all orders and update order status
- **Email Template Management**: Customize email templates for each order status
- **Dashboard**: View sales statistics and order analytics
- **Manual Email Sending**: Send emails to customers manually from order page

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens, bcrypt for password hashing
- **Email**: Nodemailer (SMTP) with mock mode support
- **Payments**: Mock UPI flow (ready for Razorpay/Cashfree integration)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AuraFarm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local with your values
   # See ENV_SETUP.md for detailed instructions
   ```
   
   **Required variables:**
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret for JWT tokens (generate with: `openssl rand -base64 32`)
   - `ADMIN_EMAIL` - Initial admin email
   - `ADMIN_PASSWORD` - Initial admin password
   
   **Optional variables:**
   - Email SMTP settings (leave empty for mock mode)
   - Payment gateway keys
   - See `.env.example` for all available variables
   
   **Validate your setup:**
   ```bash
   npm run validate-env
   ```

4. **Initialize Admin User**
   ```bash
   npx ts-node scripts/init-admin.ts
   ```

5. **Initialize Email Templates** (Optional)
   ```bash
   npx ts-node scripts/init-email-templates.ts
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication Flows

### Customer Authentication (Email OTP)
1. User enters email on login page
2. System generates 6-digit OTP and sends via email
3. OTP expires in 10 minutes
4. User enters OTP to verify
5. JWT token is set as HTTP-only cookie
6. User is authenticated for 7 days

### Admin Authentication
1. Admin enters email and password
2. Password is verified against bcrypt hash
3. JWT token is set as HTTP-only cookie
4. Admin has access to protected admin routes

## 📦 Order Lifecycle

1. **CREATED**: Order is created after payment verification
2. **PACKED**: Admin marks order as packed
3. **SHIPPED**: Order is shipped to customer
4. **DELIVERED**: Order delivery is confirmed

Each status change triggers an email notification to the customer (if email templates are configured).

## 📧 Email System

### Email Service Architecture
The email service is abstracted in `lib/email.ts`:
- **Mock Mode**: If SMTP is not configured, emails are logged to console
- **SMTP Mode**: Uses Nodemailer to send real emails via SMTP

### Email Templates
- Templates are stored in MongoDB (`EmailTemplate` model)
- Each order status has a corresponding template type
- Templates support dynamic variables:
  - `{{orderId}}`: Order ID
  - `{{userName}}`: User's name (extracted from email)
  - `{{status}}`: Current order status
  - `{{totalAmount}}`: Total order amount
  - `{{products}}`: HTML table of products

### Switching to Real Email Provider
To switch from mock to real email:
1. Configure SMTP settings in `.env`
2. The system will automatically use SMTP if configured
3. For production, consider using services like:
   - SendGrid
   - AWS SES
   - Mailgun
   - Resend

## 💳 Payment Integration

### Current Implementation (Mock UPI)
The payment flow is currently mocked:
1. User clicks "Buy Now"
2. Order is created with `PENDING` payment status
3. User enters UPI ID (prompt)
4. Payment is verified via `/api/payment/verify`
5. Order status changes to `COMPLETED`

### Integrating Real Payment Gateway

#### Razorpay Integration
1. Install Razorpay SDK:
   ```bash
   npm install razorpay
   ```

2. Update `app/api/payment/verify/route.ts`:
   ```typescript
   import Razorpay from 'razorpay';
   
   const razorpay = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID!,
     key_secret: process.env.RAZORPAY_KEY_SECRET!,
   });
   
   // Verify payment signature
   const isValid = razorpay.payments.fetch(paymentId);
   ```

3. Create payment order in checkout:
   ```typescript
   const order = await razorpay.orders.create({
     amount: totalAmount * 100, // in paise
     currency: 'INR',
   });
   ```

#### Cashfree Integration
Similar process with Cashfree SDK. The architecture supports easy swapping of payment providers.

## 🗄️ Database Models

### User
- `email`: User's email address
- `verified`: Email verification status
- `createdAt`: Account creation timestamp

### Admin
- `email`: Admin email
- `passwordHash`: Bcrypt hashed password
- `createdAt`: Account creation timestamp

### Product
- `name`: Product name
- `description`: Product description
- `price`: Product price (INR)
- `images`: Array of image URLs
- `status`: 'active' | 'inactive'
- `createdAt`, `updatedAt`: Timestamps

### Order
- `userId`: Reference to User
- `products`: Array of order items (productId, name, price, quantity, image)
- `totalAmount`: Total order amount
- `paymentStatus`: 'PENDING' | 'COMPLETED' | 'FAILED'
- `orderStatus`: 'CREATED' | 'PACKED' | 'SHIPPED' | 'DELIVERED'
- `paymentId`: Payment gateway transaction ID
- `createdAt`, `updatedAt`: Timestamps

### OTP
- `email`: Email address
- `code`: 6-digit OTP code
- `expiresAt`: Expiration timestamp
- `used`: Whether OTP has been used
- Auto-deleted after expiration (MongoDB TTL index)

### EmailTemplate
- `type`: Template type ('ORDER_CREATED', 'ORDER_PACKED', etc.)
- `subject`: Email subject line
- `body`: Email body (HTML with variables)
- `createdAt`, `updatedAt`: Timestamps

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Input Validation**: Zod schemas for all inputs
- **Protected Routes**: Middleware for admin and user routes
- **OTP Expiry**: 10-minute expiration for OTP codes
- **Environment Variables**: Secrets stored in `.env`

## 📁 Project Structure

```
AuraFarm/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product endpoints
│   │   ├── orders/       # Order endpoints
│   │   ├── checkout/     # Checkout endpoint
│   │   ├── payment/      # Payment verification
│   │   └── admin/        # Admin endpoints
│   ├── admin/            # Admin panel pages
│   ├── products/         # Product pages
│   ├── orders/           # Order pages
│   ├── login/            # Login page
│   └── page.tsx          # Homepage
├── lib/
│   ├── models/          # Mongoose models
│   ├── auth.ts          # Auth utilities
│   ├── email.ts         # Email service
│   ├── middleware.ts    # Route protection
│   ├── validations.ts   # Zod schemas
│   ├── api-client.ts    # Frontend API client
│   └── db.ts            # MongoDB connection
├── scripts/
│   ├── init-admin.ts    # Admin initialization
│   └── init-email-templates.ts  # Template initialization
└── README.md
```

## 🚀 Deployment

### Prerequisites
- MongoDB database (MongoDB Atlas recommended)
- Node.js 18+ environment
- Environment variables configured

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
- `MONGODB_URI`: Production MongoDB connection string
- `JWT_SECRET`: Strong random secret
- `SMTP_*`: Production email credentials
- `NEXT_PUBLIC_APP_URL`: Production domain

## 🧪 Testing

### Manual Testing Checklist
- [ ] Customer can login with email OTP
- [ ] Customer can browse products
- [ ] Customer can place order
- [ ] Payment verification works
- [ ] Order emails are sent
- [ ] Admin can login
- [ ] Admin can manage products
- [ ] Admin can update order status
- [ ] Admin can manage email templates
- [ ] Email templates support variables

## 📝 Notes

- **Image Uploads**: Currently supports image URLs. For production, integrate with:
  - Cloudinary
  - AWS S3
  - ImageKit
- **Payment Gateway**: Mock implementation ready for Razorpay/Cashfree
- **Email Service**: Mock mode for development, SMTP for production
- **OTP Storage**: OTPs are auto-deleted after expiration (MongoDB TTL)

## 🤝 Contributing

This is a production MVP. For enhancements:
1. Add proper image upload handling
2. Integrate real payment gateway
3. Add order cancellation/refund flow
4. Implement product search and filters
5. Add customer reviews and ratings
6. Implement inventory management

## 📄 License

Proprietary - AuraFarm

---

**Built with ❤️ for AuraFarm**

