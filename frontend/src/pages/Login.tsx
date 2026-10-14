import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
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

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/${redirect && redirect !== 'dashboard' ? redirect : 'dashboard'}`, { replace: true });
      }
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser?.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/${redirect && redirect !== 'dashboard' ? redirect : 'dashboard'}`, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Incorrect username or password. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16 flex flex-col justify-center">
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
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-2.5 focus:outline-none focus:border-[#B8586E] text-[#251117]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              placeholder="e.g. admin or rootuser"
            />
          </div>

          <div>
            <label className="text-[#705960] block mb-1 font-medium">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-2.5 focus:outline-none focus:border-[#B8586E] text-[#251117]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 cursor-pointer ${submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            <LogIn size={14} />
          </button>
        </form>

        <div className="border-t border-[#F2E8E5] mt-6 pt-4 text-center text-xs text-[#8C7077]">
          <p className="leading-relaxed">
            <span className="font-semibold text-[#331B21]">New to BuyWay?</span> Registration is by invitation only. Please use the referral link provided by your sponsor.
          </p>
        </div>
      </div>

      {/* Quick Credentials Seeding Prompt helper */}
      {/* <div className="bg-slate-900/30 border border-slate-850 rounded-lg p-3.5 mt-4 text-center text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
        💡 **Demo Accounts**: You can sign in as the root admin using username: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">admin</code> and password: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">admin123</code> or the genealogy root user using username: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">rootuser</code> and password: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">user@root.123</code>.
      </div> */}
    </div>
  );
};
