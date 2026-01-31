 import mongoose, { Schema, Document, Model } from 'mongoose';
 
 export interface IReview extends Document {
   productId: mongoose.Types.ObjectId;
   userId: mongoose.Types.ObjectId;
   orderId: mongoose.Types.ObjectId;
   rating: number;
   comment?: string;
   createdAt: Date;
   updatedAt: Date;
 }
 
 const ReviewSchema: Schema = new Schema(
   {
     productId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref: 'Product',
       index: true,
     },
     userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref: 'User',
       index: true,
     },
     orderId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref: 'Order',
       index: true,
     },
     rating: {
       type: Number,
       required: true,
       min: 1,
       max: 5,
     },
     comment: {
       type: String,
       trim: true,
       maxlength: 1000,
     },
   },
   { timestamps: true }
 );
 
 ReviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });
 
 if (mongoose.models.Review) {
   delete mongoose.models.Review;
 }
 
 const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);
 
 export default Review;
 
