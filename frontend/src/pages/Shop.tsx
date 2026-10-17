import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../context/CartContext';
import { API_BASE_URL } from '../context/AuthContext';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface CategoryOption {
  name: string;
  label: string;
}

export const Shop: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([
    { name: '', label: 'All Products' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'sw-desc'>('featured');
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCatalogData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`)
        ]);

        let prods: Product[] = [];
        if (prodRes.ok) {
          prods = await prodRes.json();
          setAllProducts(prods);
        }

        let backendCats: { name: string }[] = [];
        if (catRes.ok) {
          backendCats = await catRes.json();
        }

        // Gather real categories from backend table and from real product records
        const uniqueCatMap = new Map<string, string>();
        for (const c of backendCats) {
          if (c.name && c.name.trim()) {
            uniqueCatMap.set(c.name.trim().toLowerCase(), c.name.trim());
          }
        }
        for (const p of prods) {
          if (p.category && p.category.trim()) {
            uniqueCatMap.set(p.category.trim().toLowerCase(), p.category.trim());
          }
        }

        const realCategoriesList: CategoryOption[] = [
          { name: '', label: 'All Products' },
          ...Array.from(uniqueCatMap.values()).map(catName => ({
            name: catName,
            label: catName
          }))
        ];

        setCategories(realCategoriesList);
        setError('');
      } catch (err: any) {
        console.error('Error loading catalog data:', err);
        setError(err.message || 'Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogData();
  }, []);

  useEffect(() => {
    let result = [...allProducts];

    // Filter by Category
    if (categoryQuery) {
      result = result.filter(p =>
        p.category && (
          p.category.toLowerCase().includes(categoryQuery.toLowerCase()) ||
          categoryQuery.toLowerCase().includes(p.category.toLowerCase())
        )
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.product_code && p.product_code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'sw-desc') {
      result.sort((a, b) => (b.sw || 0) - (a.sw || 0));
    }

    setFilteredProducts(result);
  }, [allProducts, categoryQuery, searchQuery, sortBy]);

  const handleCategoryClick = (catName: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catName) {
      nextParams.set('category', catName);
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim());
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setSortBy('featured');
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6369]">
          <Link to="/" className="hover:text-[#A8435D] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#331B21]">Shop Catalog</span>
          {categoryQuery && (
            <>
              <ChevronRight size={13} />
              <span className="text-[#A8435D] font-bold">{categoryQuery}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EFE2DE] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8435D] block mb-1">
              Buyway Catalog
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl text-[#331B21] font-normal">
              {categoryQuery ? `${categoryQuery} Collection` : 'All Products'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6369] mt-1.5 max-w-xl">
              Explore curated premium products. Every order generates direct Sales Wallet (SW) volume points for your direct-selling team.
            </p>
          </div>

          <div className="text-xs text-[#8C7077] font-medium shrink-0">
            Showing <span className="font-bold text-[#331B21]">{filteredProducts.length}</span> items
          </div>
        </div>

        {/* Controls: Search Bar & Sorting */}
        <div className="bg-white p-4 rounded-2xl border border-[#EFE2DE] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search products by title, keyword, or brand..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-[#251117] rounded-full pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-[#B8586E]"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-[#9E868D]" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('search');
                  setSearchParams(nextParams);
                }}
                className="absolute right-3.5 top-3 text-[#9E868D] hover:text-[#331B21]"
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-[#61494F]">
              <ArrowUpDown size={14} className="text-[#A8435D]" />
              <span className="font-semibold">Sort By:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#331B21] font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#B8586E] cursor-pointer"
            >
              <option value="featured">Featured / Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="sw-desc">Highest SW Points</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isSelected = (!cat.name && !categoryQuery) || (cat.name === categoryQuery);
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#B8586E] text-white shadow-sm shadow-[#B8586E]/20'
                    : 'bg-white border border-[#EFE2DE] text-[#4A343A] hover:bg-[#FDF4F6] hover:text-[#A8435D]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active Filters Display */}
        {(categoryQuery || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-[#8C7077] font-medium">Applied Filters:</span>
            {categoryQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDF4F6] text-[#A8435D] border border-[#F4D5DD] rounded-full text-xs font-bold">
                <span>Category: {categoryQuery}</span>
                <button onClick={() => handleCategoryClick('')} className="hover:opacity-70">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDF4F6] text-[#A8435D] border border-[#F4D5DD] rounded-full text-xs font-bold">
                <span>Search: "{searchQuery}"</span>
                <button
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('search');
                    setSearchParams(next);
                  }}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#8C3A4D] hover:underline font-bold ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#EFE2DE] animate-pulse space-y-3">
                <div className="aspect-[3/4] bg-[#FAF7F2] rounded-xl" />
                <div className="h-4 bg-[#F2E8E4] rounded w-3/4" />
                <div className="h-3 bg-[#F2E8E4] rounded w-1/2" />
                <div className="h-8 bg-[#F2E8E4] rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 border border-red-200 text-center space-y-2">
            <p className="text-red-500 font-bold text-sm">Error: {error}</p>
            <p className="text-xs text-[#7A6369]">Make sure the backend API server is running on port 8000.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 border border-[#EFE2DE] text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-[#FDF4F6] text-[#B8586E] rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-serif text-xl text-[#331B21]">No Products Found</h3>
            <p className="text-xs text-[#7A6369] max-w-md mx-auto">
              We couldn't find any products matching your selected category or search filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
