import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { TreePage } from './pages/TreePage';
import { Commissions } from './pages/Commissions';
import { Orders } from './pages/Orders';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminPanel } from './pages/AdminPanel';
import { ReturnPolicy } from './pages/ReturnPolicy';
import { Shop } from './pages/Shop';
import { Categories } from './pages/Categories';
import { About } from './pages/About';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import bwLogo from './assets/bwLogo.jpeg';

// Protected Route for authenticated members (Admins are redirected to /admin)
const MemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold font-mono">Authenticating session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Store / Public Route (Admins are redirected to /admin)
const StoreRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold font-mono">Verifying administrative authorization...</p>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Catch-all Fallback Redirection
const CatchAllRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user?.is_admin ? "/admin" : "/"} replace />;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#FAF7F2] text-[#251117] flex flex-col">
            {/* Header Navigation */}
            <Navbar />

            {/* Main Page Content */}
            <main className="flex-1 bg-[#FAF7F2]">
              <Routes>
                {/* Dedicated Public Store routes (Admins redirect to /admin) */}
                <Route path="/" element={<StoreRoute><Home /></StoreRoute>} />
                <Route path="/shop" element={<StoreRoute><Shop /></StoreRoute>} />
                <Route path="/categories" element={<StoreRoute><Categories /></StoreRoute>} />
                <Route path="/about" element={<StoreRoute><About /></StoreRoute>} />
                <Route path="/blog" element={<StoreRoute><Blog /></StoreRoute>} />
                <Route path="/contact" element={<StoreRoute><Contact /></StoreRoute>} />
                <Route path="/products/:id" element={<StoreRoute><ProductDetails /></StoreRoute>} />
                <Route path="/cart" element={<StoreRoute><Cart /></StoreRoute>} />
                <Route path="/return-policy" element={<StoreRoute><ReturnPolicy /></StoreRoute>} />

                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<StoreRoute><Register /></StoreRoute>} />

                {/* Protected Checkout route */}
                <Route
                  path="/checkout"
                  element={
                    <MemberRoute>
                      <Checkout />
                    </MemberRoute>
                  }
                />

                {/* Protected Member routes (Admins redirect to /admin) */}
                <Route
                  path="/dashboard"
                  element={
                    <MemberRoute>
                      <Dashboard />
                    </MemberRoute>
                  }
                />
                <Route
                  path="/tree"
                  element={
                    <MemberRoute>
                      <TreePage />
                    </MemberRoute>
                  }
                />
                <Route
                  path="/commissions"
                  element={
                    <MemberRoute>
                      <Commissions />
                    </MemberRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <MemberRoute>
                      <Orders />
                    </MemberRoute>
                  }
                />

                {/* Protected Admin Control routes */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />

                {/* Catch-all Redirect */}
                <Route path="*" element={<CatchAllRoute />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-[#EFE2DE] py-8 sm:py-12 text-xs text-[#705960]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 pb-8 sm:pb-10 border-b border-[#F2E8E5]">
                  <div className="space-y-3">
                    <img src={bwLogo} alt="Buyway - Shop, Earn, Grow" className="h-10 w-auto object-contain rounded" />
                    <p className="text-xs text-[#7A6369] leading-relaxed">
                      Discover trendy collections and experience transparent rewards with direct selling volume.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-serif text-sm text-[#331B21] font-semibold mb-3">Pages & Explore</h5>
                    <ul className="space-y-2">
                      <li><Link to="/shop" className="hover:text-[#A8435D] transition-colors">Shop Catalog</Link></li>
                      <li><Link to="/categories" className="hover:text-[#A8435D] transition-colors">Categories</Link></li>
                      <li><Link to="/about" className="hover:text-[#A8435D] transition-colors">About Buyway</Link></li>
                      <li><Link to="/blog" className="hover:text-[#A8435D] transition-colors">Blog & Insights</Link></li>
                      <li><Link to="/contact" className="hover:text-[#A8435D] transition-colors">Contact Support</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-serif text-sm text-[#331B21] font-semibold mb-3">Logistics & Trust</h5>
                    <ul className="space-y-2">
                      <li><span className="text-[#8C7077]">Tracked Courier Dispatch</span></li>
                      <li><span className="text-[#8C7077]">Instant UPI Verification</span></li>
                      <li><Link to="/return-policy" className="hover:text-[#A8435D] text-[#8C2E42] font-semibold transition-colors underline decoration-[#B8586E]/40">3-Day Damage Return Policy</Link></li>
                      <li><Link to="/contact" className="hover:text-[#A8435D] transition-colors text-[#8C7077]">Support: 24/7 Helpline</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9E868D]">
                  <p>© {new Date().getFullYear()} Buyway E-Commerce. All rights reserved.</p>
                  <p className="font-script text-lg text-[#8C3A4D]">Shop, Earn, Grow ♡</p>
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
