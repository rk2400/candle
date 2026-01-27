# Quick Start: Semi-Manual UPI Payment System

## 5-Minute Setup

### Step 1: Environment Variables

Add to `.env.local`:

```env
# UPI Payment Configuration
NEXT_PUBLIC_UPI_ID=littleflame@upi
NEXT_PUBLIC_UPI_PAYEE_NAME=LittleFlame
```

**Note**: `NEXT_PUBLIC_` prefix makes these available in the browser (necessary for QR code generation).

### Step 2: Start Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`

### Step 3: Test the Payment Flow

#### 1. Create a Test Account
- Go to `/signup` → Enter email → Enter OTP (check console/email mock)
- Fill signup form
- Add delivery address

#### 2. Create a Test Order
- Go to `/products`
- Add item to cart
- Go to `/cart`
- Fill delivery address (if not done)
- Click "Checkout"
- Order created! Status: `PAYMENT_PENDING`

#### 3. Make Payment (Test Flow)
- Redirected to `/payment?orderId=[orderId]`
- See UPI QR code and merchant UPI ID
- **Option A (Simulate)**: Enter any 10+ digit number as "UPI Reference" (e.g., `1234567890`)
- Click "Submit Payment"
- Status changes to `PAYMENT_SUBMITTED`

#### 4. Verify Payment (Admin)
- Login as admin: Go to `/admin/login`
  - **Default Admin Setup** (first time only):
    ```bash
    npx ts-node scripts/init-admin.ts
    ```
    - Email: `ADMIN_EMAIL` env var
    - Password: `ADMIN_PASSWORD` env var
  
- Navigate to `/admin/payments` (💳 Payments in admin menu)
- See pending payment with:
  - Order ID
  - Amount
  - UPI Reference
  - Customer details
  
#### 5. Approve Payment
- Click "Approve" button
- Add optional note: "UTR verified in bank logs"
- Click "Confirm"
- Order status → `PAID`
- Check customer email (mock mode prints to console)

---

## Understanding the System

### What Happens When Order is Created (Checkout)
1. Products removed from stock (reserved)
2. Order created with `paymentStatus: PAYMENT_PENDING`
3. Customer redirected to `/payment?orderId=xyz`

### What Happens When Payment is Submitted
1. Customer enters UPI reference number
2. Optional: uploads payment screenshot (proof)
3. System updates order:
   - `paymentStatus: PAYMENT_SUBMITTED`
   - Stores `upiReferenceNumber` + `paymentSubmittedAt`
   - Stores optional screenshot
4. Email sent to customer: "Payment received, pending verification"

### What Happens When Admin Approves
1. Order status: `PAYMENT_PENDING` → `PAID`
2. Email sent to customer: "Payment confirmed!"
3. Order ready for fulfillment (shipping, packing, etc.)

### What Happens When Admin Rejects
1. Order status: `PAYMENT_PENDING` → `PAYMENT_REJECTED`
2. Stock automatically restored (added back to products)
3. Email sent to customer: "Payment failed, reason: [reason]. Please retry."
4. Customer can click "Retry Payment" to resubmit

---

## File Structure

```
app/
├── payment/page.tsx              # Customer payment page (UPI QR + form)
├── admin/payments/page.tsx       # Admin verification dashboard
└── api/
    ├── payment/submit/route.ts   # Customer payment submission
    └── admin/payments/
        ├── route.ts              # Admin: list pending payments
        └── [id]/route.ts         # Admin: approve/reject
        
lib/
├── upi.ts                        # QR code + UPI string generation
├── email.ts                      # Payment notification emails
├── api-client.ts                 # Frontend API calls
└── models/Order.ts               # Order schema with payment fields

.env.example                      # Copy to .env.local and fill in UPI details
```

---

## Database Schema Changes

### Order Model Extension

New fields added to Order:

```javascript
{
  paymentStatus: 'PAYMENT_PENDING' | 'PAYMENT_SUBMITTED' | 'PAID' | 'PAYMENT_REJECTED',
  upiReferenceNumber: String,    // UTR from UPI app
  paymentScreenshot: String,     // Base64 image
  paymentSubmittedAt: Date,      // When user submitted
  adminPaymentNote: String,      // Admin's reason
}
```

**No migration needed** - fields are optional in schema.

---

## API Endpoints

### For Customers

**Submit Payment**
```bash
POST /api/payment/submit
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "upiReferenceNumber": "1234567890",
  "paymentScreenshot": "data:image/png;base64,..." // optional
}
```

### For Admins

**List Pending Payments**
```bash
GET /api/admin/payments
```

**Approve or Reject**
```bash
PUT /api/admin/payments/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "action": "approve",
  "adminNote": "Verified in bank logs"
}
```

---

## Testing Without Real UPI

### Option 1: Use Test UPI ID (Recommended)
```env
NEXT_PUBLIC_UPI_ID=testmerchant@okhdfcbank
NEXT_PUBLIC_UPI_PAYEE_NAME=Test Merchant
```

Use test UPI apps:
- Google Pay (sandbox mode)
- PhonePe (test mode)
- Paytm (test mode)

### Option 2: Simulate with Any Reference Number
For development, any 10+ digit alphanumeric string works:
- `1234567890` ✓
- `TEST123456` ✓
- `AABBCCDDEE` ✓

Admin can then approve/reject in dashboard.

---

## Common Commands

```bash
# Start dev server
npm run dev

# Create initial admin account
npx ts-node scripts/init-admin.ts

# Initialize email templates (optional)
npx ts-node scripts/init-email-templates.ts

# Run tests (when available)
npm test

# Check for errors
npm run validate-env
```

---

## Email Testing

### In Development (Mock Mode)
- No SMTP configured
- Emails printed to console
- Look for logs like: `📧 [MOCK EMAIL] To: user@example.com`

### In Production (Real Email)
- Set SMTP environment variables:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  SMTP_FROM=noreply@littleflame.com
  ```

---

## Troubleshooting

### Issue: "Order not found" when submitting payment
- **Cause**: Order ID wrong or order belongs to different user
- **Fix**: Check order ID, make sure you're logged in as correct user

### Issue: "Payment already submitted"
- **Cause**: You already submitted a payment for this order
- **Fix**: Wait for admin to approve/reject, or admin can manually change status

### Issue: QR code not showing
- **Cause**: `NEXT_PUBLIC_UPI_ID` not set in env
- **Fix**: Add to `.env.local` and restart dev server

### Issue: Email not received
- **Cause**: Mock mode (development), or SMTP not configured
- **Fix**: In dev, check console logs. In prod, verify SMTP settings.

### Issue: Stock not restored after rejection
- **Cause**: Admin didn't click reject, or database issue
- **Fix**: Verify admin action completed. Check Product stock in database.

---

## Next Steps

1. **Setup**: Follow steps 1-2 above
2. **Test**: Follow steps 3-5 (complete payment flow)
3. **Customize**: Update `NEXT_PUBLIC_UPI_ID` and `NEXT_PUBLIC_UPI_PAYEE_NAME`
4. **Deploy**: Set environment variables in production
5. **Monitor**: Check admin dashboard daily for pending payments

---

## Need Help?

See `UPI_PAYMENT_SYSTEM.md` for comprehensive documentation:
- Full architecture explanation
- Security features
- Production checklist
- Future enhancements
- Troubleshooting guide

---

**Happy selling! 🕯️💳**
