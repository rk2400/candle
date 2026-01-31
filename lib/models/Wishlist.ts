 import mongoose, { Schema, Document, Model } from 'mongoose';
 
 export interface IWishlist extends Document {
   userId: mongoose.Types.ObjectId;
   productId: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
 }
 
 const WishlistSchema: Schema = new Schema(
   {
     userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
     productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
   },
   { timestamps: true }
 );
 
 WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
 
 if (mongoose.models.Wishlist) {
   delete mongoose.models.Wishlist;
 }
 
 const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
 
 export default Wishlist;
 
