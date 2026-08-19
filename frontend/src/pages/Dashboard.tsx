import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { DollarSign, Award, Users, Share2, Clipboard, ShieldCheck, ShieldAlert, ShoppingBag, Landmark, ArrowRight, UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

interface Order {
  id: number;
  total_amount: number;
  total_sw: number;
  status: string;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.slice(0, 5)); // Keep top 5 recent orders
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading member profile...</p>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${user.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = user.status === 'active';
  const progressPercent = Math.min((user.personal_sw / 50) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner: Welcome & Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl mb-8 shadow-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Hello, {user.full_name}!</h1>
          <p className="text-slate-400 text-xs mt-0.5">Welcome to your network dashboard. Monitor your volumes and team growth.</p>
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
      {!isActive && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-red-200 mb-1">Your Account is Currently Inactive!</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-2xl font-normal">
              You are currently placed in the binary tree but **cannot earn network commission matchings** from child leg transactions. Buy products to accumulate at least <span className="text-amber-400 font-bold">50 SW Points</span> to activate your commissions dashboard!
            </p>
            {/* Progress Bar */}
            <div className="mt-3 max-w-sm">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Personal: {user.personal_sw} / 50 SW</span>
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
              <span className="text-2xl font-black text-white font-mono mt-1.5">${user.wallet_balance.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Landmark size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>Commission Wallet Balance</span>
            <Link to="/commissions" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">
              Ledger
            </Link>
          </div>
        </div>

        {/* Personal SW */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Personal SW</span>
              <span className="text-2xl font-black text-white font-mono mt-1.5">{user.personal_sw} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
            <span>Own purchases accumulated</span>
            <span className="text-emerald-400 font-bold">{isActive ? 'Activated' : 'Inactive'}</span>
          </div>
        </div>

        {/* Left Leg Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Left Leg unmatched</span>
              <span className="text-2xl font-black text-slate-200 font-mono mt-1.5">{user.left_leg_sw} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Lifetime: {user.total_left_sw} SW</span>
            <span>Left Branch</span>
          </div>
        </div>

        {/* Right Leg Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Right Leg unmatched</span>
              <span className="text-2xl font-black text-slate-200 font-mono mt-1.5">{user.right_leg_sw} SW</span>
            </div>
            <div className="p-2 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Lifetime: {user.total_right_sw} SW</span>
            <span>Right Branch</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Referral code & Upline info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Referral link box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Share2 size={16} className="text-amber-500" />
              Referral Link
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-4 font-normal">
              Share your custom registration referral link. Direct recruits are auto-positioned down your binary tree legs!
            </p>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                className="bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300 px-2.5 py-2 flex-1 focus:outline-none"
                value={referralLink}
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded transition-colors active:scale-95 cursor-pointer"
                title="Copy link"
              >
                <Clipboard size={14} />
              </button>
            </div>
            {copied && <span className="text-[10px] text-emerald-400 font-bold block mt-1">Copied to clipboard!</span>}

            <div className="border-t border-slate-850 my-4" />

            <Link
              to="/tree"
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Users size={14} />
              View Binary downline
            </Link>
          </div>

          {/* Placement Details Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4">Upline Placement</h3>
            
            <div className="divide-y divide-slate-850 text-xs font-normal">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Direct Sponsor</span>
                <span className="font-bold text-slate-200">
                  {user.sponsor_id ? '@upline_sponsor' : 'Root Company Administrator'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Binary Tree Parent</span>
                <span className="font-bold text-slate-200">
                  {user.parent_id ? '@parent_placement' : 'None (Root Node)'}
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
        </div>

        {/* Right Side: Recent Orders Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-500" />
              Recent E-commerce Orders
            </h3>

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
              <div className="overflow-x-auto">
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
                        <td className="py-3 font-bold font-mono text-white">${ord.total_amount.toFixed(2)}</td>
                        <td className="py-3 text-amber-400 font-bold font-mono">{ord.total_sw} SW</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {ord.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
