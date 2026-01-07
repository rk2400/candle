'use client';

// Use relative API paths so the client talks to the same origin the app is served from.
// This avoids issues when the dev server port differs from NEXT_PUBLIC_APP_URL.
const API_URL = '';

export async function getProducts(status?: string) {
  const url = status ? `${API_URL}/api/products?status=${status}` : `${API_URL}/api/products`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products;
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_URL}/api/products/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product');
  const data = await res.json();
  return data.product;
}

export async function login(email: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  return data;
}

export async function verifyOTP(email: string, code: string) {
  const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
  return data;
}

export async function logout() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Not authenticated');
  return data.user;
}

export type AddressPayload = {
  street?: string;
  city?: string;
  state?: string;
  pincode: string;
  full?: string;
};

export async function saveAddress(address: AddressPayload) {
  const res = await fetch(`${API_URL}/api/auth/address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save address');
  return data;
}

export async function createAccount(name: string, email: string, phone: string) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create account');
  return data;
}

export async function checkout(products: Array<{ productId: string; quantity: number }>) {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ products }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to checkout');
  return data.order;
}

export async function verifyPayment(payload: any) {
  const res = await fetch(`${API_URL}/api/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify payment');
  return data;
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/api/orders`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
  return data.orders;
}

export async function getOrder(id: string) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
  return data.order;
}

// Admin APIs
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to login');
  return data;
}

export async function getAdminProducts() {
  const res = await fetch(`${API_URL}/api/admin/products`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
  return data.products;
}

export async function createProduct(product: any) {
  const res = await fetch(`${API_URL}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data.product;
}

export async function updateProduct(id: string, product: any) {
  const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data.product;
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete product');
  return data;
}

export async function getAdminOrders() {
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
  return data.orders;
}

export async function updateOrderStatus(id: string, orderStatus: string) {
  const res = await fetch(`${API_URL}/api/admin/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderStatus }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update order');
  return data.order;
}

export async function sendOrderEmail(id: string) {
  const res = await fetch(`${API_URL}/api/admin/orders/${id}/send-email`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send email');
  return data;
}

export async function getEmailTemplates() {
  const res = await fetch(`${API_URL}/api/admin/email-templates`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch templates');
  return data.templates;
}

export async function updateEmailTemplate(template: any) {
  const res = await fetch(`${API_URL}/api/admin/email-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(template),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update template');
  return data.template;
}

export async function getAdminStats() {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data.stats;
}

export async function getAdminUsers() {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data.users;
}

