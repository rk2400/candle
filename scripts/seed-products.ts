/**
 * Seed Sample Products
 * Run this script to create sample candle products with real images
 * 
 * Usage: npx ts-node scripts/seed-products.ts
 */

import mongoose from 'mongoose';
import Product from '../lib/models/Product';
import { dbConfig } from '../lib/config';

const sampleProducts = [
  {
    name: 'Vanilla Dream Candle',
    description: 'A warm and comforting vanilla-scented candle that fills your space with a cozy, homey aroma. Perfect for relaxation and creating a peaceful atmosphere. Handcrafted with premium soy wax and natural vanilla extract.',
    price: 599,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 50,
  },
  {
    name: 'Lavender Serenity Candle',
    description: 'Experience tranquility with our lavender-scented candle. Known for its calming properties, this candle helps reduce stress and promotes better sleep. Made with essential oils and natural wax for a long-lasting, soothing fragrance.',
    price: 649,
    images: ['https://images.unsplash.com/photo-1602872030496-59446a5abd0a?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 45,
  },
  {
    name: 'Ocean Breeze Candle',
    description: 'Fresh and invigorating, this ocean-scented candle brings the calming essence of the sea into your home. Perfect for creating a refreshing atmosphere. The crisp, clean scent reminds you of a coastal morning.',
    price: 699,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 40,
  },
  {
    name: 'Cinnamon Spice Candle',
    description: 'Warm and inviting, this cinnamon-scented candle creates a cozy, festive atmosphere. Ideal for autumn and winter months. The rich, spicy aroma fills your home with comfort and warmth.',
    price: 599,
    images: ['https://images.unsplash.com/photo-1602872030496-59446a5abd0a?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 55,
  },
  {
    name: 'Rose Garden Candle',
    description: 'Delicate and romantic, this rose-scented candle brings the beauty of a blooming garden indoors. Perfect for special occasions and gifting. The floral fragrance is elegant and timeless.',
    price: 749,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 35,
  },
  {
    name: 'Eucalyptus Mint Candle',
    description: 'Refreshing and energizing, this eucalyptus and mint blend helps clear the mind and invigorate your senses. Great for morning routines and creating a focused work environment.',
    price: 679,
    images: ['https://images.unsplash.com/photo-1602872030496-59446a5abd0a?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 42,
  },
  {
    name: 'Sandalwood Meditation Candle',
    description: 'Deep and grounding, this sandalwood-scented candle is perfect for meditation and mindfulness practices. Creates a serene, focused environment. The woody, earthy fragrance promotes inner peace.',
    price: 799,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 30,
  },
  {
    name: 'Citrus Burst Candle',
    description: 'Bright and uplifting, this citrus blend combines lemon, orange, and grapefruit for an energizing aroma that boosts mood and energy. Perfect for starting your day on a positive note.',
    price: 629,
    images: ['https://images.unsplash.com/photo-1602872030496-59446a5abd0a?w=800&h=800&fit=crop'],
    status: 'active',
    stock: 48,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log('Connected to MongoDB');

    // Clear existing products (optional - comment out to keep existing)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');

    let created = 0;
    let updated = 0;

    for (const productData of sampleProducts) {
      const existing = await Product.findOne({ name: productData.name });
      if (existing) {
        // Update existing product
        await Product.findByIdAndUpdate(existing._id, productData);
        updated++;
        console.log(`✓ Updated: ${productData.name}`);
      } else {
        // Create new product
        await Product.create(productData);
        created++;
        console.log(`✓ Created: ${productData.name}`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${created} products`);
    console.log(`   Updated: ${updated} products`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

