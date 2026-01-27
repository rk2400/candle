# Payment System API Reference

Quick reference for developers working with the UPI payment system.

## API Endpoints

### Customer Endpoints

#### `POST /api/payment/submit`
Submit UPI payment details after paying.

**Request:**
```bash
curl -X POST http://localhost:3000/api/payment/submit \
  -H "Content-Type: application/json" \
  -b "auth=<jwt_token>" \
  -d '{
    "orderId": "507f1f77bcf86cd799439011",
    "upiReferenceNumber": "1234567890",
    "paymentScreenshot": "data:image/png;base64,iVBORw0KGgoAAAANS..." // optional
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment submitted for verification...",
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "paymentStatus": "PAYMENT_SUBMITTED",
    "upiReferenceNumber": "1234567890",
    "totalAmount": 999
  }
}
```

**Error Responses:**
- `400`: Invalid UPI reference (< 10 chars, not alphanumeric)
- `400`: Payment already submitted
- `401`: Not authenticated
- `403`: Order not your own
- `404`: Order not found

---

### Admin Endpoints

#### `GET /api/admin/payments`
Get all pending payment verifications.

**Request:**
```bash
curl http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -b "auth=<admin_jwt_token>"
```

**Success Response (200):**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "totalAmount": 999,
      "upiReferenceNumber": "1234567890",
      "paymentScreenshot": "data:image/png;base64,...",
      "paymentSubmittedAt": "2024-01-15T10:30:00Z",
      "products": [
        {
          "name": "Lavender Candle",
          "quantity": 2,
          "price": 499
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `401`: Not authenticated
- `403`: Not admin

---

#### `PUT /api/admin/payments/[orderId]`
Approve or reject a payment submission.

**Request:**
```bash
# APPROVE
curl -X PUT http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -b "auth=<admin_jwt_token>" \
  -d '{
    "action": "approve",
    "adminNote": "Verified in bank logs"
  }'

# REJECT
curl -X PUT http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -b "auth=<admin_jwt_token>" \
  -d '{
    "action": "reject",
    "adminNote": "Invalid UTR format"
  }'
```

**Success Response (200):**
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

**Error Responses:**
- `400`: Invalid action (must be "approve" or "reject")
- `400`: Order payment status not PAYMENT_SUBMITTED
- `401`: Not authenticated
- `403`: Not admin
- `404`: Order not found

---

## Frontend API Client Functions

### `submitPayment(payload)`

Submit UPI payment reference from customer payment page.

```typescript
import { submitPayment } from '@/lib/api-client';

// Usage
const response = await submitPayment({
  orderId: "507f1f77bcf86cd799439011",
  upiReferenceNumber: "1234567890",
  paymentScreenshot: "data:image/png;base64,..." // optional
});

// Returns
{
  success: true,
  message: "Payment submitted for verification...",
  order: { id, paymentStatus, upiReferenceNumber, totalAmount }
}
```

---

### `getAdminPendingPayments()`

Get all pending payments (admin only).

```typescript
import { getAdminPendingPayments } from '@/lib/api-client';

// Usage
const { orders } = await getAdminPendingPayments();

// Returns
{
  orders: [
    {
      _id,
      userId,
      totalAmount,
      upiReferenceNumber,
      paymentScreenshot,
      paymentSubmittedAt,
      products: [ { name, quantity, price } ]
    }
  ]
}
```

---

### `verifyAdminPayment(orderId, payload)`

Approve or reject a payment (admin only).

```typescript
import { verifyAdminPayment } from '@/lib/api-client';

// Usage
const response = await verifyAdminPayment(
  "507f1f77bcf86cd799439011",
  {
    action: "approve", // or "reject"
    adminNote: "Optional note for audit trail"
  }
);

// Returns
{
  success: true,
  message: "Payment approved...",
  order: { id, paymentStatus, orderStatus }
}
```

---

## Component Examples

### Display Payment Status in Order

```tsx
import { getOrder } from '@/lib/api-client';

export default function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const order = await getOrder(orderId);
      setOrder(order);
    }
    load();
  }, [orderId]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>Order #{order._id}</h1>
      
      {/* Payment Status Badge */}
      <div className="payment-status">
        {order.paymentStatus === 'PAID' && (
          <span className="badge badge-success">✓ Paid</span>
        )}
        {order.paymentStatus === 'PAYMENT_SUBMITTED' && (
          <span className="badge badge-info">⏳ Under Verification</span>
        )}
        {order.paymentStatus === 'PAYMENT_PENDING' && (
          <span className="badge badge-warning">⚠ Payment Pending</span>
        )}
        {order.paymentStatus === 'PAYMENT_REJECTED' && (
          <span className="badge badge-error">✗ Payment Rejected</span>
        )}
      </div>

      {/* Complete Payment Button */}
      {order.paymentStatus === 'PAYMENT_PENDING' && (
        <button onClick={() => router.push(`/payment?orderId=${order._id}`)}>
          Complete Payment
        </button>
      )}

      {/* Retry Payment Button */}
      {order.paymentStatus === 'PAYMENT_REJECTED' && (
        <button onClick={() => router.push(`/payment?orderId=${order._id}`)}>
          Retry Payment
        </button>
      )}
    </div>
  );
}
```

---

### Payment Verification Page (Admin)

```tsx
import { getAdminPendingPayments, verifyAdminPayment } from '@/lib/api-client';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminPendingPayments();
        setPayments(data.orders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleApprove(orderId: string) {
    try {
      await verifyAdminPayment(orderId, {
        action: 'approve',
        adminNote: 'Verified'
      });
      // Reload payments
      setPayments(prev => prev.filter(p => p._id !== orderId));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReject(orderId: string, reason: string) {
    try {
      await verifyAdminPayment(orderId, {
        action: 'reject',
        adminNote: reason
      });
      // Reload payments
      setPayments(prev => prev.filter(p => p._id !== orderId));
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Pending Payments ({payments.length})</h1>
      {payments.map(payment => (
        <div key={payment._id} className="payment-card">
          <p>Order: {payment._id}</p>
          <p>Amount: ₹{payment.totalAmount}</p>
          <p>UTR: {payment.upiReferenceNumber}</p>
          {payment.paymentScreenshot && (
            <img src={payment.paymentScreenshot} alt="Payment" />
          )}
          <button onClick={() => handleApprove(payment._id)}>Approve</button>
          <button onClick={() => handleReject(payment._id, 'Invalid UTR')}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

---

## UPI Utility Functions

### `generateUPIString(upiId, payeeName, amount, orderId)`

Generate UPI payment URL.

```typescript
import { generateUPIString } from '@/lib/upi';

const upiUrl = generateUPIString(
  'littleflame@upi',
  'LittleFlame',
  999,
  '507f1f77bcf86cd799439011'
);

// Output: upi://pay?pa=littleflame%40upi&pn=LittleFlame&am=999&tn=507f1f77bcf86cd799439011&cu=INR
```

---

### `generateQRCodeURL(upiString)`

Generate QR code image URL.

```typescript
import { generateQRCodeURL } from '@/lib/upi';

const qrUrl = generateQRCodeURL(upiString);

// Output: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2F...

// Display in image tag
<img src={qrUrl} alt="UPI QR Code" />
```

---

## Database Queries

### Get Pending Payments

```typescript
import Order from '@/lib/models/Order';

// Get all pending payments
const pending = await Order.find({
  paymentStatus: 'PAYMENT_SUBMITTED'
}).sort({ paymentSubmittedAt: -1 });

// Get specific payment details
const order = await Order.findById(orderId);
console.log(order.upiReferenceNumber);
console.log(order.paymentScreenshot);
console.log(order.paymentSubmittedAt);
```

---

### Update Payment Status

```typescript
import Order from '@/lib/models/Order';

// Approve
const order = await Order.findByIdAndUpdate(
  orderId,
  {
    paymentStatus: 'PAID',
    adminPaymentNote: 'Verified'
  },
  { new: true }
);

// Reject
const order = await Order.findByIdAndUpdate(
  orderId,
  {
    paymentStatus: 'PAYMENT_REJECTED',
    adminPaymentNote: 'Invalid UTR'
  },
  { new: true }
);
```

---

### Restore Stock on Rejection

```typescript
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

const order = await Order.findById(orderId);

// Restore stock for all products
for (const item of order.products) {
  await Product.findByIdAndUpdate(
    item.productId,
    { $inc: { stock: item.quantity } }
  );
}
```

---

## Error Handling

### Common Errors & Solutions

```typescript
// Error: UPI Reference too short
// Solution: Validate before sending
if (upiReference.length < 10) {
  throw new Error('UPI Reference must be at least 10 characters');
}

// Error: Payment already submitted
// Solution: Check order.upiReferenceNumber first
const order = await getOrder(orderId);
if (order.upiReferenceNumber) {
  throw new Error('Payment already submitted for this order');
}

// Error: Not authenticated
// Solution: Check user is logged in
if (!user) {
  router.push('/login');
}

// Error: Not admin
// Solution: Check user.isAdmin flag
if (!user.isAdmin) {
  throw new Error('Admin access required');
}

// Error: Invalid order status
// Solution: Check paymentStatus before verification
if (order.paymentStatus !== 'PAYMENT_SUBMITTED') {
  throw new Error('Can only verify PAYMENT_SUBMITTED orders');
}
```

---

## Testing with cURL

### Test Payment Submission

```bash
# Get JWT token first (admin login)
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","password":"password"}'

# Submit payment
curl -X POST http://localhost:3000/api/payment/submit \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "orderId":"507f1f77bcf86cd799439011",
    "upiReferenceNumber":"1234567890"
  }'
```

### Test Admin Verification

```bash
# Get pending payments
curl http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Approve payment
curl -X PUT http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"action":"approve","adminNote":"OK"}'
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_UPI_ID=littleflame@upi
NEXT_PUBLIC_UPI_PAYEE_NAME=LittleFlame

