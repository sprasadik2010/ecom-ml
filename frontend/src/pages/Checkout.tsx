import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldCheck, CreditCard, Award, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Checkout: React.FC = () => {
  const { items, totalAmount, totalSw, clearCart } = useCart();
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'success'>('checkout');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<{ id: number; amount: number; sw: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states (mocked checkout)
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      // 1. Create order on the backend
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
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

      // 2. Submit order checkout (payment recorded)
      const checkoutResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.detail || 'Checkout simulation failed');
      }

      setLastPlacedOrder({
        id: orderId,
        amount: orderData.total_amount,
        sw: orderData.total_sw,
      });

      // 3. Success steps
      clearCart();
      await refreshUser(); // Update status/wallet balance and pending_sw
      setCheckoutStep('success');
      
      // Fire confetti for premium feel!
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
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full mb-4 border border-amber-500/20">
          <CheckCircle2 size={56} className="text-amber-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Order Placed Successfully!</h1>
        
        {lastPlacedOrder && (
          <div className="inline-flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 font-mono">
            <span>Order #{lastPlacedOrder.id}</span>
            <span>•</span>
            <span>{lastPlacedOrder.sw} SW Volume</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 text-left space-y-2 max-w-md">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Award size={16} />
            <span>Sales Wallet (SW) Pending Admin Approval</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your purchase payment has been verified. The generated <strong className="text-amber-400">{lastPlacedOrder?.sw} SW</strong> points are currently <strong className="text-amber-300">Pending Admin Approval</strong>. Once approved by the administrator, your personal sales volume will be credited, activating your member commissions and distributing business volume to your upline team!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link
            to="/orders"
            className="flex-1 text-center py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-bold text-xs transition-colors"
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

      <h1 className="text-2xl font-black text-white mb-6">Secured Checkout</h1>

      {error && (
        <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-4 rounded-md mb-6 font-semibold">
          Error: {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipping & Payment details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Address Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              Shipping Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Shipping Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  required
                  placeholder="San Francisco"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">ZIP / Postal Code</label>
                <input
                  type="text"
                  required
                  placeholder="94103"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Card Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-amber-500" />
              Simulated Payment (Sandbox Card)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="text-slate-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200 font-mono"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Expiration Date</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200 font-mono"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">CVV</label>
                <input
                  type="password"
                  required
                  placeholder="123"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200 font-mono"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 leading-normal">
              🛡️ **Note**: This is a test sandbox environment. No actual payment card will be charged. Click "Authorize Checkout" to instantly process and verify MLM calculations.
            </p>
          </div>
        </div>

        {/* Right Column: Checkout Total box */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md space-y-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Order Checkout</h3>
            
            <div className="divide-y divide-slate-850">
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
              <span className="text-slate-200 font-bold">Total Price:</span>
              <span className="text-2xl font-black text-white font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className={`w-full py-2.5 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Authorize Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
