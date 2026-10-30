import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  IndianRupee,
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
  ArrowUpRight,
  Star,
  Award,
  Sparkles,
  Zap,
  Copy,
  QrCode,
  Truck,
  ExternalLink,
  Printer,
  MapPin,
  Mail,
  Phone,
  Package,
  Send,
  CheckCircle2,
  Layers,
  Palette,
  Tag,
  Eye,
  EyeOff,
  Lock,
  ArrowUp,
  ArrowDown,
  Cloud,
  UploadCloud,
  Key,
  Landmark,
  CreditCard,
  Calendar,
  UserCheck,
  User as UserIcon,
  Image as ImageIcon,
  LogOut
} from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

// Types matched to backend models/schemas
interface Product {
  id: number;
  product_code?: string | null;
  name: string;
  description: string | null;
  price: number;
  sw: number;
  image_url: string | null;
  images?: string[] | null;
  colors?: string[] | null;
  sizes?: string[] | null;
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
  phone_number?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  is_admin: boolean;
  sponsor_id: number | null;
  parent_id: number | null;
  position: 'left' | 'right' | null;
  left_child_id: number | null;
  right_child_id: number | null;
  personal_sw: number;
  pending_sw?: number;
  left_leg_sw: number;
  right_leg_sw: number;
  total_left_sw: number;
  total_right_sw: number;
  total_matched_sw?: number;
  current_level?: number;
  level_name?: string;
  wallet_balance: number;
  activated_at?: string | null;
  bank_account_holder?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_branch?: string | null;
  upi_id?: string | null;
  pan_number?: string | null;
  created_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  sw: number;
  selected_color?: string;
  selected_size?: string;
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
  status: 'pending' | 'completed' | 'cancelled' | string;
  payment_method?: string;
  upi_trans_id?: string;
  upi_payer_vpa?: string;
  payment_proof_url?: string;
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
  user_username?: string;
  user_full_name?: string;
  user_phone?: string;
  created_at: string;
  items: OrderItem[];
  user?: {
    username: string;
    full_name: string;
    phone_number?: string;
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

interface RankRewardItem {
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
  user_username?: string;
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

interface ImgBBSettings {
  api_key_configured: boolean;
  masked_key: string;
  total_images: number;
  completed_images: number;
  pending_images: number;
  failed_images: number;
}

interface ImageUploadItem {
  id: number;
  local_filename: string;
  local_url: string;
  imgbb_url: string | null;
  file_size?: number | null;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

type TabType = 'dashboard' | 'products' | 'categories' | 'users' | 'orders' | 'commissions' | 'rewards' | 'media';

export const AdminPanel: React.FC = () => {
  const { token, logout } = useAuth();
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
  const [rewards, setRewards] = useState<RankRewardItem[]>([]);
  const [processingRewards, setProcessingRewards] = useState(false);

  // ImgBB Cloud Storage State
  const [imgbbSettings, setImgbbSettings] = useState<ImgBBSettings | null>(null);
  const [imgbbImages, setImgbbImages] = useState<ImageUploadItem[]>([]);
  const [imgbbApiKeyInput, setImgbbApiKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [testingImgbb, setTestingImgbb] = useState(false);
  const [syncingAllImages, setSyncingAllImages] = useState(false);
  const [savingImgbbKey, setSavingImgbbKey] = useState(false);

  // Dispatch Management State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState<OrderListItem | null>(null);
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'pending' | 'ready_dispatch' | 'dispatched' | 'delivered' | 'cancelled'>('all');
  const [dispatchForm, setDispatchForm] = useState({
    dispatch_status: 'dispatched',
    courier_name: 'Speed Post',
    tracking_number: '',
    tracking_url: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
    dispatch_notes: ''
  });

  // Product Modals / Forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newViewImageUrl, setNewViewImageUrl] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [productForm, setProductForm] = useState({
    product_code: '',
    name: '',
    description: '',
    price: 0,
    sw: 0,
    image_url: '',
    images: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
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
      setProductForm(prev => {
        const updatedImages = prev.images.includes(data.image_url)
          ? prev.images
          : [...prev.images, data.image_url];
        return {
          ...prev,
          image_url: prev.image_url || data.image_url,
          images: updatedImages
        };
      });
      triggerSuccess('Image uploaded locally! Background cloud sync to ImgBB started.');
      fetchImgbbSettings();
    } catch (err: any) {
      triggerError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/upload-multiple`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Multi-image upload failed.');
      }

      const data = await res.json();
      const newUrls: string[] = data.image_urls || [];
      setProductForm(prev => {
        const combined = [...prev.images, ...newUrls];
        return {
          ...prev,
          images: combined,
          image_url: prev.image_url || combined[0] || ''
        };
      });
      triggerSuccess(`Uploaded ${newUrls.length} photos! Background cloud sync to ImgBB started.`);
      fetchImgbbSettings();
    } catch (err: any) {
      triggerError(err.message || 'Multi-image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ImgBB API Key & Sync Handlers
  const fetchImgbbSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/imgbb`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImgbbSettings(data);
      }
    } catch (err) {
      console.error('Error fetching ImgBB settings:', err);
    }
  };

  const fetchImgbbImages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/imgbb/images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImgbbImages(data);
      }
    } catch (err) {
      console.error('Error fetching ImgBB images:', err);
    }
  };

  const handleSaveImgbbKey = async () => {
    if (!imgbbApiKeyInput.trim()) {
      triggerError('Please enter a valid ImgBB API Key.');
      return;
    }
    setSavingImgbbKey(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/imgbb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ api_key: imgbbApiKeyInput.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update ImgBB API key.');
      }
      triggerSuccess('ImgBB API Key updated successfully! Cloud uploads active.');
      setImgbbApiKeyInput('');
      setIsEditingKey(false);
      fetchImgbbSettings();
    } catch (err: any) {
      triggerError(err.message || 'Error updating API key.');
    } finally {
      setSavingImgbbKey(false);
    }
  };

  const handleTestImgbbKey = async () => {
    setTestingImgbb(true);
    try {
      const payload = imgbbApiKeyInput.trim() ? { api_key: imgbbApiKeyInput.trim() } : {};
      const res = await fetch(`${API_BASE_URL}/admin/imgbb/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.detail || 'ImgBB test failed.');
      }
      triggerSuccess(data.message || 'ImgBB connection active and verified!');
    } catch (err: any) {
      triggerError(err.message || 'ImgBB verification failed.');
    } finally {
      setTestingImgbb(false);
    }
  };

  const handleSyncAllImages = async () => {
    setSyncingAllImages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/imgbb/sync-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to trigger batch image sync.');
      }
      const data = await res.json();
      triggerSuccess(data.message || 'Queued images for background ImgBB upload.');
      fetchImgbbSettings();
      fetchImgbbImages();
    } catch (err: any) {
      triggerError(err.message || 'Error syncing images.');
    } finally {
      setSyncingAllImages(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newViewImageUrl.trim();
    if (!trimmed) return;
    setProductForm(prev => {
      const updated = [...prev.images, trimmed];
      return {
        ...prev,
        images: updated,
        image_url: prev.image_url || updated[0] || ''
      };
    });
    setNewViewImageUrl('');
    triggerSuccess('Photo view added to gallery!');
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setProductForm(prev => {
      const updated = prev.images.filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        images: updated,
        image_url: updated[0] || ''
      };
    });
  };

  const handleSetCoverImage = (idxToCover: number) => {
    setProductForm(prev => {
      const target = prev.images[idxToCover];
      const others = prev.images.filter((_, idx) => idx !== idxToCover);
      const updated = [target, ...others];
      return {
        ...prev,
        images: updated,
        image_url: target
      };
    });
    triggerSuccess('Cover photo updated!');
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    setProductForm(prev => {
      if (toIdx < 0 || toIdx >= prev.images.length) return prev;
      const copy = [...prev.images];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return {
        ...prev,
        images: copy,
        image_url: copy[0] || ''
      };
    });
  };

  const handleAddColor = (cName: string) => {
    const val = cName.trim();
    if (!val) return;
    if (productForm.colors.includes(val)) {
      triggerError(`Color '${val}' is already added.`);
      return;
    }
    setProductForm(prev => ({
      ...prev,
      colors: [...prev.colors, val]
    }));
    setCustomColorInput('');
  };

  const handleRemoveColor = (cName: string) => {
    setProductForm(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== cName)
    }));
  };

  const handleAddSize = (sName: string) => {
    const val = sName.trim();
    if (!val) return;
    if (productForm.sizes.includes(val)) {
      triggerError(`Size '${val}' is already added.`);
      return;
    }
    setProductForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, val]
    }));
    setCustomSizeInput('');
  };

  const handleRemoveSize = (sName: string) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sName)
    }));
  };

  // Wallet Adjustment Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetUser, setWalletTargetUser] = useState<UserListItem | null>(null);
  const [walletForm, setWalletForm] = useState({
    amount: 0,
    description: ''
  });

  // User Credentials Modal (Change Username / Password)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsTargetUser, setCredentialsTargetUser] = useState<UserListItem | null>(null);
  const [credentialsForm, setCredentialsForm] = useState({
    username: '',
    password: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false);

  // Full User Details Modal (Phone, Signup Time, Activation Time, Bank Details, etc.)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedDetailsUser, setSelectedDetailsUser] = useState<UserListItem | null>(null);
  const [copiedDetailField, setCopiedDetailField] = useState<string | null>(null);

  const handleOpenUserDetailsModal = (user: UserListItem) => {
    setSelectedDetailsUser(user);
    setIsUserDetailsModalOpen(true);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDetailField(fieldName);
    setTimeout(() => setCopiedDetailField(null), 2000);
  };

  const formatDateFull = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

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

  const fetchRewards = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch rank rewards.');
      const data = await res.json();
      setRewards(data);
    } catch (err: any) {
      triggerError(err.message || 'Error fetching rank rewards.');
    }
  };

  const handleProcessMonthlyRewards = async () => {
    setProcessingRewards(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/rewards/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Processing monthly rewards failed.');
      const data = await res.json();
      triggerSuccess(data.message || 'Monthly royalties processed successfully.');
      await Promise.all([fetchRewards(), fetchUsers(), fetchCommissions(), fetchStats()]);
    } catch (err: any) {
      triggerError(err.message || 'Processing monthly rewards failed.');
    } finally {
      setProcessingRewards(false);
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
    } else if (tab === 'rewards') {
      await Promise.all([fetchRewards(), fetchUsers()]);
    } else if (tab === 'media') {
      await Promise.all([fetchImgbbSettings(), fetchImgbbImages()]);
    }
    setLoading(false);
  };


  useEffect(() => {
    if (token) {
      loadTabData(activeTab);
      fetchImgbbSettings();
    }
  }, [activeTab, token]);

  const handleRefresh = () => {
    loadTabData(activeTab);
  };

  // Product Operations
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setNewViewImageUrl('');
    setCustomColorInput('');
    setCustomSizeInput('');
    const nextCode = `BW-PRD-${String(products.length + 1).padStart(4, '0')}`;
    setProductForm({
      product_code: nextCode,
      name: '',
      description: '',
      price: 1999.00,
      sw: 20,
      image_url: '',
      images: [],
      colors: [],
      sizes: [],
      category: categories[0]?.name || 'Electronics',
      stock: 100
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCustomCategory(false);
    setNewViewImageUrl('');
    setCustomColorInput('');
    setCustomSizeInput('');
    const prodImages = prod.images && prod.images.length > 0
      ? prod.images
      : (prod.image_url ? [prod.image_url] : []);

    setProductForm({
      product_code: prod.product_code || '',
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      sw: prod.sw,
      image_url: prod.image_url || (prodImages[0] || ''),
      images: prodImages,
      colors: prod.colors || [],
      sizes: prod.sizes || [],
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
    if (!productForm.product_code.trim()) {
      triggerError('Please enter a unique Product Code (e.g. BW-PRD-001).');
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

  const handleOpenCredentialsModal = (user: UserListItem) => {
    setCredentialsTargetUser(user);
    setCredentialsForm({
      username: user.username,
      password: ''
    });
    setShowNewPassword(false);
    setIsCredentialsModalOpen(true);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsTargetUser) return;

    const trimmedUsername = credentialsForm.username.trim().toLowerCase();
    const trimmedPassword = credentialsForm.password.trim();

    if (!trimmedUsername && !trimmedPassword) {
      triggerError('Please provide a valid username or new password.');
      return;
    }

    if (trimmedUsername) {
      if (trimmedUsername.length < 3) {
        triggerError('Username must be at least 3 characters.');
        return;
      }
      if (/\s/.test(trimmedUsername)) {
        triggerError('Username cannot contain spaces.');
        return;
      }
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        triggerError('Username can only contain letters, numbers, and underscores.');
        return;
      }
    }

    if (trimmedPassword) {
      if (trimmedPassword.length < 6) {
        triggerError('Password must be at least 6 characters.');
        return;
      }
      if (/\s/.test(trimmedPassword)) {
        triggerError('Password cannot contain spaces.');
        return;
      }
    }

    const payload: { username?: string; password?: string } = {};
    if (trimmedUsername && trimmedUsername !== credentialsTargetUser.username) {
      payload.username = trimmedUsername;
    }
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    if (Object.keys(payload).length === 0) {
      triggerError('No changes detected. Modify the username or enter a new password.');
      return;
    }

    setIsSubmittingCredentials(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${credentialsTargetUser.id}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update credentials.');
      }
      triggerSuccess(`Credentials updated successfully for @${data.username || credentialsTargetUser.username}!`);
      setIsCredentialsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      triggerError(err.message || 'Credentials update failed.');
    } finally {
      setIsSubmittingCredentials(false);
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
      if (nextStatus === 'completed') {
        triggerSuccess(`Order #${orderId} approved! Sales volume credited and business team commissions distributed.`);
      } else {
        triggerSuccess(`Order #${orderId} cancelled. Inventory stock restored.`);
      }
      fetchOrders();
      fetchUsers();
      fetchCommissions();
      fetchRewards();
    } catch (err: any) {
      triggerError(err.message || 'Order adjustment failed.');
    }
  };

  // Dispatch & Postal Tracking Operations
  const handleOpenDispatchModal = (order: OrderListItem) => {
    setSelectedDispatchOrder(order);
    setDispatchForm({
      dispatch_status: order.dispatch_status && order.dispatch_status !== 'pending' ? order.dispatch_status : 'dispatched',
      courier_name: order.courier_name || 'Speed Post',
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
      dispatch_notes: order.dispatch_notes || ''
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatchOrder) return;
    if (dispatchForm.dispatch_status === 'dispatched' && !dispatchForm.tracking_number.trim()) {
      triggerError('Please enter a postal tracking / consignment number (e.g. EK123456789IN).');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${selectedDispatchOrder.id}/dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dispatchForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update dispatch tracking.');
      }

      triggerSuccess(`Order #${selectedDispatchOrder.id} postal dispatch details saved! Tracking ID: ${dispatchForm.tracking_number || 'Updated'}`);
      setIsDispatchModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      triggerError(err.message || 'Error updating dispatch tracking.');
    }
  };

  const handleQuickMarkDelivered = async (orderId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dispatch_status: 'delivered',
          courier_name: 'Speed Post',
          tracking_url: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update order to delivered.');
      }

      triggerSuccess(`Order #${orderId} marked as DELIVERED to recipient!`);
      fetchOrders();
    } catch (err: any) {
      triggerError(err.message || 'Error marking order delivered.');
    }
  };

  const handlePrintPostalSlip = (order: OrderListItem) => {
    const buyer = order.user || getUserById(order.user_id);
    const recipientName = order.shipping_name || buyer?.full_name || `Customer #${order.user_id}`;
    const address = order.shipping_address || 'Address on file';
    const city = order.shipping_city || '';
    const state = order.shipping_state || '';
    const zip = order.shipping_zip || '';
    const phone = order.shipping_phone || buyer?.phone_number || '';
    const trackingNo = order.tracking_number || 'PENDING DISPATCH';
    const courier = order.courier_name || 'Speed Post';
    const itemsList = order.items.map(i => {
      const parts = [`${i.quantity}x ${i.product ? i.product.name : 'Product'}`];
      const variants = [];
      if (i.selected_color) variants.push(`Color: ${i.selected_color}`);
      if (i.selected_size) variants.push(`Size: ${i.selected_size}`);
      if (variants.length > 0) parts.push(`[${variants.join(', ')}]`);
      parts.push(`(₹${i.price.toFixed(2)})`);
      return parts.join(' ');
    }).join(', ');

    const printWindow = window.open('', '_blank', 'width=750,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Postal Dispatch Label - Order #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 25px; color: #111; }
          .parcel-label { border: 2px dashed #222; padding: 22px; max-width: 620px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #991b1b; }
          .subtitle { font-size: 11px; color: #444; font-weight: bold; }
          .tracking-box { background: #f4f4f5; border: 1.5px solid #71717a; padding: 10px 14px; margin: 14px 0; font-family: 'Courier New', monospace; font-size: 16px; font-weight: 900; }
          .address-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
          .box { border: 1px solid #a1a1aa; padding: 12px; border-radius: 6px; }
          .box h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #52525b; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
          .box p { margin: 3px 0; font-size: 13px; line-height: 1.4; }
          .bold { font-weight: bold; }
          .items { margin-top: 14px; font-size: 11px; border-top: 1px solid #e4e4e7; padding-top: 10px; color: #3f3f46; }
          .barcode { font-family: 'Courier New', monospace; letter-spacing: 5px; font-size: 22px; text-align: center; margin: 10px 0; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 9px 18px; background: #0f172a; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print Postal Label</button>
        </div>
        <div class="parcel-label">
          <div class="header">
            <div>
              <div class="title">${courier}</div>
              <div class="subtitle">Logistics & Consignment Delivery</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 15px; font-weight: 900;">ORDER #00${order.id}</div>
              <div style="font-size: 11px; color: #666;">Date: ${new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="tracking-box">
            <span>CONSIGNMENT / POSTAL TRACKING NO: </span>
            <span style="color: #0284c7; text-decoration: underline;">${trackingNo}</span>
          </div>

          <div class="barcode">||| ||||| || |||||| | ||| |||| | |||||</div>

          <div class="address-section">
            <div class="box">
              <h4>📦 DELIVER TO (CONSIGNEE):</h4>
              <p class="bold" style="font-size: 14px; color: #0f172a;">${recipientName}</p>
              <p>${address}</p>
              <p>${city} ${state ? ', ' + state : ''}</p>
              <p class="bold" style="font-size: 14px; margin-top: 4px;">PIN: ${zip || 'N/A'}</p>
              ${phone ? `<p class="bold" style="margin-top: 6px; color: #047857;">📞 Mobile: ${phone}</p>` : ''}
            </div>

            <div class="box">
              <h4>🏢 SENDER (DISPATCH HUB):</h4>
              <p class="bold">Business Fulfillment Center</p>
              <p>National Logistics & Distribution Central Hub</p>
              <p>Customer Support: support@business.com</p>
              <p style="margin-top: 8px; font-size: 11px; color: #555;">Payment Status: <strong>PAID (Prepaid UPI)</strong></p>
            </div>
          </div>

          <div class="items">
            <strong>Package Contents:</strong> ${itemsList} <br/>
            <strong>Total Order Value:</strong> ₹${order.total_amount.toFixed(2)} (${order.total_sw} SW)
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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
      (p.product_code && p.product_code.toLowerCase().includes(productSearch.toLowerCase())) ||
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
    const utr = o.upi_trans_id || '';
    const tracking = o.tracking_number || '';
    const courier = o.courier_name || '';

    const matchesSearch =
      o.id.toString().includes(orderSearch) ||
      buyerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      buyerUser.toLowerCase().includes(orderSearch.toLowerCase()) ||
      utr.toLowerCase().includes(orderSearch.toLowerCase()) ||
      tracking.toLowerCase().includes(orderSearch.toLowerCase()) ||
      courier.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status.toLowerCase().includes(orderSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (dispatchFilter === 'all') return true;
    if (dispatchFilter === 'pending') return o.status === 'pending';
    if (dispatchFilter === 'ready_dispatch') return o.status === 'completed' && (!o.dispatch_status || o.dispatch_status === 'pending');
    if (dispatchFilter === 'dispatched') return o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit';
    if (dispatchFilter === 'delivered') return o.dispatch_status === 'delivered';
    if (dispatchFilter === 'cancelled') return o.status === 'cancelled';

    return true;
  });
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-md">
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
            Admin tools for products catalog database, genealogy trees, order completion payouts, and ledger balance auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-full font-bold text-xs cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-amber-500' : ''} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-red-400 hover:text-red-300 rounded-full font-bold text-xs cursor-pointer transition-colors shadow-sm"
            title="Sign Out Administrator"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-850 gap-1.5 overflow-x-auto pb-px mb-8 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {(
          [
            { id: 'dashboard', label: 'Overview', count: null },
            { id: 'products', label: 'Catalog Items', count: products.length },
            { id: 'categories', label: 'Categories', count: categories.length },
            { id: 'users', label: 'Members', count: users.length },
            { id: 'orders', label: 'Order Processing', count: orders.length },
            { id: 'commissions', label: 'Payout Auditing', count: commissions.length },
            { id: 'rewards', label: 'Rank Royalties', count: rewards.length },
            { id: 'media', label: 'Cloud Storage (ImgBB)', count: imgbbSettings?.pending_images ?? null }
          ] as { id: TabType; label: string; count: number | null }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-xs cursor-pointer tracking-wide transition-all shrink-0 ${activeTab === t.id
                ? 'bg-slate-900 border border-slate-850 text-rose-500 shadow-sm relative -bottom-px'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
          >
            <div className="flex items-center gap-2">
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${activeTab === t.id ? 'bg-rose-500/10 text-rose-500 font-bold' : 'bg-slate-950 text-slate-500'
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
      {loading && activeTab === 'dashboard' && !stats ? (
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
                    <p className="text-[10px] text-slate-400">Total matched business volume points</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/10">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Sales ₹ amount */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Gross Sales</span>
                    <h3 className="text-2xl font-black text-white font-mono">
                      ₹{stats.total_sales_amount.toFixed(2)}
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
                      ₹{stats.total_commissions_amount.toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-400">Total referral payouts</p>
                  </div>
                  <div className="p-3 bg-amber-400/10 text-amber-400 rounded-xl border border-amber-450/10">
                    <IndianRupee size={20} />
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
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.status === 'active'
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
                            <div className="font-mono text-xs text-slate-200 font-bold">₹{o.total_amount.toFixed(2)}</div>
                            <span
                              className={`text-[9px] font-bold ${o.status === 'completed'
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
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-rose-500" />
                            <span className="text-xs font-mono">Loading product catalog...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          {productSearch ? 'No products match your search.' : 'No products found.'}
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
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{p.name}</span>
                                {p.product_code && (
                                  <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {p.product_code}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[240px] font-normal">
                                {p.description || 'No description provided.'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {p.images && p.images.length > 1 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                    📸 {p.images.length} views
                                  </span>
                                )}
                                {p.colors && p.colors.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    🎨 {p.colors.length} {p.colors.length === 1 ? 'color' : 'colors'}
                                  </span>
                                )}
                                {p.sizes && p.sizes.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    📏 {p.sizes.length} {p.sizes.length === 1 ? 'size' : 'sizes'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-350">{p.category || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                            ₹{p.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                            {p.sw} SW
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${p.stock <= 5
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
                {loading ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono">Loading products...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    {productSearch ? 'No products match your search.' : 'No products found.'}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-200 text-sm truncate">{p.name}</h4>
                            {p.product_code && (
                              <span className="px-1.5 py-0.2 rounded font-mono text-[8.5px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {p.product_code}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal truncate">{p.category || 'Uncategorized'}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {p.images && p.images.length > 1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                📸 {p.images.length} views
                              </span>
                            )}
                            {p.colors && p.colors.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                🎨 {p.colors.length} colors
                              </span>
                            )}
                            {p.sizes && p.sizes.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                📏 {p.sizes.length} sizes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-normal line-clamp-2 leading-relaxed">
                        {p.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-sans">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-350">Price: <span className="font-mono text-slate-200 font-bold">₹{p.price.toFixed(2)}</span></div>
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
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-rose-500" />
                            <span className="text-xs font-mono">Loading categories...</span>
                          </div>
                        </td>
                      </tr>
                    ) : categories.length === 0 ? (
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
                {loading ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono">Loading categories...</span>
                  </div>
                ) : categories.length === 0 ? (
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
                      <th className="py-3 px-4 text-center">Business Leg Volumes (SW)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-855 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-rose-500" />
                            <span className="text-xs font-mono">Loading members list...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          {userSearch ? 'No members match your search.' : 'No members found.'}
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
                              <div className="text-[10px] text-slate-350 flex items-center gap-2 mt-0.5 font-mono">
                                <span>📞 {u.phone_number || u.phone || 'No phone'}</span>
                                <span>•</span>
                                <span title="Signup Date">📅 {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
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
                              ₹{u.wallet_balance.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-200">
                              <div className="font-bold">{u.personal_sw} SW</div>
                              {u.pending_sw && u.pending_sw > 0 ? (
                                <div className="text-[10px] text-amber-400 font-bold font-mono">
                                  (+{u.pending_sw} SW Pending)
                                </div>
                              ) : null}
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
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.status === 'active'
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
                                  onClick={() => handleOpenUserDetailsModal(u)}
                                  className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-[10px] font-bold text-sky-400 rounded cursor-pointer transition-colors flex items-center gap-1"
                                  title="View Full Profile, Phone, Timestamps & Bank Details"
                                >
                                  <Eye size={11} />
                                  Details
                                </button>
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
                                <button
                                  onClick={() => handleOpenCredentialsModal(u)}
                                  className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 rounded cursor-pointer transition-colors flex items-center gap-1"
                                  title="Edit Username or Password"
                                >
                                  <Key size={11} />
                                  Credentials
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
                {loading ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono">Loading members...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl font-normal">
                    {userSearch ? 'No members match your search.' : 'No members found.'}
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
                            <div className="text-[10px] text-slate-450 font-normal">@{u.username} ({u.email})</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              📞 {u.phone_number || u.phone || 'No phone'} • 📅 {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                              {u.status === 'active' && u.activated_at && (
                                <span className="text-emerald-400 ml-1.5">• Act: {new Date(u.activated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                              )}
                            </div>
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
                            <span className="font-bold font-mono text-amber-400">₹{u.wallet_balance.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] font-bold">Personal Volume</span>
                            <span className="font-bold font-mono text-slate-300">{u.personal_sw} SW</span>
                            {u.pending_sw && u.pending_sw > 0 ? (
                              <span className="block text-[9px] text-amber-400 font-bold font-mono">
                                (+{u.pending_sw} SW Pending)
                              </span>
                            ) : null}
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
                          <button onClick={() => handleOpenUserDetailsModal(u)} className="flex-1 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-[10px] font-bold text-sky-400 rounded cursor-pointer transition-colors text-center flex items-center justify-center gap-1">
                            <Eye size={11} />
                            Details
                          </button>
                          <button onClick={() => handleToggleUserStatus(u)} className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold rounded cursor-pointer transition-colors text-center text-slate-355 hover:text-white">
                            Toggle Status
                          </button>
                          <button onClick={() => handleOpenWalletModal(u)} className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-500 rounded cursor-pointer transition-colors text-center">
                            Adjust Balance
                          </button>
                          <button onClick={() => handleOpenCredentialsModal(u)} className="flex-1 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 rounded cursor-pointer transition-colors text-center flex items-center justify-center gap-1">
                            <Key size={11} />
                            Credentials
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ORDERS & DISPATCH MANAGEMENT TAB */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Header & Stats Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-850 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold uppercase text-[9px] tracking-wider font-sans flex items-center gap-1">
                      <Truck size={12} />
                      Logistics & Dispatch Management
                    </span>
                    <span className="text-slate-400 font-mono text-xs">Logistics & Fulfillment Integration</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1 uppercase tracking-tight font-sans flex items-center gap-2">
                    <span>Order Processing & Fulfillment</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Verify UPI payments, print shipping slips, enter consignment tracking numbers (Speed Post / Courier), and keep members updated with live tracking.
                  </p>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div
                  onClick={() => setDispatchFilter('all')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${dispatchFilter === 'all'
                      ? 'bg-slate-850 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                    }`}
                >
                  <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Total Orders</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">{orders.length}</div>
                  <span className="text-[9px] text-slate-400">All placed orders</span>
                </div>

                <div
                  onClick={() => setDispatchFilter('pending')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${dispatchFilter === 'pending'
                      ? 'bg-amber-950/30 border-amber-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                    }`}
                >
                  <span className="text-amber-400 text-[9px] uppercase font-bold tracking-wider block">Awaiting Verification</span>
                  <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                  <span className="text-[9px] text-slate-400">Needs admin approval</span>
                </div>

                <div
                  onClick={() => setDispatchFilter('ready_dispatch')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${dispatchFilter === 'ready_dispatch'
                      ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                    }`}
                >
                  <span className="text-blue-400 text-[9px] uppercase font-bold tracking-wider block flex items-center gap-1">
                    <Package size={10} />
                    Ready for Dispatch
                  </span>
                  <div className="text-lg font-black text-blue-300 font-mono mt-0.5">
                    {orders.filter(o => o.status === 'completed' && (!o.dispatch_status || o.dispatch_status === 'pending')).length}
                  </div>
                  <span className="text-[9px] text-blue-400/80 font-bold">Needs postal booking</span>
                </div>

                <div
                  onClick={() => setDispatchFilter('dispatched')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${dispatchFilter === 'dispatched'
                      ? 'bg-sky-950/40 border-sky-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                    }`}
                >
                  <span className="text-sky-400 text-[9px] uppercase font-bold tracking-wider block flex items-center gap-1">
                    <Truck size={10} />
                    In Postal Transit
                  </span>
                  <div className="text-lg font-black text-sky-300 font-mono mt-0.5">
                    {orders.filter(o => o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit').length}
                  </div>
                  <span className="text-[9px] text-slate-400">Tracking assigned</span>
                </div>

                <div
                  onClick={() => setDispatchFilter('delivered')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${dispatchFilter === 'delivered'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                    }`}
                >
                  <span className="text-emerald-400 text-[9px] uppercase font-bold tracking-wider block flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Delivered
                  </span>
                  <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                    {orders.filter(o => o.dispatch_status === 'delivered').length}
                  </div>
                  <span className="text-[9px] text-slate-400">Postal delivery complete</span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-850">
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Orders', count: orders.length },
                    { id: 'pending', label: 'Pending Approval', count: orders.filter(o => o.status === 'pending').length },
                    { id: 'ready_dispatch', label: '📦 Ready to Post', count: orders.filter(o => o.status === 'completed' && (!o.dispatch_status || o.dispatch_status === 'pending')).length },
                    { id: 'dispatched', label: '🚚 In Postal Transit', count: orders.filter(o => o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit').length },
                    { id: 'delivered', label: '✅ Delivered', count: orders.filter(o => o.dispatch_status === 'delivered').length },
                    { id: 'cancelled', label: '❌ Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDispatchFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${dispatchFilter === f.id
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                    >
                      <span>{f.label}</span>
                      <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${dispatchFilter === f.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950 text-slate-400'
                        }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search orders */}
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search Order #, Tracking ID, Consignee, City..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <Search size={14} className="absolute left-3 top-2 text-slate-500" />
                </div>
              </div>

              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-850 font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-850 font-mono">
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Postal Delivery Address (Consignee)</th>
                      <th className="py-3 px-4">Items & Amount</th>
                      <th className="py-3 px-4">Payment & UTR</th>
                      <th className="py-3 px-4">Postal Dispatch & Tracking</th>
                      <th className="py-3 px-4 text-center">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-rose-500" />
                            <span className="text-xs font-mono">Loading orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <Package size={32} className="mx-auto text-slate-600 mb-2" />
                          <div className="font-bold text-slate-300">No orders match your filter criteria</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Try clearing search or changing the filter tab above.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const buyer = o.user || getUserById(o.user_id);
                        const isApproved = o.status === 'completed';
                        const isPending = o.status === 'pending';
                        const isCancelled = o.status === 'cancelled';
                        const isDispatched = o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit';
                        const isDelivered = o.dispatch_status === 'delivered';
                        const isAwaitingDispatch = isApproved && (!o.dispatch_status || o.dispatch_status === 'pending');

                        const recipientName = o.shipping_name || buyer?.full_name || `User #${o.user_id}`;
                        const recipientPhone = o.shipping_phone || buyer?.phone_number || '';
                        const fullAddressString = [
                          o.shipping_address,
                          o.shipping_city,
                          o.shipping_state,
                          o.shipping_zip ? `PIN: ${o.shipping_zip}` : ''
                        ].filter(Boolean).join(', ');

                        return (
                          <tr key={o.id} className="hover:bg-slate-950/40 transition-colors font-normal">
                            {/* Order ID & Date */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-bold text-slate-100 font-mono text-sm">#Order 00{o.id}</div>
                              <div className="text-[10px] text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                                <Clock size={11} className="text-slate-500" />
                                {new Date(o.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-[10px] text-amber-400 font-mono font-bold mt-1">
                                {o.total_sw} SW Volume
                              </div>
                            </td>

                            {/* Consignee & Shipping Destination */}
                            <td className="py-3.5 px-4 align-top max-w-[240px]">
                              <div className="font-bold text-slate-100 text-xs flex items-center gap-1">
                                <span>{recipientName}</span>
                                {buyer && <span className="text-[10px] text-slate-400 font-normal">(@{buyer.username})</span>}
                              </div>

                              {fullAddressString ? (
                                <div className="text-[11px] text-slate-300 mt-1 leading-tight flex items-start gap-1">
                                  <MapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                  <span>{fullAddressString}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic mt-0.5">
                                  Address on Member Profile
                                </div>
                              )}

                              {recipientPhone && (
                                <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                                  <Phone size={10} className="shrink-0" />
                                  <span>{recipientPhone}</span>
                                </div>
                              )}

                              {/* Quick copy address */}
                              {fullAddressString && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fullText = `${recipientName}, ${fullAddressString}${recipientPhone ? ', Phone: ' + recipientPhone : ''}`;
                                    navigator.clipboard.writeText(fullText);
                                    triggerSuccess('Copied shipping address to clipboard!');
                                  }}
                                  className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded text-[9px] border border-slate-800 transition-colors cursor-pointer"
                                  title="Copy complete postal label address"
                                >
                                  <Copy size={10} />
                                  <span>Copy Address</span>
                                </button>
                              )}
                            </td>

                            {/* Items & Price */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-mono font-black text-slate-100 text-sm">
                                ₹{o.total_amount.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400 space-y-1.5 mt-1 max-w-[220px]">
                                {o.items.map((item, idx) => (
                                  <div key={idx} className="space-y-0.5">
                                    <div className="line-clamp-1 font-medium text-slate-300">
                                      {item.quantity}x {item.product ? item.product.name : `Product #${item.product_id}`}
                                    </div>
                                    {(item.selected_color || item.selected_size) && (
                                      <div className="flex flex-wrap items-center gap-1">
                                        {item.selected_color && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-slate-950 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-mono">
                                            🎨 {item.selected_color}
                                          </span>
                                        )}
                                        {item.selected_size && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-slate-950 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono">
                                            📏 {item.selected_size}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Payment & UTR */}
                            <td className="py-3.5 px-4 align-top">
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${isApproved
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : isPending
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}
                                >
                                  {isApproved && <Check size={10} />}
                                  {isPending && <Clock size={10} />}
                                  {isApproved ? 'PAYMENT VERIFIED' : isPending ? 'PENDING UTR CHECK' : 'CANCELLED'}
                                </span>
                              </div>

                              {o.upi_trans_id ? (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <span className="font-mono text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] font-bold">
                                    UTR: {o.upi_trans_id}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(o.upi_trans_id || '');
                                      triggerSuccess(`Copied UTR: ${o.upi_trans_id}`);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-200 bg-slate-950 rounded border border-slate-800 transition-colors cursor-pointer"
                                    title="Copy UTR to verify in Bank"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 font-mono mt-1">No UTR logged</div>
                              )}

                              {o.upi_payer_vpa && (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  VPA: {o.upi_payer_vpa}
                                </div>
                              )}
                            </td>

                            {/* Postal Dispatch & Tracking Status */}
                            <td className="py-3.5 px-4 align-top max-w-[260px]">
                              {isPending ? (
                                <div className="text-[11px] text-amber-400/80 bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg">
                                  <span>⚠️ Approve payment first before postal dispatch.</span>
                                </div>
                              ) : isCancelled ? (
                                <div className="text-[10px] text-slate-500 italic">Order cancelled</div>
                              ) : isAwaitingDispatch ? (
                                <div className="space-y-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold rounded-md text-[10px] animate-pulse">
                                    <Package size={11} />
                                    <span>Ready for Postal Dispatch</span>
                                  </span>
                                  <div className="text-[10px] text-slate-400">
                                    Book parcel with courier service and enter Consignment Number.
                                  </div>
                                </div>
                              ) : isDispatched ? (
                                <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                                      <Truck size={12} />
                                      {o.courier_name || 'Speed Post'}
                                    </span>
                                    <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded text-[9px] font-bold uppercase">
                                      In Transit
                                    </span>
                                  </div>

                                  {/* Tracking ID Badge */}
                                  {o.tracking_number ? (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="font-mono font-bold text-slate-100 bg-slate-900 px-2 py-0.5 rounded border border-slate-750 text-xs tracking-wider select-all">
                                        {o.tracking_number}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(o.tracking_number || '');
                                          triggerSuccess(`Copied Tracking Number: ${o.tracking_number}`);
                                        }}
                                        className="p-1 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 cursor-pointer transition-colors"
                                        title="Copy Tracking ID"
                                      >
                                        <Copy size={11} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 italic">No Tracking ID entered</span>
                                  )}

                                  {/* Direct Link to Postal Portal */}
                                  <div className="pt-1 flex items-center justify-between text-[10px]">
                                    <a
                                      href={o.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                      <span>Track Shipment Online</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  </div>

                                  {o.dispatched_at && (
                                    <div className="text-[9px] text-slate-500">
                                      Dispatched: {new Date(o.dispatched_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ) : isDelivered ? (
                                <div className="space-y-1 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                                    <CheckCircle2 size={12} />
                                    <span>Delivered to Recipient</span>
                                  </div>
                                  {o.tracking_number && (
                                    <div className="text-[10px] font-mono text-slate-300">
                                      Consignment: <strong className="text-white">{o.tracking_number}</strong>
                                    </div>
                                  )}
                                  {o.delivered_at && (
                                    <div className="text-[9px] text-slate-400">
                                      Delivered on: {new Date(o.delivered_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-center align-top">
                              <div className="flex flex-col items-center gap-1.5 font-sans">
                                {/* If Pending: Approve / Cancel */}
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                                      className="w-full px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded flex items-center justify-center gap-1 text-[11px] shadow-sm cursor-pointer transition-colors"
                                      title="Approve Order & Credit Sales Wallet"
                                    >
                                      <Check size={12} />
                                      <span>Approve Payment</span>
                                    </button>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                                      className="w-full px-3 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-bold rounded border border-red-500/20 flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                                      title="Cancel Order & Restore Stock"
                                    >
                                      <X size={11} />
                                      <span>Cancel</span>
                                    </button>
                                  </>
                                )}

                                {/* If Approved & Ready for Dispatch: Prominent Dispatch Action */}
                                {isApproved && isAwaitingDispatch && (
                                  <>
                                    <button
                                      onClick={() => handleOpenDispatchModal(o)}
                                      className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-extrabold rounded flex items-center justify-center gap-1.5 text-[11px] shadow-md cursor-pointer transition-all active:scale-95"
                                      title="Dispatch via Postal Service & Add Tracking ID"
                                    >
                                      <Truck size={13} />
                                      <span>Dispatch Parcel</span>
                                    </button>
                                    <button
                                      onClick={() => handlePrintPostalSlip(o)}
                                      className="w-full px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold rounded border border-slate-800 flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                                      title="Print Postal Dispatch Slip"
                                    >
                                      <Printer size={11} />
                                      <span>Print Slip</span>
                                    </button>
                                  </>
                                )}

                                {/* If Dispatched / In Transit: Update Tracking or Mark Delivered */}
                                {isApproved && isDispatched && (
                                  <>
                                    <button
                                      onClick={() => handleOpenDispatchModal(o)}
                                      className="w-full px-2.5 py-1 bg-slate-850 hover:bg-slate-750 text-sky-300 font-bold rounded border border-sky-500/30 flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                                      title="Edit Courier or Tracking ID"
                                    >
                                      <Edit2 size={10} />
                                      <span>Edit Tracking</span>
                                    </button>
                                    <button
                                      onClick={() => handleQuickMarkDelivered(o.id)}
                                      className="w-full px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold rounded border border-emerald-500/30 flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                                      title="Mark as Delivered to Customer"
                                    >
                                      <Check size={11} />
                                      <span>Mark Delivered</span>
                                    </button>
                                    <button
                                      onClick={() => handlePrintPostalSlip(o)}
                                      className="w-full px-2 py-0.5 text-slate-400 hover:text-slate-200 text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                      title="Print Postal Dispatch Slip"
                                    >
                                      <Printer size={10} />
                                      <span>Print Label</span>
                                    </button>
                                  </>
                                )}

                                {/* If Delivered: Option to edit / print */}
                                {isApproved && isDelivered && (
                                  <div className="space-y-1 w-full">
                                    <button
                                      onClick={() => handlePrintPostalSlip(o)}
                                      className="w-full px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded border border-slate-800 flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                                    >
                                      <Printer size={10} />
                                      <span>Print Slip</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenDispatchModal(o)}
                                      className="w-full px-2 py-0.5 text-slate-500 hover:text-slate-300 text-[9px] cursor-pointer"
                                    >
                                      Edit Details
                                    </button>
                                  </div>
                                )}
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
              <div className="block md:hidden space-y-4 font-sans text-xs">
                {loading ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-950/20 border border-slate-855 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono">Loading orders...</span>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-950/20 border border-slate-855 rounded-xl font-normal">
                    <Package size={28} className="mx-auto text-slate-600 mb-1" />
                    <div>No orders matched your filters.</div>
                  </div>
                ) : (
                  filteredOrders.map((o) => {
                    const buyer = o.user || getUserById(o.user_id);
                    const isApproved = o.status === 'completed';
                    const isPending = o.status === 'pending';
                    const isDispatched = o.dispatch_status === 'dispatched' || o.dispatch_status === 'in_transit';
                    const isDelivered = o.dispatch_status === 'delivered';
                    const isAwaitingDispatch = isApproved && (!o.dispatch_status || o.dispatch_status === 'pending');
                    const recipientName = o.shipping_name || buyer?.full_name || `User #${o.user_id}`;
                    const fullAddressString = [
                      o.shipping_address,
                      o.shipping_city,
                      o.shipping_state,
                      o.shipping_zip ? `PIN: ${o.shipping_zip}` : ''
                    ].filter(Boolean).join(', ');

                    return (
                      <div key={o.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 shadow-sm text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                          <div>
                            <div className="font-bold text-slate-100 text-xs">Order #00{o.id}</div>
                            <div className="text-[9px] text-slate-400 font-normal">
                              {new Date(o.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isPending
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                              {isApproved ? 'VERIFIED' : isPending ? 'PENDING' : 'CANCELLED'}
                            </span>
                          </div>
                        </div>

                        {/* Customer Delivery Details */}
                        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 text-[10.5px]">
                          <div className="font-bold text-slate-200 flex items-center justify-between">
                            <span>📦 TO: {recipientName}</span>
                            {buyer && <span className="text-[9px] text-slate-400">@{buyer.username}</span>}
                          </div>
                          {fullAddressString && (
                            <div className="text-slate-300 leading-tight text-[10px]">
                              {fullAddressString}
                            </div>
                          )}
                          {o.shipping_phone && (
                            <div className="text-emerald-400 font-mono text-[9.5px]">
                              📞 {o.shipping_phone}
                            </div>
                          )}
                        </div>

                        {/* Items & Amount */}
                        <div className="space-y-2 pt-1 border-t border-slate-850/60">
                          <div className="flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-mono text-slate-100 font-black text-sm">₹{o.total_amount.toFixed(2)}</span>
                              <span className="text-amber-400 font-mono font-bold ml-2">({o.total_sw} SW)</span>
                            </div>
                            {o.upi_trans_id && (
                              <span className="font-mono text-emerald-400 text-[10px] font-bold">
                                UTR: {o.upi_trans_id}
                              </span>
                            )}
                          </div>

                          {/* Ordered items breakdown */}
                          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850/60 space-y-1">
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Ordered Items:</div>
                            {o.items.map((item, idx) => (
                              <div key={idx} className="text-[10px] text-slate-300 flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-slate-200">{item.quantity}x</span> {item.product ? item.product.name : `Product #${item.product_id}`}
                                  {(item.selected_color || item.selected_size) && (
                                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                      {item.selected_color && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-slate-900 text-indigo-300 border border-indigo-500/30 rounded text-[8.5px] font-mono">
                                          🎨 {item.selected_color}
                                        </span>
                                      )}
                                      {item.selected_size && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-slate-900 text-amber-300 border border-amber-500/30 rounded text-[8.5px] font-mono">
                                          📏 {item.selected_size}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className="font-mono text-slate-400 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Status Card */}
                        {isDispatched && (
                          <div className="bg-sky-950/30 border border-sky-500/20 p-2.5 rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-sky-400">{o.courier_name || 'Speed Post'}</span>
                              <span className="text-sky-300 bg-sky-500/20 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase">In Transit</span>
                            </div>
                            <div className="font-mono font-bold text-white text-xs select-all">
                              Tracking: {o.tracking_number}
                            </div>
                            <a
                              href={o.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 font-bold text-[10px] inline-flex items-center gap-1 hover:underline pt-0.5"
                            >
                              <span>Track Shipment Online</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}

                        {isDelivered && (
                          <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            <span>Delivered to recipient</span>
                          </div>
                        )}

                        {/* Mobile Actions */}
                        <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-2">
                          {isPending && (
                            <>
                              <button onClick={() => handleUpdateOrderStatus(o.id, 'completed')} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1">
                                <Check size={12} /> Approve
                              </button>
                              <button onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded text-xs">
                                Cancel
                              </button>
                            </>
                          )}

                          {isApproved && isAwaitingDispatch && (
                            <>
                              <button onClick={() => handleOpenDispatchModal(o)} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white font-extrabold rounded text-xs flex items-center justify-center gap-1.5 shadow-md">
                                <Truck size={14} /> Dispatch Postal Parcel
                              </button>
                              <button onClick={() => handlePrintPostalSlip(o)} className="px-3 py-2 bg-slate-800 text-slate-200 rounded border border-slate-700 text-xs">
                                <Printer size={13} />
                              </button>
                            </>
                          )}

                          {isApproved && isDispatched && (
                            <>
                              <button onClick={() => handleOpenDispatchModal(o)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold rounded border border-sky-500/30 text-xs">
                                Edit Tracking
                              </button>
                              <button onClick={() => handleQuickMarkDelivered(o.id)} className="flex-1 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded text-xs">
                                Mark Delivered
                              </button>
                              <button onClick={() => handlePrintPostalSlip(o)} className="px-2.5 py-1.5 bg-slate-950 text-slate-300 rounded border border-slate-800 text-xs">
                                <Printer size={12} />
                              </button>
                            </>
                          )}

                          {isApproved && isDelivered && (
                            <button onClick={() => handlePrintPostalSlip(o)} className="w-full py-1.5 bg-slate-950 text-slate-300 rounded border border-slate-800 text-xs flex items-center justify-center gap-1">
                              <Printer size={12} /> Print Postal Slip
                            </button>
                          )}
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
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-rose-500" />
                            <span className="text-xs font-mono">Loading commission ledger logs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : commissions.length === 0 ? (
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
                              +₹{c.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${c.type === 'binary_matching'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : c.type === 'sponsor_matching_bonus'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : c.type === 'rank_level_reward'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : c.type === 'direct_referral'
                                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}
                              >
                                {c.type === 'binary_matching' ? 'Business Match' : c.type === 'sponsor_matching_bonus' ? '5-Level Sponsor' : c.type === 'rank_level_reward' ? 'Rank Royalty' : c.type.replace('_', ' ')}
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
                {loading ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono">Loading commissions...</span>
                  </div>
                ) : commissions.length === 0 ? (
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
                          <span className="font-mono font-bold text-emerald-555 text-sm">+₹{c.amount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1.5 text-[11px] font-normal text-slate-350">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[8px] uppercase font-bold">Reward Type:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${c.type === 'binary_matching'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : c.type === 'sponsor_matching_bonus'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : c.type === 'rank_level_reward'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : c.type === 'direct_referral'
                                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                              {c.type === 'binary_matching' ? 'Business Match' : c.type === 'sponsor_matching_bonus' ? '5-Level Sponsor' : c.type === 'rank_level_reward' ? 'Rank Royalty' : c.type.replace('_', ' ')}
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

          {/* RANK ROYALTIES TAB */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Rewards Summary & Action Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Royalty Streams</span>
                  <div className="text-2xl font-black text-white mt-1">{rewards.length} Streams</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    <span className="text-emerald-400 font-bold">{rewards.filter(r => r.status === 'active').length} Active</span> • {rewards.filter(r => r.status === 'completed').length} Completed
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Royalties Disbursed</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    ₹{rewards.reduce((sum, r) => sum + (r.months_paid * r.monthly_amount), 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Disbursed across all member levels</div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Monthly Payout Runner</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disburse pending monthly royalties due today.</p>
                  </div>
                  <button
                    onClick={handleProcessMonthlyRewards}
                    disabled={processingRewards}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={processingRewards ? 'animate-spin' : ''} />
                    <span>{processingRewards ? 'Processing Payouts...' : 'Trigger Monthly Royalties Payout'}</span>
                  </button>
                </div>
              </div>

              {/* Rewards Schedule Table */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      Member Rank & Royalty Schedules
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Schedule and audit details for all member rank royalties (Levels 1 to 10).
                    </p>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300 font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                        <th className="py-3.5 px-3">Member</th>
                        <th className="py-3.5 px-3">Level & Rank</th>
                        <th className="py-3.5 px-3">Monthly Royalty</th>
                        <th className="py-3.5 px-3">Progress</th>
                        <th className="py-3.5 px-3">Next Payout</th>
                        <th className="py-3.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <RefreshCw size={20} className="animate-spin text-rose-500" />
                              <span className="text-xs font-mono">Loading rank royalty schedules...</span>
                            </div>
                          </td>
                        </tr>
                      ) : rewards.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            No member rank royalty schedules created yet.
                          </td>
                        </tr>
                      ) : (
                        rewards.map((r) => {
                          const progressPct = Math.min((r.months_paid / r.total_months) * 100, 100);
                          return (
                            <tr key={r.id} className="hover:bg-slate-950/20 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-200">{r.user_username || `User #${r.user_id}`}</div>
                                <div className="text-[10px] text-slate-500 font-mono">ID: {r.user_id}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Star size={11} className="fill-current" />
                                  {r.level_name}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-white">
                                ₹{r.monthly_amount.toFixed(2)} <span className="text-slate-500 font-normal">/ mo</span>
                              </td>
                              <td className="py-3 px-3 min-w-[140px]">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                  <span>Month {r.months_paid} of {r.total_months}</span>
                                  <span>{progressPct.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPct}%` }} />
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">
                                {r.next_payout_at && r.status === 'active' ? (
                                  <span className="text-amber-400 font-mono">{new Date(r.next_payout_at).toLocaleDateString()}</span>
                                ) : (
                                  <span className="text-slate-600">Completed</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${r.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                  }`}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-rose-500" />
                      <span className="text-xs font-mono">Loading rewards...</span>
                    </div>
                  ) : rewards.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl">
                      No member rank royalty schedules created yet.
                    </div>
                  ) : (
                    rewards.map((r) => (
                      <div key={r.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs">{r.user_username || `User #${r.user_id}`}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-amber-400 font-bold">{r.level_name}</span>
                          <span className="font-mono font-bold text-white">₹{r.monthly_amount.toFixed(2)}/mo</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-850 flex justify-between">
                          <span>Paid: {r.months_paid}/{r.total_months} Months</span>
                          {r.next_payout_at && <span>Next: {new Date(r.next_payout_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CLOUD MEDIA & IMGBB MANAGEMENT TAB */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-fade-in">
              {/* Cloud Sync Status Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                  <Cloud size={240} className="text-rose-500" />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 rounded-xl shrink-0">
                      <Cloud size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-black text-white">ImgBB Cloud Image Storage</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          imgbbSettings?.api_key_configured
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {imgbbSettings?.api_key_configured ? '● Cloud Auto-Sync Active' : '○ API Key Required'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
                        When uploading product and category images, they are instantly stored locally for zero-latency editing, while an asynchronous background worker uploads them to your <strong>ImgBB</strong> cloud account and seamlessly updates your database links.
                      </p>
                    </div>
                  </div>

                  {/* Quick Batch Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <button
                      onClick={handleSyncAllImages}
                      disabled={syncingAllImages || !imgbbSettings?.api_key_configured}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      <UploadCloud size={15} className={syncingAllImages ? 'animate-bounce' : ''} />
                      <span>{syncingAllImages ? 'Syncing Images...' : 'Sync All Pending to Cloud'}</span>
                    </button>

                    <button
                      onClick={() => {
                        fetchImgbbSettings();
                        fetchImgbbImages();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-850">
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Media Files</span>
                    <span className="text-lg font-black font-mono text-white mt-0.5 block">{imgbbSettings?.total_images ?? 0}</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">ImgBB CDN Hosted</span>
                    <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">{imgbbSettings?.completed_images ?? 0}</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Pending Background Sync</span>
                    <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">{imgbbSettings?.pending_images ?? 0}</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Failed / Retry Needed</span>
                    <span className="text-lg font-black font-mono text-red-400 mt-0.5 block">{imgbbSettings?.failed_images ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* ImgBB API Key Configuration Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950 border border-slate-800 text-amber-500 rounded-lg">
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">ImgBB Cloud API Key</h3>
                      <p className="text-[11px] text-slate-400">
                        Your secret API key from <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-rose-400 underline hover:text-rose-300 font-semibold">api.imgbb.com</a>. Stored securely in database & .env.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {imgbbSettings?.api_key_configured && !isEditingKey && (
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                        <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Active Key:</span>
                        <span>{imgbbSettings.masked_key}</span>
                      </div>
                    )}

                    <button
                      onClick={() => setIsEditingKey(!isEditingKey)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isEditingKey ? 'Cancel' : (imgbbSettings?.api_key_configured ? 'Change Key' : 'Configure Key')}
                    </button>
                  </div>
                </div>

                {isEditingKey && (
                  <div className="mt-4 p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 animate-fade-in">
                    <label className="text-xs font-bold text-slate-300 block">Enter ImgBB API Key</label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 3a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p"
                        value={imgbbApiKeyInput}
                        onChange={(e) => setImgbbApiKeyInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={handleTestImgbbKey}
                          disabled={testingImgbb || !imgbbApiKeyInput.trim()}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {testingImgbb ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          onClick={handleSaveImgbbKey}
                          disabled={savingImgbbKey || !imgbbApiKeyInput.trim()}
                          className="w-full sm:w-auto px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        >
                          {savingImgbbKey ? 'Saving...' : 'Save & Activate'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Don't have a key? Go to <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">api.imgbb.com</a>, log in or sign up (100% free), and click <strong>Get API Key</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Image Uploads Ledger / Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                <div className="p-4 sm:p-5 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon size={16} className="text-rose-400" />
                      Uploaded Images & Background Sync Status
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Real-time status of local files and their mirrored cloud hosting links on ImgBB CDN.
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850 self-start sm:self-auto">
                    Showing {imgbbImages.length} images
                  </span>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-rose-500" />
                    <span className="font-mono">Loading media gallery...</span>
                  </div>
                ) : imgbbImages.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    <UploadCloud size={32} className="mx-auto mb-2 text-slate-700" />
                    <p className="font-semibold text-slate-400">No images uploaded yet</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Images uploaded when adding products or categories will appear here and sync to ImgBB automatically.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 border-b border-slate-850 text-slate-400 uppercase text-[9px] font-mono tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Preview</th>
                          <th className="py-3 px-4">Local Filename</th>
                          <th className="py-3 px-4">Cloud Status</th>
                          <th className="py-3 px-4">ImgBB Cloud Link</th>
                          <th className="py-3 px-4 text-right">Uploaded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        {imgbbImages.map((img) => (
                          <tr key={img.id} className="hover:bg-slate-850/40 transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={img.imgbb_url || img.local_url}
                                alt="Thumbnail"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-slate-950 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = img.local_url;
                                }}
                              />
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <div className="truncate max-w-[200px] text-slate-200" title={img.local_filename}>
                                {img.local_filename}
                              </div>
                              {img.file_size && (
                                <span className="text-[10px] text-slate-500">{(img.file_size / 1024).toFixed(1)} KB</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {img.status === 'completed' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <Check size={11} />
                                  ImgBB CDN Hosted
                                </span>
                              )}
                              {img.status === 'uploading' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  <RefreshCw size={11} className="animate-spin" />
                                  Uploading to ImgBB...
                                </span>
                              )}
                              {img.status === 'pending' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Clock size={11} />
                                  Pending Cloud Sync
                                </span>
                              )}
                              {img.status === 'failed' && (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                    <AlertCircle size={11} />
                                    Sync Failed
                                  </span>
                                  {img.error_message && (
                                    <p className="text-[10px] text-red-400/80 mt-0.5 truncate max-w-[200px]" title={img.error_message}>
                                      {img.error_message}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {img.imgbb_url ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={img.imgbb_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-rose-400 hover:text-rose-300 underline truncate max-w-[240px] flex items-center gap-1"
                                  >
                                    <span className="truncate">{img.imgbb_url}</span>
                                    <ExternalLink size={11} className="shrink-0" />
                                  </a>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(img.imgbb_url || '');
                                      triggerSuccess('Copied ImgBB URL to clipboard!');
                                    }}
                                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                                    title="Copy Link"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">Local Server: /static/...</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-[11px] text-slate-400 font-mono">
                              {new Date(img.created_at).toLocaleDateString()}{' '}
                              <span className="text-slate-500 text-[10px]">{new Date(img.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* PRODUCT CREATION/EDIT MODAL OVERLAY */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-850 px-6 py-4 bg-slate-950/80 shrink-0">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans">
                <PlusCircle size={17} className="text-amber-500" />
                <span>{editingProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleProductSubmit} className="p-6 space-y-5 text-xs font-bold text-slate-200 overflow-y-auto flex-1">
              {/* 1. Core Product Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Code */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Product Code *</span>
                    <span className="text-[9px] text-amber-400 font-mono lowercase">e.g. BW-PRD-001</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BW-PRD-001"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-amber-300 font-mono tracking-wider font-bold focus:outline-none focus:border-amber-500 uppercase placeholder:text-slate-600"
                    value={productForm.product_code}
                    onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value.toUpperCase() })}
                  />
                  <span className="text-[9.5px] text-slate-500 font-normal block">
                    Unique product identifier used by admin to search, identify, and inventory items.
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Product Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vogue Ultra Slim Smart Watch"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-normal"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                {/* Category Selection from DB List */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Category *</label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-normal font-sans"
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name || ''}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Inventory */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Stock Inventory *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-normal"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-normal"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* SW points */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Sales Wallet (SW) *</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded">BV Points</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-normal"
                    value={productForm.sw}
                    onChange={(e) => setProductForm({ ...productForm, sw: parseInt(e.target.value) || 0 })}
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Product Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide detailed description, specifications, and warranty info..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-normal resize-none"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* 2. MULTIPLE PHOTO VIEWS & GALLERY MANAGEMENT */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5 font-sans">
                <div className="flex items-center justify-between border-b border-slate-850/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                      <Layers size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Multiple Product Views & Photo Gallery</h4>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Upload multiple photos (front, side, back, in-hand, detail view) so customers can browse angles.
                      </p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {productForm.images.length} {productForm.images.length === 1 ? 'View' : 'Views'}
                  </span>
                </div>

                {/* Upload & Add Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Multi-File Upload Button */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-400 font-semibold block">
                      📁 Upload Photos (Select One or Multiple Files):
                    </span>
                    <label className="relative flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-amber-500 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors text-[11px]">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleMultiImageUpload}
                        className="hidden"
                      />
                      <span>{uploading ? 'Uploading Photos...' : '+ Select Files from Computer'}</span>
                    </label>
                  </div>

                  {/* Add Photo by URL */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-400 font-semibold block">
                      🔗 Or Add Photo via Web URL:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-amber-500 font-normal"
                        value={newViewImageUrl}
                        onChange={(e) => setNewViewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                      >
                        + Add View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gallery Thumbnails List */}
                {productForm.images.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Gallery Views (First image is Cover Photo):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {productForm.images.map((imgUrl, idx) => {
                        const isCover = idx === 0;
                        return (
                          <div
                            key={idx}
                            className={`relative bg-slate-900 rounded-xl border p-2 flex flex-col gap-1.5 transition-all ${
                              isCover ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-slate-800'
                            }`}
                          >
                            {/* Image Thumbnail */}
                            <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 relative">
                              <img src={imgUrl} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                              <span
                                className={`absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                  isCover ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/90 text-slate-300'
                                }`}
                              >
                                {isCover ? 'Cover' : `View #${idx + 1}`}
                              </span>
                            </div>

                            {/* View Action Bar */}
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              {!isCover ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverImage(idx)}
                                  className="text-[9px] text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer"
                                  title="Make this the main cover photo"
                                >
                                  Make Cover
                                </button>
                              ) : (
                                <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                                  <Star size={9} fill="currentColor" /> Primary
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx - 1)}
                                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                    title="Move view earlier"
                                  >
                                    <ArrowUp size={10} />
                                  </button>
                                )}
                                {idx < productForm.images.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx + 1)}
                                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                    title="Move view later"
                                  >
                                    <ArrowDown size={10} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                  title="Delete this view"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 border border-slate-850/60 rounded-lg text-[11px] font-normal">
                    No photo views added yet. Upload files above or add an image URL to build this product's gallery.
                  </div>
                )}
              </div>

              {/* 3. COLOR VARIANTS MANAGEMENT */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-850/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                      <Palette size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Color Options & Swatches</h4>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Customers can choose from these colors on the product page.
                      </p>
                    </div>
                  </div>
                  <span className="text-rose-400 font-mono text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {productForm.colors.length} {productForm.colors.length === 1 ? 'Color' : 'Colors'}
                  </span>
                </div>

                {/* Active Color Chips */}
                <div className="space-y-1.5">
                  <span className="text-[9.5px] text-slate-400 font-semibold block">Configured Colors:</span>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-900 rounded-lg border border-slate-800 items-center">
                    {productForm.colors.length === 0 ? (
                      <span className="text-slate-500 text-[10px] italic">No color variants added (Product will not require color choice)</span>
                    ) : (
                      productForm.colors.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1.5 bg-slate-950 text-slate-200 border border-slate-750 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        >
                          <span>{c}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(c)}
                            className="text-slate-400 hover:text-red-400 cursor-pointer"
                            title={`Remove ${c}`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Add Palette Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] text-slate-400 font-semibold block">Quick 1-Click Color Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Black',
                      'White',
                      'Space Gray',
                      'Silver',
                      'Gold',
                      'Rose Gold',
                      'Royal Blue',
                      'Navy Blue',
                      'Red',
                      'Maroon',
                      'Emerald Green',
                      'Olive',
                      'Pink',
                      'Khaki'
                    ].map((colorPreset) => (
                      <button
                        key={colorPreset}
                        type="button"
                        onClick={() => handleAddColor(colorPreset)}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          productForm.colors.includes(colorPreset)
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 opacity-60'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        + {colorPreset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Adder */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter custom color (e.g. Midnight Cyan)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-rose-500 font-normal"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColor(customColorInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddColor(customColorInput)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              {/* 4. SIZE / OPTION VARIANTS MANAGEMENT */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-850/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Tag size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Size Variants & Options</h4>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Customers can choose from these size pills or option bundles.
                      </p>
                    </div>
                  </div>
                  <span className="text-sky-400 font-mono text-[10px] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {productForm.sizes.length} {productForm.sizes.length === 1 ? 'Size' : 'Sizes'}
                  </span>
                </div>

                {/* Active Size Chips */}
                <div className="space-y-1.5">
                  <span className="text-[9.5px] text-slate-400 font-semibold block">Configured Sizes:</span>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-900 rounded-lg border border-slate-800 items-center">
                    {productForm.sizes.length === 0 ? (
                      <span className="text-slate-500 text-[10px] italic">No size options defined (Product will not require size choice)</span>
                    ) : (
                      productForm.sizes.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 bg-slate-950 text-sky-300 border border-slate-750 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold"
                        >
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(s)}
                            className="text-slate-400 hover:text-red-400 cursor-pointer"
                            title={`Remove ${s}`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick 1-Click Preset Bundles */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] text-slate-400 font-semibold block">Quick 1-Click Size Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => ['S', 'M', 'L', 'XL', 'XXL'].forEach(handleAddSize)}
                      className="text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:bg-slate-850 hover:border-sky-500 transition-all cursor-pointer"
                    >
                      + Apparel (S, M, L, XL, XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => ['6', '7', '8', '9', '10', '11'].forEach(handleAddSize)}
                      className="text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:bg-slate-850 hover:border-sky-500 transition-all cursor-pointer"
                    >
                      + Footwear (6, 7, 8, 9, 10, 11)
                    </button>
                    <button
                      type="button"
                      onClick={() => ['64GB', '128GB', '256GB', '512GB'].forEach(handleAddSize)}
                      className="text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:bg-slate-850 hover:border-sky-500 transition-all cursor-pointer"
                    >
                      + Tech (64GB, 128GB, 256GB)
                    </button>
                    <button
                      type="button"
                      onClick={() => ['40mm', '44mm', '46mm'].forEach(handleAddSize)}
                      className="text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:bg-slate-850 hover:border-sky-500 transition-all cursor-pointer"
                    >
                      + Watch (40mm, 44mm, 46mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSize('Free Size')}
                      className="text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:bg-slate-850 hover:border-sky-500 transition-all cursor-pointer"
                    >
                      + Free Size
                    </button>
                  </div>
                </div>

                {/* Custom Size Adder */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter custom size (e.g. 1 Litre, 32 Waist, 42 Reg)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-sky-500 font-normal"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSize(customSizeInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSize(customSizeInput)}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850 font-sans">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-850 text-slate-450 hover:text-slate-200 rounded-full font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full font-bold transition-colors cursor-pointer shadow-md"
                >
                  <Save size={14} />
                  <span>{editingProduct ? 'Save Product Changes' : 'Publish Product to Catalog'}</span>
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

      {isWalletModalOpen && walletTargetUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-850 px-6 py-4 bg-slate-950/60 font-sans">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <IndianRupee size={16} className="text-amber-500" />
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
                  <span className="font-bold font-mono text-amber-500">₹{walletTargetUser.wallet_balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1 font-sans">
                <label className="text-[10px] text-slate-455 uppercase flex items-center justify-between">
                  <span>Adjustment Amount</span>
                  <span className="text-[8px] text-slate-500 font-normal">Use negative value to subtract</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-455">₹</span>
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

      {/* USER CREDENTIALS (USERNAME & PASSWORD) MODAL */}
      {isCredentialsModalOpen && credentialsTargetUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60 font-sans">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                  <Key size={16} />
                </div>
                <span>Edit Member Credentials</span>
              </h3>
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-4 text-xs font-sans">
              {/* Target User Info Card */}
              <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Target Member</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{credentialsTargetUser.full_name}</span>
                  <span className="font-mono text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    ID #{credentialsTargetUser.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Current Handle: @{credentialsTargetUser.username}</div>
              </div>

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[9px] text-slate-500 font-normal">Min 3 chars, letters/numbers/underscore</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. johndoe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono font-medium text-xs transition-colors"
                    value={credentialsForm.username}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>New Password</span>
                  <span className="text-[9px] text-amber-500/80 font-normal">Leave blank to keep unchanged</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3.5 pr-10 py-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
                    value={credentialsForm.password}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-[11px] text-emerald-300/80 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>Permanent Referral Link & Safe Tree</span>
                </div>
                <p>
                  Changing the username only updates their login handle. Their referral link, genealogy tree, commissions, and order history are tied to their permanent member ID and remain 100% intact and unchanged.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850 mt-5">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg font-bold transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCredentials}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  {isSubmittingCredentials ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Update Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE USER PROFILE & DETAILS MODAL (FOR ADMIN) */}
      {isUserDetailsModalOpen && selectedDetailsUser && (() => {
        const sponsor = getUserById(selectedDetailsUser.sponsor_id);
        const parent = getUserById(selectedDetailsUser.parent_id);
        const hasBank = !!(selectedDetailsUser.bank_account_number || selectedDetailsUser.upi_id);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in font-sans overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-lg flex items-center justify-center shadow-md border border-amber-400/30 shrink-0">
                    {(selectedDetailsUser.full_name?.trim() || selectedDetailsUser.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-base sm:text-lg">
                        {selectedDetailsUser.full_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedDetailsUser.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {selectedDetailsUser.status.toUpperCase()} MEMBER
                      </span>
                      {selectedDetailsUser.is_admin && (
                        <span className="bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span className="text-amber-400">@{selectedDetailsUser.username}</span>
                      <span>•</span>
                      <span>ID #{selectedDetailsUser.id}</span>
                      {selectedDetailsUser.level_name && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 font-sans">{selectedDetailsUser.level_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUserDetailsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
                {/* 1. Contact & Timestamp Overview (4 Cards) */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-sky-400" />
                    <span>Contact Info & Timestamps</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phone Number */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center gap-1">
                          <Phone size={11} className="text-emerald-400" />
                          <span>Phone Number</span>
                        </div>
                        <div className="font-bold text-slate-100 text-sm mt-0.5 truncate">
                          {selectedDetailsUser.phone_number || selectedDetailsUser.phone ? (
                            <a
                              href={`tel:${selectedDetailsUser.phone_number || selectedDetailsUser.phone}`}
                              className="text-emerald-400 hover:underline"
                            >
                              {selectedDetailsUser.phone_number || selectedDetailsUser.phone}
                            </a>
                          ) : (
                            <span className="text-slate-500 font-normal">Not provided</span>
                          )}
                        </div>
                      </div>
                      {(selectedDetailsUser.phone_number || selectedDetailsUser.phone) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedDetailsUser.phone_number || selectedDetailsUser.phone || '', 'phone')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold border border-slate-800 transition-colors ml-2 cursor-pointer shrink-0"
                          title="Copy Phone"
                        >
                          {copiedDetailField === 'phone' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Email */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center gap-1">
                          <Mail size={11} className="text-blue-400" />
                          <span>Email Address</span>
                        </div>
                        <div className="font-bold text-slate-100 text-xs mt-0.5 truncate" title={selectedDetailsUser.email}>
                          <a href={`mailto:${selectedDetailsUser.email}`} className="hover:underline text-slate-200">
                            {selectedDetailsUser.email}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedDetailsUser.email, 'email')}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold border border-slate-800 transition-colors ml-2 cursor-pointer shrink-0"
                        title="Copy Email"
                      >
                        {copiedDetailField === 'email' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Signup Time */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center gap-1">
                        <Calendar size={11} className="text-amber-400" />
                        <span>Signup Time (Registered)</span>
                      </div>
                      <div className="font-bold text-amber-300 text-xs mt-0.5 font-mono">
                        {formatDateFull(selectedDetailsUser.created_at)}
                      </div>
                    </div>

                    {/* Activation Time */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center gap-1">
                        <Zap size={11} className={selectedDetailsUser.status === 'active' ? 'text-emerald-400' : 'text-slate-500'} />
                        <span>Activation Time</span>
                      </div>
                      {selectedDetailsUser.status === 'active' ? (
                        <div className="font-bold text-emerald-400 text-xs mt-0.5 font-mono flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>{selectedDetailsUser.activated_at ? formatDateFull(selectedDetailsUser.activated_at) : 'Active Member'}</span>
                        </div>
                      ) : (
                        <div className="text-red-400 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>Inactive (Needs 1 SW or Admin Activation)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. MLM Tree & Volume Summary */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-amber-400" />
                    <span>Business Placement & SW Volumes</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Sponsor</div>
                      <div className="font-bold font-mono text-slate-200 mt-0.5 truncate">
                        {sponsor ? `@${sponsor.username}` : selectedDetailsUser.sponsor_id ? `ID ${selectedDetailsUser.sponsor_id}` : 'Root'}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Parent Node</div>
                      <div className="font-bold font-mono text-slate-200 mt-0.5 truncate">
                        {parent ? `@${parent.username} (${selectedDetailsUser.position})` : 'None'}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Personal Volume</div>
                      <div className="font-bold font-mono text-slate-100 mt-0.5">
                        {selectedDetailsUser.personal_sw} SW
                        {selectedDetailsUser.pending_sw && selectedDetailsUser.pending_sw > 0 ? (
                          <span className="text-amber-400 text-[10px] ml-1">(+{selectedDetailsUser.pending_sw} pend)</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Wallet Balance</div>
                      <div className="font-bold font-mono text-amber-400 text-sm mt-0.5">
                        ₹{selectedDetailsUser.wallet_balance.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Left Leg SW</div>
                      <div className="font-bold font-mono text-slate-200 mt-0.5">
                        {selectedDetailsUser.left_leg_sw} / {selectedDetailsUser.total_left_sw}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Right Leg SW</div>
                      <div className="font-bold font-mono text-slate-200 mt-0.5">
                        {selectedDetailsUser.right_leg_sw} / {selectedDetailsUser.total_right_sw}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Total Matched SW</div>
                      <div className="font-bold font-mono text-emerald-400 mt-0.5">
                        {selectedDetailsUser.total_matched_sw || 0} SW
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">Rank / Royalty</div>
                      <div className="font-bold text-amber-300 mt-0.5 truncate">
                        {selectedDetailsUser.level_name || 'Member'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bank & Payout Details */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Landmark size={14} className="text-emerald-400" />
                      <span>Bank & Payout Details (For Payments)</span>
                    </div>
                    {hasBank ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Ready for Payouts
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> Details Pending
                      </span>
                    )}
                  </div>

                  {!hasBank ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-300 text-xs">No Bank Account Added Yet</div>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                          This member has not yet added their bank account number or UPI ID on their dashboard. Payouts cannot be processed until they provide details.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Bank Name & Branch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Bank Name</div>
                          <div className="font-bold text-slate-100 text-sm mt-0.5">
                            {selectedDetailsUser.bank_name || '—'}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Branch Location</div>
                          <div className="font-bold text-slate-200 text-sm mt-0.5">
                            {selectedDetailsUser.bank_branch || 'Not specified'}
                          </div>
                        </div>
                      </div>

                      {/* Account Holder Name */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                        <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Account Holder Name</div>
                        <div className="font-bold text-slate-100 text-sm mt-0.5">
                          {selectedDetailsUser.bank_account_holder || selectedDetailsUser.full_name}
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Bank Account Number</div>
                          <div className="font-bold font-mono text-amber-400 text-sm sm:text-base mt-0.5 tracking-wider truncate">
                            {selectedDetailsUser.bank_account_number || '—'}
                          </div>
                        </div>
                        {selectedDetailsUser.bank_account_number && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedDetailsUser.bank_account_number!, 'bank_acc')}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                            title="Copy Account Number"
                          >
                            {copiedDetailField === 'bank_acc' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedDetailField === 'bank_acc' ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>

                      {/* IFSC Code */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">IFSC Code</div>
                          <div className="font-bold font-mono text-emerald-400 text-sm mt-0.5 truncate">
                            {selectedDetailsUser.bank_ifsc || '—'}
                          </div>
                        </div>
                        {selectedDetailsUser.bank_ifsc && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedDetailsUser.bank_ifsc!, 'bank_ifsc')}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                            title="Copy IFSC Code"
                          >
                            {copiedDetailField === 'bank_ifsc' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedDetailField === 'bank_ifsc' ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>

                      {/* UPI ID & PAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">UPI ID (VPA)</div>
                            <div className="font-bold font-mono text-slate-200 text-xs mt-0.5 truncate" title={selectedDetailsUser.upi_id || ''}>
                              {selectedDetailsUser.upi_id || '—'}
                            </div>
                          </div>
                          {selectedDetailsUser.upi_id && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedDetailsUser.upi_id!, 'upi_id')}
                              className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer shrink-0 ml-1"
                              title="Copy UPI ID"
                            >
                              {copiedDetailField === 'upi_id' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">PAN Number</div>
                          <div className="font-bold font-mono text-slate-200 text-xs mt-0.5">
                            {selectedDetailsUser.pan_number || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleUserStatus(selectedDetailsUser);
                      setIsUserDetailsModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Toggle Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDetailsModalOpen(false);
                      handleOpenWalletModal(selectedDetailsUser);
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Adjust Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDetailsModalOpen(false);
                      handleOpenCredentialsModal(selectedDetailsUser);
                    }}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Key size={12} />
                    Credentials
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUserDetailsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* POSTAL DISPATCH & TRACKING MANAGEMENT MODAL */}
      {isDispatchModalOpen && selectedDispatchOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Postal Parcel Dispatch & Tracking</span>
                    <span className="font-mono text-amber-400 font-bold">#Order 00{selectedDispatchOrder.id}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Assign postal consignment tracking number for member package tracking.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Delivery Consignee & Order Summary Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} />
                    Consignee (Delivery Address)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const buyer = selectedDispatchOrder.user || getUserById(selectedDispatchOrder.user_id);
                      const fullText = `${selectedDispatchOrder.shipping_name || buyer?.full_name || ''}, ${selectedDispatchOrder.shipping_address || ''}, ${selectedDispatchOrder.shipping_city || ''} ${selectedDispatchOrder.shipping_state || ''} PIN: ${selectedDispatchOrder.shipping_zip || ''}, Phone: ${selectedDispatchOrder.shipping_phone || buyer?.phone_number || ''}`;
                      navigator.clipboard.writeText(fullText);
                      triggerSuccess('Copied address to clipboard!');
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>Copy for Parcel Envelope</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-850">
                  <div>
                    <div className="text-slate-400 text-[10px]">Recipient Name:</div>
                    <div className="font-bold text-slate-100 text-xs">
                      {selectedDispatchOrder.shipping_name || selectedDispatchOrder.user?.full_name || getUserById(selectedDispatchOrder.user_id)?.full_name || `Customer #${selectedDispatchOrder.user_id}`}
                    </div>
                    {selectedDispatchOrder.shipping_phone && (
                      <div className="text-emerald-400 font-mono text-[10.5px] mt-0.5">
                        📞 {selectedDispatchOrder.shipping_phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px]">Postal Destination:</div>
                    <div className="text-slate-200 leading-tight">
                      {[
                        selectedDispatchOrder.shipping_address,
                        selectedDispatchOrder.shipping_city,
                        selectedDispatchOrder.shipping_state,
                        selectedDispatchOrder.shipping_zip ? `PIN: ${selectedDispatchOrder.shipping_zip}` : ''
                      ].filter(Boolean).join(', ') || 'Address on user profile'}
                    </div>
                  </div>
                </div>

                {/* Enclosed Items */}
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                  <div>
                    <span>Items to pack: </span>
                    <strong className="text-slate-200 font-mono">
                      {selectedDispatchOrder.items.map(i => {
                        const parts = [`${i.quantity}x ${i.product ? i.product.name : 'Item'}`];
                        const variants = [];
                        if (i.selected_color) variants.push(`Color: ${i.selected_color}`);
                        if (i.selected_size) variants.push(`Size: ${i.selected_size}`);
                        if (variants.length > 0) parts.push(`(${variants.join(', ')})`);
                        return parts.join(' ');
                      }).join(', ')}
                    </strong>
                  </div>
                  <span className="font-bold font-mono text-amber-400">₹{selectedDispatchOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4">
                {/* 1. Postal Service / Courier Provider */}
                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                    <span>1. Courier / Carrier Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">e.g. Speed Post, DTDC, Delhivery</span>
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-semibold cursor-pointer"
                    value={dispatchForm.courier_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      let defaultUrl = dispatchForm.tracking_url;
                      if (val.includes('Speed Post') || val.includes('Registered Post') || val.includes('Business Parcel')) {
                        defaultUrl = 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx';
                      } else if (val.includes('DTDC')) {
                        defaultUrl = 'https://www.dtdc.in/tracking/shipment-tracking.asp';
                      } else if (val.includes('Delhivery')) {
                        defaultUrl = 'https://www.delhivery.com/tracking';
                      } else if (val.includes('Blue Dart')) {
                        defaultUrl = 'https://www.bluedart.com/tracking';
                      }
                      setDispatchForm({ ...dispatchForm, courier_name: val, tracking_url: defaultUrl });
                    }}
                  >
                    <option value="Speed Post">Speed Post (EMS)</option>
                    <option value="Registered Post">Registered Post</option>
                    <option value="Business Parcel">Business Parcel</option>
                    <option value="DTDC Courier">DTDC Express Courier</option>
                    <option value="Professional Couriers">The Professional Couriers</option>
                    <option value="Delhivery Express">Delhivery Express</option>
                    <option value="Blue Dart Express">Blue Dart Express</option>
                    <option value="Other Courier">Other Courier / Logistics Service</option>
                  </select>
                </div>

                {/* 2. Postal Consignment / Article Tracking Number */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="p-1 bg-amber-500/10 text-amber-400 rounded">#</span>
                    <span>2. Consignment / Tracking Number</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={dispatchForm.dispatch_status === 'dispatched'}
                    placeholder="e.g. EK123456789IN or SP987654321IN"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg p-2.5 font-mono text-amber-300 text-sm tracking-wider font-bold uppercase placeholder:text-slate-600 focus:outline-none"
                    value={dispatchForm.tracking_number}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_number: e.target.value.toUpperCase() })}
                  />
                  <span className="text-[10px] text-slate-400 block">
                    💡 Enter the tracking / consignment number from your dispatch booking receipt. This will be shown on the user's order dashboard.
                  </span>
                </div>

                {/* 3. Tracking Website URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200">
                      3. Postal Tracking Web Portal URL
                    </label>
                    <a
                      href={dispatchForm.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Open Tracking Portal in New Tab</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <input
                    type="url"
                    placeholder="https://carrier-website.com/tracking"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                    value={dispatchForm.tracking_url}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_url: e.target.value })}
                  />
                </div>

                {/* 4. Dispatch Status Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-200 block mb-1">
                      4. Dispatch State
                    </label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-semibold cursor-pointer"
                      value={dispatchForm.dispatch_status}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, dispatch_status: e.target.value })}
                    >
                      <option value="dispatched">🚚 Dispatched (In Postal Transit)</option>
                      <option value="delivered">✅ Delivered to Recipient</option>
                      <option value="pending">⏳ Pending Dispatch (Not yet posted)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-200 block mb-1">
                      5. Dispatch Notes / Office Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatched via GPO Counter No. 2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                      value={dispatchForm.dispatch_notes}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, dispatch_notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => handlePrintPostalSlip(selectedDispatchOrder)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-750 font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs"
                >
                  <Printer size={13} />
                  <span>Print Postal Shipping Label</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg font-bold transition-colors cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition-colors cursor-pointer shadow-md text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Save & Update Postal Tracking</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