# Optional (mock mode if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=password
SMTP_FROM=noreply@littleflame.com

# Core (existing)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

---

## Type Definitions

```typescript
// Payment Status
type PaymentStatus = 
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUBMITTED'
  | 'PAID'
  | 'PAYMENT_REJECTED';

// Order Payment Fields
interface OrderPaymentFields {
  paymentStatus: PaymentStatus;
  upiReferenceNumber?: string;
  paymentScreenshot?: string;
  paymentSubmittedAt?: Date;
  adminPaymentNote?: string;
}

// Payment Submit Payload
interface PaymentSubmitPayload {
  orderId: string;
  upiReferenceNumber: string;
  paymentScreenshot?: string;
}

// Payment Verification Payload
interface PaymentVerificationPayload {
  action: 'approve' | 'reject';
  adminNote?: string;
}
```

---

## Quick Reference Table

| Action | Endpoint | Method | Auth | Body | Status Change |
|--------|----------|--------|------|------|---|
| Submit Payment | `/api/payment/submit` | POST | User | {orderId, upiRef} | PENDING → SUBMITTED |
| List Payments | `/api/admin/payments` | GET | Admin | — | — |
| Approve Payment | `/api/admin/payments/[id]` | PUT | Admin | {approve} | SUBMITTED → PAID |
| Reject Payment | `/api/admin/payments/[id]` | PUT | Admin | {reject} | SUBMITTED → REJECTED |

---

**Last Updated**: January 2024
