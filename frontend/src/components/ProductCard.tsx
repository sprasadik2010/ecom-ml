import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  // Generate deterministic rating for mockup visual
  const rating = 4.0 + (product.id % 2 === 0 ? 0.5 : 0.2);
  const reviewsCount = 42 + (product.id * 17) % 150;

  // Mock pricing calculations for premium design look
  const originalPrice = product.price * 1.54;
  const discountPercent = 35;

  return (
    <div className="bg-white border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-amber-500/30 hover:shadow-[0_8px_24px_rgba(159,18,57,0.04)] transition-all duration-300 group relative">
      {/* Product Image Container */}
      <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-950 border-b border-slate-700">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-[#9F1239] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-700">
          {product.category}
        </span>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full border border-slate-700 hover:text-red-500 transition-colors shadow-xs cursor-pointer"
          title="Add to Wishlist"
        >
          <Heart size={14} fill={isWishlisted ? '#E11D48' : 'none'} className={isWishlisted ? 'text-red-500' : 'text-slate-400'} />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/products/${product.id}`} className="hover:text-amber-500 transition-colors">
          <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm line-clamp-2 min-h-[36px] leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="mt-auto pt-1.5 border-t border-slate-800 flex items-start justify-between gap-2">
          {/* Price Layout (Look 1 Style) */}
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-[#9F1239] font-mono leading-none">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] text-slate-400 line-through font-mono leading-none">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="text-[8px] font-black text-emerald-400 leading-none">
                {discountPercent}% OFF
              </span>
            </div>
          </div>
          {/* SW Indicator */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">SW Point</span>
            <span className="text-[11px] text-amber-500 font-extrabold font-mono mt-0.5">{product.sw} SW</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className={`w-full mt-3.5 flex items-center justify-center gap-1.5 py-2 px-4 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
            product.stock > 0
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-[0.98]'
              : 'bg-slate-850 text-slate-400 cursor-not-allowed border border-slate-800'
          }`}
        >
          {product.stock > 0 ? (
            <>
              <ShoppingCart size={12} />
              Add to Cart
            </>
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  );
};
