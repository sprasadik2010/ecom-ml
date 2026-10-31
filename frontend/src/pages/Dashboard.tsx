import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, Award, Users, Share2, Clipboard, ShieldCheck, ShieldAlert, ShoppingBag, Landmark, ArrowRight, Star, Zap, Calendar, CheckCircle2, TrendingUp, Sparkles, Clock, LogOut, UserCog, CreditCard, Eye, EyeOff, Check, AlertCircle, X, Lock, Edit3, Mail, User as UserIcon } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

interface Order {
  id: number;
  total_amount: number;
  total_sw: number;
  status: string;
  created_at: string;
  dispatch_status?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
}

interface RankReward {
  id: number;
  user_id: number;
  level: number;
  level_name: string;
  monthly_amount: number;
  total_months: number;
  months_paid: number;
  status: string;
  created_at: string;
  last_payout_at: string | null;
  next_payout_at: string | null;
}

interface LevelDefinition {
  level: number;
  name: string;
  target_nodes: number;
  target_sw: number;
  monthly_amount: number;
  duration_months: number;
  target_description: string;
}

interface Commission {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const DEFAULT_LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: "Level 1 (Associate)",
    target_nodes: 1,
    target_sw: 100.0,
    monthly_amount: 1000.0,
    duration_months: 2,
    target_description: "Both child nodes reach 100 SW (100 SW each side)"
  },
  {
    level: 2,
    name: "Level 2 (Promoter)",
    target_nodes: 2,
    target_sw: 200.0,
    monthly_amount: 2000.0,
    duration_months: 3,
    target_description: "Any 2 nodes in each side reach 100 SW (200 SW each side)"
  },
  {
    level: 3,
    name: "Level 3 (Team Leader)",
    target_nodes: 4,
    target_sw: 400.0,
    monthly_amount: 5000.0,
    duration_months: 3,
    target_description: "Any 4 nodes in each side reach 100 SW (400 SW each side)"
  },
  {
    level: 4,
    name: "Level 4 (Senior Team Leader)",
    target_nodes: 8,
    target_sw: 800.0,
    monthly_amount: 8000.0,
    duration_months: 4,
    target_description: "Any 8 nodes in each side reach 100 SW (800 SW each side)"
  },
  {
    level: 5,
    name: "Level 5 (Team Manager)",
    target_nodes: 16,
    target_sw: 1600.0,
    monthly_amount: 12500.0,
    duration_months: 4,
    target_description: "Any 16 nodes in each side reach 100 SW (1,600 SW each side)"
  },
  {
    level: 6,
    name: "Level 6 (Senior Team Manager)",
    target_nodes: 32,
    target_sw: 3200.0,
    monthly_amount: 20000.0,
    duration_months: 4,
    target_description: "Any 32 nodes in each side reach 100 SW (3,200 SW each side)"
  },
  {
    level: 7,
    name: "Level 7 (Area Manager)",
    target_nodes: 64,
    target_sw: 6400.0,
    monthly_amount: 40000.0,
    duration_months: 5,
    target_description: "Any 64 nodes in each side reach 100 SW (6,400 SW each side)"
  },
  {
    level: 8,
    name: "Level 8 (Regional Manager)",
    target_nodes: 128,
    target_sw: 12800.0,
    monthly_amount: 70000.0,
    duration_months: 5,
    target_description: "Any 128 nodes in each side reach 100 SW (12,800 SW each side)"
  },
  {
    level: 9,
    name: "Level 9 (Manager)",
    target_nodes: 256,
    target_sw: 25600.0,
    monthly_amount: 100000.0,
    duration_months: 5,
    target_description: "Any 256 nodes in each side reach 100 SW (25,600 SW each side)"
  },
  {
    level: 10,
    name: "Level 10 (Senior Manager)",
    target_nodes: 512,
    target_sw: 51200.0,
    monthly_amount: 100000.0,
    duration_months: 5,
    target_description: "Any 512 nodes in each side reach 100 SW (51,200 SW each side)"
  }
];

const POPULAR_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Federal Bank",
  "IDFC FIRST Bank",
  "Yes Bank",
  "Indian Bank",
  "Central Bank of India"
];

const maskAccountNumber = (acc?: string | null) => {
  if (!acc) return '—';
  if (acc.length <= 4) return acc;
  const last4 = acc.slice(-4);
  const maskedLength = Math.max(acc.length - 4, 4);
  return `${'•'.repeat(maskedLength)} ${last4}`;
};

