import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  LogOut,
  User as UserIcon,
  Search,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  GitFork,
  IndianRupee,
  Layers,
  Heart,
  Phone,
  Info,
  BookOpen
} from 'lucide-react';
import bwLogo from '../assets/bwLogo.jpeg';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    'Fashion',
    'Beauty & Personal Care',
    'Home & Living',
    'Accessories',
    'Electronics',
    'Kids & Baby'
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          const names = data.map((c: any) => c.name);
          if (names.length > 0) {
            setCategories(names);
          }
        }
      } catch (e) {
        // Fallback already preset
      }
    };
    fetchCategories();
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isHomeActive = location.pathname === '/';
  const isShopActive = location.pathname === '/shop';
  const isCategoriesActive = location.pathname === '/categories';
  const isAboutActive = location.pathname === '/about';
  const isBlogActive = location.pathname === '/blog';
  const isContactActive = location.pathname === '/contact';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#F0E4E7] sticky top-0 z-50 shadow-[0_2px_15px_rgba(168,67,93,0.03)]">
      {/* Top Navbar Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo (Matches mockup) */}
        <Link
          to={user?.is_admin ? "/admin" : "/"}
          className="flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0"
        >
          <img
            src={bwLogo}
            alt="Buyway - Shop, Earn, Grow"
            className="h-9 sm:h-11 md:h-12 w-auto object-contain rounded"
          />
        </Link>

        {/* Center Navigation Links (Matches mockup) */}
        <nav className="hidden lg:flex items-center gap-8 text-[13.5px] font-medium text-[#4A343A]">
          <Link
            to="/"
            className={`transition-colors relative py-1 ${
              isHomeActive
                ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                : 'hover:text-[#A8435D]'
            }`}
          >
            Home
          </Link>

          <Link
            to="/shop"
            className={`transition-colors relative py-1 ${
              isShopActive
                ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                : 'hover:text-[#A8435D]'
            }`}
          >
            Shop
          </Link>

          {/* Categories Dropdown & Link */}
          <div className="relative" ref={categoriesRef}>
            <div className="flex items-center gap-1">
              <Link
                to="/categories"
                className={`transition-colors relative py-1 ${
                  isCategoriesActive
                    ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                    : 'hover:text-[#A8435D]'
                }`}
              >
                Categories
              </Link>
              <button
                type="button"
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="hover:text-[#A8435D] transition-colors py-1 cursor-pointer"
                title="Expand categories"
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isCategoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#EFE2DE] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9E868D] border-b border-[#F7EFE8] flex items-center justify-between">
                  <span>Browse Categories</span>
                  <Link to="/categories" onClick={() => setIsCategoriesOpen(false)} className="text-[#A8435D] hover:underline text-[9px] font-bold">
                    View All
                  </Link>
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setIsCategoriesOpen(false);
                      navigate(`/shop?category=${encodeURIComponent(cat)}`);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium transition-colors flex items-center justify-between"
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/about"
            className={`transition-colors relative py-1 ${
              isAboutActive
                ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                : 'hover:text-[#A8435D]'
            }`}
          >
            About Us
          </Link>

          <Link
            to="/blog"
            className={`transition-colors relative py-1 ${
              isBlogActive
                ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                : 'hover:text-[#A8435D]'
            }`}
          >
            Blog
          </Link>

          <Link
            to="/contact"
            className={`transition-colors relative py-1 ${
              isContactActive
                ? 'text-[#A8435D] font-bold border-b-2 border-[#A8435D]'
                : 'hover:text-[#A8435D]'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Right Action Icons (Matches mockup: Search, User, Cart) */}
        <div className="flex items-center gap-2 sm:gap-4 text-[#331B21]">
          {/* Admin badge link if admin */}
          {user?.is_admin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF2F5] hover:bg-[#FAE4EB] text-[#A8435D] border border-[#F4D5DD] rounded-full text-xs font-bold transition-all"
            >
              <ShieldCheck size={14} />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* 1. Search Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#4A343A] hover:text-[#A8435D] hover:bg-[#FDF4F6] rounded-full transition-colors cursor-pointer"
              title="Search products"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            {/* Expandable Search Input Popover */}
            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white border border-[#EFE2DE] rounded-2xl shadow-xl p-3 z-50">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search trendy products..."
                    className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-[#251117] rounded-full pl-4 pr-10 py-2 text-xs focus:outline-none focus:border-[#B8586E]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 text-[#705960] hover:text-[#A8435D] cursor-pointer"
                  >
                    <Search size={15} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 2. User Account Icon */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 text-[#4A343A] hover:text-[#A8435D] hover:bg-[#FDF4F6] rounded-full transition-colors cursor-pointer"
              title="My Account"
              aria-label="Account"
            >
              <UserIcon size={20} />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 bg-white border border-[#EFE2DE] rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-[#F7EFE8]">
                      <div className="text-[11px] text-[#8C7077] font-normal">Signed in as</div>
                      <div className="font-bold text-[#331B21] text-xs truncate">@{user.username}</div>
                      <div className="text-[10px] text-[#A8435D] font-medium">{user.full_name}</div>
                      
                      {!user.is_admin && (
                        <div className="mt-2 bg-[#FAF2E8] border border-[#F4E1CA] px-2.5 py-1 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-[#C07718]">
                          <span className="text-[10px] font-sans text-[#8C6B3D]">Wallet:</span>
                          <span>₹{user.wallet_balance?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      {user.is_admin ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium"
                        >
                          <ShieldCheck size={14} className="text-[#A8435D]" />
                          <span>Admin Control Center</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium"
                          >
                            <ShoppingBag size={14} />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium"
                          >
                            <ShieldCheck size={14} />
                            <span>Member Dashboard</span>
                          </Link>
                          <Link
                            to="/tree"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium"
                          >
                            <GitFork size={14} />
                            <span>Binary Network Tree</span>
                          </Link>
                          <Link
                            to="/commissions"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#331B21] hover:bg-[#FDF4F6] hover:text-[#A8435D] font-medium"
                          >
                            <IndianRupee size={14} />
                            <span>Commissions & SW</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-[#F7EFE8] pt-1 mt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-[#B91C1C] hover:bg-[#FDF2F2] font-semibold cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    <div className="text-center pb-2 border-b border-[#F7EFE8]">
                      <div className="text-xs font-bold text-[#331B21]">Welcome to BuyWay</div>
                      <div className="text-[10px] text-[#8C7077]">Sign in to shop, earn, and grow</div>
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full block py-2 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white text-center rounded-full font-bold text-xs shadow-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full block py-2 px-4 border border-[#E8D7DC] text-[#4A343A] hover:bg-[#FAF7F2] text-center rounded-full font-bold text-xs"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Shopping Cart Icon with Rose Badge (Matches mockup) */}
          <Link
            to="/cart"
            className="p-2 text-[#4A343A] hover:text-[#A8435D] hover:bg-[#FDF4F6] rounded-full transition-colors relative"
            title="Shopping Cart"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            <span className="absolute top-1 right-1 bg-[#D97788] text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          </Link>

          {/* 4. Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#4A343A] hover:text-[#A8435D] lg:hidden rounded-full hover:bg-[#FDF4F6] transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#F0E4E7] px-5 py-5 space-y-4 shadow-xl">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search trendy products..."
              className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-[#251117] rounded-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-[#B8586E]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3.5 text-[#705960] hover:text-[#A8435D]"
            >
              <Search size={15} />
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-2.5 text-sm font-medium text-[#4A343A] border-b border-[#F7EFE8] pb-4">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Shop All Products
            </Link>
            <Link
              to="/categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Categories
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              About Us
            </Link>
            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Blog
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Contact Support
            </Link>
            <Link
              to="/return-policy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-lg hover:bg-[#FDF4F6] hover:text-[#A8435D]"
            >
              Return Policy
            </Link>
          </nav>

          {/* Member Links in Drawer */}
          {user ? (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#331B21]">Account (@{user.username})</div>
              {user.is_admin ? (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 bg-[#FDF2F5] text-[#A8435D] rounded-lg text-xs font-bold"
                >
                  Admin Center
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 bg-[#FAF7F2] rounded-lg text-center font-medium hover:bg-[#FDF4F6] hover:text-[#A8435D]"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 bg-[#FAF7F2] rounded-lg text-center font-medium hover:bg-[#FDF4F6] hover:text-[#A8435D]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/tree"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 bg-[#FAF7F2] rounded-lg text-center font-medium hover:bg-[#FDF4F6] hover:text-[#A8435D]"
                  >
                    Binary Tree
                  </Link>
                  <Link
                    to="/commissions"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 bg-[#FAF7F2] rounded-lg text-center font-medium hover:bg-[#FDF4F6] hover:text-[#A8435D]"
                  >
                    Commissions
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-2 py-2 px-3 bg-[#FDF2F2] text-[#B91C1C] rounded-lg text-xs font-bold text-center"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2 text-center bg-[#B8586E] text-white rounded-full text-xs font-bold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2 text-center border border-[#E8D7DC] text-[#4A343A] rounded-full text-xs font-bold"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
