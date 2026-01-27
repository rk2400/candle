# Semi-Manual UPI Payment System

## Overview

This LittleFlame application implements a **production-realistic, fraud-aware, semi-manual UPI payment system** designed for Indian D2C startups. The system avoids expensive payment gateways while maintaining security, transparency, and operational control.

## Architecture

### Payment Flow

```
Customer Order Creation
    ↓
Order created with PAYMENT_PENDING status
    ↓
Customer redirected to /payment page
    ↓
Customer sees UPI QR code + UPI ID
    ↓
Customer completes payment in UPI app
    ↓
Customer submits UPI Reference Number + optional screenshot
    ↓
Payment status changes to PAYMENT_SUBMITTED
    ↓
Admin reviews payment in /admin/payments
    ↓
Admin approves or rejects
    ↓
PAID → Order can be fulfilled
REJECTED → Stock restored, user can retry
```

## Payment Status States

The system uses 4 distinct payment statuses to prevent invalid transitions:

| Status | Meaning | Next State |
|--------|---------|-----------|
| `PAYMENT_PENDING` | Order created, awaiting payment | → `PAYMENT_SUBMITTED` |
| `PAYMENT_SUBMITTED` | Customer submitted payment details | → `PAID` or `PAYMENT_REJECTED` |
| `PAID` | Payment verified by admin | Order fulfillment begins |
| `PAYMENT_REJECTED` | Payment could not be verified | → `PAYMENT_PENDING` (user can retry) |

## Core Components

### 1. Payment Data Model

**File**: `lib/models/Order.ts`

Extended Order schema with payment fields:

```typescript
{
  paymentStatus: 'PAYMENT_PENDING' | 'PAYMENT_SUBMITTED' | 'PAID' | 'PAYMENT_REJECTED',
  upiReferenceNumber?: string,        // UTR from UPI app (max 32 chars)
  paymentScreenshot?: string,         // Base64 encoded screenshot for audit
  paymentSubmittedAt?: Date,          // When user submitted payment
  adminPaymentNote?: string,          // Admin notes (reason for rejection, etc.)
}
```

### 2. UPI Utilities

**File**: `lib/upi.ts`

#### `generateUPIString(upiId, payeeName, amount, orderId)`
Generates UPI payment URL in standard format:
```
upi://pay?pa=merchant@upi&pn=Merchant%20Name&am=1000&tn=Order123456&cu=INR
```

Features:
- URL encoding for special characters
- Order ID in payment note (helps match payments to orders)
- Amount in rupees (no decimals in UPI)
- Currency set to INR

#### `generateQRCodeURL(upiString)`
Generates QR code URL using free qr-server API:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...
```

Features:
- **No external dependencies** - uses free REST API
- No library needed, works client-side or server-side
- Generates standard QR code image
- Size: 300x300 pixels (responsive)

### 3. API Endpoints

#### Customer Endpoints

##### `POST /api/payment/submit`
**Purpose**: Customer submits UPI reference after paying

**Request**:
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "upiReferenceNumber": "123456789012345",
  "paymentScreenshot": "data:image/png;base64,iVBORw0KGgoAAAANS..." // optional
}
```

**Validation**:
- `upiReferenceNumber`: min 10 chars, alphanumeric only
- Order must exist and belong to user
- Order payment status must be `PAYMENT_PENDING`
- No duplicate submissions (prevents accidental re-submission)
- Screenshot: converted to base64, validated

**Response**:
```json
{
  "success": true,
  "message": "Payment submitted for verification...",
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "paymentStatus": "PAYMENT_SUBMITTED",
    "upiReferenceNumber": "123456789012345",
    "totalAmount": 999
  }
}
```

**Side Effects**:
- Email notification sent to user: "Payment Received - Under Verification"
- Order moved to verification queue

#### Admin Endpoints

##### `GET /api/admin/payments`
**Purpose**: Fetch all payments awaiting verification

