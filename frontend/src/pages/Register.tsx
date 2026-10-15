import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldAlert, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import bwLogo from '../assets/bwLogo.jpeg';

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
      // Without token, direct registration is disallowed when team has users
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
      <div className="max-w-md mx-auto px-4 py-8 sm:py-16 min-h-[calc(100dvh-12rem)] flex flex-col justify-center text-center">
        <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#0D7A5C]" />
          
          <div className="p-3 bg-[#E8F5EF] text-[#0D7A5C] rounded-full mb-4 border border-[#C5E9D7] inline-block">
            <CheckCircle2 size={44} className="animate-bounce" />
          </div>
          
          <h2 className="font-serif text-2xl text-[#331B21] font-normal mb-2">Registration Successful!</h2>
          <p className="text-[#7A6369] text-xs leading-relaxed mb-6">
            Congratulations! You have been successfully placed in the business tree under your sponsor leg. Your status starts as <span className="text-[#B91C1C] font-bold">Inactive</span>. To activate your account and start earning team commissions, please log in and buy products!
          </p>

          <Link
            to="/login"
            className="w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95"
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
      <div className="max-w-md mx-auto px-4 py-8 sm:py-16 min-h-[calc(100dvh-12rem)] flex flex-col justify-center text-center">
        <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#B8586E]" />
          
          <div className="p-3 bg-[#FAF2E8] text-[#C07718] rounded-full mb-4 border border-[#F4E1CA] inline-block">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="font-serif text-2xl text-[#331B21] font-normal mb-2">Referral Link Required</h2>
          <p className="text-[#7A6369] text-xs leading-relaxed mb-6">
            Registration in BuyWay is strictly by referral invitation. Please use a <span className="text-[#C07718] font-bold">Left Leg</span> or <span className="text-[#C07718] font-bold">Right Leg</span> referral link provided by your sponsor.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95"
            >
              Sign In to Existing Account
            </Link>
            <Link
              to="/"
              className="w-full min-h-[42px] py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F2E8E5] text-[#4A343A] rounded-full font-bold text-xs flex items-center justify-center transition-all border border-[#E8D7DC]"
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
      <div className="max-w-md mx-auto px-4 py-8 sm:py-16 min-h-[calc(100dvh-12rem)] flex flex-col justify-center text-center">
        <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#B91C1C]" />
          
          <div className="p-3 bg-[#FDF2F2] text-[#B91C1C] rounded-full mb-4 border border-[#FAD1D1] inline-block">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="font-serif text-2xl text-[#331B21] font-normal mb-2">Invalid Referral Link</h2>
          <p className="text-[#B91C1C] text-xs leading-relaxed mb-6 font-medium">
            {error || 'This referral link is invalid or expired. Please ask your sponsor for a new Left or Right referral link.'}
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95"
            >
              Go to Sign In
            </Link>
            <Link
              to="/"
              className="w-full min-h-[42px] py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F2E8E5] text-[#4A343A] rounded-full font-bold text-xs flex items-center justify-center transition-all border border-[#E8D7DC]"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-12 min-h-[calc(100dvh-12rem)] flex flex-col justify-center">
      <div className="bg-white border border-[#EFE2DE] rounded-2xl p-5 sm:p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#B8586E]" />

        <div className="text-center mb-6">
          <img src={bwLogo} alt="BuyWay" className="h-12 w-auto mx-auto mb-3 object-contain rounded" />
          <h2 className="font-serif text-2xl text-[#331B21] font-normal tracking-tight flex items-center justify-center gap-1">
            Create Member Account
          </h2>
          <p className="text-[#7A6369] text-xs mt-1">
            Join BuyWay direct selling and activate commissions
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
            <div className="bg-[#FAF2E8] border border-[#F4E1CA] p-3.5 rounded-xl text-[#331B21]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C6B3D] block">Sponsor</span>
                  <span className="font-bold text-[#331B21] text-xs">@{sponsorUsername}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8C6B3D] block">Placement</span>
                  <span className="font-bold text-[#C07718] capitalize text-xs">{position} Leg</span>
                </div>
              </div>
              <p className="text-[10px] text-[#7A6369] mt-2 border-t border-[#F4E1CA] pt-1.5 leading-normal">
                🔒 Placement verified by encrypted sponsor invitation link.
              </p>
            </div>
          )}

          {/* Personal Info */}
          <div>
            <label className="text-[#705960] block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-[#705960] block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-[#705960] block mb-1 font-medium">Username (min. 3 characters)</label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="choose_username"
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, ''))}
              disabled={submitting}
            />
            <p className="text-[10px] text-[#8C7077] mt-1">
              Minimum 3 characters. Only lowercase letters, numbers, and underscores allowed.
            </p>
          </div>

          <div>
            <label className="text-[#705960] block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-[#705960] block mb-1 font-medium">Password (min. 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ''))}
              disabled={submitting}
            />
            <p className="text-[10px] text-[#8C7077] mt-1">
              Minimum 6 characters without spaces.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || isLinkInvalid}
            className={`w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B8586E]/20 cursor-pointer ${
              submitting || isLinkInvalid ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {submitting ? 'Creating member...' : 'Register'}
            <UserPlus size={15} />
          </button>
        </form>

        <div className="border-t border-[#F2E8E5] mt-6 pt-4 text-center text-xs text-[#8C7077] flex items-center justify-between">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="text-[#B8586E] hover:text-[#A1455B] font-bold transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
