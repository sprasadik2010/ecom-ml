import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldAlert, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sponsorUsername, setSponsorUsername] = useState('');
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [token, setToken] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasUsers, setHasUsers] = useState<boolean>(true); // default to true to be safe
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if there are users in the system to determine if sponsor is required
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/has-users`);
        if (response.ok) {
          const data = await response.json();
          setHasUsers(data.has_users);
        }
      } catch (err) {
        console.error('Failed to check if users exist:', err);
      }
    };
    checkUsers();
  }, []);

  // Pre-populate sponsor and position from encrypted referral link URL parameter
  useEffect(() => {
    const urlToken = searchParams.get('token') || '';
    
    if (urlToken) {
      setToken(urlToken);
      const verifyLink = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/auth/verify-referral?token=${encodeURIComponent(urlToken)}`
          );
          if (!response.ok) {
            const errData = await response.json();
            setError(errData.detail || 'Invalid or tampered referral link. Positioning cannot be changed.');
            setIsLinkInvalid(true);
          } else {
            const data = await response.json();
            setSponsorUsername(data.sponsor);
            setPosition(data.position);
            setIsLinkInvalid(false);
          }
        } catch (err) {
          console.error('Failed to verify referral link:', err);
          setError('Failed to connect to verification server. Please reload the page.');
        }
      };
      verifyLink();
    } else {
      // Without token, direct registration is disallowed when network has users
      setToken('');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLinkInvalid) {
      setError('Cannot submit. The referral link is tampered or invalid.');
      return;
    }

    if (hasUsers) {
      if (!token.trim()) {
        setError('A valid encrypted referral link is required. Direct registration is disabled.');
        return;
      }
      if (!sponsorUsername.trim()) {
        setError('Referral sponsor username is required.');
        return;
      }
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setError('Username cannot contain spaces.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain lowercase letters, numbers, and underscores.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }

    setSubmitting(true);

    try {
      await register(cleanUsername, email, password, fullName, phoneNumber, sponsorUsername, position, token);
      setSuccess(true);
      setSubmitting(false);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Check if username/email is taken or sponsor is correct.');
      setSubmitting(false);
    }
  };

  // 1. Success state
  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-emerald-500" />
          
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20 inline-block">
            <CheckCircle2 size={48} className="animate-bounce" />
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">Registration Successful!</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Congratulations! You have been successfully placed in the business network tree under your sponsor leg. Your status starts as <span className="text-red-400 font-bold">Inactive</span>. To activate your account and start earning network commissions, please log in and buy products!
          </p>

          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  // 2. Gatekeeper: Missing or empty referral link
  if (hasUsers && !token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-amber-500" />
          
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4 border border-amber-500/20 inline-block">
            <ShieldAlert size={44} />
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">Referral Link Required</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Registration in the business network is strictly by referral link. Please use a <span className="text-amber-400 font-bold">Left Leg</span> or <span className="text-amber-400 font-bold">Right Leg</span> referral link provided by your sponsor.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Sign In to Existing Account
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-md font-bold text-xs flex items-center justify-center transition-colors border border-slate-800"
            >
              Explore Store Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Gatekeeper: Tampered or invalid referral link
  if (isLinkInvalid) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center text-center">
        <div className="bg-slate-900 border border-red-900 rounded-lg p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-red-500" />
          
          <div className="p-3 bg-red-500/10 text-red-400 rounded-full mb-4 border border-red-500/20 inline-block">
            <ShieldAlert size={44} />
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">Invalid Referral Link</h2>
          <p className="text-red-300 text-xs leading-relaxed mb-6">
            {error || 'This referral link is invalid or expired. Please ask your sponsor for a new Left or Right referral link.'}
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-md font-bold text-xs flex items-center justify-center transition-colors border border-slate-700"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-amber-500" />

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
            Create Member Account
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Join the business selling network and activate commissions
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-3.5 rounded-md mb-5 font-semibold flex items-start gap-2 leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
          {/* Verified Sponsor & Position Banner */}
          {sponsorUsername && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-md text-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-500 block">Sponsor</span>
                  <span className="font-bold text-slate-100">@{sponsorUsername}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-500 block">Placement</span>
                  <span className="font-bold text-slate-100 capitalize">{position} Leg</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 border-t border-amber-500/20 pt-1.5 leading-normal">
                🔒 Placement verified by encrypted sponsor invitation link.
              </p>
            </div>
          )}

          <div className="border-t border-slate-850 my-4" />

          {/* Personal Info */}
          <div>
            <label className="text-slate-400 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Username (min. 3 characters)</label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="choose_username"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, ''))}
              disabled={submitting}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Minimum 3 characters. Only letters, numbers, and underscores allowed (no spaces).
            </p>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password (min. 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ''))}
              disabled={submitting}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Minimum 6 characters without spaces.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || isLinkInvalid}
            className={`w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              submitting || isLinkInvalid ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {submitting ? 'Creating member...' : 'Register'}
            <UserPlus size={14} />
          </button>
        </form>

        <div className="border-t border-slate-850 mt-6 pt-4 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-amber-500 hover:text-amber-400 font-bold transition-colors inline-flex items-center gap-0.5"
          >
            <ArrowLeft size={12} /> Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
