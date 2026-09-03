import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../context/AuthContext';
import { IndianRupee, Landmark, ArrowRight, Award, Compass, HelpCircle, Star, Sparkles, Zap } from 'lucide-react';

interface Commission {
  id: number;
  amount: number;
  type: 'direct_referral' | 'binary_matching' | 'rank_level_reward' | 'admin_adjustment';
  description: string;
  created_at: string;
}

export const Commissions: React.FC = () => {
  const { user, token } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!token) return;
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
  }, [token]);

  if (!user) {
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

  const totalRankRewards = commissions
    .filter((c) => c.type === 'rank_level_reward')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOther = commissions
    .filter((c) => c.type !== 'binary_matching' && c.type !== 'rank_level_reward')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalEarned = totalMatching + totalRankRewards + totalOther;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black text-white">Commissions Ledger</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Review your network earnings. Track your ₹10/SW 1:1 matching bonuses and progressive level monthly royalties in real-time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <span>Binary Matching + Level Royalties</span>
            <span className="font-bold text-amber-500">100% Paid</span>
          </div>
        </div>

        {/* Binary Matching Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">1:1 Binary Match Bonus</span>
              <div className="text-2xl font-black text-slate-200 font-mono mt-1.5">₹{totalMatching.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>₹10 per Matched Sales Point</span>
            <span className="font-mono">{commissions.filter(c => c.type === 'binary_matching').length} Matches</span>
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
            <span>₹1,000 to ₹10,000 / mo Streams</span>
            <span className="font-mono">{commissions.filter(c => c.type === 'rank_level_reward').length} Payouts</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Compass size={18} className="text-amber-500" />
          Earnings Ledger Statement
        </h3>

        {loading ? (
          <div className="py-10 text-center text-slate-500 text-xs">Loading ledger transaction logs...</div>
        ) : commissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2.5">
            <HelpCircle size={36} className="text-slate-700" />
            <h4 className="font-bold text-slate-300 text-xs">No Commission Transactions Found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
              Activate your account by making a purchase, share your referral link, and wait for leg matching events to process!
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
                  {commissions.map((comm) => {
                    const isRank = comm.type === 'rank_level_reward';
                    const isMatching = comm.type === 'binary_matching';
                    return (
                      <tr key={comm.id} className="hover:bg-slate-950/20 transition-colors font-normal text-slate-300">
                        <td className="py-3.5 font-mono font-bold text-slate-400">#TXN{1000 + comm.id}</td>
                        <td className="py-3.5 text-slate-400">{new Date(comm.created_at).toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isRank
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : isMatching
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {isRank ? 'Rank Royalty' : isMatching ? 'Binary Match' : comm.type.replace('_', ' ')}
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
              {commissions.map((comm) => (
                <div 
                  key={comm.id} 
                  className="bg-slate-950/20 border border-slate-850 rounded-xl p-4 shadow-sm hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono font-bold text-slate-400 text-xs">#TXN{1000 + comm.id}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      comm.type === 'rank_level_reward'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : comm.type === 'binary_matching'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {comm.type === 'rank_level_reward' ? 'Rank Royalty' : comm.type === 'binary_matching' ? 'Binary Match' : comm.type.replace('_', ' ')}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
