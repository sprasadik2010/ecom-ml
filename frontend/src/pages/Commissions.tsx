import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../context/AuthContext';
import { IndianRupee, Landmark, ArrowRight, Award, Compass, HelpCircle, Star, Sparkles, Zap, Users, Filter } from 'lucide-react';

interface Commission {
  id: number;
  amount: number;
  type: 'direct_referral' | 'binary_matching' | 'rank_level_reward' | 'admin_adjustment' | 'sponsor_matching_bonus';
  description: string;
  created_at: string;
}

type FilterType = 'all' | 'binary_matching' | 'sponsor_matching_bonus' | 'rank_level_reward';

export const Commissions: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!token || user?.is_admin) return;
      try {
        const response = await fetch(`${API_BASE_URL}/commissions/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCommissions(data);
        }
      } catch (error) {
        console.error('Error fetching commissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [token, user]);

  if (!user || user.is_admin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Authenticating commissions access...</p>
      </div>
    );
  }

  // Calculate totals
  const totalMatching = commissions
    .filter((c) => c.type === 'binary_matching')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalSponsorBonus = commissions
    .filter((c) => c.type === 'sponsor_matching_bonus')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalRankRewards = commissions
    .filter((c) => c.type === 'rank_level_reward')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOther = commissions
    .filter((c) => c.type !== 'binary_matching' && c.type !== 'rank_level_reward' && c.type !== 'sponsor_matching_bonus')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalEarned = totalMatching + totalSponsorBonus + totalRankRewards + totalOther;

  const filteredCommissions = commissions.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.type === activeFilter;
  });

  const getCommissionBadge = (type: string) => {
    switch (type) {
      case 'rank_level_reward':
        return {
          label: 'Rank Royalty',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Star size={11} className="fill-amber-400 text-amber-400" />
        };
      case 'binary_matching':
        return {
          label: 'Business Match',
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Zap size={11} />
        };
      case 'sponsor_matching_bonus':
        return {
          label: '4-Level Sponsor Bonus',
          classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Users size={11} />
        };
      case 'direct_referral':
        return {
          label: 'Direct Referral',
          classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: null
        };
      default:
        return {
          label: type.replace(/_/g, ' '),
          classes: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: null
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black text-white">Commissions Ledger</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Review your network earnings. Track your 1:1 matching bonuses (with 10% auto-deduction: 2% TDA + 8% 4-level sponsor distribution), sponsor matching overrides, and progressive level monthly royalties in real-time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Earned */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Lifetime Earnings</span>
              <div className="text-2xl font-black text-white font-mono mt-1.5">₹{totalEarned.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>All Network Income Streams</span>
            <span className="font-bold text-amber-500">100% Paid</span>
          </div>
        </div>

        {/* Business Matching Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">1:1 Team Match Bonus</span>
              <div className="text-2xl font-black text-slate-200 font-mono mt-1.5">₹{totalMatching.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>₹10/SW (90% Net After 10% Cut)</span>
            <span className="font-mono">{commissions.filter(c => c.type === 'binary_matching').length} Matches</span>
          </div>
        </div>

        {/* 4-Level Sponsor Bonus Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">4-Level Sponsor Royalty</span>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1.5">₹{totalSponsorBonus.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-purple-400 rounded-lg border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>2% per Level (Up to 4 Levels)</span>
            <span className="font-mono">{commissions.filter(c => c.type === 'sponsor_matching_bonus').length} Bonuses</span>
          </div>
        </div>

        {/* Rank Royalty Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Rank Monthly Royalties</span>
              <div className="text-2xl font-black text-slate-200 font-mono mt-1.5">₹{totalRankRewards.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Star size={20} className="fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>₹1,000 to ₹5,12,000 / mo</span>
            <span className="font-mono">{commissions.filter(c => c.type === 'rank_level_reward').length} Payouts</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Compass size={18} className="text-amber-500" />
            Earnings Ledger Statement
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              All ({commissions.length})
            </button>
            <button
              onClick={() => setActiveFilter('binary_matching')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'binary_matching'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-emerald-400'
              }`}
            >
              <Zap size={12} />
              Team Match ({commissions.filter(c => c.type === 'binary_matching').length})
            </button>
            <button
              onClick={() => setActiveFilter('sponsor_matching_bonus')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'sponsor_matching_bonus'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-purple-400'
              }`}
            >
              <Users size={12} />
              Sponsor Bonus ({commissions.filter(c => c.type === 'sponsor_matching_bonus').length})
            </button>
            <button
              onClick={() => setActiveFilter('rank_level_reward')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'rank_level_reward'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-amber-400'
              }`}
            >
              <Star size={12} />
              Rank Royalty ({commissions.filter(c => c.type === 'rank_level_reward').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500 text-xs">Loading ledger transaction logs...</div>
        ) : filteredCommissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2.5">
            <HelpCircle size={36} className="text-slate-700" />
            <h4 className="font-bold text-slate-300 text-xs">No Commission Transactions Found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
              {activeFilter === 'all'
                ? 'Activate your account by making a purchase, share your referral link, and wait for leg matching and sponsor events to process!'
                : `No transactions found for the selected filter '${activeFilter.replace(/_/g, ' ')}'.`}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                    <th className="py-3">Transaction</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Description</th>
                    <th className="py-3 text-right">Credit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredCommissions.map((comm) => {
                    const badge = getCommissionBadge(comm.type);
                    return (
                      <tr key={comm.id} className="hover:bg-slate-950/20 transition-colors font-normal text-slate-300">
                        <td className="py-3.5 font-mono font-bold text-slate-400">#TXN{1000 + comm.id}</td>
                        <td className="py-3.5 text-slate-400">{new Date(comm.created_at).toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badge.classes}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300 max-w-md pr-4">{comm.description}</td>
                        <td className="py-3.5 text-right font-black font-mono text-emerald-400">+₹{comm.amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {filteredCommissions.map((comm) => {
                const badge = getCommissionBadge(comm.type);
                return (
                  <div 
                    key={comm.id} 
                    className="bg-slate-950/20 border border-slate-850 rounded-xl p-4 shadow-sm hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono font-bold text-slate-400 text-xs">#TXN{1000 + comm.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badge.classes}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-[11px] font-normal text-slate-400">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Date</span>
                        <span>{new Date(comm.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col pt-1.5 border-t border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Description</span>
                        <span className="text-slate-300 leading-normal">{comm.description}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Credit Amount</span>
                        <span className="font-black font-mono text-sm text-emerald-400">+₹{comm.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

