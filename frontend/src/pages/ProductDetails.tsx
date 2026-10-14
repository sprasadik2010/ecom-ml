import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { API_BASE_URL } from '../context/AuthContext';
import {
  Star,
  ShoppingCart,
  Award,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Check,
  CheckCircle2,
  X,
  Layers,
  RotateCcw,
  ShieldCheck,
  Truck,
  Info
} from 'lucide-react';

// Helper to resolve CSS color or hex for popular variant color names
const getColorStyle = (colorName: string): string => {
  const lower = colorName.toLowerCase().trim();
  const map: Record<string, string> = {
    'black': '#111827',
    'matte black': '#18181b',
    'onyx black': '#09090b',
    'space gray': '#4b5563',
    'storm gray': '#64748b',
    'charcoal gray': '#374151',
    'charcoal black': '#1f2937',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'white': '#f8fafc',
    'moonlight white': '#f1f5f9',
    'cool white': '#f8fafc',
    'silver': '#cbd5e1',
    'silver stainless': '#e2e8f0',
    'stainless silver': '#e2e8f0',
    'platinum silver': '#e2e8f0',
    'gold': '#eab308',
    'rose gold': '#f43f5e',
    'sunset coral': '#fb7185',
    'red': '#ef4444',
    'crimson': '#dc2626',
    'maroon': '#991b1b',
    'blue': '#3b82f6',
    'royal blue': '#1d4ed8',
    'navy': '#1e3a8a',
    'navy blue': '#1e3a8a',
    'deep navy': '#172554',
    'midnight blue': '#0f172a',
    'ocean blue': '#0284c7',
    'teal ocean': '#0d9488',
    'teal': '#14b8a6',
    'green': '#22c55e',
    'emerald green': '#10b981',
    'forest green': '#15803d',
    'olive': '#65a30d',
    'olive green': '#4d7c0f',
    'yellow': '#eab308',
    'amber': '#f59e0b',
    'warm amber': '#d97706',
    'orange': '#f97316',
    'purple': '#a855f7',
    'pastel purple': '#c084fc',
    'pink': '#ec4899',
    'blush pink': '#f472b6',
    'khaki': '#d4b996',
    'vintage khaki': '#c2a681',
    'beige': '#e5d9c5',
    'brown': '#78350f',
    'chocolate fudge': '#451a03',
    'french vanilla': '#fef3c7',
    'café mocha': '#713f12',
    'strawberry bliss': '#fb7185',
  };

  for (const [key, hex] of Object.entries(map)) {
    if (lower.includes(key)) return hex;
  }
  return '#64748b'; // default slate tone
};

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

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

        // Pre-select first color & size if available
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        setActiveImageIdx(0);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Error loading product details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

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

  // Construct gallery images list (with fallbacks)
  const galleryImages: string[] = (
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : []
  ).filter(Boolean);

  const currentImage = galleryImages[activeImageIdx] || product.image_url || '';

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Touch & Mouse horizontal swipe handling
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - (touchStartY ?? 0);

    // Swipe threshold: > 35px horizontal movement
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        handleNextImage(); // Swiped left -> next
      } else {
        handlePrevImage(); // Swiped right -> prev
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const diffX = e.clientX - dragStartX;
    if (Math.abs(diffX) > 35) {
      if (diffX < 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setIsDragging(false);
    setDragStartX(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
      setAddedAnimation(true);
      setTimeout(() => {
        navigate('/cart');
      }, 350);
    }
  };

  const rating = 4.0 + (product.id % 2 === 0 ? 0.5 : 0.2);
  const reviewsCount = 42 + (product.id * 17) % 150;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Back button link */}
      <Link to="/shop" className="inline-flex items-center gap-2 text-[#7A6369] hover:text-[#A8435D] font-semibold text-xs mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Product Photo Views / Swipeable Gallery */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Hero Photo Container with Horizontal Swipe */}
          <div
            className="relative bg-white border border-[#EFE2DE] rounded-3xl p-3 flex items-center justify-center aspect-square max-h-[520px] overflow-hidden group shadow-xs select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* Horizontal Sliding Track */}
            {galleryImages.length > 0 ? (
              <div
                className="w-full h-full flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${activeImageIdx * 100}%)` }}
              >
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full shrink-0 flex items-center justify-center p-2"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-contain rounded-2xl transition-all duration-300 group-hover:scale-102 cursor-pointer pointer-events-none"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#A89498] text-xs">No image available</div>
            )}

            {/* Photo Counter & Swipe Navigation Badge */}
            {galleryImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-[#EFE2DE] text-[#4A343A] text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs pointer-events-none z-10">
                <Layers size={11} className="text-[#B8586E]" />
                <span>{activeImageIdx + 1} of {galleryImages.length} <span className="hidden sm:inline">• Swipe ↔ to view</span></span>
              </div>
            )}

            {/* Lightbox / Zoom Trigger Button */}
            {currentImage && (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white backdrop-blur-md text-[#4A343A] hover:text-[#B8586E] rounded-full border border-[#EFE2DE] transition-colors shadow-xs cursor-pointer z-10"
                title="View full resolution photo"
              >
                <Maximize2 size={13} />
              </button>
            )}

            {/* Next / Prev Navigation Floating Arrows (shown if > 1 photo) */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-[#B8586E] text-[#4A343A] hover:text-white rounded-full border border-[#EFE2DE] backdrop-blur-md transition-all shadow-md opacity-85 hover:opacity-100 cursor-pointer z-10"
                  title="Previous photo view (or swipe right)"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-[#B8586E] text-[#4A343A] hover:text-white rounded-full border border-[#EFE2DE] backdrop-blur-md transition-all shadow-md opacity-85 hover:opacity-100 cursor-pointer z-10"
                  title="Next photo view (or swipe left)"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Dot Pagination Indicators */}
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none z-10">
                  {galleryImages.map((_, dotIdx) => (
                    <div
                      key={dotIdx}
                      className={`transition-all duration-300 rounded-full ${
                        dotIdx === activeImageIdx
                          ? 'w-4 h-1.5 bg-white'
                          : 'w-1.5 h-1.5 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Strip / Multi-View Selector */}
          {galleryImages.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#7A6369] font-semibold px-1">
                <span>Available Views ({galleryImages.length}):</span>
                <span className="text-[10px] text-[#A8435D]">Click or swipe to switch</span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = idx === activeImageIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#B8586E] ring-2 ring-[#B8586E]/30 scale-102 shadow-md shadow-[#B8586E]/20'
                          : 'border-[#EFE2DE] hover:border-[#B8586E]/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 bg-[#B8586E] text-white font-black text-[8px] uppercase tracking-wider text-center py-0.2">
                          Active
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column: Details & Variant Selection */}
        <div className="lg:col-span-4 flex flex-col space-y-5">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#8C2E42] tracking-widest block mb-1.5">
              {product.category || 'Featured'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#331B21] leading-tight mb-2 font-normal">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                    className={i < Math.floor(rating) ? 'text-amber-500' : 'text-slate-300'}
                  />
                ))}
              </div>
              <span className="text-xs text-[#331B21] font-semibold">{rating}</span>
              <span className="text-xs text-[#8C7077]">({reviewsCount} customer reviews)</span>
            </div>
          </div>

          <div className="border-t border-[#F0E4E7]" />

          {/* Price */}
          <div>
            <span className="text-[#8C7077] text-xs uppercase font-bold tracking-wider block mb-1">Price</span>
            <span className="text-3xl font-black text-[#9C384F] font-mono leading-none">₹{product.price.toFixed(2)}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-[#A89297] line-through font-mono leading-none">₹{(product.price * 1.54).toFixed(2)}</span>
              <span className="bg-[#E8F5EF] border border-[#C5E9D7] text-[#0D7A5C] font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">35% OFF</span>
            </div>
          </div>

          {/* SW Box (Sales Wallet Points) */}
          <div className="bg-[#FAF2E8] border border-[#F4E1CA] rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-[#F4E1CA] text-[#C07718] rounded-full shrink-0">
              <Award size={20} className="animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#331B21] mb-0.5">Earn Sales Wallet Points</h4>
              <p className="text-xs text-[#7A6369] leading-normal">
                Purchasing credits <strong className="text-[#C07718] font-mono font-bold">{product.sw} SW</strong> to your account and propagates business bonus volume up your binary tree!
              </p>
            </div>
          </div>

          {/* COLOR SELECTOR */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5 bg-white border border-[#EFE2DE] p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#705960] font-bold uppercase tracking-wider text-[10.5px]">
                  Select Color:
                </span>
                {selectedColor && (
                  <span className="text-[#B8586E] font-bold font-sans text-xs">
                    {selectedColor}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {product.colors.map((c) => {
                  const isSelected = selectedColor === c;
                  const dotColor = getColorStyle(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#FDF4F6] border-[#B8586E] text-[#B8586E] ring-2 ring-[#B8586E]/20 scale-102 shadow-xs'
                          : 'bg-[#FAF7F2] border-[#EFE2DE] text-[#4A343A] hover:border-[#B8586E]/50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: dotColor }}
                      >
                        {isSelected && <Check size={8} className="text-white drop-shadow" />}
                      </span>
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIZE SELECTOR */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2.5 bg-white border border-[#EFE2DE] p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#705960] font-bold uppercase tracking-wider text-[10.5px]">
                  Select Size / Option:
                </span>
                {selectedSize && (
                  <span className="text-[#B8586E] font-bold font-mono text-xs">
                    {selectedSize}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[42px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#B8586E] text-white border-[#B8586E] shadow-sm scale-102'
                          : 'bg-[#FAF7F2] border-[#EFE2DE] text-[#4A343A] hover:border-[#B8586E]/50'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="font-bold text-sm text-[#331B21] mb-2">Product Description</h4>
            <p className="text-xs text-[#7A6369] leading-relaxed font-normal">
              {product.description || 'No detailed description available for this item.'}
            </p>
          </div>

          {/* 3-Day Transit Damage Return Policy Card */}
          <div className="bg-[#FAF7F2] border border-[#EFE2DE] p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8C2E42] font-bold text-xs uppercase tracking-wider">
                <RotateCcw size={15} />
                <span>3-Day Return Policy</span>
              </div>
              <span className="text-[10px] bg-[#E8F5EF] text-[#0D7A5C] font-bold px-2 py-0.5 rounded-full">
                Damaged Goods Protected
              </span>
            </div>

            <p className="text-xs text-[#4A343A] leading-relaxed">
              BuyWay accepts return requests for products that arrive damaged, provided the request is submitted within <strong>3 days of delivery</strong> with photographs of the damaged product. BuyWay bears return shipping for verified claims, and a replacement will be provided.
            </p>

            <div className="pt-2 border-t border-[#F0E4E7] flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-[#8C7077]">Misuse or missing tags non-eligible.</span>
              <Link to="/return-policy" className="text-[#B8586E] hover:text-[#A8435D] font-bold underline decoration-[#B8586E]/40">
                View Full Return Policy →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout/Actions Box */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[#EFE2DE] rounded-2xl p-4 sm:p-6 shadow-md lg:sticky lg:top-24 space-y-4">
            <div>
              <span className="text-[#705960] text-xs font-semibold">Total Price:</span>
              <div className="text-2xl font-black text-[#331B21] mt-1 font-mono">
                ₹{(product.price * quantity).toFixed(2)}
              </div>
            </div>

            {/* Selected Variant Summary */}
            {(selectedColor || selectedSize) && (
              <div className="bg-[#FAF7F2] border border-[#EFE2DE] p-2.5 rounded-xl space-y-1 text-[11px]">
                <span className="text-[#705960] font-bold block text-[10px] uppercase tracking-wider">
                  Selected Configuration:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {selectedColor && (
                    <span className="bg-white border border-[#EFE2DE] px-2 py-0.5 rounded text-[#B8586E] font-bold">
                      Color: {selectedColor}
                    </span>
                  )}
                  {selectedSize && (
                    <span className="bg-white border border-[#EFE2DE] px-2 py-0.5 rounded text-[#0D7A5C] font-bold font-mono">
                      Size: {selectedSize}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-[#F0E4E7]" />

            <div className="space-y-4">
              {/* Stock Status */}
              <div>
                <span className="text-[#705960] text-xs block mb-1">Inventory Status:</span>
                <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${product.stock > 0 ? 'text-[#0D7A5C]' : 'text-red-500'}`}>
                  {product.stock > 0 ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>In Stock ({product.stock} units available)</span>
                    </>
                  ) : (
                    'Temporarily Out of Stock'
                  )}
                </span>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div>
                  <label htmlFor="qty" className="text-[#705960] text-xs block mb-1.5">
                    Quantity:
                  </label>
                  <select
                    id="qty"
                    className="bg-[#FAF7F2] border border-[#EFE2DE] rounded-lg p-2 w-full text-xs font-semibold focus:outline-none focus:border-[#B8586E] text-[#251117]"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'unit' : 'units'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`w-full py-3 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  product.stock > 0
                    ? addedAnimation
                      ? 'bg-[#0D7A5C] text-white scale-95'
                      : 'bg-[#B8586E] hover:bg-[#A3475D] text-white shadow-[#B8586E]/20 active:scale-95'
                    : 'bg-[#F2EAE7] text-[#A89498] cursor-not-allowed border border-[#E8DDDA]'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check size={16} />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={15} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              {/* Trust & Policy Assurance Badges */}
              <div className="pt-2 border-t border-[#F0E4E7] space-y-2 text-[11px] text-[#705960]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#0D7A5C] shrink-0" />
                  <span>3-Day Damage Replacement Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#B8586E] shrink-0" />
                  <span>Tracked India Post Dispatch Logistics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>{product.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 font-mono">View {activeImageIdx + 1} of {galleryImages.length}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Image with Prev / Next & Swipe */}
          <div
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center select-none touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={currentImage}
              alt="Full resolution product view"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 p-2.5 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white rounded-full transition-colors cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 p-2.5 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white rounded-full transition-colors cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {galleryImages.length > 1 && (
            <div
              className="flex items-center gap-2 mt-4 overflow-x-auto max-w-xl pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    idx === activeImageIdx
                      ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
