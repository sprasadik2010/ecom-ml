import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Award, 
  ArrowLeft, 
  Loader, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink,
  Smartphone,
  HelpCircle,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Checkout: React.FC = () => {
  const { items, totalAmount, totalSw, clearCart } = useCart();
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'success'>('checkout');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<{ id: number; amount: number; sw: number; upi_trans_id?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Merchant UPI Config from backend
  const [merchantUpiId, setMerchantUpiId] = useState('merchant@okhdfcbank');
  const [merchantUpiName, setMerchantUpiName] = useState('Business MLM Store');

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [upiTransId, setUpiTransId] = useState('');
  const [upiPayerVpa, setUpiPayerVpa] = useState('');

  // Fetch backend payment configuration on mount
  useEffect(() => {
    if (user?.full_name && !fullName) setFullName(user.full_name);
    if (user?.phone_number && !phone) setPhone(user.phone_number);
  }, [user]);

  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payment/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.upi_id) setMerchantUpiId(data.upi_id);
          if (data.upi_name) setMerchantUpiName(data.upi_name);
        }
      } catch (err) {
        console.warn('Could not fetch payment config, using defaults:', err);
      }
    };
    fetchPaymentConfig();
  }, []);

  // Construct Dynamic UPI Deep-link URI (NPCI standard)
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantUpiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order Purchase ${Date.now()}`)}`;

  // Generate dynamic QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!upiTransId.trim()) {
      setError('Please enter the 12-digit UPI Transaction ID / UTR number from your payment receipt.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create order on the backend with shipping details
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_name: fullName.trim() || undefined,
        shipping_address: address.trim() || undefined,
        shipping_city: city.trim() || undefined,
        shipping_state: stateName.trim() || undefined,
        shipping_zip: zipCode.trim() || undefined,
        shipping_phone: phone.trim() || undefined,
      };

      const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.detail || 'Failed to place order');
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.id;

      // 2. Submit order checkout with UPI Transaction ID & Payer details
      const checkoutPayload = {
        payment_method: 'upi_qr',
        upi_trans_id: upiTransId.trim(),
        upi_payer_vpa: upiPayerVpa.trim() || undefined,
        shipping_name: fullName.trim() || undefined,
        shipping_address: address.trim() || undefined,
        shipping_city: city.trim() || undefined,
        shipping_state: stateName.trim() || undefined,
        shipping_zip: zipCode.trim() || undefined,
        shipping_phone: phone.trim() || undefined,
      };

      const checkoutResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.detail || 'Checkout submission failed');
      }

      setLastPlacedOrder({
        id: orderId,
        amount: orderData.total_amount,
        sw: orderData.total_sw,
        upi_trans_id: upiTransId.trim(),
      });

      // 3. Success steps
      clearCart();
      await refreshUser(); // Update status/wallet balance and pending_sw
      setCheckoutStep('success');
      
      // Fire celebratory confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutStep === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
          <CheckCircle2 size={56} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Order Placed Successfully!</h1>
        
        {lastPlacedOrder && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 font-mono text-xs">
            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full font-bold">
              Order #{lastPlacedOrder.id}
            </span>
            <span className="bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full font-bold">
              {lastPlacedOrder.sw} SW Volume
            </span>
            {lastPlacedOrder.upi_trans_id && (
              <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full font-bold">
                UTR: {lastPlacedOrder.upi_trans_id}
              </span>
            )}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 text-left space-y-2 max-w-md shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Award size={16} />
            <span>UPI Payment Submitted & Pending Verification</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your UPI transaction ID <strong className="text-emerald-400 font-mono">{lastPlacedOrder?.upi_trans_id}</strong> has been logged into your order record. The generated <strong className="text-amber-400">{lastPlacedOrder?.sw} SW</strong> points are <strong className="text-amber-300">Pending Admin Verification</strong>. Once verified, your personal sales volume will be credited, activating your member rank and distributing commissions to your team!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link
            to="/orders"
            className="flex-1 text-center py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-bold text-xs transition-colors shadow-sm"
          >
            View My Orders
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 text-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-bold text-xs border border-slate-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 text-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-bold text-xs border border-slate-800 transition-colors"
          >
            Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 font-semibold text-xs mb-6 transition-colors">
        <ArrowLeft size={14} /> Return to Cart
      </Link>

      <h1 className="text-2xl font-black text-white mb-6">UPI Secured Checkout</h1>

      {error && (
        <div className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-4 rounded-md mb-6 font-semibold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipping & Dynamic UPI Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Address Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              1. Shipping & Customer Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Shipping Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, Apartment 4B"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">City / District</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">State / Province</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 400001"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Delivery Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dynamic UPI Payment Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" />
                2. Scan & Pay via UPI (GPay / PhonePe / Paytm)
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  Google Pay
                </span>
                <span className="text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  PhonePe
                </span>
                <span className="text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  Paytm / BHIM
                </span>
              </div>
            </div>

            {/* QR Code & Direct Pay Layout */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
              {/* QR Code Graphic with Amount Badge */}
              <div className="text-center shrink-0">
                <div className="p-3 bg-white rounded-xl shadow-lg inline-block border-2 border-slate-200">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                  <div className="mt-1 text-center">
                    <span className="text-[10px] font-extrabold text-slate-900 block font-mono">
                      AMOUNT: ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Scan with any UPI App
                </div>
              </div>

              {/* UPI Payment Instructions & Deep Link */}
              <div className="flex-1 space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Payee / Merchant UPI ID:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs sm:text-sm select-all">
                      {merchantUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Intent Deep Link Button */}
                <div>
                  <a
                    href={upiDeepLink}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Smartphone size={15} />
                    <span>Pay directly on Mobile (GPay / PhonePe)</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-amber-400 shrink-0" />
                    <span>Payment Steps:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[10.5px] pl-1">
                    <li>Scan the QR code or tap the mobile pay button.</li>
                    <li>The exact order amount (<strong>₹{totalAmount.toFixed(2)}</strong>) will appear automatically.</li>
                    <li>Complete the transaction on GPay / PhonePe / Paytm.</li>
                    <li>Copy the <strong>12-digit UPI Ref No. / UTR</strong> from your receipt and paste it below.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* UTR Input Form Area */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
              <div>
                <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Hash size={14} className="text-amber-400" />
                  <span>12-Digit UPI Transaction ID / UTR Number</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 408923451234 or UPI123456789"
                  className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded p-2.5 font-mono text-amber-300 text-sm tracking-wider focus:outline-none placeholder:text-slate-600 font-bold"
                  value={upiTransId}
                  onChange={(e) => setUpiTransId(e.target.value)}
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  💡 You can find the 12-digit UTR on your Google Pay / PhonePe / Paytm payment receipt under "UPI Transaction ID" or "UPI Ref ID".
                </span>
              </div>

              <div>
                <label className="text-slate-400 font-normal text-xs block mb-1">
                  Your Paying UPI ID / Mobile (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@oksbi or 9876543210"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-300 text-xs font-mono"
                  value={upiPayerVpa}
                  onChange={(e) => setUpiPayerVpa(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary box */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Order Summary</h3>
            
            <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="py-2.5 flex justify-between items-start text-xs font-normal">
                  <div className="flex flex-col pr-4">
                    <span className="text-slate-200 line-clamp-1 font-semibold">{item.product.name}</span>
                    <span className="text-slate-500 text-[10px]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono text-slate-300 font-bold whitespace-nowrap">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-850 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Sales Wallet:</span>
              <span className="text-amber-400 font-bold font-mono text-[11px] flex items-center gap-1">
                <Award size={12} /> {totalSw} SW
              </span>
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-baseline">
              <span className="text-slate-200 font-bold">Payable Amount:</span>
              <span className="text-2xl font-black text-white font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className={`w-full py-3 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Verifying Transaction Details...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Submit Order & UPI UTR
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              🛡️ Upon submission, your order is recorded with your UPI Transaction ID and submitted for instant verification.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
