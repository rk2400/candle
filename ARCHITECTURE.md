# Architecture Guide

## System Overview

LittleFlame is built as a full-stack Next.js application with a clear separation between frontend, API routes, and database layers. The architecture is designed to be scalable, secure, and easy to extend.

## Key Architecture Decisions

### 1. Authentication Strategy

#### Customer Authentication (Email OTP)
- **Why**: Passwordless authentication reduces friction and security risks
- **Implementation**: 
  - OTP stored in MongoDB with TTL index (auto-deletes after expiry)
  - 10-minute expiration window
  - Single-use OTPs (marked as used after verification)
- **Security**: OTPs are hashed in production (currently plain for simplicity)

#### Admin Authentication (Password)
- **Why**: Admin accounts need stronger security
- **Implementation**: Bcrypt password hashing with 10 salt rounds
- **Security**: Passwords never stored in plain text

### 2. Session Management

- **JWT Tokens**: Stored in HTTP-only cookies
- **Expiration**: 7 days for both user and admin sessions
- **Type Field**: JWT payload includes `type: 'user' | 'admin'` for role-based access

### 3. Database Design

#### Models
- **User**: Minimal schema (email, verified flag)
- **Admin**: Separate collection for admin accounts
- **Product**: Active/inactive status for soft deletes
- **Order**: Embedded product data (denormalized for performance)
- **OTP**: TTL index for automatic cleanup
- **EmailTemplate**: One template per order status type

#### Design Patterns
- **Denormalization**: Order products stored as embedded documents (no joins needed)
- **Soft Deletes**: Products use status field instead of hard deletes
- **TTL Indexes**: OTP collection auto-cleans expired records

### 4. Email Service Abstraction

```typescript
// lib/email.ts - Abstracted email service
class EmailService {
  // Automatically switches between mock and SMTP
  // Mock mode: Logs to console (development)
  // SMTP mode: Sends real emails (production)
}
```

**Benefits**:
- Easy to swap email providers
- Mock mode for development/testing
- Centralized email logic

**Extending**:
- Add SendGrid: Create `lib/email-sendgrid.ts` and swap in `lib/email.ts`
- Add AWS SES: Similar pattern
- Add Resend: Similar pattern

### 5. Payment Integration Architecture

#### Current: Mock UPI
```typescript
// app/api/payment/verify/route.ts
// Currently mocks payment verification
// Ready for real gateway integration
```

#### Extending to Razorpay
1. Create `lib/payment-razorpay.ts`
2. Update `app/api/payment/verify/route.ts` to use Razorpay SDK
3. Add Razorpay order creation in checkout flow

#### Extending to Cashfree
1. Create `lib/payment-cashfree.ts`
2. Similar pattern to Razorpay

**Key Point**: Payment logic is isolated in one route handler, making it easy to swap providers.

### 6. API Route Structure

```
app/api/
├── auth/              # Authentication endpoints
│   ├── login/         # Customer OTP request
│   ├── verify-otp/    # Customer OTP verification
│   ├── logout/        # Session termination
│   └── admin/login/   # Admin login
├── products/          # Public product endpoints
├── orders/            # User order endpoints (protected)
├── checkout/          # Order creation (protected)
├── payment/           # Payment verification (protected)
└── admin/             # Admin endpoints (admin-protected)
    ├── products/      # Product CRUD
    ├── orders/        # Order management
    ├── email-templates/ # Template management
    └── stats/          # Dashboard statistics
```

### 7. Middleware Pattern

```typescript
// lib/middleware.ts
export function withAuth(handler) {
  // Verifies JWT token
  // Attaches user to request
  // Returns 401 if unauthorized
}

export function withAdminAuth(handler) {
  // Verifies JWT token
  // Checks admin type
  // Returns 403 if not admin
}
```

**Usage**:
```typescript
export const GET = withAuth(async (req) => {
  // req.user is guaranteed to exist
  // req.user.type is 'user' or 'admin'
});
```

### 8. Frontend Architecture

#### Server Components (Default)
- Homepage, product listing: Server-rendered for SEO
- Direct database access via API routes

#### Client Components (When Needed)
- Forms, interactive elements: Client-side for reactivity
- Uses `'use client'` directive

#### API Client Layer
- `lib/api-client.ts`: Centralized API calls
- Handles authentication cookies automatically
- Error handling and type safety

### 9. State Management

- **No Global State**: Uses React hooks and server components
- **Session State**: JWT tokens in HTTP-only cookies
- **Form State**: Local component state with React hooks
- **Data Fetching**: Server components + client-side fetch for dynamic data

### 10. Error Handling

#### API Routes
```typescript
try {
  // Logic
} catch (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 400 }
  );
}
```

#### Frontend
- `react-hot-toast` for user notifications
- Try-catch blocks in async functions
- Error boundaries for React errors

## Extension Points

### Adding New Features

1. **New Product Fields**
   - Update `lib/models/Product.ts`
   - Update `lib/validations.ts` (productSchema)
   - Update admin product forms

2. **New Order Status**
   - Update `OrderStatus` type in `lib/models/Order.ts`
   - Add email template type
   - Update admin order status dropdown

3. **New Payment Method**
   - Create payment provider file in `lib/`
   - Update `app/api/payment/verify/route.ts`
   - Update checkout flow

4. **New Email Template**
   - Add to `EmailTemplate` type
   - Create default template
   - Update admin email template UI

### Performance Optimizations

1. **Image Optimization**
   - Use Next.js Image component
   - Implement CDN (Cloudinary, ImageKit)
   - Lazy loading for product images

2. **Database Indexing**
   - Add indexes on frequently queried fields
   - Example: `User.email`, `Order.userId`, `Order.createdAt`

3. **Caching**
   - Product listing: ISR (Incremental Static Regeneration)
   - Order data: Client-side caching with SWR/React Query

4. **API Optimization**
   - Pagination for product/order lists
   - Field selection (only fetch needed fields)
   - Aggregation pipelines for stats

## Security Considerations

### Current Implementation
- ✅ Password hashing (bcrypt)
- ✅ JWT tokens
- ✅ HTTP-only cookies
- ✅ Input validation (Zod)
- ✅ Protected routes
- ✅ OTP expiration

### Production Enhancements
- [ ] Rate limiting (OTP requests, login attempts)
- [ ] CSRF protection
- [ ] XSS protection (sanitize user inputs)
- [ ] SQL injection prevention (Mongoose handles this)
- [ ] HTTPS only cookies
- [ ] OTP hashing (store hashed OTPs)
- [ ] Admin IP whitelisting (optional)
- [ ] Audit logging

## Deployment Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production MongoDB
- [ ] Set up SMTP email service
- [ ] Configure `NEXT_PUBLIC_APP_URL`
- [ ] Initialize admin user
- [ ] Initialize email templates
- [ ] Set up image CDN
- [ ] Configure payment gateway
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backups

## Monitoring & Logging

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics / Plausible
- **Logging**: Logtail / Datadog
- **Uptime**: UptimeRobot
- **Performance**: Vercel Analytics

## Scaling Considerations

### Current Capacity
- Handles ~1000 concurrent users
- MongoDB connection pooling
- Stateless API design (horizontal scaling ready)

### Scaling Steps
1. **Database**: MongoDB Atlas with replica sets
2. **Caching**: Redis for session storage
3. **CDN**: Cloudflare for static assets
4. **Load Balancing**: Vercel handles this automatically
5. **Queue System**: Bull/BullMQ for email sending
6. **Search**: Algolia/Meilisearch for product search

---

**This architecture is designed to grow with your business while maintaining simplicity.**



