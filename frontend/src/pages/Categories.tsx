import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import catFashion from '../assets/cat_fashion.jpg';
import catBeauty from '../assets/cat_beauty.jpg';
import catHome from '../assets/cat_home.jpg';
import catAccessories from '../assets/cat_accessories.jpg';
import catElectronics from '../assets/cat_electronics.jpg';
import catKids from '../assets/cat_kids.jpg';
import catMore from '../assets/cat_more.jpg';

export const Categories: React.FC = () => {
  const categoryCards = [
    {
      name: 'Fashion',
      query: 'Fashion',
      image: catFashion,
      bgHex: '#FDE4E8',
      tag: 'Trendy & Style',
      description: 'Elegant dresses, premium shirts, everyday essentials and bespoke seasonal outfits curated for supreme comfort.',
      itemCount: '12+ Items'
    },
    {
      name: 'Beauty & Personal Care',
      query: 'Beauty',
      image: catBeauty,
      bgHex: '#FCE4D6',
      tag: 'Glow & Wellness',
      description: 'Natural skincare formulations, organic cleansers, nourishing serums, and daily personal care necessities.',
      itemCount: '8+ Items'
    },
    {
      name: 'Home & Living',
      query: 'Home',
      image: catHome,
      bgHex: '#E2EFE4',
      tag: 'Modern Living',
      description: 'Aesthetic room accents, smart bedside lighting, ergonomic cushions, and sustainable homeware accessories.',
      itemCount: '10+ Items'
    },
    {
      name: 'Accessories',
      query: 'Accessories',
      image: catAccessories,
      bgHex: '#EFE2F5',
      tag: 'Luxury Details',
      description: 'Handcrafted leather wallets, stylish sunglasses, smart utility bags, and statement jewelry.',
      itemCount: '14+ Items'
    },
    {
      name: 'Electronics',
      query: 'Electronics',
      image: catElectronics,
      bgHex: '#DEF0FB',
      tag: 'Smart Tech',
      description: 'AMOLED smartwatches, active noise-cancelling headphones, wireless chargers, and cutting-edge tech gadgets.',
      itemCount: '16+ Items'
    },
    {
      name: 'Kids & Baby',
      query: 'Kids',
      image: catKids,
      bgHex: '#FEF2D8',
      tag: 'Safe & Gentle',
      description: 'Child-safe plush toys, baby apparel, developmental games, and daily nursery essentials.',
      itemCount: '6+ Items'
    },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6369]">
          <Link to="/" className="hover:text-[#A8435D] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#331B21]">Categories</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8435D] block">
            Curated Collections
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl text-[#331B21] font-normal">
            Shop by Category
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
            Browse our diverse lifestyle collections. Every purchase earns you Sales Wallet (SW) volume points directly credited to your member account.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categoryCards.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-[#EFE2DE] shadow-xs hover:shadow-lg hover:border-[#E8D0D6] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Icon Halo */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-20 h-20 rounded-2xl p-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner"
                    style={{ backgroundColor: cat.bgHex }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <span className="px-3 py-1 bg-[#FDF4F6] text-[#A8435D] text-[11px] font-bold rounded-full border border-[#F4D5DD]">
                    {cat.tag}
                  </span>
                </div>

                <h3 className="font-serif text-xl text-[#331B21] font-semibold mb-2 group-hover:text-[#B8586E] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#7A6369] leading-relaxed mb-4">
                  {cat.description}
                </p>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[#F2E8E5] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9E868D]">{cat.itemCount}</span>
                <Link
                  to={`/shop?category=${encodeURIComponent(cat.query)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A8435D] group-hover:gap-2.5 transition-all"
                >
                  <span>Explore Items</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All Products CTA Banner */}
        <div className="bg-gradient-to-r from-[#F6ECE7] via-[#F3E3DD] to-[#ECD5CD] rounded-3xl p-8 sm:p-10 border border-[#EEDCD6] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5">
            <h4 className="font-serif text-2xl text-[#331B21]">Looking for Something Specific?</h4>
            <p className="text-xs text-[#6D555B]">View the complete store catalog with real-time price & SW filtering.</p>
          </div>
          <Link
            to="/shop"
            className="px-8 py-3 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all shrink-0 inline-flex items-center gap-2"
          >
            <span>View All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
};
