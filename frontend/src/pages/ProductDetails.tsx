import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { API_BASE_URL } from '../context/AuthContext';
import { Star, ShoppingCart, Award, ArrowLeft, Shield, RotateCcw, MessageCircle } from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Error loading product details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 font-bold mb-4">Error: {error || 'Product not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-semibold text-sm">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const rating = 4.0 + (product.id % 2 === 0 ? 0.5 : 0.2);
  const reviewsCount = 42 + (product.id * 17) % 150;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button link */}
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 font-semibold text-xs mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Container */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-6 flex items-center justify-center aspect-square max-h-[500px]">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain rounded-md"
          />
        </div>

        {/* Middle Column: Details */}
        <div className="lg:col-span-4 flex flex-col">
          <span className="text-xs uppercase font-extrabold text-amber-500 tracking-widest mb-1.5">
            {product.category}
          </span>
          <h1 className="text-2xl font-black text-white leading-tight mb-2">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                  className={i < Math.floor(rating) ? 'text-amber-400' : 'text-slate-700'}
                />
              ))}
            </div>
            <span className="text-xs text-slate-300 font-semibold">{rating}</span>
            <span className="text-xs text-slate-500">({reviewsCount} customer reviews)</span>
          </div>

          <div className="border-t border-slate-800 my-4" />

          {/* Price */}
          <div className="mb-4">
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block mb-1">Price</span>
            <span className="text-3xl font-black text-[#9F1239] font-mono leading-none">${product.price.toFixed(2)}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-400 line-through font-mono leading-none">${(product.price * 1.54).toFixed(2)}</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">35% OFF</span>
            </div>
          </div>

          {/* SW Box (Sales Wallet Points) */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-full">
              <Award size={20} className="animate-bounce" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-100 mb-0.5">Earn MLM Sales Wallet Points</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Purchasing this product credits <span className="text-amber-400 font-bold font-mono">{product.sw} SW</span> to your account and propagates leg volumes up your sponsor binary tree leg, earning team bonuses!
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-sm text-slate-200 mb-2">Product Description</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {product.description}
            </p>
          </div>

          {/* Guarantees */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-[10px] text-slate-400">
            <div className="flex items-center gap-2 border border-slate-850 p-2 rounded bg-slate-900/30">
              <Shield size={16} className="text-amber-500" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2 border border-slate-850 p-2 rounded bg-slate-900/30">
              <RotateCcw size={16} className="text-amber-500" />
              <span>30-Day Money Back</span>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout/Actions Box */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md">
            <div className="mb-4">
              <span className="text-slate-400 text-xs font-semibold">Total Price:</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">${(product.price * quantity).toFixed(2)}</div>
            </div>

            <div className="border-t border-slate-800 my-4" />

            <div className="space-y-4">
              {/* Stock Status */}
              <div>
                <span className="text-slate-400 text-xs block mb-1">Status:</span>
                <span className={`text-xs font-bold ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Temporarily Out of Stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div>
                  <label htmlFor="qty" className="text-slate-400 text-xs block mb-1.5">
                    Quantity:
                  </label>
                  <select
                    id="qty"
                    className="bg-slate-950 border border-slate-800 rounded-md p-1.5 w-full text-xs font-semibold focus:outline-none focus:border-amber-500 text-slate-200"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  product.stock > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
                    : 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                <ShoppingCart size={14} />
                Add to Cart
              </button>

              {/* WhatsApp Order CTA (Look 3 style) */}
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                  `Hello ApexZone! I'm interested in ordering: "${product.name}" (ID: #${product.id}, Category: ${product.category}, Price: $${product.price.toFixed(2)}). Please help me place this order.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-550 hover:bg-emerald-600 text-white rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/10"
              >
                <MessageCircle size={14} />
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
