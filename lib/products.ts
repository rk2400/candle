import connectDB from './db';
import Product from './models/Product';

export interface GetProductsOptions {
  status?: string;
  limit?: number;
  featured?: boolean;
  category?: string;
  search?: string;
}

export async function getProductsFromDb(opts: GetProductsOptions = {}) {
  await connectDB();

  const { status = 'active', limit, featured, category, search } = opts;
  const query: any = {};

  if (status) query.status = status;
  if (typeof featured === 'boolean') query.featured = featured;
  if (category) {
    // Normalize category to lowercase to match database enum values
    // Map common display names to database values
    const categoryMap: Record<string, string> = {
      'Floral': 'floral',
      'Woody': 'woody',
      'Fresh': 'fresh',
      'Seasonal': 'seasonal',
      'Seasonal Scents': 'seasonal',
      'Signature Series': 'signature',
      'Gift Sets': 'gift-sets',
    };
    const normalizedCategory = categoryMap[category] || category.toLowerCase();
    query.category = normalizedCategory;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  let q = Product.find(query).sort({ createdAt: -1 });
  if (limit && Number(limit) > 0) q = q.limit(Number(limit));

  const products = await q.lean().exec();

  // Normalize IDs to strings and ensure safe fields for client
  return products.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
  }));
}

export async function getProductById(id: string) {
  await connectDB();
  if (!id) return null;
  const product = await Product.findById(id).lean().exec();
  if (!product) return null;
  return { ...product, _id: product._id.toString() };
}

export default { getProductsFromDb, getProductById };
