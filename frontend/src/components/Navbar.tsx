import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut, User as UserIcon, Network, DollarSign, Search, ShieldCheck, Menu, X, Compass, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-700 sticky top-0 z-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      {/* Upper Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
          <span className="text-xl font-extrabold tracking-widest text-amber-500 flex items-center gap-1 uppercase font-sans">
            <span className="text-slate-100">apex</span>zone
          </span>
          <span className="bg-amber-500/10 text-[9px] uppercase font-bold text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
            Network
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg hidden md:flex items-center">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Search for items, clothing, dupattas..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-full pl-5 pr-12 py-2 focus:outline-none focus:border-amber-500 text-xs transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-4 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
            >
              <Search size={15} />
            </button>
          </div>
        </form>

        {/* Action Items */}
        <nav className="flex items-center gap-3 md:gap-4 text-sm font-medium">
          {/* Desktop Links Container */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/" className="text-slate-300 hover:text-amber-500 transition-colors">
              Shop
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-300 hover:text-amber-500 transition-colors">
                  <ShieldCheck size={15} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/tree" className="flex items-center gap-1.5 text-slate-300 hover:text-amber-500 transition-colors">
                  <Network size={15} />
                  <span>Binary Tree</span>
                </Link>
                <Link to="/commissions" className="flex items-center gap-1.5 text-slate-300 hover:text-amber-500 transition-colors">
                  <DollarSign size={15} />
                  <span>Commissions</span>
                </Link>

                {/* Wallet Pill */}
                <div className="bg-slate-950 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                  <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">Wallet:</span>
                  ${user.wallet_balance.toFixed(2)}
                </div>

                {/* User Dropdown/Pill */}
                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <div className="flex flex-col text-right hidden lg:flex">
                    <span className="text-[9px] text-slate-400 font-normal">Hello, {user.full_name.split(' ')[0]}</span>
                    <span className="text-xs font-bold text-slate-200">@{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 bg-slate-950 hover:bg-red-50 text-red-400 border border-slate-800 hover:border-red-400/30 rounded transition-colors"
                    title="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 pl-2">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-amber-500 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-full font-bold transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Cart Icon (Always visible) */}
          <Link to="/cart" className="relative p-2 text-slate-300 hover:text-amber-500 transition-colors flex items-center">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full h-4.5 w-4.5 flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button (Hamburger) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded md:hidden transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-700 px-4 py-4 flex flex-col gap-4 shadow-lg">
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-full px-4 py-2 focus:outline-none focus:border-amber-500 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-4 top-2.5 text-slate-400 hover:text-amber-500 transition-colors"
              >
                <Search size={14} />
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1 text-xs font-semibold">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 bg-slate-950/20 hover:bg-slate-950/50 rounded-md text-slate-300 hover:text-amber-500 transition-colors"
            >
              Shop Catalog
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 bg-slate-950/20 hover:bg-slate-950/50 rounded-md text-slate-300 hover:text-amber-500 flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck size={14} className="text-amber-500" />
                  Dashboard
                </Link>
                <Link
                  to="/tree"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 bg-slate-950/20 hover:bg-slate-950/50 rounded-md text-slate-300 hover:text-amber-500 flex items-center gap-2 transition-colors"
                >
                  <Network size={14} className="text-amber-500" />
                  Binary Tree
                </Link>
                <Link
                  to="/commissions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 bg-slate-950/20 hover:bg-slate-950/50 rounded-md text-slate-300 hover:text-amber-500 flex items-center gap-2 transition-colors"
                >
                  <DollarSign size={14} className="text-amber-500" />
                  Commissions Ledger
                </Link>

                <div className="border-t border-slate-700 my-2" />

                {/* Mobile Wallet & User Pill */}
                <div className="px-3 py-2 bg-slate-950/30 border border-slate-700 rounded-md flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase">Logged in as</span>
                    <span className="font-bold text-slate-200">@{user.username}</span>
                  </div>
                  <div className="bg-slate-950 border border-amber-400/20 px-2.5 py-1 rounded text-amber-400 font-bold font-mono">
                    Wallet: ${user.wallet_balance.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full mt-2 py-2 px-4 bg-red-500/10 hover:bg-red-50 text-red-400 rounded border border-red-200/20 transition-colors text-center font-bold text-xs"
                >
                  Sign Out Account
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2 text-center bg-slate-950 text-slate-300 rounded-full border border-slate-800 font-bold text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold text-xs transition-colors"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-navbar */}
      <div className="bg-slate-950 py-2 px-4 text-xs font-normal border-t border-slate-850 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-slate-350">
          <Link to="/" className="font-bold text-slate-200 flex items-center gap-1 hover:text-amber-500 transition-colors">
            All Products
          </Link>
          <Link to="/?category=Electronics" className="hover:text-amber-500 transition-colors">
            Electronics
          </Link>
          <Link to="/?category=Wellness" className="hover:text-amber-500 transition-colors">
            Wellness
          </Link>
          <Link to="/?category=Apparel" className="hover:text-amber-500 transition-colors">
            Apparel
          </Link>
          <Link to="/?category=Smart%20Home" className="hover:text-amber-500 transition-colors">
            Smart Home
          </Link>
          <div className="ml-auto text-slate-400 flex items-center gap-1.5 font-mono text-[9px]">
            {user && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Referral Link: <span className="text-amber-400">{window.location.origin}/register?ref={user.username}</span></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-700 py-2.5 px-6 flex items-center justify-between z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
          <Home size={18} className={window.location.pathname === '/' && !searchParams.get('category') ? 'text-amber-500' : ''} />
          <span className={`text-[9px] font-bold tracking-wide ${window.location.pathname === '/' && !searchParams.get('category') ? 'text-amber-500' : ''}`}>Home</span>
        </Link>
        <Link to="/?category=Apparel" className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
          <Compass size={18} className={searchParams.get('category') ? 'text-amber-500' : ''} />
          <span className={`text-[9px] font-bold tracking-wide ${searchParams.get('category') ? 'text-amber-500' : ''}`}>Category</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 relative transition-colors">
          <ShoppingCart size={18} className={window.location.pathname === '/cart' ? 'text-amber-500' : ''} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full h-4.5 w-4.5 flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
          <span className={`text-[9px] font-bold tracking-wide ${window.location.pathname === '/cart' ? 'text-amber-500' : ''}`}>Cart</span>
        </Link>
        {user && (
          <Link to="/tree" className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
            <Network size={18} className={window.location.pathname === '/tree' ? 'text-amber-500' : ''} />
            <span className={`text-[9px] font-bold tracking-wide ${window.location.pathname === '/tree' ? 'text-amber-500' : ''}`}>Network</span>
          </Link>
        )}
        <Link to={user ? "/dashboard" : "/login"} className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
          <UserIcon size={18} className={window.location.pathname === '/dashboard' || window.location.pathname === '/login' ? 'text-amber-500' : ''} />
          <span className={`text-[9px] font-bold tracking-wide ${window.location.pathname === '/dashboard' || window.location.pathname === '/login' ? 'text-amber-500' : ''}`}>
            {user ? 'Profile' : 'Profile'}
          </span>
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;
