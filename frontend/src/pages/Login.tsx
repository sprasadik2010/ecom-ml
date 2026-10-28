import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import bwLogo from '../assets/bwLogo.jpeg';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // If already authenticated, redirect to dashboard (or /admin for admin)
  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser?.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Incorrect username or password. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16 min-h-[calc(100dvh-12rem)] flex flex-col justify-center">
      <div className="bg-white border border-[#EFE2DE] rounded-2xl p-5 sm:p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#B8586E]" />

        <div className="text-center mb-6">
          <img src={bwLogo} alt="BuyWay" className="h-12 w-auto mx-auto mb-3 object-contain rounded" />
          <h2 className="font-serif text-2xl text-[#331B21] font-normal tracking-tight flex items-center justify-center gap-1">
            Sign In to BuyWay
          </h2>
          <p className="text-[#7A6369] text-xs mt-1">
            Access your store and team account
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-3.5 rounded-md mb-5 font-semibold flex items-start gap-2 leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
          <div>
            <label className="text-[#705960] block mb-1 font-medium">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              placeholder="e.g. admin or rootuser"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#705960] font-medium">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#B8586E] hover:text-[#A1455B] font-semibold transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B8586E]/20 cursor-pointer ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            <LogIn size={15} />
          </button>
        </form>

        <div className="border-t border-[#F2E8E5] mt-6 pt-4 text-center text-xs text-[#8C7077] space-y-2">
          <p className="leading-relaxed">
            <span className="font-semibold text-[#331B21]">New to BuyWay?</span> Registration is by invitation only. Please use the referral link provided by your sponsor.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs">
            <Link
              to="/"
              className="text-[#B8586E] hover:text-[#A1455B] font-bold transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Return to Store
            </Link>
            <Link
              to="/contact"
              className="text-[#7A6369] hover:text-[#331B21] transition-colors"
            >
              Need Support?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
