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

  // Pre-populate sponsor and position from URL query params (referrals or visual tree clicks!)
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
      const urlSponsor = searchParams.get('sponsor') || searchParams.get('ref') || '';
      const urlPosition = searchParams.get('position') || 'left';
      if (urlSponsor) {
        setSponsorUsername(urlSponsor);
      }
      if (urlPosition === 'left' || urlPosition === 'right') {
        setPosition(urlPosition);
      }
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
      if (!sponsorUsername.trim()) {
        setError('Referral sponsor username is required.');
        return;
      }
      if (!token.trim()) {
        setError('A valid encrypted referral link is required. You cannot register directly without one.');
        return;
      }
    }

    setSubmitting(true);

    try {
      await register(username, email, password, fullName, phoneNumber, sponsorUsername, position, token);
      setSuccess(true);
      setSubmitting(false);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Check if username/email is taken or sponsor is correct.');
      setSubmitting(false);
    }
  };

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
            Congratulations! You have been successfully placed in the binary tree under your sponsor leg. Your status starts as <span className="text-red-400 font-bold">Inactive</span>. To activate your account and start earning network commissions, please log in and buy products!
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

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-amber-500" />

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
            Create Member Account
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Join the binary selling network and activate commissions
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-3.5 rounded-md mb-5 font-semibold flex items-start gap-2 leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
          {/* Sponsor Username */}
          <div className="bg-slate-950/40 p-3 rounded border border-slate-850">
            <label className="text-amber-500 font-bold block mb-1">Referral Sponsor Username</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed"
              value={sponsorUsername}
              onChange={(e) => setSponsorUsername(e.target.value)}
              disabled={submitting || (hasUsers && !!searchParams.get('token'))}
              placeholder="Sponsor username (e.g. rootuser)"
              required={hasUsers}
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              {hasUsers
                ? 'Referral sponsor is required to place you in the network tree.'
                : 'Leave blank if you are the root genealogy user (first user). Otherwise, a sponsor is required.'}
            </p>
          </div>

          {/* Position Choice */}
          {sponsorUsername && (
            <div className="bg-slate-950/20 p-3 rounded border border-slate-850">
              <label className="text-slate-400 block mb-1.5 font-bold">Placement Leg Position</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-2 rounded border select-none transition-colors ${
                  position === 'left' 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' 
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                } ${token ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="position"
                    className="hidden"
                    value="left"
                    checked={position === 'left'}
                    onChange={() => setPosition('left')}
                    disabled={!!token || submitting}
                  />
                  Left Leg
                </label>
                <label className={`flex items-center justify-center gap-2 p-2 rounded border select-none transition-colors ${
                  position === 'right' 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' 
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                } ${token ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="position"
                    className="hidden"
                    value="right"
                    checked={position === 'right'}
                    onChange={() => setPosition('right')}
                    disabled={!!token || submitting}
                  />
                  Right Leg
                </label>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">
                {token 
                  ? '🔒 Placement is locked by the sponsor referral link.' 
                  : `💡 **Spillover**: Placement is search-traverse down the extreme ${position} leg of the sponsor tree.`}
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
            <label className="text-slate-400 block mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="choose_username"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={submitting}
            />
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
            <label className="text-slate-400 block mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none focus:border-amber-500 text-slate-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
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
