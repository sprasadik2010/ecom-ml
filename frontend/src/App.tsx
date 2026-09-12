import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Header Navigation */}
            <Navbar />

            {/* Main Page Content */}
            <main className="flex-1 bg-slate-950">
              <Routes>
                {/* Public Store routes (Admins redirect to /admin) */}
                <Route path="/" element={<StoreRoute><Home /></StoreRoute>} />
                <Route path="/products/:id" element={<StoreRoute><ProductDetails /></StoreRoute>} />
                <Route path="/cart" element={<StoreRoute><Cart /></StoreRoute>} />
                
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

                {/* Protected MLM Member routes (Admins redirect to /admin) */}
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
            <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4">
                <p className="font-bold text-slate-400">ApexZone E-Commerce & Business MLM Selling Network</p>
                <p className="mt-1">© {new Date().getFullYear()} ApexZone. All rights reserved. Simulated Sandboxed MLM Tree.</p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
