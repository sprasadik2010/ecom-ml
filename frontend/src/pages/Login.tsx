import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || 'dashboard';

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      navigate(`/${redirect === 'dashboard' ? 'dashboard' : redirect}`);
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      // Success redirection is handled by the useEffect above
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Incorrect username or password. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-amber-500" />
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
            Sign In
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Access your e-commerce panel and MLM downline stats
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
            <label className="text-slate-400 block mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            <LogIn size={14} />
          </button>
        </form>

        <div className="border-t border-slate-850 mt-6 pt-4 text-center text-xs text-slate-500">
          <span>New to the network? </span>
          <Link
            to={`/register?redirect=${redirect}`}
            className="text-amber-500 hover:text-amber-400 font-bold transition-colors inline-flex items-center gap-0.5"
          >
            Register Here <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      
      {/* Quick Credentials Seeding Prompt helper */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-lg p-3.5 mt-4 text-center text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
        💡 **Demo Accounts**: You can sign in as the root admin using username: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">admin</code> and password: <code className="text-amber-500/80 font-bold font-mono bg-slate-950 px-1 py-0.5 rounded">admin123</code>.
      </div>
    </div>
  );
};
