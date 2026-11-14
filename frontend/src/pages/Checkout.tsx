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
  Hash,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import paymentQrImage from '../assets/payment_qr.jpg';

interface ActiveOrderInfo {
  id: number;
  amount: number;
  sw: number;
  shipping_name?: string;
  shipping_address?: string;
  items_count?: number;
  timestamp?: number;
}

export const Checkout: React.FC = () => {
  const { items, totalAmount, totalSw, clearCart } = useCart();
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'awaiting_payment' | 'success'>('checkout');
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<{ id: number; amount: number; sw: number; upi_trans_id?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showOptionalUtr, setShowOptionalUtr] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Merchant UPI Config from backend (Sharath Kumar)
  const [merchantUpiId, setMerchantUpiId] = useState('sharathponnammu@oksbi');
  const [merchantUpiName, setMerchantUpiName] = useState('sharath kumar');

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

  // Restore pending active order if user switches back to browser or tab reloaded
  useEffect(() => {
    try {
      const saved = localStorage.getItem('buyway_active_order');
      if (saved) {
        const parsed: ActiveOrderInfo = JSON.parse(saved);
        // Valid for up to 24 hours
        if (parsed && parsed.id && (Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000)) {
          setActiveOrder(parsed);
          setCheckoutStep('awaiting_payment');
        } else {
          localStorage.removeItem('buyway_active_order');
        }
      }
    } catch (e) {
      console.warn('Could not restore pending order', e);
    }
  }, []);

  // Construct Dynamic UPI Deep-link URI with specific order ID
  const getUpiDeepLink = (orderId?: number, amt?: number) => {
    const amountVal = (amt != null ? amt : totalAmount).toFixed(2);
    const noteVal = orderId ? `BuyWay Order #${orderId}` : `BuyWay Purchase ${Date.now()}`;
    return `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantUpiName)}&am=${amountVal}&cu=INR&tn=${encodeURIComponent(noteVal)}&aid=uGICAgIDVx_jpXQ`;
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // STEP 1: Pre-create order on backend BEFORE opening UPI app
  const handleCreateOrderAndPay = async (launchUpiApp: boolean) => {
    if (items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    // Validate delivery details
    if (!fullName.trim() || !address.trim() || !city.trim() || !stateName.trim() || !zipCode.trim() || !phone.trim()) {
      setError('Please fill in all shipping details before proceeding to payment.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create order on the backend
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          selected_color: item.selectedColor,
          selected_size: item.selectedSize,
        })),
        shipping_name: fullName.trim(),
        shipping_address: address.trim(),
        shipping_city: city.trim(),
        shipping_state: stateName.trim(),
        shipping_zip: zipCode.trim(),
        shipping_phone: phone.trim(),
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

      // 2. Prepare Order state & save to localStorage for reload resilience
      const pendingOrderObj: ActiveOrderInfo = {
        id: orderId,
        amount: orderData.total_amount,
        sw: orderData.total_sw,
        shipping_name: fullName.trim(),
        shipping_address: `${address.trim()}, ${city.trim()}, ${stateName.trim()} - ${zipCode.trim()}`,
        items_count: items.length,
        timestamp: Date.now()
      };
      setActiveOrder(pendingOrderObj);
      localStorage.setItem('buyway_active_order', JSON.stringify(pendingOrderObj));

      // 3. Clear cart as stock is now reserved
      clearCart();

      // 4. Advance UI step to awaiting payment confirmation
      setCheckoutStep('awaiting_payment');

      // 5. If mobile UPI requested, trigger deep link
      if (launchUpiApp) {
        const link = getUpiDeepLink(orderId, orderData.total_amount);
        window.location.href = link;
      }

    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: One-tap confirmation when customer returns from UPI app (no typing required!)
  const handleConfirmPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeOrder) return;

    setLoading(true);
    setError('');

    try {
      const transId = upiTransId.trim() || `UPI-APP-CONFIRMED-#${activeOrder.id}`;
      const checkoutPayload = {
        payment_method: 'upi_qr',
        upi_trans_id: transId,
        upi_payer_vpa: upiPayerVpa.trim() || undefined,
        shipping_name: fullName.trim() || activeOrder.shipping_name || undefined,
      };

      const checkoutResponse = await fetch(`${API_BASE_URL}/orders/${activeOrder.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.detail || 'Payment confirmation failed');
      }

      setLastPlacedOrder({
        id: activeOrder.id,
        amount: activeOrder.amount,
        sw: activeOrder.sw,
        upi_trans_id: transId,
      });

      // Clear pending active order from localStorage
      localStorage.removeItem('buyway_active_order');
      await refreshUser();
      setCheckoutStep('success');

      // Confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err: any) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Payment confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel order in case customer made an error or wants to modify
  const handleCancelActiveOrder = async () => {
    if (!activeOrder) return;
    if (!window.confirm('Cancel this pending order? This will release reserved products back to the store.')) return;

    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/orders/${activeOrder.id}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.warn('Could not cancel on server:', err);
    } finally {
      localStorage.removeItem('buyway_active_order');
      setActiveOrder(null);
      setCheckoutStep('checkout');
      setLoading(false);
      navigate('/cart');
    }
  };

  // SUCCESS STEP
  if (checkoutStep === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-20 text-center flex flex-col items-center">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
          <CheckCircle2 size={56} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-100 mb-2">Order Submitted Successfully!</h1>

        {lastPlacedOrder && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 font-mono text-xs">
            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full font-bold">
              Order #{lastPlacedOrder.id}
            </span>
            <span className="bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full font-bold">
              {lastPlacedOrder.sw} SW Volume
            </span>
            {lastPlacedOrder.upi_trans_id && !lastPlacedOrder.upi_trans_id.includes('UPI-APP-CONFIRMED') && (
              <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full font-bold">
                UTR: {lastPlacedOrder.upi_trans_id}
              </span>
            )}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 text-left space-y-2 max-w-md shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Award size={16} />
            <span>Payment Logged & Awaiting Admin Verification</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your order <strong className="text-emerald-400 font-mono">#{lastPlacedOrder?.id}</strong> is registered in the system. The generated <strong className="text-amber-400">{lastPlacedOrder?.sw} SW</strong> points are <strong className="text-amber-300">Pending Admin Verification</strong>. Once payment is verified against the bank statement, your personal volume and team commissions will be automatically activated!
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

  // AWAITING PAYMENT STEP (Returned from UPI app or waiting for confirmation)
  if (checkoutStep === 'awaiting_payment' && activeOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Check size={14} className="p-0.5 bg-emerald-500/20 rounded-full" />
            <span>1. Order Created</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
            <Clock size={14} />
            <span>2. Complete Payment</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>3. Admin Approval</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-slate-800/80 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles size={12} /> Order #{activeOrder.id} Registered
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Pay ₹{activeOrder.amount.toFixed(2)} via UPI
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please complete your transaction on Google Pay, PhonePe, or Paytm. Once done, tap the button below to confirm.
            </p>
          </div>

          {/* Payment Details Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Payable Amount:</span>
              <span className="font-mono text-base font-black text-emerald-400">₹{activeOrder.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Payee Name:</span>
              <span className="font-bold text-slate-200 capitalize">{merchantUpiName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Payee UPI ID (VPA):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 select-all">{merchantUpiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="px-2 py-0.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedUpi ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">UPI Payment Note:</span>
              <span className="font-mono text-slate-300 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                BuyWay Order #{activeOrder.id}
              </span>
            </div>
          </div>

          {/* Primary Action: ONE TAP CONFIRMATION (No typing required!) */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleConfirmPayment()}
              className="w-full py-4 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Logging Your Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} className="text-slate-950" />
                  <span>I Have Completed Payment</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 font-normal">
              ⚡ <strong>Zero typing needed:</strong> Tap above after paying in GPay/PhonePe to register your confirmation with the admin.
            </p>
          </div>

          {/* Re-Open UPI App / View QR Code Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-850">
            <a
              href={getUpiDeepLink(activeOrder.id, activeOrder.amount)}
              className="py-2.5 px-3 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-800"
            >
              <Smartphone size={14} className="text-emerald-400" />
              <span>Reopen UPI App</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <button
              type="button"
              onClick={() => setShowQrModal(!showQrModal)}
              className="py-2.5 px-3 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-800"
            >
              <QrCode size={14} className="text-amber-400" />
              <span>{showQrModal ? 'Hide QR Code' : 'Scan QR Code'}</span>
            </button>
          </div>

          {/* Expandable QR Code View */}
          {showQrModal && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center animate-fadeIn">
              <div className="p-2 bg-white rounded-2xl shadow-xl inline-block border-2 border-slate-200 max-w-[200px]">
                <img
                  src={paymentQrImage}
                  alt="UPI Payment QR Code"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-2">
                Scan with GPay / PhonePe / Paytm / BHIM
              </span>
            </div>
          )}

          {/* Optional Helper: 12-Digit UTR Input (Non-blocking) */}
          <div className="pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setShowOptionalUtr(!showOptionalUtr)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Hash size={13} className="text-amber-400" />
                <span>Have the 12-digit UPI UTR number? (Optional)</span>
              </span>
              {showOptionalUtr ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showOptionalUtr && (
              <div className="mt-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-855 space-y-3 text-xs animate-fadeIn">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    12-Digit UPI Transaction ID / UTR (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 408923451234"
                    value={upiTransId}
                    onChange={(e) => setUpiTransId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded p-2 text-amber-300 font-mono font-bold tracking-wider focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    You do NOT have to type this to place your order. It just helps the admin verify even faster.
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    Your UPI ID / Mobile (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@oksbi"
                    value={upiPayerVpa}
                    onChange={(e) => setUpiPayerVpa(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-mono focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirmPayment()}
                  disabled={loading}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-lg text-xs transition-colors"
                >
                  Submit with UTR
                </button>
              </div>
            )}
          </div>

          {/* Footer Info & Cancel Option */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-850/60">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              Order #{activeOrder.id} is securely saved in admin panel
            </span>
            <button
              type="button"
              onClick={handleCancelActiveOrder}
              disabled={loading}
              className="text-red-400/80 hover:text-red-300 underline cursor-pointer"
            >
              Cancel this order & return to store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 0: Empty Cart with no active order
  if (items.length === 0 && !activeOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="p-3 bg-slate-900 text-slate-400 rounded-full mb-4 border border-slate-800">
          <XCircle size={48} className="text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Your Cart is Empty</h1>
        <p className="text-xs text-slate-400 mb-6">
          Add some products to your cart before proceeding to checkout.
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md text-xs transition-colors"
          >
            Explore Store
          </Link>
          <Link
            to="/orders"
            className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-md text-xs border border-slate-800 transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>
    );
  }

  // STEP 1: INITIAL CHECKOUT FORM
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 font-semibold text-xs mb-6 transition-colors">
        <ArrowLeft size={14} /> Return to Cart
      </Link>

      <h1 className="text-xl sm:text-2xl font-black text-slate-100 mb-6">UPI Secured Checkout</h1>

      {error && (
        <div className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-4 rounded-md mb-6 font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipping & Dynamic UPI Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Address Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              1. Shipping & Customer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name *</label>
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
                <label className="text-slate-400 block mb-1">Shipping Address *</label>
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
                <label className="text-slate-400 block mb-1">City / District *</label>
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
                <label className="text-slate-400 block mb-1">State / Province *</label>
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
                <label className="text-slate-400 block mb-1">PIN / Postal Code *</label>
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
                <label className="text-slate-400 block mb-1">Delivery Contact Phone *</label>
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
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" />
                2. Instant UPI Mobile Pay & QR
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
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
            <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 bg-slate-950/60 p-3.5 sm:p-5 rounded-xl border border-slate-800">
              {/* Official UPI QR Code Card */}
              <div className="text-center shrink-0 flex flex-col items-center">
                <div className="p-2 bg-white rounded-2xl shadow-xl inline-block border-2 border-slate-200 overflow-hidden max-w-[210px] sm:max-w-[240px]">
                  <img
                    src={paymentQrImage}
                    alt="UPI Payment QR Code - Sharath Kumar"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                  <div className="mt-2 py-1.5 px-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                    <span className="text-[11px] font-black text-slate-900 block font-mono">
                      PAYABLE AMOUNT: ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Scan to pay with any UPI app
                </div>
              </div>

              {/* UPI Payment Instructions & Seamless Button */}
              <div className="flex-1 space-y-3.5 text-xs w-full">
                <div>
                  <span className="text-slate-400 text-[11px] block">Payee / Account Name:</span>
                  <div className="font-bold text-slate-100 text-sm capitalize mt-0.5">
                    {merchantUpiName}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Payee UPI ID (VPA):</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-amber-500 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs sm:text-sm select-all break-all">
                      {merchantUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Mobile Action: Auto-creates order and opens GPay/PhonePe */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={loading || items.length === 0}
                    onClick={() => handleCreateOrderAndPay(true)}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span>Registering Order & Launching UPI...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={18} />
                        <span>Pay ₹{totalAmount.toFixed(2)} on Mobile (GPay / PhonePe)</span>
                        <ExternalLink size={13} />
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-[11px] text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-amber-400 shrink-0" />
                    <span>How it works:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10.5px] pl-1">
                    <li>Tap the green button above to open Google Pay or PhonePe.</li>
                    <li>Your order is <strong>automatically created and saved</strong> in our system.</li>
                    <li>After paying, simply return to this page and tap <strong>"I Have Paid"</strong>.</li>
                    <li>No need to hunt or copy any 12-digit transaction ID!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary box */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Order Summary</h3>

            <div className="divide-y divide-slate-855 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const itemKey = `${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
                return (
                  <div key={itemKey} className="py-2.5 flex justify-between items-start text-xs font-normal">
                    <div className="flex flex-col pr-4">
                      <span className="text-slate-200 line-clamp-1 font-semibold">{item.product.name}</span>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] mt-0.5">
                        <span>Qty: {item.quantity}</span>
                        {item.selectedColor && (
                          <span className="text-amber-400 font-bold">• {item.selectedColor}</span>
                        )}
                        {item.selectedSize && (
                          <span className="text-sky-400 font-bold font-mono">• {item.selectedSize}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-slate-300 font-bold whitespace-nowrap">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-850 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Sales Wallet:</span>
              <span className="text-amber-400 font-bold font-mono text-[11px] flex items-center gap-1">
                <Award size={12} /> {totalSw} SW
              </span>
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-baseline">
              <span className="text-slate-200 font-bold">Payable Amount:</span>
              <span className="text-2xl font-black text-slate-100 font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => handleCreateOrderAndPay(true)}
              className={`w-full py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${loading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-[#B8586E] hover:bg-[#A3475D] text-white shadow-[#B8586E]/25 active:scale-95'
                }`}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Proceed to Pay via UPI
                </>
              )}
            </button>

            <div className="bg-[#FAF7F2] border border-[#EFE2DE] p-3 rounded-xl text-[10.5px] text-[#705960] leading-relaxed space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-bold text-[#8C2E42]">
                <ShieldCheck size={13} className="text-[#0D7A5C]" />
                <span>3-Day Damage Protection Guarantee</span>
              </div>
              <p>
                Products arriving damaged in transit are eligible for free replacement within 3 days of delivery with photographs. <Link to="/return-policy" target="_blank" className="text-[#B8586E] font-bold underline">Policy Details →</Link>
              </p>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              🛡️ Upon tapping pay, your order is immediately registered in our system, securing your inventory and volume points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
