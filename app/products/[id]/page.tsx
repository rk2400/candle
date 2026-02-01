'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, getOrders, getProductReviews, submitReview, getWishlist } from '@/lib/api-client';
import { useCart } from '@/lib/contexts/CartContext';
import { useUser } from '@/lib/contexts/UserContext';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, items, removeFromCart, updateQuantity } = useCart();
  const { user } = useUser();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [showGoToCart, setShowGoToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewsData, setReviewsData] = useState<{ reviews: any[]; avgRating: number; ratingCount: number } | null>(null);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [isWished, setIsWished] = useState(false);

  const cartItem = product ? items.find(item => item.productId === product._id) : null;
  const inCartQuantity = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProduct(params.id as string);
        setProduct(data);
        setActiveImageIndex(0);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params.id]);

  useEffect(() => {
    async function loadReviewsAndEligibility() {
      if (!params.id) return;
      try {
        const r = await getProductReviews(params.id as string);
        setReviewsData(r);
      } catch (e: any) {
        // ignore silently
      }
      try {
        if (user) {
          const orders = await getOrders();
          const eligible = orders.filter((o: any) =>
            o.orderStatus === 'DELIVERED' &&
            (o.products || []).some((p: any) => String(p.productId?._id ?? p.productId) === String(params.id))
          );
          setEligibleOrders(eligible);
        } else {
          setEligibleOrders([]);
        }
      } catch (e: any) {
        // ignore silently
      }
    }
    loadReviewsAndEligibility();
  }, [params.id, user]);

  useEffect(() => {
    async function checkWishlist() {
      if (!user || !params.id) {
        setIsWished(false);
        return;
      }
      try {
        const items = await getWishlist();
        const found = items.some((w: any) => String(w.productId?._id ?? w.productId) === String(params.id));
        setIsWished(found);
      } catch {
        // ignore
      }
    }
    checkWishlist();
  }, [params.id, user]);

  async function handleSubmitReview() {
    if (!user) {
      toast.error('Please login to submit a rating');
      router.push('/login');
      return;
    }
    const orderId = eligibleOrders[0]?._id;
    if (!orderId) {
      toast.error('Ratings are allowed only after delivery of your order');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        productId: params.id as string,
        orderId,
        rating,
        comment: comment?.trim() || undefined,
      });
      toast.success('Thank you for your review!');
      setComment('');
      setRating(5);
      const r = await getProductReviews(params.id as string);
      setReviewsData(r);
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleToggleWishlist() {
    if (!user) {
      router.push('/login');
      return;
    }
    setWishLoading(true);
    try {
      const { addToWishlist, removeFromWishlist } = await import('@/lib/api-client');
      if (isWished) {
        await removeFromWishlist(params.id as string);
        setIsWished(false);
        toast.success('Removed from wishlist');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wishlist:updated'));
        }
      } else {
        await addToWishlist(params.id as string);
        setIsWished(true);
        toast.success('Added to wishlist');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wishlist:updated'));
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update wishlist');
    } finally {
      setWishLoading(false);
    }
  }

  function handleUpdateQuantity(newQty: number) {
    if (!product) return;
    if (newQty < 1) {
      removeFromCart(product._id);
      return;
    }
    if (product.stock !== undefined && product.stock < newQty) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }
    updateQuantity(product._id, newQty);
  }

  function handleAddToCart() {
    if (!product) return;

    if (!user) {
      toast.error('Please login to add items to your cart');
      router.push('/login');
      return;
    }

    if (product.stock !== undefined && product.stock < quantity) {
      toast.error('Selected quantity exceeds available stock');
      return;
    }

    addToCart(
      {
        id: product._id,
        name: product.name,
        price: typeof product.discountPrice === 'number' && product.discountPrice < product.price ? product.discountPrice : product.price,
        originalPrice: product.price,
        image: product.images?.[0],
      },
      quantity
    );
    toast.success('Added to cart!');
    setShowGoToCart(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <h2 className="text-2xl font-serif text-stone-900 mb-4">Product not found</h2>
        <button 
          onClick={() => router.push('/products')}
          className="text-primary-600 hover:text-primary-700 underline"
        >
          Return to Collection
        </button>
      </div>
    );
  }

  const alreadyReviewed = !!(
    reviewsData &&
    user &&
    reviewsData.reviews.some((r: any) => String(r.userId?._id ?? r.userId) === String(user.id))
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Column: Images */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 relative group">
              {product.images && product.images[activeImageIndex] ? (
                <img
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                  No Image
                </div>
              )}
              {/* Overlays */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-wider text-stone-900 uppercase">
                  Best Seller
                </div>
                {product.stock === 0 && (
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleToggleWishlist}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-sm transition-colors ${
                    isWished ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white/90 backdrop-blur border-stone-200 text-stone-600 hover:text-primary-600'
                  }`}
                  aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  disabled={wishLoading}
                  title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  {isWished ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Thumbnail Grid (Mock - assuming multiple images might exist later) */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary-500' : 'border-transparent hover:border-primary-500'}`}
                    onClick={() => setActiveImageIndex(idx)}
                    title="View image"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-medium text-primary-600 tracking-widest uppercase">Signature Collection</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-2xl font-medium text-stone-600">
                {typeof product.discountPrice === 'number' && product.discountPrice < product.price ? (
                  <span className="flex items-center gap-3">
                    <span className="text-stone-400 line-through">₹{product.price}</span>
                    <span className="text-stone-900">₹{product.discountPrice}</span>
                  </span>
                ) : (
                  <>₹{product.price}</>
                )}
              </p>
              {typeof product.discountPrice === 'number' && product.discountPrice < product.price && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                  Limited Time Deal!
                </span>
              )}
              {product.stock === 0 ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                  Out of Stock
                </span>
              ) : (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  In Stock
                </span>
              )}
            </div>
            <div className="text-sm text-stone-600 mb-6">
              Orders are typically shipped within 3 days of placing the order.
            </div>
            {reviewsData && (
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.round(reviewsData.avgRating) ? '' : 'opacity-30'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-stone-600">{reviewsData.avgRating.toFixed(1)} • {reviewsData.ratingCount} ratings</span>
              </div>
            )}

            <div className="prose prose-stone mb-8 text-stone-600 leading-relaxed">
              <p>{product.description}</p>
            </div>

            {/* Actions */}
            <div className="border-t border-b border-stone-200 py-8 mb-8">
              {cartItem ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-stone-50 rounded-full border border-stone-200 p-1 w-full max-w-md mx-auto sm:mx-0">
                    <button 
                      onClick={() => handleUpdateQuantity(inCartQuantity - 1)}
                      className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-sm text-stone-600 hover:text-red-500 transition-colors"
                      title={inCartQuantity === 1 ? "Remove from cart" : "Decrease quantity"}
                    >
                      {inCartQuantity === 1 ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ) : (
                        <span className="text-2xl font-light">-</span>
                      )}
                    </button>
                    
                    <div className="flex-1 text-center">
                      <span className="block text-sm text-stone-500 font-medium uppercase tracking-wider mb-1">Quantity in Cart</span>
                      <span className="text-2xl font-serif font-medium text-stone-900">{inCartQuantity}</span>
                    </div>

                    <button 
                      onClick={() => handleUpdateQuantity(inCartQuantity + 1)}
                      className="w-14 h-14 flex items-center justify-center bg-stone-900 rounded-full shadow-sm text-white hover:bg-stone-800 transition-colors"
                    >
                      <span className="text-2xl font-light">+</span>
                    </button>
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <button
                      onClick={() => router.push('/cart')}
                      className="btn btn-primary rounded-full h-10 px-6 text-sm"
                    >
                      Go to Cart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center border border-stone-300 rounded-full w-max">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium text-stone-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(product.stock !== undefined ? Math.min(product.stock, quantity + 1) : quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 btn rounded-full h-12 px-8 flex items-center justify-center gap-2 transition-all shadow-lg ${
                      product.stock === 0
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow-xl'
                    }`}
                  >
                    <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    <span className="w-1 h-1 bg-white rounded-full mx-1"></span>
                    <span>
                      ₹{(
                        (typeof product.discountPrice === 'number' && product.discountPrice < product.price ? product.discountPrice : product.price) * quantity
                      )}
                    </span>
                  </button>
                  {showGoToCart && (
                    <button
                      onClick={() => router.push('/cart')}
                      className="btn btn-secondary rounded-full h-12 px-6"
                    >
                      Go to Cart
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Accordions / Tabs */}
            <div className="space-y-4">
              <DetailsItem title="Scent Notes" isOpen={activeTab === 'scent'} onClick={() => setActiveTab(activeTab === 'scent' ? '' : 'scent')}>
                <div className="grid grid-cols-3 gap-4 text-sm text-stone-600">
                  <div>
                    <span className="block font-bold text-stone-900 mb-1">Top</span>
                    {(product.scentNotes?.top && product.scentNotes.top.length
                      ? product.scentNotes.top
                      : ['Bergamot', 'Lemon Peel']
                    ).join(', ')}
                  </div>
                  <div>
                    <span className="block font-bold text-stone-900 mb-1">Middle</span>
                    {(product.scentNotes?.middle && product.scentNotes.middle.length
                      ? product.scentNotes.middle
                      : ['Ylang Ylang', 'Jasmine']
                    ).join(', ')}
                  </div>
                  <div>
                    <span className="block font-bold text-stone-900 mb-1">Base</span>
                    {(product.scentNotes?.base && product.scentNotes.base.length
                      ? product.scentNotes.base
                      : ['Sandalwood', 'Amber']
                    ).join(', ')}
                  </div>
                </div>
              </DetailsItem>
              
              <DetailsItem title="Vessel & Dimensions" isOpen={activeTab === 'vessel'} onClick={() => setActiveTab(activeTab === 'vessel' ? '' : 'vessel')}>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {product.vesselDetails || 'Housed in a reusable matte ceramic vessel.\nDimensions: 3.5\" H x 3.25\" W\nWeight: 12 oz (340g)'}
                </p>
              </DetailsItem>

              <DetailsItem title="Care Instructions" isOpen={activeTab === 'care'} onClick={() => setActiveTab(activeTab === 'care' ? '' : 'care')}>
                <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                  {(product.careInstructions && product.careInstructions.length
                    ? product.careInstructions
                    : [
                        'Trim wick to 1/4" before each burn.',
                        'Allow wax to melt to the edges to prevent tunneling.',
                        'Do not burn for more than 4 hours at a time.',
                      ]
                  ).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </DetailsItem>
            </div>
          </div>
        </div>
      </main>

      <section className="bg-white py-20 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1">
              <h2 className="text-2xl font-serif text-stone-900 mb-6">Customer Reviews</h2>
              {!reviewsData || reviewsData.reviews.length === 0 ? (
                <p className="text-stone-600">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviewsData.reviews.slice(0, 10).map((r: any) => (
                    <div key={r._id} className="p-4 border border-stone-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{r.userId?.name || 'Customer'}</div>
                        <div className="flex items-center text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < r.rating ? '' : 'opacity-30'}`} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.48 3.5a1 1 0 011.04 0l3.06 1.86 3.49.54a1 1 0 01.56 1.72l-2.52 2.6.62 3.55a1 1 0 01-1.48 1.04L12 13.9l-3.25 1.91a1 1 0 01-1.48-1.04l.62-3.55-2.52-2.6a1 1 0 01.56-1.72l3.49-.54 3.06-1.86z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-stone-700 text-sm">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(eligibleOrders.length > 0 && !alreadyReviewed) && (
              <div className="w-full md:w-96">
                <h3 className="text-xl font-serif text-stone-900 mb-4">Add Your Rating</h3>
                <div className="card p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
                          <svg className={`w-6 h-6 ${i < rating ? '' : 'opacity-30'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.48 3.5a1 1 0 011.04 0l3.06 1.86 3.49.54a1 1 0 01.56 1.72l-2.52 2.6.62 3.55a1 1 0 01-1.48 1.04L12 13.9l-3.25 1.91a1 1 0 01-1.48-1.04l.62-3.55-2.52-2.6a1 1 0 01.56-1.72l3.49-.54 3.06-1.86z"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    className="input w-full h-24"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="btn btn-primary w-full mt-3"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Rating'}
                  </button>
                  <p className="text-xs text-stone-500 mt-2">Ratings are available only for delivered orders. One rating per order item.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story / Context Section */}
      <section className="bg-white py-20 border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-xs mb-4 block">The Experience</span>
          <h2 className="text-3xl font-serif text-stone-900 mb-6">Hand-Poured with Intention</h2>
          <p className="text-stone-600 leading-relaxed">
            Every LittleFlame candle is crafted in small batches in our studio. We use only 100% natural soy wax, 
            premium phthalate-free fragrance oils, and lead-free cotton wicks. The result is a clean burn 
            that fills your space with sophisticated scent without overwhelming it.
          </p>
        </div>
      </section>
    </div>
  );
}

function DetailsItem({ title, children, isOpen, onClick }: { title: string; children: React.ReactNode; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-stone-200">
      <button 
        onClick={onClick}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className="font-serif text-lg text-stone-900 group-hover:text-primary-700 transition-colors">{title}</span>
        <span className={`transform transition-transform duration-300 text-stone-400 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}