**Response**:
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "totalAmount": 999,
      "upiReferenceNumber": "123456789012345",
      "paymentScreenshot": "data:image/png;base64,...",
      "paymentSubmittedAt": "2024-01-15T10:30:00Z",
      "products": [
        { "name": "Lavender Candle", "quantity": 2, "price": 499 }
      ]
    }
  ]
}
```

##### `PUT /api/admin/payments/[id]`
**Purpose**: Admin approves or rejects payment

**Request**:
```json
{
  "action": "approve" | "reject",
  "adminNote": "Payment verified from UPI logs" // optional
}
```

**Actions**:
- `approve`: Sets payment status to `PAID`, sends confirmation email to user
- `reject`: Sets payment status to `PAYMENT_REJECTED`, restores stock, sends rejection email

**Response**:
```json
{
  "success": true,
  "message": "Payment approved. Order confirmation email sent to customer.",
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "paymentStatus": "PAID",
    "orderStatus": "PENDING"
  }
}
```

### 4. Frontend Pages

#### `/payment` - Customer Payment Page

**File**: `app/payment/page.tsx`

Features:
- **Left Column**:
  - Dynamic UPI QR code (regenerated based on current amount)
  - Merchant UPI ID (copyable)
  - Clear instructions: "Enter Order ID as payment note in your UPI app"
  - Payment amount display
  
- **Right Column**:
  - UPI Reference Number input (after-payment)
  - Optional payment screenshot upload (image → base64)
  - Form validation (min 10 chars)
  - Submit button
  
- **Status Handling**:
  - If `PAYMENT_PENDING`: Show payment form
  - If `PAYMENT_SUBMITTED`: Show "Under Verification" state
  - If `PAID`: Show confirmation, redirect to order details
  - If `PAYMENT_REJECTED`: Show "Please retry" state

- **Order Summary**:
  - Subtotal, discount, taxes
  - Final amount to pay
  - Product list

#### `/admin/payments` - Admin Payment Verification

**File**: `app/admin/payments/page.tsx`

Features:
- **Payment List**:
  - Order ID, amount, UPI reference
  - Submission timestamp
  - Product details
  - Payment screenshot (if uploaded)
  
- **Actions**:
  - Approve button → Opens modal for admin notes
  - Reject button → Opens modal for rejection reason
  
- **Approve Modal**:
  - Confirm order ID, amount, UTR
  - Optional admin notes field
  - Sends user confirmation email
  
- **Reject Modal**:
  - Confirm order ID, amount, UTR
  - Required rejection reason
  - Sends user rejection email + restores stock

### 5. Email Notifications

**File**: `lib/email.ts` - `sendPaymentNotification()` method

#### Payment Submitted (Customer)
- Subject: `Payment Received - Order #[orderId]`
- Message: Payment received, under verification, will confirm within 24 hours
- Sent: Immediately after customer submits UPI reference

#### Payment Approved (Customer)
- Subject: `Payment Confirmed! - Order #[orderId]`
- Message: Payment verified, order confirmed, shipping soon
- Sent: Immediately after admin approval
- Effect: Order fulfillment can begin

#### Payment Rejected (Customer)
- Subject: `Payment Could Not Be Verified - Order #[orderId]`
- Message: Payment verification failed, reason given, can retry
- Sent: Immediately after admin rejection
- Effect: Stock restored, order available for retry

## Configuration

**File**: `lib/config.ts`

```typescript
export const paymentConfig = {
  upiId: process.env.NEXT_PUBLIC_UPI_ID,           // e.g., "merchant@upi"
  upiPayeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME, // e.g., "LittleFlame"
};
```

**File**: `.env.local` (create from `.env.example`)

```env
# UPI Payment Configuration
NEXT_PUBLIC_UPI_ID=littleflame@upi
NEXT_PUBLIC_UPI_PAYEE_NAME=LittleFlame
```

## Security & Fraud Prevention

