/**
 * Generate UPI payment string for QR code generation
 * UPI format: upi://pay?pa=upiid&pn=payeename&am=amount&tn=note&cu=INR
 */
export function generateUPIString(
  upiId: string,
  payeeName: string,
  amount: number,
  orderId: string
): string {
  const encodedPayeeName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(`Order ${orderId}`);
  
  return `upi://pay?pa=${upiId}&pn=${encodedPayeeName}&am=${amount}&tn=${encodedNote}&cu=INR`;
}

/**
 * Generate QR code data URL using qr-server API (no external library needed)
 * This service is free and reliable
 */
export function generateQRCodeURL(upiString: string): string {
  const encodedUPI = encodeURIComponent(upiString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUPI}`;
}
