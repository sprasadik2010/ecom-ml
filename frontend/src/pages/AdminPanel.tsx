import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Save,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Activity,
  ChevronRight,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

// Types matched to backend models/schemas
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  sw: number;
  image_url: string | null;
  category: string | null;
  stock: number;
}

interface Category {
  id: number;
  name: string;
  image_url: string | null;
}

interface UserListItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: 'active' | 'inactive';
  is_admin: boolean;
  sponsor_id: number | null;
  parent_id: number | null;
  position: 'left' | 'right' | null;
  left_child_id: number | null;
  right_child_id: number | null;
  personal_sw: number;
  left_leg_sw: number;
  right_leg_sw: number;
  total_left_sw: number;
  total_right_sw: number;
  wallet_balance: number;
  created_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  sw: number;
  product: {
    id: number;
    name: string;
    image_url: string | null;
    price: number;
  };
}

interface OrderListItem {
  id: number;
  user_id: number;
  total_amount: number;
  total_sw: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
  user?: {
    username: string;
    full_name: string;
  };
}

interface CommissionListItem {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  user?: {
    username: string;
    full_name: string;
  };
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_sales_amount: number;
  total_sales_sw: number;
  total_commissions_amount: number;
  recent_users: UserListItem[];
  recent_orders: OrderListItem[];
}

type TabType = 'dashboard' | 'products' | 'categories' | 'users' | 'orders' | 'commissions';

