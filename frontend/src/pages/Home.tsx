import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../context/CartContext';
import { API_BASE_URL } from '../context/AuthContext';
import {
  Truck,
  ShieldCheck,
  Heart,
  Headphones,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// Exact extracted assets from attached design
import heroExactRight from '../assets/hero_exact_right.jpg';
import bwLogo from '../assets/bwLogo.jpeg';
import catFashion from '../assets/cat_fashion.jpg';
import catBeauty from '../assets/cat_beauty.jpg';
import catHome from '../assets/cat_home.jpg';
import catAccessories from '../assets/cat_accessories.jpg';
import catElectronics from '../assets/cat_electronics.jpg';
import catKids from '../assets/cat_kids.jpg';
import catMore from '../assets/cat_more.jpg';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          setFeaturedProducts(data.slice(0, 8)); // Top 8 featured
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  interface HomeCategory {
    label: string;
    query: string;
    image: string;
    bgHex: string;
    link: string;
  }

  const [categoriesList, setCategoriesList] = useState<HomeCategory[]>([]);

  useEffect(() => {
    const fetchHomeCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          const pastelColors = ['#FDE4E8', '#FCE4D6', '#E2EFE4', '#EFE2F5', '#DEF0FB', '#FEF2D8', '#FCE4EC'];
          const mapped: HomeCategory[] = data.map((c: any, idx: number) => ({
            label: c.name,
            query: c.name,
            image: c.image_url || catMore,
            bgHex: pastelColors[idx % pastelColors.length],
            link: `/shop?category=${encodeURIComponent(c.name)}`
          }));
          setCategoriesList(mapped);
        }
      } catch (err) {
        console.error('Failed to load categories for home:', err);
      }
    };
    fetchHomeCategories();
  }, []);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">

        {/* 1. HERO BANNER - EXACT MATCH TO ATTACHED IMAGE */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F7EFEA] via-[#F4E6E0] to-[#EBD7CE] border border-[#ECD9D2] shadow-[0_8px_30px_rgba(168,67,93,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">

            {/* Left Column: Hero Text */}
            <div className="lg:col-span-6 p-5 sm:p-10 lg:p-16 space-y-3 sm:space-y-4 z-10 text-left">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.25em] text-[#8C3A4D] block">
                YOUR ONE STOP
              </span>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#331B21] font-normal leading-[1.12] tracking-tight">
                Shop More<br />
                Live Better <span className="font-sans font-light text-[#A8435D]">♡</span>
              </h1>

              <p className="text-[#6D555B] text-xs sm:text-sm max-w-md leading-relaxed font-normal">
                Discover trendy products, trusted quality and a seamless shopping experience - only at Buyway.
              </p>

              <div className="pt-2 sm:pt-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#C45A6D] hover:bg-[#B2485C] text-white rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#C45A6D]/30 hover:gap-3 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right Column: Exactly Attached Image Arch, Woman Picture & Script */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end overflow-hidden">
              <div className="w-full max-w-[580px] h-full flex items-center justify-center">
                <img
                  src={heroExactRight}
                  alt="Happy woman with Buyway bags - Better Choices Brighter You"
                  className="w-full h-auto object-contain object-right"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 2. TRUST / FEATURE HIGHLIGHTS BAR - EXACT MATCH TO ATTACHED IMAGE */}
        <section className="bg-white border border-[#EFE2DE] rounded-2xl p-4 sm:p-6 lg:px-10 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {/* Badge 1 */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl bg-[#FCFAF8] md:bg-transparent border border-[#F0E4E7]/60 md:border-none">
              <div className="p-1.5 sm:p-2 text-[#A8435D] rounded-full shrink-0">
                <Truck size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#331B21]">Fast & Reliable</div>
                <div className="text-[10px] sm:text-[11px] text-[#7A6369]">Delivery</div>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl bg-[#FCFAF8] md:bg-transparent border border-[#F0E4E7]/60 md:border-none">
              <div className="p-1.5 sm:p-2 text-[#A8435D] rounded-full shrink-0">
                <ShieldCheck size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#331B21]">Secure</div>
                <div className="text-[10px] sm:text-[11px] text-[#7A6369]">Payments</div>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl bg-[#FCFAF8] md:bg-transparent border border-[#F0E4E7]/60 md:border-none">
              <div className="p-1.5 sm:p-2 text-[#A8435D] rounded-full shrink-0">
                <Heart size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#331B21]">Trendy &</div>
                <div className="text-[10px] sm:text-[11px] text-[#7A6369]">Quality Products</div>
              </div>
            </div>

            {/* Badge 4 */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl bg-[#FCFAF8] md:bg-transparent border border-[#F0E4E7]/60 md:border-none">
              <div className="p-1.5 sm:p-2 text-[#A8435D] rounded-full shrink-0">
                <Headphones size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#331B21]">Dedicated</div>
                <div className="text-[10px] sm:text-[11px] text-[#7A6369]">Customer Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SHOP BY CATEGORY - DYNAMIC ONLY IF REAL CATEGORIES EXIST */}
        {categoriesList.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            {/* Decorative Divider Header: — Shop by Category — */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div className="h-[1px] w-8 sm:w-28 bg-[#E4D1D6]"></div>
              <h2 className="font-serif text-xl sm:text-3xl text-[#331B21] font-normal tracking-wide text-center">
                Shop by Category
              </h2>
              <div className="h-[1px] w-8 sm:w-28 bg-[#E4D1D6]"></div>
            </div>

            {/* Circular Category Pills */}
            <div className="flex items-center justify-start sm:justify-center gap-3.5 sm:gap-7 overflow-x-auto pb-4 pt-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
              {categoriesList.map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.link}
                  className="flex flex-col items-center gap-2 sm:gap-2.5 shrink-0 group focus:outline-none cursor-pointer"
                >
                  {/* Circular Image Container with Exact Mockup Crop */}
                  <div
                    className="w-16 h-16 sm:w-22 sm:h-22 rounded-full p-1 sm:p-1.5 transition-all duration-300 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md shadow-xs overflow-hidden"
                    style={{ backgroundColor: cat.bgHex }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {/* Label Underneath */}
                  <span className="text-[11px] sm:text-xs font-semibold text-center transition-colors max-w-[76px] sm:max-w-[85px] leading-tight text-[#4A343A] group-hover:text-[#B8586E]">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. PROMOTIONAL STRIP - EXACT MATCH TO ATTACHED IMAGE */}
        <section className="bg-gradient-to-r from-[#9E4758] via-[#8B3A4A] to-[#7A303F] text-white rounded-2xl p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 shadow-lg shadow-[#8B3A4A]/20 relative overflow-hidden">
          {/* Script text on left */}
          <div className="z-10 text-center md:text-left space-y-1">
            <div className="font-script text-xl sm:text-3xl lg:text-4xl text-[#FFE8EE] font-normal leading-snug">
              Your Favourite Store is Just a Click Away ♡
            </div>
          </div>

          {/* Action button & Logo on right */}
          <div className="z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/shop"
              className="px-6 sm:px-7 py-2.5 bg-white hover:bg-[#FFF4F6] text-[#7A303F] font-bold rounded-full text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Explore Now</span>
              <ArrowRight size={14} />
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <img
                src={bwLogo}
                alt="Buyway - Shop, Earn, Grow"
                className="h-10 w-auto object-contain brightness-0 invert opacity-95"
              />
            </div>
          </div>
        </section>

        {/* 5. FEATURED PRODUCTS PREVIEW */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-[#F0E4E7] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8435D]">
                Top Picks
              </span>
              <h3 className="font-serif text-2xl text-[#331B21] font-normal">
                Featured Collection
              </h3>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#A8435D] hover:text-[#8C2E42] flex items-center gap-1 transition-colors"
            >
              <span>View All Products</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#EFE2DE] animate-pulse space-y-3">
                  <div className="aspect-[3/4] bg-[#FAF7F2] rounded-xl" />
                  <div className="h-4 bg-[#F2E8E4] rounded w-3/4" />
                  <div className="h-3 bg-[#F2E8E4] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 6. DIRECT SELLING MEMBER REWARDS TEASER */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-6 rounded-2xl border border-[#EFE2DE] space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E8] text-[#C07718] flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <h4 className="font-serif text-lg text-[#331B21]">Earn SW Volume Points</h4>
            <p className="text-xs text-[#7A6369] leading-relaxed">
              Every purchase earns Sales Wallet (SW) volume points, qualifying you for 1:1 team matching bonuses.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EFE2DE] space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FDF4F6] text-[#A8435D] flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <h4 className="font-serif text-lg text-[#331B21]">Curated Quality Guarantee</h4>
            <p className="text-xs text-[#7A6369] leading-relaxed">
              Bespoke fashion, wellness products, and smart living essentials verified for durability, comfort, and premium style.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EFE2DE] space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5EF] text-[#0D7A5C] flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="font-serif text-lg text-[#331B21]">India Post Tracked Logistics</h4>
            <p className="text-xs text-[#7A6369] leading-relaxed">
              Every order is dispatched via official India Post tracked parcel logistics with direct postal tracking references.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};