### 1. Duplicate Submission Prevention
- Only one payment submission per order allowed
- System checks `order.upiReferenceNumber` before allowing new submission
- Prevents accidental duplicate entries and "payment multiple times" exploits

### 2. Order Ownership Validation
- Customer can only submit payment for their own orders
- `order.userId` matched against `req.user.userId`
- Prevents cross-user payment manipulation

### 3. Payment Status Validation
- Strict state transitions enforced
- Can only submit payment if status is `PAYMENT_PENDING`
- Can only verify if status is `PAYMENT_SUBMITTED`
- Prevents invalid state transitions

### 4. UPI Reference Validation
- Minimum 10 characters (typical UTR length)
- Alphanumeric only (no special chars)
- Uppercase conversion (standardization)
- Prevents typos and invalid reference formats

### 5. Screenshot Evidence
- Optional but encouraged
- Base64 encoded for easy storage/display
- Size validation (< 2MB)
- Provides audit trail for disputed payments

### 6. Stock Management
- Stock **reserved** at checkout (deducted when order created)
- Stock **released** if payment rejected
- Prevents overselling during payment verification period
- Ensures accurate inventory accounting

### 7. Admin Manual Verification
- No automatic approval - human review required
- Admin sees payment reference, screenshot, product details
- Can add notes for audit trail
- Clear approve/reject workflow

## Workflow Examples

### Scenario 1: Successful Payment

1. Customer adds items to cart, clicks "Checkout"
2. Order created with `paymentStatus: PAYMENT_PENDING`, stock deducted
3. Customer redirected to `/payment?orderId=xyz`
4. Customer scans UPI QR or opens UPI with merchant ID
5. Customer **enters Order ID in UPI app note field** (important!)
6. Customer sends ₹999 via UPI
7. Customer gets UPI reference number (e.g., `123456789012345`)
8. Customer enters reference + optional screenshot on payment page
9. Customer clicks "Submit Payment"
10. Order status → `PAYMENT_SUBMITTED`
11. Email sent: "Payment received, under verification"
12. Admin receives notification, reviews in `/admin/payments`
13. Admin sees reference, screenshot, product details
14. Admin clicks "Approve"
15. Order status → `PAID`
16. Email sent: "Payment confirmed, shipping soon"
17. Order can be marked as shipped, delivered

### Scenario 2: Payment Rejection

1. Steps 1-14 same as above
2. Admin clicks "Reject" and enters reason: "Invalid UTR format"
3. Order status → `PAYMENT_REJECTED`
4. Stock automatically restored (added back to product quantities)
5. Email sent: "Payment could not be verified, reason: Invalid UTR format"
6. Customer can create new order or go to existing order and click "Retry Payment"
7. Order available again for payment submission

### Scenario 3: Payment Already Verified

1. Customer already paid and admin approved (status = `PAID`)
2. Customer tries to access `/payment?orderId=xyz`
3. Page detects payment is already `PAID`
4. Page redirects to order details page with "Payment Complete" status

## Testing Checklist

### Manual Testing (No Automated Tests Yet)

- [ ] **Order Creation**
  - Add items to cart
  - Enter delivery address
  - Click checkout
  - Verify order created with `PAYMENT_PENDING` status
  - Stock correctly deducted

- [ ] **Payment Submission**
  - Navigate to `/payment?orderId=[id]`
  - QR code displays correctly
  - Can copy UPI ID
  - Enter valid UPI reference (e.g., `1234567890`)
  - Optional: Upload screenshot
  - Click submit
  - Verify order status → `PAYMENT_SUBMITTED`
  - Check email received: "Payment received"

- [ ] **Admin Verification - Approve**
  - Login as admin
  - Navigate to `/admin/payments`
  - See pending payment
  - Click approve
  - Add optional note
  - Confirm
  - Verify order status → `PAID`
  - Check email received: "Payment confirmed"