export const AdminPanel: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search filter inputs
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionListItem[]>([]);

  // Product Modals / Forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    sw: 0,
    image_url: '',
    category: 'Electronics',
    stock: 10
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image_url: ''
  });
  const [categoryUploading, setCategoryUploading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories list.');
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching categories.');
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCategoryUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Image upload failed.');
      }
      
      const data = await res.json();
      setCategoryForm(prev => ({ ...prev, image_url: data.image_url }));
      triggerSuccess('Category image uploaded successfully!');
    } catch (err: any) {
      triggerError(err.message || 'Image upload failed.');
    } finally {
      setCategoryUploading(false);
    }
  };

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Image upload failed.');
      }
      
      const data = await res.json();
      setProductForm(prev => ({ ...prev, image_url: data.image_url }));
      triggerSuccess('Image uploaded successfully!');
    } catch (err: any) {
      triggerError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Wallet Adjustment Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetUser, setWalletTargetUser] = useState<UserListItem | null>(null);
  const [walletForm, setWalletForm] = useState({
    amount: 0,
    description: ''
  });

  // Show status alerts temporarily
  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // API Call wrappers
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch admin stats.');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching stats.');
    }
  };

  const fetchProducts = async () => {
    try {
      // Products are public, but we can fetch them normally
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error('Failed to fetch products catalog.');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching products.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users list.');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching users.');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders list.');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching orders.');
    }
  };

  const fetchCommissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/commissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch commissions log.');
      const data = await res.json();
      setCommissions(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching commissions.');
    }
  };

  // Load active tab data
  const loadTabData = async (tab: TabType) => {
    setLoading(true);
    if (tab === 'dashboard') {
      await fetchStats();
    } else if (tab === 'products') {
      await Promise.all([fetchProducts(), fetchCategories()]);
    } else if (tab === 'categories') {
      await fetchCategories();
    } else if (tab === 'users') {
      await fetchUsers();
    } else if (tab === 'orders') {
      await Promise.all([fetchOrders(), fetchUsers()]);
    } else if (tab === 'commissions') {
      await Promise.all([fetchCommissions(), fetchUsers()]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadTabData(activeTab);
    }
  }, [activeTab, token]);

  const handleRefresh = () => {
    loadTabData(activeTab);
  };

  // Product Operations
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setProductForm({
      name: '',
      description: '',
      price: 19.99,
      sw: 10,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      category: 'Electronics',
      stock: 100
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCustomCategory(false);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      sw: prod.sw,
      image_url: prod.image_url || '',
      category: prod.category || 'Electronics',
      stock: prod.stock
    });
    setIsProductModalOpen(true);
  };

  // Category Operations
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      image_url: cat.image_url || ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      triggerError('Please provide a category name.');
      return;
    }

    try {
      const url = editingCategory
        ? `${API_BASE_URL}/admin/categories/${editingCategory.id}`
        : `${API_BASE_URL}/admin/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save category.');
      }

      triggerSuccess(editingCategory ? 'Category updated!' : 'Category created successfully!');
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      triggerError(err.message || 'Error saving category.');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!window.confirm('Are you sure you want to delete this category? Products under it will need to be reassigned.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete category.');
      }

      triggerSuccess('Category deleted successfully.');
      fetchCategories();
    } catch (err: any) {
      triggerError(err.message || 'Error deleting category.');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || productForm.price <= 0 || productForm.sw <= 0) {
      triggerError('Please fill in Name, Price, and Sales Wallet (SW) values.');
      return;
    }

    try {
      const url = editingProduct
        ? `${API_BASE_URL}/admin/products/${editingProduct.id}`
        : `${API_BASE_URL}/admin/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error saving product.');
      }

      triggerSuccess(editingProduct ? 'Product updated successfully.' : 'Product added successfully.');
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      triggerError(err.message || 'Product save failed.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete request failed.');
      triggerSuccess('Product deleted.');
      fetchProducts();
    } catch (err: any) {
      triggerError(err.message || 'Could not delete product.');
    }
  };

  // User Operations
  const handleToggleUserStatus = async (user: UserListItem) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Status change failed.');
      triggerSuccess(`User @${user.username} status set to ${nextStatus}.`);
      fetchUsers();
    } catch (err: any) {
      triggerError(err.message || 'Status change failed.');
    }
  };

  const handleOpenWalletModal = (user: UserListItem) => {
    setWalletTargetUser(user);
    setWalletForm({ amount: 10.0, description: 'Admin adjustment credit' });
    setIsWalletModalOpen(true);
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletTargetUser) return;
    if (walletForm.amount === 0 || !walletForm.description.trim()) {
      triggerError('Please enter a non-zero adjustment amount and reference details.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${walletTargetUser.id}/wallet`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(walletForm)
      });
      if (!res.ok) throw new Error('Wallet adjustment failed.');
      triggerSuccess(`Wallet balance of @${walletTargetUser.username} updated.`);
      setIsWalletModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      triggerError(err.message || 'Wallet adjustment failed.');
    }
  };

  // Order Operations
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Order status update failed.');
      }
      triggerSuccess(`Order #${orderId} marked as ${nextStatus}. MLM points and matching volume distributed.`);
      fetchOrders();
    } catch (err: any) {
      triggerError(err.message || 'Order adjustment failed.');
    }
  };

  // Resolvers to look up usernames from user IDs
  const getUserById = (id: number | null): UserListItem | undefined => {
    if (!id) return undefined;
    return users.find((u) => u.id === id);
  };

  // Filter calculations
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const buyerName = o.user?.full_name || getUserById(o.user_id)?.full_name || '';
    const buyerUser = o.user?.username || getUserById(o.user_id)?.username || '';
    return (
      o.id.toString().includes(orderSearch) ||
      buyerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      buyerUser.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status.toLowerCase().includes(orderSearch.toLowerCase())
    );
  });
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Upper Status Notifications */}
      {success && (
        <div className="fixed top-20 right-4 bg-emerald-500 text-slate-950 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xl border border-emerald-400 z-50 animate-bounce font-bold text-xs">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-slate-950 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xl border border-red-400 z-50 animate-pulse font-bold text-xs">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/10 text-rose-550 rounded border border-rose-500/20 font-bold uppercase text-[9px] tracking-wider font-sans">
              System Control
            </span>
            <span className="text-slate-400 font-mono text-xs">Sandbox Environment</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 uppercase tracking-tight font-sans">
            Administrator Center
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Admin tools for products catalog database, MLM genealogy trees, order completion payouts, and ledger balance auditing.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 self-start md:self-center px-4 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-full font-bold text-xs cursor-pointer transition-colors shadow-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-amber-500' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-850 gap-1.5 overflow-x-auto pb-px mb-8 scrollbar-none">
        {(
          [
            { id: 'dashboard', label: 'Overview', count: null },
            { id: 'products', label: 'Catalog Items', count: products.length },
            { id: 'categories', label: 'Categories', count: categories.length },
            { id: 'users', label: 'Network Members', count: users.length },
            { id: 'orders', label: 'Order Processing', count: orders.length },
            { id: 'commissions', label: 'Payout Auditing', count: commissions.length }
          ] as { id: TabType; label: string; count: number | null }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-xs cursor-pointer tracking-wide transition-all shrink-0 ${
              activeTab === t.id
                ? 'bg-slate-900 border border-slate-850 text-rose-500 shadow-sm relative -bottom-px'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                    activeTab === t.id ? 'bg-rose-500/10 text-rose-500 font-bold' : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main Tab Render Grid */}
      {loading && !stats && !products.length ? (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-16 text-center shadow-sm">
          <div className="h-10 w-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-bold font-mono">Syncing system database...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Users */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Members</span>
                    <h3 className="text-2xl font-black text-white">{stats.total_users}</h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                      <span className="text-emerald-500 font-bold">{stats.active_users} Active</span>
                      <span>•</span>
                      <span>{stats.inactive_users} Inactive</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-550 rounded-xl border border-rose-500/10">
                    <Users size={20} />
                  </div>
                </div>

                {/* Sales SW volume */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Sales Volume</span>
                    <h3 className="text-2xl font-black text-white font-mono">{stats.total_sales_sw} SW</h3>
                    <p className="text-[10px] text-slate-400">Total matched binary volume points</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/10">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Sales $ amount */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Gross Sales</span>
                    <h3 className="text-2xl font-black text-white font-mono">
                      ${stats.total_sales_amount.toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-400">Total payments collected</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-550 rounded-xl border border-emerald-550/10">
                    <ShoppingBag size={20} />
                  </div>
                </div>

                {/* Commissions Paid */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Commissions Paid</span>
                    <h3 className="text-2xl font-black text-white font-mono">
                      ${stats.total_commissions_amount.toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-400">Total MLM network referral payouts</p>
                  </div>
                  <div className="p-3 bg-amber-400/10 text-amber-400 rounded-xl border border-amber-450/10">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              {/* Recent lists side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Users */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                      <Activity size={15} className="text-rose-500" />
                      <span>Recent Member Registrations</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline flex items-center cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-850">
                    {stats.recent_users.length === 0 ? (
                      <p className="text-slate-550 text-xs py-4 text-center">No recent signups.</p>
                    ) : (
                      stats.recent_users.map((u) => (
                        <div key={u.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-200">
                              {u.full_name} <span className="text-slate-400 font-normal">@{u.username}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-550 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-550 border border-red-500/20'
                            }`}
                          >
                            {u.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                      <Clock size={15} className="text-rose-500" />
                      <span>Recent Store Orders</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline flex items-center cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-850">
                    {stats.recent_orders.length === 0 ? (
                      <p className="text-slate-550 text-xs py-4 text-center">No orders created yet.</p>
                    ) : (
                      stats.recent_orders.map((o) => (
                        <div key={o.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-200">Order #{o.id}</div>
                            <div className="text-[10px] text-slate-500 font-sans">
                              Buyer User ID: {o.user_id} • Value: {o.total_sw} SW
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-slate-200 font-bold">${o.total_amount.toFixed(2)}</div>
                            <span
                              className={`text-[9px] font-bold ${
                                o.status === 'completed'
                                  ? 'text-emerald-550'
                                  : o.status === 'pending'
                                  ? 'text-amber-400'
                                  : 'text-red-550'
                              }`}
                            >
                              {o.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Search catalog items..."
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-rose-500 text-xs transition-colors"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <Search size={14} className="absolute left-3.5 top-2.5 text-slate-500" />
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="flex items-center gap-1.5 self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add New Product</span>
                </button>
              </div>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-center">Sales Wallet (SW)</th>
                      <th className="py-3 px-4 text-center">Inventory</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No products match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="h-10 w-10 object-cover rounded-lg border border-slate-850"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center text-slate-500">
                                No Img
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-200">{p.name}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[240px] font-normal">
                                {p.description || 'No description provided.'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-350">{p.category || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                            {p.sw} SW
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                p.stock <= 5
                                  ? 'bg-red-500/10 text-red-555 border border-red-500/25'
                                  : 'bg-slate-950 text-slate-400'
                              }`}
                            >
                                {p.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1 hover:bg-slate-850 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-550 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    No products match your search.
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-12 w-12 object-cover rounded-lg border border-slate-850" />
                        ) : (
                          <div className="h-12 w-12 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center text-slate-500 text-[10px]">
                            No Img
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-200 text-sm truncate">{p.name}</h4>
                          <p className="text-[10px] text-slate-400 font-normal truncate">{p.category || 'Uncategorized'}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-normal line-clamp-2 leading-relaxed">
                        {p.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-sans">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-350">Price: <span className="font-mono text-slate-200 font-bold">${p.price.toFixed(2)}</span></div>
                          <div className="font-bold text-amber-500 font-mono">{p.sw} SW</div>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] block ${p.stock <= 5 ? 'bg-red-500/10 text-red-550 border border-red-500/25' : 'bg-slate-950 text-slate-405'}`}>
                            {p.stock} units
                          </span>
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleOpenEditProduct(p)} className="p-1.5 bg-slate-950 border border-slate-800 text-slate-450 hover:text-white rounded transition-colors" title="Edit">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-500/5 border border-red-500/10 text-slate-450 hover:text-red-500 rounded transition-colors" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white font-sans">E-Commerce Categories</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Manage store categories, filter pills, and visual cover banners.</p>
                </div>

                <button
                  onClick={handleOpenAddCategory}
                  className="flex items-center gap-1.5 self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Category Cover Banner</th>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">
                          No categories created yet.
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-950/40 transition-colors font-normal">
                          <td className="py-3 px-4">
                            {c.image_url ? (
                              <img
                                src={c.image_url}
                                alt={c.name}
                                className="h-10 w-24 object-cover rounded-lg border border-slate-850"
                              />
                            ) : (
                              <div className="h-10 w-24 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center text-slate-550 text-[10px]">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200 text-sm">
                            {c.name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-sans font-bold">
                              <button
                                onClick={() => handleOpenEditCategory(c)}
                                className="p-1.5 hover:bg-slate-850 text-slate-450 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c.id)}
                                className="p-1.5 hover:bg-red-500/10 text-slate-450 hover:text-red-550 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-4">
                {categories.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    No categories created yet.
                  </div>
                ) : (
                  categories.map((c) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 shadow-sm font-sans">
                      <div className="flex items-center gap-3">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="h-12 w-20 object-cover rounded-lg border border-slate-850" />
                        ) : (
                          <div className="h-12 w-20 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center text-slate-500 text-[10px]">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-200 text-sm truncate">{c.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-2 border-t border-slate-850 gap-2">
                        <button onClick={() => handleOpenEditCategory(c)} className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded transition-colors flex items-center gap-1 text-[10px]" title="Edit">
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 bg-red-500/5 border border-red-500/10 text-slate-400 hover:text-red-550 rounded transition-colors flex items-center gap-1 text-[10px]" title="Delete">
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Search user */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Search by username, name, or email..."
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-rose-500 text-xs transition-colors"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <Search size={14} className="absolute left-3.5 top-2.5 text-slate-500" />
                </div>
              </div>

              {/* Table list */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-850 whitespace-nowrap">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Member ID & User</th>
                      <th className="py-3 px-4">Referral Tree Placement</th>
                      <th className="py-3 px-4 text-center">Wallet Bal</th>
                      <th className="py-3 px-4 text-center">Personal SW</th>
                      <th className="py-3 px-4 text-center">Binary Leg Volumes (SW)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-855 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const sponsor = getUserById(u.sponsor_id);
                        const parent = getUserById(u.parent_id);
                        return (
                          <tr key={u.id} className="hover:bg-slate-950/40 transition-colors font-normal">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-205 flex items-center gap-1">
                                <span>{u.full_name}</span>
                                {u.is_admin && (
                                  <span className="bg-rose-500/10 text-rose-550 text-[8px] font-black px-1 rounded uppercase font-sans border border-rose-500/25">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">@{u.username} ({u.email})</div>
                            </td>
                            <td className="py-3 px-4 font-normal">
                              <div className="text-[10px] text-slate-350 space-y-0.5 font-sans">
                                <div>
                                  Sponsor:{' '}
                                  <span className="font-bold font-mono text-slate-300">
                                    {sponsor ? `@${sponsor.username}` : u.sponsor_id ? `ID ${u.sponsor_id}` : 'Root'}
                                  </span>
                                </div>
                                {parent && (
                                  <div>
                                    Parent:{' '}
                                    <span className="font-bold font-mono text-slate-300">
                                      @{parent.username} ({u.position})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                              ${u.wallet_balance.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-200">
                              {u.personal_sw} SW
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400 font-normal">
                              <div className="flex flex-col items-center">
                                <div>
                                  Left Leg: <span className="font-bold text-slate-200">{u.left_leg_sw}</span> / {u.total_left_sw}
                                </div>
                                <div>
                                  Right Leg: <span className="font-bold text-slate-200">{u.right_leg_sw}</span> / {u.total_right_sw}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-555 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-550 border border-red-500/20'
                                }`}
                              >
                                {u.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="px-2 py-1 bg-slate-955 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
                                  title="Toggle Active/Inactive"
                                >
                                  Toggle Status
                                </button>
                                <button
                                  onClick={() => handleOpenWalletModal(u)}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-500 rounded cursor-pointer transition-colors"
                                  title="Credit/Debit Wallet"
                                >
                                  Adjust Bal
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-4 text-xs font-sans">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    No members found.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const sponsor = getUserById(u.sponsor_id);
                    const parent = getUserById(u.parent_id);
                    return (
                      <div key={u.id} className="bg-slate-900 border border-slate-855 p-4 rounded-xl space-y-3 shadow-sm text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {u.is_admin && (
                                <span className="bg-rose-500/10 text-rose-550 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-rose-500/25">Admin</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-450 font-normal">@{u.username}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-555 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {u.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-350 font-normal">
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] font-bold">Sponsor</span>
                            <span className="font-bold font-mono text-slate-300">{sponsor ? `@${sponsor.username}` : 'Root'}</span>
                          </div>
                          <div>
                            <span className="text-slate-505 block uppercase text-[8px] font-bold">Parent Node</span>
                            <span className="font-bold font-mono text-slate-300">{parent ? `@${parent.username} (${u.position})` : 'None'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] font-bold">Wallet Balance</span>
                            <span className="font-bold font-mono text-amber-400">${u.wallet_balance.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] font-bold">Personal Volume</span>
                            <span className="font-bold font-mono text-slate-300">{u.personal_sw} SW</span>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-slate-850/60 flex justify-between font-normal">
                            <div>
                              <span className="text-slate-500 text-[8px] uppercase font-bold">Left Leg (Matched/Total)</span>
                              <div className="font-mono text-slate-400"><span className="font-bold text-slate-200">{u.left_leg_sw}</span> / {u.total_left_sw} SW</div>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 text-[8px] uppercase font-bold">Right Leg (Matched/Total)</span>
                              <div className="font-mono text-slate-400"><span className="font-bold text-slate-200">{u.right_leg_sw}</span> / {u.total_right_sw} SW</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-850/60 font-sans">
                          <button onClick={() => handleToggleUserStatus(u)} className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold rounded cursor-pointer transition-colors text-center text-slate-355 hover:text-white">
                            Toggle Status
                          </button>
                          <button onClick={() => handleOpenWalletModal(u)} className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-500 rounded cursor-pointer transition-colors text-center">
                            Adjust Balance
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Search orders */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Search by order ID, buyer username or status..."
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-rose-500 text-xs transition-colors"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <Search size={14} className="absolute left-3.5 top-2.5 text-slate-500" />
                </div>
              </div>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-850 font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Buyer Member</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Payment</th>
                      <th className="py-3 px-4 text-center">Volume (SW)</th>
                      <th className="py-3 px-4 text-center">Checkout Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No orders matched.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const buyer = o.user || getUserById(o.user_id);
                        return (
                          <tr key={o.id} className="hover:bg-slate-950/40 transition-colors font-normal">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-200">#Order {o.id}</div>
                              <div className="text-[10px] text-slate-500 font-sans font-normal">
                                {new Date(o.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-202">
                                {buyer ? buyer.full_name : `User ID ${o.user_id}`}
                              </div>
                              <div className="text-[10px] text-slate-450 font-normal">
                                {buyer ? `@${buyer.username}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-normal">
                              <div className="max-w-[200px] text-[10px] text-slate-350 space-y-1 font-sans">
                                {o.items.map((item, idx) => (
                                  <div key={idx} className="line-clamp-1">
                                    {item.quantity}x {item.product ? item.product.name : `Product ${item.product_id}`}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                              ${o.total_amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                              {o.total_sw} SW
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  o.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-555 border border-emerald-500/20'
                                    : o.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-red-500/10 text-red-550 border border-red-500/20'
                                }`}
                              >
                                {o.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {o.status === 'pending' && (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                                    className="p-1 bg-emerald-500/10 hover:bg-emerald-555 hover:text-slate-955 text-emerald-555 rounded border border-emerald-500/20 cursor-pointer transition-colors"
                                    title="Approve / Complete Checkout"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                                    className="p-1 bg-red-500/10 hover:bg-red-555 hover:text-slate-955 text-red-550 rounded border border-red-550/20 cursor-pointer transition-colors"
                                    title="Cancel Order"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                              {o.status === 'completed' && (
                                <span className="text-[10px] text-slate-500 font-mono font-normal">Simulated Done</span>
                              )}
                              {o.status === 'cancelled' && (
                                <span className="text-[10px] text-red-500/50 font-mono font-normal">Cancelled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-4 font-sans text-xs">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-855 rounded-xl font-normal">
                    No orders matched.
                  </div>
                ) : (
                  filteredOrders.map((o) => {
                    const buyer = o.user || getUserById(o.user_id);
                    return (
                      <div key={o.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 shadow-sm text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div>
                            <div className="font-bold text-slate-200">Order #{o.id}</div>
                            <div className="text-[9px] text-slate-500 font-normal">{new Date(o.created_at).toLocaleString()}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-555 border border-emerald-500/20' : o.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-550 border border-red-500/20'}`}>
                            {o.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-505 text-[8px] uppercase block font-bold">Buyer Member</span>
                            <span className="font-bold text-slate-200">{buyer ? buyer.full_name : `User ID ${o.user_id}`}</span>{' '}
                            <span className="text-slate-450 font-normal">({buyer ? `@${buyer.username}` : ''})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase block font-bold">Items Purchased</span>
                            <div className="text-[10px] text-slate-400 space-y-1 font-normal">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="line-clamp-1">
                                  {item.quantity}x {item.product ? item.product.name : `Product ${item.product_id}`} (${item.price.toFixed(2)})
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-850/60 text-[10px]">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-350">Gross Price: <span className="font-mono text-slate-200 font-bold">${o.total_amount.toFixed(2)}</span></div>
                            <div className="font-bold text-amber-500 font-mono">{o.total_sw} SW</div>
                          </div>

                          {o.status === 'pending' && (
                            <div className="flex gap-1.5 font-sans font-bold">
                              <button onClick={() => handleUpdateOrderStatus(o.id, 'completed')} className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-555 rounded border border-emerald-500/20 cursor-pointer font-bold transition-all flex items-center gap-1">
                                <Check size={11} />
                                <span>Approve</span>
                              </button>
                              <button onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')} className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-slate-950 text-red-550 rounded border border-red-550/20 cursor-pointer font-bold transition-all flex items-center gap-1">
                                <X size={11} />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}
                          {o.status === 'completed' && <span className="text-[9px] text-slate-500 font-mono font-normal">Simulated Done</span>}
                          {o.status === 'cancelled' && <span className="text-[9px] text-red-500/50 font-mono font-normal">Cancelled</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* COMMISSIONS TAB */}
          {activeTab === 'commissions' && (
            <div className="bg-slate-900 border border-slate-855 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-850 pb-3">
                <h4 className="text-sm font-black text-white font-sans">System Commissions Ledger</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Audit logs of matching volumes and referral rewards paid out automatically or adjustments made.
                </p>
              </div>

              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-850 font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Record ID</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4 text-right">Payout Amount</th>
                      <th className="py-3 px-4">Reward Type</th>
                      <th className="py-3 px-4">Audit Description Log</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No commission ledger logs recorded.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((c) => {
                        const userRec = getUserById(c.user_id);
                        return (
                          <tr key={c.id} className="hover:bg-slate-950/40 transition-colors font-normal">
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-450 font-normal">#Log-{c.id}</td>
                            <td className="py-3 px-4 font-bold">
                              <div className="font-bold text-slate-200">
                                {userRec ? userRec.full_name : `User ID ${c.user_id}`}
                              </div>
                              <div className="text-[10px] text-slate-450 font-normal">
                                {userRec ? `@${userRec.username}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-555">
                              +${c.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  c.type === 'binary_matching'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : c.type === 'direct_referral'
                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}
                              >
                                {c.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-350 italic max-w-xs truncate" title={c.description || ''}>
                              {c.description || 'Auto matching volume release.'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[10px] font-mono">
                              {new Date(c.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-4 font-sans text-xs">
                {commissions.length === 0 ? (
                  <div className="text-center py-6 text-slate-555 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    No commission ledger logs recorded.
                  </div>
                ) : (
                  commissions.map((c) => {
                    const userRec = getUserById(c.user_id);
                    return (
                      <div key={c.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div>
                            <span className="font-mono text-[9px] text-slate-500 block uppercase">Log #{c.id}</span>
                            <span className="font-bold text-slate-200">{userRec ? userRec.full_name : `User ID ${c.user_id}`}</span>{' '}
                            <span className="text-slate-450 font-normal">(@{userRec ? userRec.username : ''})</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-555 text-sm">+${c.amount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1.5 text-[11px] font-normal text-slate-350">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[8px] uppercase font-bold">Reward Type:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${c.type === 'binary_matching' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : c.type === 'direct_referral' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                              {c.type}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase font-bold block">Audit Details</span>
                            <p className="italic leading-relaxed">{c.description || 'Auto matching volume release.'}</p>
                          </div>
                        </div>

                        <div className="text-right text-[9px] text-slate-500 font-mono border-t border-slate-850/60 pt-1.5">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT CREATION/EDIT MODAL OVERLAY */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-850 px-6 py-4 bg-slate-950/60">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                <PlusCircle size={16} className="text-amber-500" />
                <span>{editingProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Product Display Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-normal"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                {/* Category Selection from DB List */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Category</label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-normal font-sans"
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name || ''}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Stock Inventory</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* SW points */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <span>Sales Wallet (SW)</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded">BV Points</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                    value={productForm.sw}
                    onChange={(e) => setProductForm({ ...productForm, sw: parseInt(e.target.value) || 0 })}
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Product Description</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-normal resize-none"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                {/* Image URL & File Upload */}
                <div className="col-span-2 space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 uppercase">Product Image</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* URL Input */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-normal block">Provide Image URL</span>
                      <input
                        type="url"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                        value={productForm.image_url || ''}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    {/* Local Upload Input */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-normal block">Or Upload Local Image</span>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          onChange={handleImageUpload}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-slate-400 focus:outline-none focus:border-rose-500 font-normal text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-rose-500/10 file:text-rose-500 file:cursor-pointer hover:file:bg-rose-500/20"
                        />
                        {uploading && (
                          <span className="absolute right-3 top-2 text-[9px] font-bold text-amber-500 font-mono animate-pulse">
                            Uploading...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850 mt-6 font-sans">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-850 text-slate-450 hover:text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold transition-colors cursor-pointer shadow-sm animate-pulse-subtle"
                >
                  <Save size={14} />
                  <span>{editingProduct ? 'Save Updates' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATION/EDIT MODAL OVERLAY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-850 px-6 py-4 bg-slate-950/60">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                <PlusCircle size={16} className="text-amber-500" />
                <span>{editingCategory ? 'Edit Category' : 'Add Category'}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-xs font-bold text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Footwear"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-normal font-sans"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                </div>

                {/* Category Image Cover */}
                <div className="col-span-2 space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 uppercase">Category Cover Banner Image</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* URL Input */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-505 font-normal block">Provide Image URL</span>
                      <input
                        type="url"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                        value={categoryForm.image_url || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    {/* Local Upload Input */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-505 font-normal block">Or Upload Local Image</span>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={categoryUploading}
                          onChange={handleCategoryImageUpload}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-slate-400 focus:outline-none focus:border-rose-500 font-normal text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-rose-500/10 file:text-rose-500 file:cursor-pointer hover:file:bg-rose-500/20"
                        />
                        {categoryUploading && (
                          <span className="absolute right-3 top-2 text-[9px] font-bold text-amber-500 font-mono animate-pulse">
                            Uploading...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850 mt-6 font-sans">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-850 text-slate-455 hover:text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold transition-colors cursor-pointer shadow-sm animate-pulse-subtle"
                >
                  <Save size={14} />
                  <span>{editingCategory ? 'Save Updates' : 'Add Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALLET BALANCE ADJUSTMENT MODAL OVERLAY */}
      {isWalletModalOpen && walletTargetUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-850 px-6 py-4 bg-slate-950/60 font-sans">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <DollarSign size={16} className="text-amber-500" />
                <span>Adjust Wallet Balance</span>
              </h3>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-200">
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-1 font-sans">
                <span className="text-[10px] text-slate-500 uppercase">Target Recipient</span>
                <div className="font-bold text-slate-200">{walletTargetUser.full_name}</div>
                <div className="font-mono text-[10px] text-slate-400 font-normal">@{walletTargetUser.username}</div>
                <div className="text-[10px] mt-1 pt-1.5 border-t border-slate-850 flex justify-between items-center text-slate-350 font-normal">
                  <span>Current Wallet Balance:</span>
                  <span className="font-bold font-mono text-amber-500">${walletTargetUser.wallet_balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1 font-sans">
                <label className="text-[10px] text-slate-450 uppercase flex items-center justify-between">
                  <span>Adjustment Amount</span>
                  <span className="text-[8px] text-slate-500 font-normal">Use negative value to subtract</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-450">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-8 pr-4 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-normal"
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 font-sans font-normal">
                <label className="text-[10px] text-slate-450 uppercase font-bold">Adjustment Reason / Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compensation payout, Referral rebate..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 font-normal"
                  value={walletForm.description}
                  onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })}
                />
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850 mt-6 font-sans">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-850 text-slate-450 hover:text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
