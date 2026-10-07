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
  Layers,
  Truck,
  Copy,
  Check,
  MapPin,
  Phone,
  Send,
  HelpCircle
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
  payment_method?: string;
  upi_trans_id?: string;
  upi_payer_vpa?: string;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_phone?: string;
  dispatch_status?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  dispatched_at?: string;
  delivered_at?: string;
  dispatch_notes?: string;
  created_at: string;
  items: OrderItem[];
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'dispatched' | 'cancelled';

export const Orders: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [copiedTrackingId, setCopiedTrackingId] = useState<Record<number, boolean>>({});

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

  const handleCopyTracking = (orderId: number, trackingNo: string) => {
    navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingId((prev) => ({ ...prev, [orderId]: true }));
    setTimeout(() => {
      setCopiedTrackingId((prev) => ({ ...prev, [orderId]: false }));
    }, 2000);
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
  const inTransitCount = orders.filter(
    (o) => o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit'
  ).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingSW = orders
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + o.total_sw, 0);

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    let matchesStatus = true;
    if (filterStatus === 'pending') matchesStatus = order.status === 'pending';
    else if (filterStatus === 'completed') matchesStatus = order.status === 'completed';
    else if (filterStatus === 'dispatched') {
      matchesStatus = order.dispatch_status === 'dispatched' || order.dispatch_status === 'in_transit' || order.dispatch_status === 'delivered';
    } else if (filterStatus === 'cancelled') matchesStatus = order.status === 'cancelled';
    
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const orderIdMatch = `#${order.id}`.includes(query) || order.id.toString().includes(query);
    const trackingMatch = order.tracking_number?.toLowerCase().includes(query) || false;
    const courierMatch = order.courier_name?.toLowerCase().includes(query) || false;
    const itemMatch = order.items?.some(
      (item) => 
        item.product?.name?.toLowerCase().includes(query) ||
        item.product?.category?.toLowerCase().includes(query)
    );

    return orderIdMatch || trackingMatch || courierMatch || itemMatch;
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
              <h1 className="text-2xl font-black text-white">My Orders & Postal Tracking</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Track your package shipments, postal tracking numbers (India Post), delivery progress, and personal SW volume credits.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
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
            <span>All-time orders</span>
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
            <span>Personal Volume</span>
            <span className="text-amber-400 font-bold font-mono">Credited</span>
          </div>
        </div>

        {/* In Transit / Postal Shipments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">In Postal Transit</span>
              <div className="text-xl font-black text-sky-400 font-mono mt-1">
                {inTransitCount}
              </div>
            </div>
            <div className="p-2 bg-slate-950 text-sky-400 rounded-lg border border-slate-800">
              <Truck size={18} />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Postal Department</span>
            <span className="text-sky-400 font-semibold font-mono">Dispatched</span>
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
            <span>Awaiting Verification</span>
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
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('dispatched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterStatus === 'dispatched'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Truck size={12} />
            <span>In Postal Transit ({orders.filter((o) => o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit' || o.dispatch_status === 'delivered').length})</span>
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
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Order #, Tracking ID or Product..."
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
              : 'Try clearing your search query or switching to the "All Orders" tab to view all orders.'}
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
            const isDispatched = order.dispatch_status === 'dispatched' || order.dispatch_status === 'in_transit';
            const isDelivered = order.dispatch_status === 'delivered';
            const hasTracking = Boolean(order.tracking_number);

            const recipientName = order.shipping_name || user.full_name;
            const fullAddressString = [
              order.shipping_address,
              order.shipping_city,
              order.shipping_state,
              order.shipping_zip ? `PIN: ${order.shipping_zip}` : ''
            ].filter(Boolean).join(', ');

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
                    <div className={`p-2.5 rounded-lg border shrink-0 ${
                      isDispatched
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : isDelivered
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-amber-400'
                    }`}>
                      {isDispatched ? <Truck size={20} /> : <Package size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          Order #00{order.id}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isDispatched
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                              : isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 size={11} />}
                          {isDispatched && <Truck size={11} />}
                          {!isDispatched && isCompleted && <CheckCircle2 size={11} />}
                          {isPending && <Clock size={11} />}
                          {isCancelled && <XCircle size={11} />}
                          
                          {isDelivered
                            ? 'DELIVERED'
                            : isDispatched
                            ? 'IN POSTAL TRANSIT'
                            : isCompleted
                            ? 'PAYMENT APPROVED'
                            : isPending
                            ? 'PENDING APPROVAL'
                            : order.status.toUpperCase()}
                        </span>

                        {/* Postal Tracking Number Badge in Header */}
                        {order.tracking_number && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-950/40 text-blue-300 border border-blue-500/30 rounded-full font-mono text-[10px] font-bold">
                            <Truck size={10} />
                            Postal Tracking: {order.tracking_number}
                          </span>
                        )}

                        {/* UPI UTR Badge */}
                        {order.upi_trans_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] font-bold">
                            UTR: {order.upi_trans_id}
                          </span>
                        )}
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
                        {order.payment_method && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[10px] text-slate-500 font-bold">
                              {order.payment_method.replace('_', ' ')}
                            </span>
                          </>
                        )}
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

                {/* Expanded Order Items & Dispatch Tracker */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5 bg-slate-950/40">
                    {/* 1. POSTAL DISPATCH & LIVE TRACKING BOX */}
                    {(isDispatched || isDelivered || hasTracking) ? (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
                        {/* Header of Dispatch Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                              <Truck size={18} />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                                <span>Postal Department Dispatch & Live Tracking</span>
                                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[9px] font-bold uppercase">
                                  {isDelivered ? 'Delivered' : 'In Transit'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Carrier: <strong className="text-white">{order.courier_name || 'India Post (Speed Post)'}</strong>
                                {order.dispatched_at && (
                                  <span> • Dispatched on {new Date(order.dispatched_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Direct Track on Postal Website Button */}
                          <a
                            href={order.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                          >
                            <span>Track on Postal Dept Website</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>

                        {/* Visual Progress Steps Tracker */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-2.5 text-[10.5px]">
                            <div className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                              <Check size={12} />
                              <span>1. Order Placed</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-2.5 text-[10.5px]">
                            <div className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                              <Check size={12} />
                              <span>2. Payment Verified</span>
                            </div>
                            <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5 block">
                              SW Credited
                            </span>
                          </div>

                          <div className={`border rounded-lg p-2.5 text-[10.5px] ${
                            isDispatched || isDelivered 
                              ? 'bg-slate-900/90 border-sky-500/40 text-sky-300' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}>
                            <div className="font-bold flex items-center justify-center gap-1 text-sky-400">
                              <Truck size={12} />
                              <span>3. Postal Dispatched</span>
                            </div>
                            <span className="text-[9px] text-sky-300/80 font-mono mt-0.5 block">
                              {order.courier_name || 'India Post'}
                            </span>
                          </div>

                          <div className={`border rounded-lg p-2.5 text-[10.5px] ${
                            isDelivered 
                              ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}>
                            <div className="font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>4. Delivered</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                              {isDelivered ? (order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : 'Completed') : 'In Transit'}
                            </span>
                          </div>
                        </div>

                        {/* Consignment Tracking ID Banner */}
                        {order.tracking_number && (
                          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                Postal Consignment / Article Tracking Number:
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono font-black text-amber-300 text-base sm:text-lg bg-slate-900 px-3 py-1 rounded-md border border-slate-750 tracking-wider select-all">
                                  {order.tracking_number}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTracking(order.id, order.tracking_number!)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Copy Postal Consignment Number"
                                >
                                  {copiedTrackingId[order.id] ? (
                                    <>
                                      <Check size={13} className="text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={13} />
                                      <span>Copy Number</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Step-by-step guidance */}
                            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 max-w-sm">
                              <div className="text-slate-300 font-bold flex items-center gap-1">
                                <HelpCircle size={12} className="text-sky-400 shrink-0" />
                                <span>How to track on Postal Dept website:</span>
                              </div>
                              <p className="text-[10.5px] leading-tight text-slate-400">
                                1. Copy the Consignment Number above.<br/>
                                2. Click <strong>'Track on Postal Dept Website'</strong> to open the India Post tracking portal.<br/>
                                3. Paste your number in the <em>Consignment Number</em> field to view live delivery scans.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Postal Shipping Destination Address */}
                        {(fullAddressString || order.shipping_name) && (
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-1.5">
                              <MapPin size={13} className="text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-200">Postal Delivery To: </span>
                                <span className="text-slate-300">{recipientName}</span>
                                {fullAddressString && <span className="text-slate-400"> ({fullAddressString})</span>}
                              </div>
                            </div>
                            {order.shipping_phone && (
                              <div className="text-emerald-400 font-mono text-[10px] shrink-0">
                                📞 {order.shipping_phone}
                              </div>
                            )}
                          </div>
                        )}

                        {order.dispatch_notes && (
                          <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800">
                            <strong>Admin Remarks:</strong> "{order.dispatch_notes}"
                          </div>
                        )}
                      </div>
                    ) : isCompleted ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">Payment Approved & In Packaging</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Your order has been approved and personal SW credited. The administrator is packaging your items for dispatch via Postal Department. Postal tracking consignment ID will appear here once booked at the post office.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* 2. ORDER ITEMS LIST */}
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
