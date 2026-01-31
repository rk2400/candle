'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { useUser } from '@/lib/contexts/UserContext';
import { checkout, getCurrentUser, saveAddress, AddressPayload, validateCoupon } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [address, setAddress] = useState<AddressPayload>({ street: '', city: '', state: '', pincode: '', full: '' });
  const [addrSaving, setAddrSaving] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const indianStates = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
  ];
  const allCities = ['New Delhi','Mumbai','Bengaluru','Chennai','Hyderabad','Kolkata','Pune','Ahmedabad','Jaipur','Lucknow','Bhopal','Indore','Surat','Vadodara','Nagpur','Patna','Ranchi','Guwahati','Kochi','Thiruvananthapuram'];
  const citiesByState: Record<string, string[]> = {
    'Delhi': ['New Delhi','Dwarka','Rohini','Saket','Lajpat Nagar','Karol Bagh'],
    'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik','Thane','Aurangabad'],
    'Karnataka': ['Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi'],
    'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Salem','Tiruchirappalli'],
    'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar'],
    'West Bengal': ['Kolkata','Siliguri','Durgapur','Asansol','Howrah'],
    'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot'],
    'Uttar Pradesh': ['Lucknow','Kanpur','Noida','Ghaziabad','Varanasi','Agra'],
    'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain'],
    'Rajasthan': ['Jaipur','Udaipur','Jodhpur','Kota','Ajmer'],
    'Kerala': ['Kochi','Thiruvananthapuram','Kozhikode','Thrissur'],
    'Bihar': ['Patna','Gaya','Muzaffarpur','Bhagalpur'],
    'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Hazaribagh'],
    'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat']
  };
  const cityOptions = useMemo(() => {
    const key = (address.state || '').toString();
    return citiesByState[key] || allCities;
  }, [address.state]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      try {
        const current = await getCurrentUser();
        if (!mounted) return;
        setCurrentUser(current);
        if (current?.address) {
          setAddress({
            street: current.address.street || '',
            city: current.address.city || '',
            state: current.address.state || '',
            pincode: current.address.pincode || '',
            full: current.address.full || '',
          });
        }
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    setDiscountAmount(0);
  }, [items]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) {
      toast.error('Enter a promo code');
      return;
    }
    setValidatingCoupon(true);
    try {
      const payload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const res = await validateCoupon(couponCode.trim(), payload);
      setDiscountAmount(res.discountAmount || 0);
      if (res.discountAmount > 0) {
        toast.success(`Promo applied: ₹${res.discountAmount} off`);
      } else {
        toast('Promo code valid but no discount for this cart');
      }
    } catch (e: any) {
      setDiscountAmount(0);
      toast.error(e?.message || 'Invalid promo code');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleSaveAddress() {
    if (!address.pincode || !/^[0-9]{6}$/.test(address.pincode)) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    setAddrSaving(true);
    try {
      const res = await saveAddress(address);
      if (res?.user) {
        setCurrentUser(res.user);
        setAddress({
          street: res.user.address?.street || '',
          city: res.user.address?.city || '',
          state: res.user.address?.state || '',
          pincode: res.user.address?.pincode || '',
          full: res.user.address?.full || '',
        });
        setEditingAddress(false);
        toast.success('Address saved');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save address');
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleCheckout() {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Show confirmation dialog instead of directly processing
    setShowCheckoutConfirm(true);
  }

  async function confirmCheckout() {
    setShowCheckoutConfirm(false);
    setProcessing(true);
    try {
      const current = currentUser || (await getCurrentUser());
      if (!current || !current.address || !current.address.pincode) {
        setEditingAddress(true);
        setProcessing(false);
        toast.error('Please add your delivery address before proceeding');
        return;
      }

      const order = await checkout(items, couponCode.trim() || undefined);
      
      // Clear cart and redirect to payment page
      clearCart();
      toast.success('Order created! Proceeding to payment...');
      router.push(`/payment?orderId=${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif text-stone-900 mb-4">Your bag is empty</h2>
          <p className="text-stone-500 mb-8">Looks like you haven't added any candles to your collection yet.</p>
          <Link href="/products" className="btn btn-primary inline-flex">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-12">Your Shopping Bag</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-8">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 p-6 bg-white rounded-xl shadow-sm border border-stone-100">
                <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">No Img</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-stone-900 font-serif">{item.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-stone-200 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-stone-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-medium text-stone-900">
                      {typeof item.originalPrice === 'number' && item.originalPrice > item.price ? (
                        <span className="flex items-center gap-2">
                          <span className="text-stone-400 line-through">₹{(item.originalPrice * item.quantity).toFixed(2)}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </span>
                      ) : (
                        <>₹{(item.price * item.quantity).toFixed(2)}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 sticky top-24">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{getTotal()}</span>
                </div>
                <div className="space-y-3">
                  {!showCoupon ? (
                    <button
                      onClick={() => setShowCoupon(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 underline"
                    >
                      Have a coupon?
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="input flex-1 h-10 text-sm"
                        placeholder="Enter promo code"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || items.length === 0}
                        className="btn btn-secondary h-10 px-4 text-sm"
                      >
                        {validatingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-stone-100 pt-4 flex justify-between font-bold text-lg text-stone-900">
                  <span>Total</span>
                  <span>₹{Math.max(0, getTotal() - discountAmount)}</span>
                </div>
              </div>

              {/* Address Section */}
              {user && (
                <div className="mb-8 border-t border-stone-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-stone-900">Delivery Address</h3>
                    <button 
                      onClick={() => setEditingAddress(!editingAddress)}
                      className="text-sm text-primary-600 hover:text-primary-700 underline"
                    >
                      {editingAddress ? 'Cancel' : (currentUser?.address?.pincode ? 'Edit' : 'Add')}
                    </button>
                  </div>

                  {editingAddress ? (
                    <div className="space-y-4">
                      <textarea
                        placeholder="Full Address (Apartment, Street, Landmark)"
                        value={address.full}
                        onChange={(e) => setAddress({ ...address, full: e.target.value })}
                        className="input w-full text-sm min-h-[96px]"
                        rows={4}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="Street"
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          className="input w-full text-sm h-12"
                        />
                        <input
                          placeholder="City"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="input w-full text-sm h-12"
                          list="cityList"
                        />
                        <datalist id="cityList">
                          {cityOptions
                            .filter((c) => !address.city || c.toLowerCase().includes(address.city.toLowerCase()))
                            .slice(0, 10)
                            .map((c) => (
                              <option key={c} value={c} />
                            ))}
                        </datalist>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="State"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          className="input w-full text-sm h-12"
                          list="stateList"
                        />
                        <datalist id="stateList">
                          {indianStates
                            .filter((s) => !address.state || s.toLowerCase().includes(address.state.toLowerCase()))
                            .slice(0, 10)
                            .map((s) => (
                              <option key={s} value={s} />
                            ))}
                        </datalist>
                        <input
                          placeholder="ZIP Code"
                          value={address.pincode}
                          onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\\D/g, '').slice(0, 6) })}
                          className="input w-full text-sm h-12"
                        />
                      </div>
                      <button 
                        onClick={handleSaveAddress}
                        disabled={addrSaving}
                        className="btn bg-stone-800 text-white w-full text-sm py-3"
                      >
                        {addrSaving ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  ) : (
                    currentUser?.address?.pincode ? (
                      <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-lg">
                        <p>{currentUser.address.full}</p>
                        <p>{currentUser.address.street}, {currentUser.address.city}</p>
                        <p>{currentUser.address.state} - {currentUser.address.pincode}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500 italic">Please add an address to checkout.</p>
                    )
                  )}
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={processing}
                className="w-full btn btn-primary py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                {processing ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m4 0h-4l-1-4H7l-1 4H3v4h18v-4h-5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-stone-900">100+ happy customers</p>
                  <p className="text-sm text-stone-600">Loved by our community</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11s1.343 3 3 3 3-1.343 3-3zm0 0l6-3v6l-6 3V11z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Safe and secure delivery</p>
                  <p className="text-sm text-stone-600">Protected packaging</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l6-3-6-3-6 3 6 3zm0 0v8m-6 3l6-3 6 3" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Website exclusive offers</p>
                  <p className="text-sm text-stone-600">Special deals online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-3">
                Confirm Your Order
              </h2>
              
              <p className="text-stone-600 mb-6 leading-relaxed">
                You are about to place an order for <span className="font-semibold">₹{Math.max(0, getTotal() - discountAmount)}</span>. Your order will be confirmed after the payment is verified.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Note:</span> Payment verification may take up to 24 hours. You'll receive a confirmation email once verified.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckout}
                  disabled={processing}
                  className="flex-1 btn btn-primary"
                >
                  {processing ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

