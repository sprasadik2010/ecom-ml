import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../context/CartContext';
import { API_BASE_URL } from '../context/AuthContext';
import { ShoppingBag, Tag, Compass } from 'lucide-react';

export const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  // Search query & category from URL params
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';

  const [activeCategory, setActiveCategory] = useState(categoryQuery);

  useEffect(() => {
    setActiveCategory(categoryQuery);
  }, [categoryQuery]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
          throw new Error('Failed to load products');
        }
        const data = await response.json();
        setAllProducts(data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Error connecting to API server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    let filtered = allProducts;

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setProducts(filtered);
  }, [allProducts, activeCategory, searchQuery]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const categoriesList = [
    { name: '', label: 'All Items', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=120&h=120&q=80' },
    ...categories.map((c) => ({
      name: c.name,
      label: c.name,
      img: c.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&h=120&q=80'
    }))
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 sm:pb-8">
      {/* Hero Promotional Banner */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FCEAE7] to-[#F3DFDB] border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[200px]">
        {/* Banner Details */}
        <div className="flex-1 space-y-3 z-10 text-center sm:text-left">
          <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#9F1239] bg-white px-3 py-1 rounded-full border border-[#9F1239]/10">
            New Collection
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
            Elegance In Every Thread
          </h1>
          <p className="text-xs text-slate-450 max-w-sm font-normal">
            Discover premium quality Indian ethnic suits, dupattas, and curated accessories for every occasion.
          </p>
          <button 
            onClick={() => setActiveCategory('Apparel')}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full text-xs font-bold transition-all shadow-md shadow-[#9F1239]/20 hover:scale-[1.02] cursor-pointer"
          >
            Shop Apparel Now
          </button>
        </div>

        {/* Right decoration */}
        <div className="flex-1 w-full max-w-[280px] h-[160px] relative z-10 hidden md:block">
          <div className="absolute inset-0 bg-contain bg-right bg-no-repeat opacity-95 transition-transform duration-500 hover:scale-105" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80")' }} />
        </div>
      </div>

      {/* Categories Selector */}
      <div className="mb-8">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Compass size={14} className="text-amber-500" />
          Top Categories
        </h3>
        <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {categoriesList.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center p-0.5 transition-all ${
                activeCategory === cat.name
                  ? 'border-[#9F1239] shadow-md shadow-[#9F1239]/10'
                  : 'border-slate-800 group-hover:border-slate-650'
              }`}>
                <img 
                  src={cat.img} 
                  alt={cat.label} 
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <span className={`text-[10px] font-bold tracking-wide transition-colors ${
                activeCategory === cat.name ? 'text-amber-500 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold">Loading product catalog...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900 rounded-lg p-6 text-center max-w-xl mx-auto my-12">
          <p className="text-red-400 font-semibold mb-2">Failed to load product list</p>
          <p className="text-slate-400 text-xs mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-md text-xs font-bold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg">
          <ShoppingBag size={48} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-lg mb-1">No products found</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery ? `We couldn't find matches for "${searchQuery}"` : 'There are no products in this category.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} className="text-amber-500" />
              {activeCategory || 'Best Selling'} ({products.length})
            </h2>
            <span className="text-[10px] text-amber-500 hover:underline cursor-pointer font-bold uppercase tracking-wider">
              View All
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
