import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { ShoppingBag, Heart, Award, Eye } from 'lucide-react';

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

  const originalPrice = product.price * 1.54;
  const discountPercent = 35;
  const photoCount = product.images && product.images.length > 0 ? product.images.length : 1;

  return (
    <div className="bg-white border border-[#EFE2DE] rounded-2xl overflow-hidden flex flex-col hover:border-[#B8586E]/40 hover:shadow-[0_12px_32px_rgba(168,67,93,0.08)] transition-all duration-300 group relative">
      {/* Product Image Container */}
      <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-[#FAF7F2] border-b border-[#F0E4E0]">
        <img
          src={product.image_url || ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#8C2E42] text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#EFE2DE] shadow-xs">
          {product.category || 'Featured'}
        </span>

        {/* Multi-view Pill if > 1 photo */}
        {photoCount > 1 && (
          <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <Eye size={10} />
            <span>{photoCount} views</span>
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full border border-[#EFE2DE] text-[#705960] hover:text-[#B8586E] transition-colors shadow-xs cursor-pointer"
          title="Add to Wishlist"
        >
          <Heart size={14} fill={isWishlisted ? '#B8586E' : 'none'} className={isWishlisted ? 'text-[#B8586E]' : 'text-[#705960]'} />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Title */}
          <Link to={`/products/${product.id}`} className="hover:text-[#B8586E] transition-colors">
            <h3 className="font-bold text-[#331B21] text-xs sm:text-sm line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          
          {/* Variants hint */}
          {(product.colors && product.colors.length > 0 || product.sizes && product.sizes.length > 0) && (
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8C7077]">
              {product.colors && product.colors.length > 0 && (
                <span>{product.colors.length} colors</span>
              )}
              {product.colors && product.colors.length > 0 && product.sizes && product.sizes.length > 0 && (
                <span>•</span>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <span>{product.sizes.length} sizes</span>
              )}
            </div>
          )}
        </div>

        <div>
          {/* Price & SW Section */}
          <div className="pt-2 border-t border-[#F5EDE9] flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black text-[#9C384F] font-mono leading-none">
                ₹{product.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-[#A89297] line-through font-mono leading-none">
                  ₹{originalPrice.toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-[#0D7A5C] bg-[#E8F5EF] px-1.5 py-0.2 rounded leading-none">
                  {discountPercent}% OFF
                </span>
              </div>
            </div>

            {/* SW Badge */}
            <div className="bg-[#FAF2E8] border border-[#F4E1CA] px-2 py-0.5 rounded-lg text-right shrink-0">
              <span className="text-[8px] uppercase tracking-wider text-[#9C6D34] font-bold block leading-none">Points</span>
              <span className="text-[11px] text-[#C07718] font-black font-mono mt-0.5 block leading-none flex items-center gap-0.5">
                <Award size={10} /> {product.sw} SW
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`w-full mt-3.5 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full font-bold text-xs transition-all cursor-pointer shadow-xs ${
              product.stock > 0
                ? 'bg-[#B8586E] hover:bg-[#A3475D] text-white shadow-[#B8586E]/20 active:scale-[0.98]'
                : 'bg-[#F2EAE7] text-[#A89498] cursor-not-allowed border border-[#E8DDDA]'
            }`}
          >
            {product.stock > 0 ? (
              <>
                <ShoppingBag size={13} />
                <span>Add to Cart</span>
              </>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
