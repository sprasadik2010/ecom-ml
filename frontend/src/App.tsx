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
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  
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
  
  return <>{children}</>;
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
                {/* Public Store routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                
                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Checkout route */}
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected MLM Member routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tree" 
                  element={
                    <ProtectedRoute>
                      <TreePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/commissions" 
                  element={
                    <ProtectedRoute>
                      <Commissions />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4">
                <p className="font-bold text-slate-400">ApexZone E-Commerce & Binary MLM Selling Network</p>
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
