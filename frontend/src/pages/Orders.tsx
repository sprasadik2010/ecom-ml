import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  IndianRupee, 
  Award, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Filter,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';

interface ProductInfo {
  id: number;
  name: string;
  description?: string;
  price: number;
  sw: number;
  image_url?: string;
  category?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  sw: number;
  product: ProductInfo;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  total_sw: number;
  status: 'pending' | 'completed' | 'cancelled' | string;
  created_at: string;
  items: OrderItem[];
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'cancelled';

export const Orders: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token || user?.is_admin) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load orders history.');
        }

        const data: Order[] = await res.json();
        setOrders(data);
        
        // Auto-expand all orders by default for convenience
        const initialExpanded: Record<number, boolean> = {};
        data.forEach((o) => {
          initialExpanded[o.id] = true;
        });
        setExpandedOrders(initialExpanded);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Error loading orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, user]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!user || user.is_admin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Authenticating session...</p>
      </div>
    );
  }

  // Summary statistics calculations
  const totalOrdersCount = orders.length;
  const totalAmountSpent = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const totalCompletedSW = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_sw, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingSW = orders
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + o.total_sw, 0);

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const orderIdMatch = `#${order.id}`.includes(query) || order.id.toString().includes(query);
    const itemMatch = order.items?.some(
      (item) => 
        item.product?.name?.toLowerCase().includes(query) ||
        item.product?.category?.toLowerCase().includes(query)
    );

    return orderIdMatch || itemMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">My E-commerce Orders</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Track your store purchases, package items, delivery states, and personal SW volume credits.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs transition-colors shadow-sm"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Orders</span>
              <div className="text-xl font-black text-white font-mono mt-1">{totalOrdersCount}</div>
            </div>
            <div className="p-2 bg-slate-950 text-slate-300 rounded-lg border border-slate-800">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
            <span>All-time purchases</span>
            <span className="font-mono text-slate-300">{orders.filter(o => o.status === 'completed').length} Approved</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Approved Spending</span>
              <div className="text-xl font-black text-white font-mono mt-1">₹{totalAmountSpent.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Payment Verified</span>
            <span className="text-emerald-400 font-bold">100% Fulfilled</span>
          </div>
        </div>

        {/* Total Credited SW */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Personal SW</span>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">{user.personal_sw} SW</div>
            </div>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-lg border border-slate-800">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Lifetime volume</span>
            <span className="text-amber-400 font-bold font-mono">₹10/SW Value</span>
          </div>
        </div>

        {/* Pending SW / Approvals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Pending Orders</span>
              <div className="text-xl font-black text-amber-300 font-mono mt-1">
                {pendingOrdersCount} <span className="text-xs text-slate-400 font-sans">({pendingSW} SW)</span>
              </div>
            </div>
            <div className="p-2 bg-slate-950 text-amber-300 rounded-lg border border-slate-800">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Awaiting Admin Check</span>
            <span className="text-amber-300 font-semibold font-mono">Pending</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'completed'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Approved ({orders.filter((o) => o.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Pending Approval ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'cancelled'
                ? 'bg-red-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Cancelled ({orders.filter((o) => o.status === 'cancelled').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by Order # or Product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
        </div>
      </div>

      {/* Orders List Container */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs font-medium">Loading your orders history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 text-center text-red-400 text-xs">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="p-3.5 bg-slate-950 rounded-full border border-slate-800 text-slate-600 mb-3">
            <Package size={36} />
          </div>
          <h3 className="text-slate-200 font-bold text-sm mb-1">
            {orders.length === 0 ? 'No Orders Placed Yet' : 'No Orders Match Your Filters'}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mb-6 leading-relaxed">
            {orders.length === 0
              ? 'Explore our product catalog, order premium items, and activate your personal sales volume in the binary tree!'
              : 'Try clearing your search query or switching to the "All" tab to view all orders.'}
          </p>
          <Link
            to="/"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>Browse Products Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders[order.id] ?? true;
            const isCompleted = order.status === 'completed';
            const isPending = order.status === 'pending';
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden transition-all shadow-sm"
              >
                {/* Order Summary Header Bar */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-amber-400 shrink-0">
                      <Package size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          Order #00{order.id}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 size={11} />}
                          {isPending && <Clock size={11} />}
                          {isCancelled && <XCircle size={11} />}
                          {isCompleted
                            ? 'APPROVED'
                            : isPending
                            ? 'PENDING APPROVAL'
                            : order.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-500" />
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers size={12} className="text-slate-500" />
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Header Metrics */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <div className="flex items-center gap-5">
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Total Amount</span>
                        <span className="font-mono font-black text-white text-base">₹{order.total_amount.toFixed(2)}</span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Sales Volume</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">{order.total_sw} SW</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 rounded border border-slate-800 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Order Items List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-slate-950/40">
                    {/* Items Table / Cards */}
                    <div className="divide-y divide-slate-850">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Product Details & Thumbnail */}
                          <div className="flex items-center gap-3.5">
                            <div className="h-14 w-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.product?.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package size={22} className="text-slate-600" />
                              )}
                            </div>

                            <div>
                              <Link
                                to={`/products/${item.product_id}`}
                                className="font-bold text-slate-200 hover:text-amber-400 text-xs transition-colors line-clamp-1 inline-flex items-center gap-1"
                              >
                                <span>{item.product?.name || `Product #${item.product_id}`}</span>
                                <ExternalLink size={11} className="text-slate-500" />
                              </Link>
                              
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                {item.product?.category && (
                                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
                                    {item.product.category}
                                  </span>
                                )}
                                <span>Qty: <strong className="text-slate-200">{item.quantity}</strong></span>
                                <span>•</span>
                                <span>Unit: ₹{item.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Line Item Totals */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 pl-17 sm:pl-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Points</span>
                              <span className="font-mono font-bold text-amber-400 text-xs">
                                {item.sw * item.quantity} SW
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Subtotal</span>
                              <span className="font-mono font-black text-slate-100 text-sm">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Status Notice Box */}
                    <div className="pt-3 border-t border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        {isCompleted ? (
                          <>
                            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                            <span>This order has been verified by the administrator. Sales volume points are fully credited.</span>
                          </>
                        ) : isPending ? (
                          <>
                            <Clock size={14} className="text-amber-400 shrink-0" />
                            <span>Awaiting administrator verification. Once approved, {order.total_sw} SW will be added to your active volume.</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-red-400 shrink-0" />
                            <span>This order was cancelled. Stock volume has been returned to the catalog.</span>
                          </>
                        )}
                      </div>

                      <div className="text-slate-400 text-[11px] font-mono shrink-0">
                        Invoice ID: <span className="text-slate-200 font-bold">APX-ORD-{order.id.toString().padStart(6, '0')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