- [ ] **Admin Verification - Reject**
  - Same as above but click reject
  - Enter rejection reason
  - Verify order status → `PAYMENT_REJECTED`
  - Verify stock restored (product quantity increased)
  - Check email received: "Payment failed, reason: [reason]"

- [ ] **Customer Retry After Rejection**
  - Customer views order details
  - Sees "Payment Rejected" status
  - Clicks "Retry Payment"
  - Redirected to `/payment?orderId=[id]`
  - Can submit new payment reference
  - Verify status → `PAYMENT_SUBMITTED` again

- [ ] **Duplicate Prevention**
  - After first submission, try submitting again
  - Should see error: "Payment already submitted..."

- [ ] **Email Notifications**
  - Payment submitted → Email received
  - Payment approved → Email received
  - Payment rejected → Email received (with reason)

- [ ] **Mobile Responsiveness**
  - QR code displays on mobile
  - Payment form accessible on mobile
  - Screenshot upload works on mobile

## Production Checklist

Before deploying to production:

- [ ] Set correct `NEXT_PUBLIC_UPI_ID` in production env
- [ ] Set correct `NEXT_PUBLIC_UPI_PAYEE_NAME` in production env
- [ ] Configure real SMTP settings for email
- [ ] Test complete payment flow with real UPI payment
- [ ] Verify email templates are branded correctly
- [ ] Set up admin access controls
- [ ] Enable HTTPS (required for sensitive data)
- [ ] Monitor payment logs and email delivery
- [ ] Create admin SOP for payment verification
- [ ] Set up alerts for payment failures
- [ ] Test stock restoration on rejection
- [ ] Verify no duplicate payment submission possible
- [ ] Set up daily admin payment verification routine
- [ ] Create customer FAQ for payment process

## Future Enhancements

1. **Automatic Payment Verification** (Phase 2)
   - Integrate with NPCI/bank APIs to auto-verify UPI payments
   - Requires bank partnership
   - Eliminates manual admin verification

2. **Payment Gateway Integration** (When Scale Requires)
   - Razorpay, Phonepe, Google Pay
   - Could replace this system at higher volumes
   - Keep this system as fallback

3. **Analytics & Reporting**
   - Track payment success rates
   - Average verification time
   - Most common rejection reasons

4. **Retry Automation**
   - Auto-retry rejected payments with customer confirmation
   - Payment plan support (installments)

5. **Multi-Currency Support**
   - Support payments in multiple currencies
   - Requires exchange rate handling

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/models/Order.ts` | Order schema with payment fields |
| `lib/config.ts` | UPI configuration |
| `lib/upi.ts` | UPI utilities (QR, string generation) |
| `lib/email.ts` | Email notifications |
| `app/api/payment/submit/route.ts` | Customer payment submission |
| `app/api/admin/payments/route.ts` | Admin: list pending payments |
| `app/api/admin/payments/[id]/route.ts` | Admin: approve/reject payments |
| `app/payment/page.tsx` | Customer payment page |
| `app/admin/payments/page.tsx` | Admin payment verification UI |
| `lib/api-client.ts` | Frontend API client |
| `.env.example` | Environment variable template |

## Support & Troubleshooting

### Common Issues

**Q: QR code not displaying**
A: Check `NEXT_PUBLIC_UPI_ID` and `NEXT_PUBLIC_UPI_PAYEE_NAME` are set in `.env.local`

**Q: Email not sending**
A: Check SMTP configuration in `.env.local`. See `lib/email.ts` for mock mode.

**Q: Stock not restored after rejection**
A: Verify admin clicked "Reject" action. Check database for stock values.

**Q: Payment submitted twice**
A: System prevents this - check if second submission shows error.

**Q: Can't find payment in admin panel**
A: Payment must be in `PAYMENT_SUBMITTED` status. Check order status.

---

**Last Updated**: January 2024
**System Version**: 1.0.0 (Semi-Manual UPI)
**Author**: LittleFlame Dev Team
