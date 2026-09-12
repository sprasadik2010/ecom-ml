import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, Award, Users, Share2, Clipboard, ShieldCheck, ShieldAlert, ShoppingBag, Landmark, ArrowRight, Star, Zap, Calendar, CheckCircle2, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

interface Order {
  id: number;
  total_amount: number;
  total_sw: number;
  status: string;
  created_at: string;
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

const DEFAULT_LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: "Level 1 (Bronze Star)",
    target_nodes: 1,
    target_sw: 100.0,
    monthly_amount: 1000.0,
    duration_months: 2,
    target_description: "Both child nodes reach 100 SW (100 SW each side)"
  },
  {
    level: 2,
    name: "Level 2 (Silver Star)",
    target_nodes: 2,
    target_sw: 200.0,
    monthly_amount: 2000.0,
    duration_months: 3,
    target_description: "Any 2 nodes in each side reach 100 SW (200 SW each side)"
  },
  {
    level: 3,
    name: "Level 3 (Gold Star)",
    target_nodes: 4,
    target_sw: 400.0,
    monthly_amount: 4000.0,
    duration_months: 3,
    target_description: "Any 4 nodes in each side reach 100 SW (400 SW each side)"
  },
  {
    level: 4,
    name: "Level 4 (Platinum Star)",
    target_nodes: 8,
    target_sw: 800.0,
    monthly_amount: 8000.0,
    duration_months: 3,
    target_description: "Any 8 nodes in each side reach 100 SW (800 SW each side)"
  },
  {
    level: 5,
    name: "Level 5 (Diamond Star)",
    target_nodes: 16,
    target_sw: 1600.0,
    monthly_amount: 16000.0,
    duration_months: 3,
    target_description: "Any 16 nodes in each side reach 100 SW (1,600 SW each side)"
  },
  {
    level: 6,
    name: "Level 6 (Double Diamond Star)",
    target_nodes: 32,
    target_sw: 3200.0,
    monthly_amount: 32000.0,
    duration_months: 3,
    target_description: "Any 32 nodes in each side reach 100 SW (3,200 SW each side)"
  },
  {
    level: 7,
    name: "Level 7 (Triple Diamond Star)",
    target_nodes: 64,
    target_sw: 6400.0,
    monthly_amount: 64000.0,
    duration_months: 3,
    target_description: "Any 64 nodes in each side reach 100 SW (6,400 SW each side)"
  },
  {
    level: 8,
    name: "Level 8 (Crown Diamond Star)",
    target_nodes: 128,
    target_sw: 12800.0,
    monthly_amount: 128000.0,
    duration_months: 3,
    target_description: "Any 128 nodes in each side reach 100 SW (12,800 SW each side)"
  },
  {
    level: 9,
    name: "Level 9 (Royal Crown Diamond)",
    target_nodes: 256,
    target_sw: 25600.0,
    monthly_amount: 256000.0,
    duration_months: 3,
    target_description: "Any 256 nodes in each side reach 100 SW (25,600 SW each side)"
  },
  {
    level: 10,
    name: "Level 10 (Crown Ambassador)",
    target_nodes: 512,
    target_sw: 51200.0,
    monthly_amount: 512000.0,
    duration_months: 3,
    target_description: "Any 512 nodes in each side reach 100 SW (51,200 SW each side)"
  }
];

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<RankReward[]>([]);
  const [levelDefs, setLevelDefs] = useState<LevelDefinition[]>(DEFAULT_LEVELS);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchOrdersAndRewards = async () => {
      if (!token || user?.is_admin) return;
      try {
        const [ordRes, rewRes, lvlRes] = await Promise.all([
          fetch(`${API_BASE_URL}/orders/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/rewards/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/rewards/levels`).catch(() => null),
        ]);

        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.slice(0, 5));
        }
        if (rewRes.ok) {
          const rewData = await rewRes.json();
          setRewards(rewData);
        }
        if (lvlRes && lvlRes.ok) {
          const lvlData = await lvlRes.json();
          if (Array.isArray(lvlData) && lvlData.length > 0) {
            setLevelDefs(lvlData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrdersAndRewards();
  }, [token, user]);

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
  const progressPercent = Math.min((user.personal_sw / 50) * 100, 100);
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


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner: Welcome, Rank & Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl mb-8 shadow-md">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-white">Hello, {user.full_name}!</h1>
            {user.current_level > 0 && (
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${getLevelBadgeColor(user.current_level)} border shadow-sm flex items-center gap-1.5`}>
                <Star size={13} className="fill-current" />
                {user.level_name || `Level ${user.current_level}`}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">Welcome to your network dashboard. Track 1:1 business matching pairs and progressive monthly royalties.</p>
        </div>

        {/* Member Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider leading-none">Membership</span>
            <span className={`text-sm font-black mt-1 leading-none ${isActive ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`}>
              {user.status.toUpperCase()} MEMBER
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${
            isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {isActive ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
        </div>
      </div>

      {/* Conditional Warning for Inactive Members */}
      {!isActive && !user.is_admin && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-red-200 mb-1">Your Account is Currently Inactive!</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-2xl font-normal">
              You are currently placed in the business network tree but **cannot earn team matching commissions (₹10/SW)** from child leg transactions. Buy products to accumulate at least <span className="text-amber-400 font-bold">50 SW Points</span> to activate your commissions!
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
                <span>Personal: {user.personal_sw} / 50 SW {user.pending_sw && user.pending_sw > 0 ? `(+${user.pending_sw} SW Pending)` : ''}</span>
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
            <span className="text-emerald-400 font-bold">Earned ₹{(matchedSW * 10).toFixed(0)}</span>
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

      {/* Rank Progression & Royalty Streams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left: Rank & Milestone Ladder Progress (All 10 Levels) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-500" />
                10-Level Royalty Progression Ladder
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-gradient-to-r ${getLevelBadgeColor(user.current_level)}`}>
                {user.level_name || 'Member (Level 0)'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-normal mb-5 font-normal">
              For every 1 matching point on Left & Right legs you earn <span className="text-emerald-400 font-bold">₹10</span>. In addition, unlock 10 progressive monthly royalty streams starting at <span className="text-amber-400 font-bold">₹1,000/mo</span> up to <span className="text-amber-400 font-bold">₹5,12,000/mo</span> as your binary network nodes achieve 100 SW on both sides!
            </p>

            {/* Current Level / Next Milestone Status Box */}
            {user.current_level < 10 ? (
              <div className="bg-slate-950/60 border border-amber-500/40 rounded-lg p-4 mb-4 shadow-sm">
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
                <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-900/80 p-2.5 rounded-md border border-slate-800">
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

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-850">
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
              <div className="bg-slate-950/50 border border-amber-500/30 rounded-lg p-3.5 mb-4 flex items-center justify-between gap-3">
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
                      🎉 Highest Network Rank Reached (Crown Ambassador)!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 10-Level Roadmap Table */}
            <div className="space-y-2 text-xs max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
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

          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>Levels 1 to 10 Royalty Ladder</span>
            <span className="text-amber-400 font-mono font-bold">10 Progressive Ranks</span>
          </div>
        </div>


        {/* Right: Active Monthly Royalty Stream Cards */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Active Monthly Royalty Streams
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                {rewards.length} Stream{rewards.length !== 1 ? 's' : ''}
              </span>
            </div>

            {rewards.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2">
                <Award size={32} className="text-slate-700" />
                <p className="text-xs font-bold text-slate-300">No Royalty Streams Active Yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
                  Match 100 Sales Points on both legs to unlock your first ₹1,000/month royalty stream!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map((rew) => (
                  <div key={rew.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
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

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-850">
                      <span>Progress: <strong className="text-white font-mono">{rew.months_paid} / {rew.total_months} Months Paid</strong></span>
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
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
            <span>Matching Rate: <strong>₹10 / Matched SW</strong></span>
            <Link to="/tree" className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1">
              View Business Genealogy &rarr;
            </Link>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Referral code & Upline info or Admin panel overview */}
        <div className="lg:col-span-4 space-y-6">
          {user.is_admin ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-rose-500" />
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-rose-500" />
                Administrator Mode
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal mb-4 font-normal">
                You are logged in as the System Administrator. You have full system privileges to audit sales, adjust wallets, edit categories, and manage products.
              </p>
              <Link
                to="/admin"
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-slate-950 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Go to Admin Panel
              </Link>
            </div>
          ) : (
            <>
              {/* Referral link box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                  <Share2 size={16} className="text-amber-500" />
                  Referral Links
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal mb-4 font-normal">
                  Share your signed referral links. Placement side is secured and verified by the system tree.
                </p>
                
                <div className="space-y-4">
                  {/* Left Link */}
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Left Leg Placement Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        className="bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300 px-2.5 py-2 flex-1 focus:outline-none"
                        value={leftReferralLink}
                      />
                      <button
                        onClick={handleCopyLeft}
                        className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded transition-colors active:scale-95 cursor-pointer"
                        title="Copy Left link"
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                    {copiedLeft && <span className="text-[10px] text-emerald-400 font-bold block mt-1">Left link copied!</span>}
                  </div>

                  {/* Right Link */}
                  <div>
                    <label className="text-[9px] text-slate-505 uppercase font-black block mb-1">Right Leg Placement Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        className="bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300 px-2.5 py-2 flex-1 focus:outline-none"
                        value={rightReferralLink}
                      />
                      <button
                        onClick={handleCopyRight}
                        className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-955 rounded transition-colors active:scale-95 cursor-pointer"
                        title="Copy Right link"
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                    {copiedRight && <span className="text-[10px] text-emerald-400 font-bold block mt-1">Right link copied!</span>}
                  </div>
                </div>

                <div className="border-t border-slate-850 my-4" />

                <Link
                  to="/tree"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users size={14} />
                  View Business Tree
                </Link>
              </div>

              {/* Placement Details Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4">Upline Placement</h3>
                
                <div className="divide-y divide-slate-850 text-xs font-normal">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Direct Sponsor</span>
                    <span className="font-bold text-slate-200">
                      {user.sponsor_id ? `@${user.sponsor_username || user.sponsor_id}` : 'Root Company Administrator'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Business Tree Parent</span>
                    <span className="font-bold text-slate-200">
                      {user.parent_id ? `@${user.parent_username || user.parent_id}` : 'None (Root Node)'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Placement Side</span>
                    <span className="font-bold text-amber-500 capitalize">
                      {user.position ? `${user.position} side` : 'None (Root Node)'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Account Created</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Recent Orders Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
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
        </div>
      </div>
    </div>
  );
};
