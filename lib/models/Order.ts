import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus = 'CREATED' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
export type PaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_SUBMITTED' | 'PAID' | 'PAYMENT_REJECTED';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  products: IOrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  address?: {
    full?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  paymentId?: string;
  // Semi-manual UPI payment fields
  upiReferenceNumber?: string;
  paymentScreenshot?: string;
  paymentSubmittedAt?: Date;
  adminPaymentNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
});

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    products: {
      type: [OrderItemSchema],
      required: true,
    },
    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAID', 'PAYMENT_REJECTED'],
      default: 'PAYMENT_PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['CREATED', 'PACKED', 'SHIPPED', 'DELIVERED'],
      default: 'CREATED',
    },
    paymentId: {
      type: String,
    },
    upiReferenceNumber: {
      type: String,
      trim: true,
    },
    paymentScreenshot: {
      type: String,
    },
    paymentSubmittedAt: {
      type: Date,
    },
    adminPaymentNote: {
      type: String,
      trim: true,
    },
    address: {
      full: { type: String, trim: true, default: '' },
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;



