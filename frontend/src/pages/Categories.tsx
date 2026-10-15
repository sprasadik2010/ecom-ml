import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Sparkles, FolderOpen } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

interface CategoryItem {
  id: number;
  name: string;
  image_url?: string;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

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

        {/* Categories Grid or Clean Empty State */}
        {categories.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-[#EFE2DE] text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-[#FDF2F5] text-[#A8435D] rounded-2xl mx-auto flex items-center justify-center">
              <FolderOpen size={32} />
            </div>
            <h3 className="font-serif text-xl text-[#331B21] font-semibold">No Categories Yet</h3>
            <p className="text-xs text-[#7A6369] leading-relaxed">
              Categories added from the admin panel will appear here. You can explore all available products directly in the shop.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs transition-all shadow-sm"
            >
              <span>Explore All Products</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((cat, idx) => {
              const pastelColors = ['#FDE4E8', '#FCE4D6', '#E2EFE4', '#EFE2F5', '#DEF0FB', '#FEF2D8', '#FCE4EC'];
              const bgHex = pastelColors[idx % pastelColors.length];
              return (
                <div
                  key={cat.id || idx}
                  className="bg-white rounded-3xl p-6 border border-[#EFE2DE] shadow-xs hover:shadow-lg hover:border-[#E8D0D6] transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual Icon Halo */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="w-20 h-20 rounded-2xl p-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner overflow-hidden"
                        style={{ backgroundColor: bgHex }}
                      >
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Sparkles size={28} className="text-[#A8435D]" />
                        )}
                      </div>
                      <span className="px-3 py-1 bg-[#FDF4F6] text-[#A8435D] text-[11px] font-bold rounded-full border border-[#F4D5DD]">
                        Collection
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-[#331B21] font-semibold mb-2 group-hover:text-[#B8586E] transition-colors">
                      {cat.name}
                    </h3>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-4 border-t border-[#F2E8E5] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#9E868D]">View Catalog</span>
                    <Link
                      to={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A8435D] group-hover:gap-2.5 transition-all"
                    >
                      <span>Explore Items</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
