import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag, ArrowRight, Award, ChevronLeft } from 'lucide-react';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, totalSw } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (!user) {
      // Prompt login before checkout
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-200 mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-slate-500 text-sm mb-6">
          Explore our premium catalog, earn SW points, and activate your binary tree downline bonuses!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-md text-xs transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart items */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            {/* Header info */}
            <div className="p-4 bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:grid grid-cols-12 gap-2 border-b border-slate-850">
              <span className="col-span-6">Product Details</span>
              <span className="col-span-2 text-center">Price</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {/* Item rows */}
            <div className="divide-y divide-slate-850">
              {items.map((item) => (
                <React.Fragment key={item.product.id}>
                  {/* Desktop Item Row */}
                  <div className="hidden md:grid p-4 grid-cols-12 gap-2 items-center text-xs">
                    {/* Name & Image */}
                    <div className="col-span-6 flex gap-3 items-center">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded bg-slate-950 border border-slate-800"
                      />
                      <div className="flex flex-col">
                        <Link to={`/products/${item.product.id}`} className="font-extrabold text-slate-200 hover:text-amber-500 transition-colors line-clamp-1">
                          {item.product.name}
                        </Link>
                        <span className="text-[10px] text-slate-500 mt-0.5">{item.product.category}</span>
                        
                        {/* SW Indicator */}
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold font-mono mt-1">
                          <Award size={10} /> {item.product.sw} SW / unit
                        </span>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 text-center font-mono font-bold text-slate-300">
                      ${item.product.price.toFixed(2)}
                    </div>

                    {/* Quantity Selector */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <select
                        className="bg-slate-950 border border-slate-800 rounded p-1 text-[11px] font-bold text-slate-200 focus:outline-none"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                      >
                        {Array.from({ length: Math.min(item.product.stock, 10) }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 hover:text-red-400 text-slate-500 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="col-span-2 text-right font-mono font-bold text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                      <span className="block text-[8px] text-amber-500 font-bold mt-0.5">{(item.product.sw * item.quantity)} SW</span>
                    </div>
                  </div>

                  {/* Mobile Item Card Layout */}
                  <div className="block md:hidden p-4 relative text-xs">
                    {/* Top Section: Image, Name, and Delete Button */}
                    <div className="flex gap-3 items-start pr-8">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <Link to={`/products/${item.product.id}`} className="font-extrabold text-slate-200 hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
                          {item.product.name}
                        </Link>
                        <span className="text-[10px] text-slate-500 mt-1">{item.product.category}</span>
                        
                        {/* SW Indicator */}
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold font-mono mt-1">
                          <Award size={10} /> {item.product.sw} SW / unit
                        </span>
                      </div>
                    </div>

                    {/* Delete button absolutely positioned at top right */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-slate-950 text-slate-400 hover:text-red-400 rounded border border-slate-800 transition-all active:scale-95 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Divider */}
                    <div className="border-t border-slate-850/50 my-3" />

                    {/* Details Row: Price, Qty Selector, and Total */}
                    <div className="flex flex-wrap items-center justify-between gap-4 font-mono">
                      {/* Price per Unit */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-sans">Price</span>
                        <span className="text-slate-300 font-bold">${item.product.price.toFixed(2)}</span>
                      </div>

                      {/* Quantity dropdown */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-sans mb-1">Qty</span>
                        <select
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-bold text-slate-200 focus:outline-none"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                        >
                          {Array.from({ length: Math.min(item.product.stock, 10) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Total details */}
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-sans">Total</span>
                        <span className="text-white font-extrabold">${(item.product.price * item.quantity).toFixed(2)}</span>
                        <span className="text-[9px] text-amber-500 font-bold font-sans">{(item.product.sw * item.quantity)} SW</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-bold transition-colors">
            <ChevronLeft size={14} /> Continue Shopping
          </Link>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md space-y-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Order Summary</h3>
            
            <div className="border-t border-slate-850 pt-3 flex justify-between text-xs">
              <span className="text-slate-400">Total Items:</span>
              <span className="font-bold text-slate-200">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            <div className="flex justify-between text-xs items-center">
              <span className="text-slate-400">Total Sales Wallet SW:</span>
              <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-amber-400 font-bold font-mono text-[11px] flex items-center gap-1">
                <Award size={12} /> {totalSw} SW
              </span>
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-baseline">
              <span className="text-slate-200 font-bold">Subtotal:</span>
              <span className="text-2xl font-black text-white font-mono">${totalAmount.toFixed(2)}</span>
            </div>

            {/* MLM Info Blurb */}
            {user && user.status === 'inactive' && (
              <div className="bg-blue-950/20 border border-blue-900 rounded p-3 text-[10px] text-slate-400 leading-normal">
                {totalSw >= 50 ? (
                  <p className="text-emerald-400 font-bold">
                    🎉 This purchase of {totalSw} SW will ACTIVATE your MLM member status!
                  </p>
                ) : (
                  <p>
                    💡 Add more items to reach <span className="text-amber-400 font-bold">50 SW</span> and activate your account tree status! (Current Cart: {totalSw} SW)
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCheckoutClick}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
