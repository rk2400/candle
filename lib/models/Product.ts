import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  status: 'active' | 'inactive';
  stock: number;
  category: 'floral' | 'fresh' | 'seasonal' | 'woody' | 'signature' | 'gift-sets' | 'other';
  isBestSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      enum: ['floral', 'fresh', 'seasonal', 'woody', 'signature', 'gift-sets', 'other'],
      default: 'other',
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure schema updates apply during dev by resetting cached model
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