export const Dashboard: React.FC = () => {
  const { user, token, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<RankReward[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [levelDefs, setLevelDefs] = useState<LevelDefinition[]>(DEFAULT_LEVELS);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [loadingCommissions, setLoadingCommissions] = useState(true);

  // Profile & Bank Details State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formConfirmAccountNumber, setFormConfirmAccountNumber] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formPanNumber, setFormPanNumber] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [copiedBankIfsc, setCopiedBankIfsc] = useState(false);
  const [copiedBankUpi, setCopiedBankUpi] = useState(false);
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);

  const openEditProfile = () => {
    if (!user) return;
    setFormFullName(user.full_name || '');
    setFormPhoneNumber(user.phone_number || '');
    setFormBankName(user.bank_name || '');
    setFormAccountHolder(user.bank_account_holder || user.full_name || '');
    setFormAccountNumber(user.bank_account_number || '');
    setFormConfirmAccountNumber(user.bank_account_number || '');
    setFormIfsc(user.bank_ifsc || '');
    setFormBranch(user.bank_branch || '');
    setFormUpiId(user.upi_id || '');
    setFormPanNumber(user.pan_number || '');
    setFormError('');
    setFormSuccess('');
    setIsEditProfileOpen(true);
  };

  const handleCopyIfsc = () => {
    if (user?.bank_ifsc) {
      navigator.clipboard.writeText(user.bank_ifsc);
      setCopiedBankIfsc(true);
      setTimeout(() => setCopiedBankIfsc(false), 2000);
    }
  };

  const handleCopyUpi = () => {
    if (user?.upi_id) {
      navigator.clipboard.writeText(user.upi_id);
      setCopiedBankUpi(true);
      setTimeout(() => setCopiedBankUpi(false), 2000);
    }
  };

  const handleCopyAcc = () => {
    if (user?.bank_account_number) {
      navigator.clipboard.writeText(user.bank_account_number);
      setCopiedBankAcc(true);
      setTimeout(() => setCopiedBankAcc(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formFullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }

    // If bank account is entered, validate
    if (formAccountNumber.trim() || formConfirmAccountNumber.trim()) {
      if (formAccountNumber.trim() !== formConfirmAccountNumber.trim()) {
        setFormError('Bank Account Number and Confirm Account Number do not match.');
        return;
      }
      if (!formBankName.trim()) {
        setFormError('Please select or enter your Bank Name.');
        return;
      }
      if (!formIfsc.trim()) {
        setFormError('Please enter the Bank IFSC Code.');
        return;
      }
    }

    if (formIfsc.trim() && !/^[A-Z0-9]{4,15}$/i.test(formIfsc.trim())) {
      setFormError('Invalid IFSC Code format. Please enter a valid IFSC code (e.g. HDFC0001234).');
      return;
    }

    if (formUpiId.trim() && !formUpiId.includes('@')) {
      setFormError('Invalid UPI ID. UPI ID must be in format username@bank (e.g. name@okhdfcbank).');
      return;
    }

    if (formPanNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formPanNumber.trim())) {
      setFormError('Invalid PAN format. PAN should be 10 characters (e.g. ABCDE1234F).');
      return;
    }

    try {
      setFormSaving(true);
      await updateProfile({
        full_name: formFullName.trim(),
        phone_number: formPhoneNumber.trim(),
        bank_name: formBankName.trim(),
        bank_account_holder: formAccountHolder.trim() || formFullName.trim(),
        bank_account_number: formAccountNumber.trim(),
        bank_ifsc: formIfsc.trim().toUpperCase(),
        bank_branch: formBranch.trim(),
        upi_id: formUpiId.trim().toLowerCase(),
        pan_number: formPanNumber.trim().toUpperCase(),
      });
      setFormSuccess('Profile and bank payout details saved successfully!');
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setFormSaving(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    } else if (user) {
      document.title = `Welcome, ${user.full_name?.trim() || user.username} | BuyWay Dashboard`;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!token || user?.is_admin) return;

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await fetch(`${API_BASE_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const ordData = await res.json();
          if (isMounted && Array.isArray(ordData)) {
            setOrders(ordData.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard orders:', err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };

    const fetchRewards = async () => {
      try {
        setLoadingRewards(true);
        const res = await fetch(`${API_BASE_URL}/rewards/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const rewData = await res.json();
          if (isMounted && Array.isArray(rewData)) {
            setRewards(rewData);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard rewards:', err);
      } finally {
        if (isMounted) setLoadingRewards(false);
      }
    };

    const fetchCommissions = async () => {
      try {
        setLoadingCommissions(true);
        const res = await fetch(`${API_BASE_URL}/commissions/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const commData = await res.json();
          if (isMounted && Array.isArray(commData)) {
            setCommissions(commData);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard commissions:', err);
      } finally {
        if (isMounted) setLoadingCommissions(false);
      }
    };

    const fetchLevelDefs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/rewards/levels`);
        if (res.ok) {
          const lvlData = await res.json();
          if (isMounted && Array.isArray(lvlData) && lvlData.length > 0) {
            setLevelDefs(lvlData);
          }
        }
      } catch (err) {
        console.error('Error fetching level definitions:', err);
      }
    };

    fetchOrders();
    fetchRewards();
    fetchCommissions();
    fetchLevelDefs();

    return () => {
      isMounted = false;
    };
  }, [token, user?.id, user?.is_admin]);

  if (!user || user.is_admin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading member profile...</p>
      </div>
    );
  }

  const leftReferralLink = `${window.location.origin}/register?token=${user.ref_token_left || ''}`;
  const rightReferralLink = `${window.location.origin}/register?token=${user.ref_token_right || ''}`;

  const handleCopyLeft = () => {
    navigator.clipboard.writeText(leftReferralLink);
    setCopiedLeft(true);
    setTimeout(() => setCopiedLeft(false), 2000);
  };

  const handleCopyRight = () => {
    navigator.clipboard.writeText(rightReferralLink);
    setCopiedRight(true);
    setTimeout(() => setCopiedRight(false), 2000);
  };

  const isActive = user.status === 'active';
  const progressPercent = Math.min((user.personal_sw / 1) * 100, 100);
  const matchedSW = user.total_matched_sw || 0;
  const left100Nodes = user.left_100_nodes || 0;
  const right100Nodes = user.right_100_nodes || 0;
  const matched100Nodes = Math.min(left100Nodes, right100Nodes);

  const nextLevelNumber = Math.min((user.current_level || 0) + 1, 10);
  const nextLevelDef = levelDefs.find(l => l.level === nextLevelNumber) || levelDefs[0];
  const targetNodes = nextLevelDef?.target_nodes || 1;
  const targetSw = nextLevelDef?.target_sw || 100;

  const leftNodeProgress = Math.min((left100Nodes / targetNodes) * 100, 100);
  const rightNodeProgress = Math.min((right100Nodes / targetNodes) * 100, 100);
  const overallProgress = Math.min(leftNodeProgress, rightNodeProgress);

  const getLevelBadgeColor = (lvl: number) => {
    switch (lvl) {
      case 1: return 'from-amber-700 to-amber-500 text-amber-100 border-amber-500/40';
      case 2: return 'from-slate-400 to-slate-200 text-slate-900 border-slate-300';
      case 3: return 'from-yellow-500 to-amber-300 text-slate-950 border-yellow-300';
      case 4: return 'from-cyan-500 to-blue-400 text-slate-950 border-cyan-300';
      case 5: return 'from-purple-500 to-pink-500 text-white border-purple-300';
      case 6: return 'from-blue-600 to-indigo-400 text-white border-blue-400';
      case 7: return 'from-violet-600 to-fuchsia-400 text-white border-violet-400';
      case 8: return 'from-rose-600 to-orange-400 text-white border-rose-400';
      case 9: return 'from-amber-500 to-red-500 text-white border-amber-400';
      case 10: return 'from-emerald-400 via-teal-300 to-amber-300 text-slate-950 border-emerald-300';
      default: return 'from-slate-800 to-slate-700 text-slate-300 border-slate-700';
    }
  };


  const totalMatchingEarned = commissions
    .filter((c) => c.type === 'binary_matching')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalSponsorBonusEarned = commissions
    .filter((c) => c.type === 'sponsor_matching_bonus')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalRankRoyaltyEarned = commissions
    .filter((c) => c.type === 'rank_level_reward')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Banner: Welcome Card */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-xl mb-4 sm:mb-6 shadow-md">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300/40 shrink-0">
            {(user.full_name?.trim() || user.username?.trim() || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">{user.full_name?.trim() || user.username}</span>!
              </h1>
              {user.current_level > 0 && (
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${getLevelBadgeColor(user.current_level)} border shadow-sm flex items-center gap-1.5 shrink-0`}>
                  <Star size={13} className="fill-current" />
                  {user.level_name || `Level ${user.current_level}`}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Welcome to your personal BuyWay dashboard, <span className="text-slate-200 font-semibold">{user.full_name?.trim() || user.username}</span>. Track 1:1 business matching pairs, 5-level sponsor overrides, and progressive monthly royalties.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 flex-wrap font-mono">
              <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">@{user.username}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-sans">{user.email}</span>
              {user.phone_number && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-sans flex items-center gap-1">
                    <span>📞</span>
                    <span>{user.phone_number}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons, Member Status Pill & Sign Out */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap shrink-0">
          <button
            onClick={openEditProfile}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
            title="Edit Profile & Bank Details"
          >
            <UserCog size={15} />
            <span>Edit Profile & Bank</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none">Membership</span>
              <span className={`text-xs font-black mt-0.5 leading-none ${isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                {user.status.toUpperCase()}
              </span>
            </div>
            <div className={`p-1.5 rounded-md border ${
              isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {isActive ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
            title="Sign Out from BuyWay"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Referral Links Card: Next to Welcome Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md mb-8">
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Share2 size={16} className="text-amber-500" />
            Referral Links
          </h3>
          <Link
            to="/tree"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Users size={14} />
            <span className="hidden sm:inline">View Business Tree</span>
            <span className="sm:hidden">Tree</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Left Side Link */}
          <div className="p-3 sm:p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col justify-between">
            <label className="text-[11px] sm:text-xs text-slate-300 font-bold block mb-1.5 text-left truncate">
              Left Side Link
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="text"
                readOnly
                className="bg-slate-900 border border-slate-800 rounded-lg text-[11px] sm:text-xs font-mono text-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0 focus:outline-none select-all text-left"
                value={leftReferralLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLeft}
                className={`p-1.5 sm:p-2.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  copiedLeft ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                }`}
                title="Copy Left Side Link"
              >
                {copiedLeft ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                <span className="text-xs hidden sm:inline">{copiedLeft ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            {copiedLeft && (
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold block mt-1.5 text-left">
                ✓ Copied!
              </span>
            )}
          </div>

          {/* Right Side Link */}
          <div className="p-3 sm:p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col justify-between">
            <label className="text-[11px] sm:text-xs text-slate-300 font-bold block mb-1.5 text-right truncate">
              Right Side Link
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="text"
                readOnly
                className="bg-slate-900 border border-slate-800 rounded-lg text-[11px] sm:text-xs font-mono text-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0 focus:outline-none select-all text-left"
                value={rightReferralLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyRight}
                className={`p-1.5 sm:p-2.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  copiedRight ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                }`}
                title="Copy Right Side Link"
              >
                {copiedRight ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                <span className="text-xs hidden sm:inline">{copiedRight ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            {copiedRight && (
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold block mt-1.5 text-right">
                ✓ Copied!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bank Account & Payout Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Landmark size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  Bank Account & Payout Details
                </h3>
                {user.bank_account_number ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Ready for Payouts
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertCircle size={11} /> Action Needed
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Registered bank account and UPI details used for commission payouts, binary matching bonuses, and monthly royalties.
              </p>
            </div>
          </div>

          <button
            onClick={openEditProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Edit3 size={13} className="text-amber-400" />
            <span>{user.bank_account_number ? 'Update Bank Details' : 'Add Bank Details'}</span>
          </button>
        </div>

        {!user.bank_account_number ? (
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-900/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">No Bank Account Linked Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Please link your bank account (Account Number, IFSC, UPI ID) so your wallet balance, binary matching commissions, and monthly rank royalties can be disbursed directly without delays.
                </p>
              </div>
            </div>
            <button
              onClick={openEditProfile}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shrink-0 shadow-md cursor-pointer transition-colors active:scale-95"
            >
              Add Bank Details Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Bank Name & Branch */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">Bank & Branch</div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={user.bank_name || ''}>
                {user.bank_name || '—'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate" title={user.bank_branch || ''}>
                {user.bank_branch ? `Branch: ${user.bank_branch}` : 'Branch: Not specified'}
              </div>
            </div>

            {/* Account Holder Name */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">Account Holder</div>
              <div className="text-sm font-bold text-slate-100 mt-1 truncate" title={user.bank_account_holder || user.full_name}>
                {user.bank_account_holder || user.full_name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {user.pan_number ? `PAN: ${user.pan_number}` : 'PAN: Not added'}
              </div>
            </div>

            {/* Account Number */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">Account Number</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showAccountNumber ? 'Hide Account Number' : 'Show Account Number'}
                  >
                    {showAccountNumber ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={handleCopyAcc}
                    className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedBankAcc ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
                  </button>
                </div>
              </div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1 tracking-wider">
                {showAccountNumber ? user.bank_account_number : maskAccountNumber(user.bank_account_number)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Savings / Current
              </div>
            </div>

            {/* IFSC & UPI */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">IFSC & UPI ID</span>
                <div className="flex items-center gap-1.5">
                  {user.bank_ifsc && (
                    <button
                      onClick={handleCopyIfsc}
                      className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Copy IFSC Code"
                    >
                      {copiedBankIfsc ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-white mt-1 flex items-center justify-between">
                <span>IFSC: <span className="text-amber-300">{user.bank_ifsc || '—'}</span></span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span className="truncate" title={user.upi_id || ''}>
                  UPI: {user.upi_id ? <span className="text-slate-200 font-mono">{user.upi_id}</span> : 'Not provided'}
                </span>
                {user.upi_id && (
                  <button
                    onClick={handleCopyUpi}
                    className="text-slate-400 hover:text-amber-400 transition-colors ml-1 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedBankUpi ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Warning for Inactive Members */}
      {!isActive && !user.is_admin && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-red-200 mb-1">Your Account is Currently Inactive!</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-2xl font-normal">
              You are currently placed in the business tree but **cannot earn team matching commissions (₹10/SW)** from child leg transactions. Buy products to accumulate at least <span className="text-amber-400 font-bold">1 SW Point</span> to activate your commissions!
            </p>

            {user.pending_sw && user.pending_sw > 0 ? (
              <div className="mt-2.5 px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-md text-[11px] text-amber-300 font-bold flex items-center gap-1.5 max-w-lg">
                <Clock size={13} className="text-amber-400 shrink-0" />
                <span>You have {user.pending_sw} SW pending admin approval. Your account will automatically activate upon administrator approval!</span>
              </div>
            ) : null}

            {/* Progress Bar */}
            <div className="mt-3 max-w-sm">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Personal: {user.personal_sw} / 1 SW {user.pending_sw && user.pending_sw > 0 ? `(+${user.pending_sw} SW Pending)` : ''}</span>
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors self-start md:self-center shrink-0 cursor-pointer"
          >
            Go Shop Now
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Grid: 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Wallet balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Withdrawable Wallet</span>
              <span className="text-2xl font-black text-white font-mono mt-1.5">₹{user.wallet_balance.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Landmark size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>Commission Wallet Balance</span>
            <Link to="/commissions" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">
              Ledger &rarr;
            </Link>
          </div>
        </div>

        {/* Matched SW Points & Node Pairs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Matched Sales Points</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1.5">{matchedSW} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>{matched100Nodes} Matched 100-SW Node{matched100Nodes !== 1 ? 's' : ''}</span>
            <span className="text-emerald-400 font-bold">Earned ₹{(matchedSW * 10 * 0.90).toFixed(0)} Net</span>
          </div>
        </div>

        {/* Left Leg Volume & 100-SW Nodes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Left Leg Volume</span>
              <span className="text-2xl font-black text-slate-200 font-mono mt-1.5">{user.left_leg_sw} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-amber-400 font-bold">{left100Nodes} Node{left100Nodes !== 1 ? 's' : ''} (≥100 SW)</span>
            <span className="text-slate-400">Total: {user.total_left_sw} SW</span>
          </div>
        </div>

        {/* Right Leg Volume & 100-SW Nodes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Right Leg Volume</span>
              <span className="text-2xl font-black text-slate-200 font-mono mt-1.5">{user.right_leg_sw} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-amber-400 font-bold">{right100Nodes} Node{right100Nodes !== 1 ? 's' : ''} (≥100 SW)</span>
            <span className="text-slate-400">Total: {user.total_right_sw} SW</span>
          </div>
        </div>
      </div>

      {/* Recent E-commerce Orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={18} className="text-amber-500" />
            Recent E-commerce Orders
          </h3>
          <Link 
            to="/orders" 
            className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-10 text-center text-slate-500 text-xs">Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2">
            <p className="text-xs">No orders placed yet.</p>
            <Link to="/" className="text-xs text-amber-500 hover:text-amber-400 font-bold transition-colors">
              Shop Products & Get Active
            </Link>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                    <th className="py-3">Order ID</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">SW Volume</th>
                    <th className="py-3 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-200">#00{ord.id}</td>
                      <td className="py-3 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-bold font-mono text-white">₹{ord.total_amount.toFixed(2)}</td>
                      <td className="py-3 text-amber-400 font-bold font-mono">{ord.total_sw} SW</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : ord.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {ord.status === 'completed' && <CheckCircle2 size={10} />}
                          {ord.status === 'pending' && <Clock size={10} />}
                          {ord.status === 'completed' ? 'APPROVED' : ord.status === 'pending' ? 'PENDING APPROVAL' : ord.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {orders.map((ord) => (
                <div 
                  key={ord.id} 
                  className="bg-slate-950/20 border border-slate-850 rounded-xl p-4 shadow-sm hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono font-bold text-slate-200 text-xs">#00{ord.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      ord.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : ord.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {ord.status === 'completed' && <CheckCircle2 size={9} />}
                      {ord.status === 'pending' && <Clock size={9} />}
                      {ord.status === 'completed' ? 'APPROVED' : ord.status === 'pending' ? 'PENDING APPROVAL' : ord.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] font-normal">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Date</span>
                      <span className="text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Amount</span>
                      <span className="font-black font-mono text-white">₹{ord.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">SW Volume</span>
                      <span className="text-amber-400 font-bold font-mono">{ord.total_sw} SW</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2b. Team Earnings & Sponsor Match Bonuses */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Landmark size={18} className="text-amber-500" />
              Team Earnings & Commission Streams
            </h3>
            <p className="text-xs text-slate-400 leading-normal mt-0.5 font-normal">
              1:1 Team Match Bonuses (90% Net), 5-Level Sponsor Overrides (4% Direct, 1% L2-L5), and Monthly Royalties.
            </p>
          </div>
          <Link 
            to="/commissions" 
            className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Full Ledger</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* 3 mini summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">1:1 Team Matching</span>
              <span className="text-base font-black font-mono text-emerald-400">₹{totalMatchingEarned.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-900 text-emerald-400 rounded-md border border-slate-800">
              <Zap size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">5-Level Sponsor Royalty</span>
              <span className="text-base font-black font-mono text-purple-400">₹{totalSponsorBonusEarned.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-900 text-purple-400 rounded-md border border-slate-800">
              <Users size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Rank Royalties</span>
              <span className="text-base font-black font-mono text-amber-400">₹{totalRankRoyaltyEarned.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-900 text-amber-400 rounded-md border border-slate-800">
              <Star size={16} className="fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Recent Transactions list */}
        {loadingCommissions ? (
          <div className="py-6 text-center text-slate-500 text-xs">Loading commission streams...</div>
        ) : commissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-1.5">
            <Landmark size={24} className="text-slate-700 mb-1" />
            <p className="text-xs font-bold text-slate-300">No Commission Earnings Yet</p>
            <p className="text-[11px] text-slate-500">Pair child sales volumes or sponsor active team members to earn matching overrides!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {commissions.slice(0, 5).map((c) => {
              const isRank = c.type === 'rank_level_reward';
              const isMatching = c.type === 'binary_matching';
              const isSponsor = c.type === 'sponsor_matching_bonus';
              return (
                <div key={c.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-slate-800 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded-md shrink-0 border ${
                      isRank ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      isMatching ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      isSponsor ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {isRank && <Star size={13} className="fill-current" />}
                      {isMatching && <Zap size={13} />}
                      {isSponsor && <Users size={13} />}
                      {!isRank && !isMatching && !isSponsor && <IndianRupee size={13} />}
                    </span>
                    <div className="min-w-0 truncate">
                      <p className="text-slate-300 font-medium truncate">{c.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="font-black font-mono text-emerald-400 shrink-0 text-sm">
                    +₹{c.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Active Monthly Royalty Streams */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Active Monthly Royalty Streams
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
            {rewards.length} Stream{rewards.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingRewards ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading royalty streams...</div>
        ) : rewards.length === 0 ? (
          <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2">
            <Award size={32} className="text-slate-700" />
            <p className="text-xs font-bold text-slate-300">No Royalty Streams Active Yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
              Match 100 Sales Points on both legs to unlock your first ₹1,000/month royalty stream!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((rew) => (
              <div key={rew.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        {rew.level_name}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                        ₹{rew.monthly_amount.toFixed(2)} / Month
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rew.status === 'completed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {rew.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-850 mt-3">
                  <span>Progress: <strong className="text-white font-mono">{rew.months_paid} / {rew.total_months} Mo</strong></span>
                  {rew.next_payout_at && rew.status === 'active' && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Calendar size={11} />
                      Next: {new Date(rew.next_payout_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>Matching Rate: <strong>₹10 / Matched SW</strong></span>
          <Link to="/tree" className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1">
            View Business Genealogy &rarr;
          </Link>
        </div>
      </div>

      {/* 4. Upline Placement */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8">
        <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={16} className="text-amber-500" />
          Upline Placement
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-normal">
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block mb-1">Direct Sponsor</span>
            <span className="font-bold text-slate-200 text-sm">
              {user.sponsor_id ? `@${user.sponsor_username || user.sponsor_id}` : 'Root Company Administrator'}
            </span>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block mb-1">Business Tree Parent</span>
            <span className="font-bold text-slate-200 text-sm">
              {user.parent_id ? `@${user.parent_username || user.parent_id}` : 'None (Root Node)'}
            </span>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block mb-1">Placement Side</span>
            <span className="font-bold text-amber-500 capitalize text-sm">
              {user.position ? `${user.position} side` : 'None (Root Node)'}
            </span>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block mb-1">Account Created</span>
            <span className="font-mono text-xs text-slate-300 font-bold">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* 5. 10-Level Royalty Progression Ladder */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-8 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-500" />
              10-Level Royalty Progression Ladder
            </h3>
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-gradient-to-r ${getLevelBadgeColor(user.current_level)} self-start sm:self-auto`}>
              {user.level_name || 'Member (Level 0)'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal mb-5 font-normal">
            For every 1 matching point on Left & Right legs you earn <span className="text-emerald-400 font-bold">₹10</span>. In addition, unlock 10 progressive monthly royalty streams starting at <span className="text-amber-400 font-bold">₹1,000/mo</span> up to <span className="text-amber-400 font-bold">₹5,12,000/mo</span> as your team nodes achieve 100 SW on both sides!
          </p>

          {/* Current Level / Next Milestone Status Box */}
          {user.current_level < 10 ? (
            <div className="bg-slate-950/60 border border-amber-500/40 rounded-lg p-4 mb-5 shadow-sm">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  Target: {nextLevelDef.name}
                </span>
                <span className="font-mono text-amber-400 font-bold text-[11px]">
                  {nextLevelDef.target_description}
                </span>
              </div>

              {/* Dual Leg Node Counter Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-900/80 p-3 rounded-md border border-slate-800">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Left Leg: {left100Nodes} / {targetNodes} Nodes (≥100 SW)</span>
                    <span className={left100Nodes >= targetNodes ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {leftNodeProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        left100Nodes >= targetNodes ? 'bg-emerald-400' : 'bg-amber-500'
                      }`}
                      style={{ width: `${leftNodeProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Right Leg: {right100Nodes} / {targetNodes} Nodes (≥100 SW)</span>
                    <span className={right100Nodes >= targetNodes ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {rightNodeProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        right100Nodes >= targetNodes ? 'bg-emerald-400' : 'bg-amber-500'
                      }`}
                      style={{ width: `${rightNodeProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-850 gap-1">
                <span>
                  Monthly Reward: <strong className="text-emerald-400">₹{nextLevelDef.monthly_amount.toLocaleString('en-IN')}/mo for {nextLevelDef.duration_months} Months</strong> (Total ₹{(nextLevelDef.monthly_amount * nextLevelDef.duration_months).toLocaleString('en-IN')})
                </span>
                {left100Nodes >= targetNodes && right100Nodes >= targetNodes ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Ready for Promotion!
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono text-[10px]">
                    Need {Math.max(0, targetNodes - left100Nodes)}L &bull; {Math.max(0, targetNodes - right100Nodes)}R more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/50 border border-amber-500/30 rounded-lg p-3.5 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm bg-gradient-to-br ${getLevelBadgeColor(user.current_level)} shadow-sm shrink-0`}>
                  L{user.current_level}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.level_name || `Level ${user.current_level}`} Achieved!</span>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    🎉 Highest Team Rank Reached (Senior Manager)!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10-Level Roadmap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {levelDefs.map((lvl) => {
              const isAchieved = (user.current_level || 0) >= lvl.level;
              const isCurrentTarget = (user.current_level || 0) === lvl.level - 1;
              const totalReward = lvl.monthly_amount * lvl.duration_months;

              return (
                <div
                  key={lvl.level}
                  className={`p-3 rounded-lg border transition-all ${
                    isAchieved
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : isCurrentTarget
                      ? 'bg-slate-950/60 border-amber-500/50 shadow-sm shadow-amber-500/5'
                      : 'bg-slate-950/20 border-slate-850 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                          isAchieved
                            ? 'bg-emerald-400 text-slate-950'
                            : isCurrentTarget
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {lvl.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-100 text-xs">{lvl.name}</span>
                          {isAchieved && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Achieved
                            </span>
                          )}
                          {isCurrentTarget && (
                            <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <Zap size={10} /> Current Target
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                          {lvl.target_description}
                        </div>
                        <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                          Target: {lvl.target_nodes} node{lvl.target_nodes > 1 ? 's' : ''} with ≥100 SW on each side ({lvl.target_sw.toLocaleString('en-IN')} SW)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-400 font-mono text-xs block">
                        ₹{lvl.monthly_amount.toLocaleString('en-IN')} / mo
                      </span>
                      <div className="text-[10px] text-slate-400">
                        for {lvl.duration_months} mos
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        (Total ₹{totalReward.toLocaleString('en-IN')})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
          <span>Levels 1 to 10 Royalty Ladder</span>
          <span className="text-amber-400 font-mono font-bold">10 Progressive Ranks</span>
        </div>
      </div>

      {/* Edit Profile & Bank Details Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold">
                  <UserCog size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Edit Profile & Bank Details</h3>
                  <p className="text-xs text-slate-400">Update your personal profile and registered bank account for payouts.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProfile} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Section 1: Personal Profile */}
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-3">
                  <UserIcon size={14} />
                  <span>Personal Profile</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="e.g. Sivaprasad Nair"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Displayed on your dashboard and tree</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formPhoneNumber}
                      onChange={(e) => setFormPhoneNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Primary contact mobile number</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        <span>Email Address</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                        <Lock size={10} /> Locked
                      </span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-lg px-3 py-2 text-slate-400 text-xs cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Tied to your secure account login</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
                      <span>Username</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                        <Lock size={10} /> Locked
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`@${user.username}`}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-lg px-3 py-2 text-amber-400 font-mono text-xs cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Permanent identifier in MLM tree</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Bank & Payout Details */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <Landmark size={14} />
                    <span>Bank Account Details (Used for Payments)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Commission & Royalty Payouts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      list="banksList"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC Bank"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <datalist id="banksList">
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Select or type your bank name</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formAccountHolder}
                      onChange={(e) => setFormAccountHolder(e.target.value)}
                      placeholder="As per bank passbook / cheque"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Full name registered with bank</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Enter account number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Savings or Current account number</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Confirm Account Number
                    </label>
                    <input
                      type="password"
                      value={formConfirmAccountNumber}
                      onChange={(e) => setFormConfirmAccountNumber(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Re-enter account number to verify"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Double check to avoid payment errors</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="e.g. SBIN0001234 or HDFC0000001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">11-character Indian Financial System Code</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Branch Name / Location
                    </label>
                    <input
                      type="text"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      placeholder="e.g. Indiranagar, Bangalore"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Bank branch or city location</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      UPI ID / VPA <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formUpiId}
                      onChange={(e) => setFormUpiId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">For instant UPI payouts if supported</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      PAN Card Number <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formPanNumber}
                      onChange={(e) => setFormPanNumber(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">10-character alphanumeric PAN</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-950/70 border border-slate-850 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
                  <Lock size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Your banking information is safely stored. It will be used exclusively to process your MLM commission payouts, binary matching overrides, and monthly rank royalties.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={formSaving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                >
                  {formSaving ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Details...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
