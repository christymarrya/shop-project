"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Users, Package, ShoppingCart, DollarSign, 
  Plus, Edit2, Trash2, ArrowLeft, RefreshCw, X, Sparkles, Check,
  ShoppingBag, Download, Search, Filter, Activity, Database, Key, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { api, AdminUser, UserRole } from '../../services/api';
import { getProductImageUrl } from '../../services/image';
import { formatCurrency } from '../../utils/currency';

type TabType = 'overview' | 'products' | 'users' | 'orders' | 'security';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: 0,
    quantity: 0,
    sku: '',
    image_url: '',
    gallery_urls: '',
    brand: '',
    mrp: 0,
    discount_percent: 0,
    stock_status: 'In Stock',
    rating: 4.0,
    reviews_count: 0,
    tags: '',
    specifications: '',
    featured: false,
    status: 'active'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Security log / audit state
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityEventType, setSecurityEventType] = useState('');
  const [securityRole, setSecurityRole] = useState('');
  const [securityUsername, setSecurityUsername] = useState('');
  const [securityStartDate, setSecurityStartDate] = useState('');
  const [securityEndDate, setSecurityEndDate] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchSecurityLogs = async () => {
    setSecurityLoading(true);
    try {
      const data = await api.admin.securityEvents({
        search: securitySearch || undefined,
        eventType: securityEventType || undefined,
        role: securityRole || undefined,
        username: securityUsername || undefined,
        startDate: securityStartDate || undefined,
        endDate: securityEndDate || undefined,
      });
      setSecurityLogs(data);
    } catch (err: any) {
      console.error('Failed to load security logs:', err);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Reload orders when filters change
  useEffect(() => {
    if (currentUser && activeTab === 'orders') {
      api.orders.adminAll(orderSearch || undefined, orderStatusFilter || undefined)
        .then(data => setOrders(data))
        .catch(err => console.error(err));
    }
  }, [orderSearch, orderStatusFilter, activeTab, currentUser]);

  // Reload security logs when filters change
  useEffect(() => {
    if (currentUser && activeTab === 'security') {
      fetchSecurityLogs();
    }
  }, [
    currentUser,
    activeTab,
    securitySearch,
    securityEventType,
    securityRole,
    securityUsername,
    securityStartDate,
    securityEndDate,
  ]);

  const exportToCsv = () => {
    if (securityLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Event Type', 'Username', 'Role', 'IP Address', 'Action', 'Details'];
    const rows = securityLogs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.event_type,
      log.username,
      log.role,
      log.ip_address,
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `security_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJson = () => {
    if (securityLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }
    const jsonContent = JSON.stringify(securityLogs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `security_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminStatusChange = async (orderGroupId: string, newStatus: string) => {
    try {
      await api.orders.adminUpdateStatus(orderGroupId, newStatus);
      alert(`Status updated successfully to ${newStatus}`);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '', password: '', role: 'user' as UserRole
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');
  const [userManagementMessage, setUserManagementMessage] = useState('');
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    setCurrentUser(user);
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, productsData, usersData, ordersData] = await Promise.all([
        api.admin.stats(),
        api.products.list(),
        api.admin.usersList(),
        api.orders.adminAll()
      ]);

      setStats(statsData);
      setProducts(productsData);
      setUsers(usersData);
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin dashboard details. Make sure database is linked.');
    } finally {
      setLoading(false);
    }
  };

  // File Upload Handler with size & format safety checks
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Maximum 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds the 5MB limit. Please choose a smaller image.');
        return;
      }

      // Valid extensions only
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid format. Only JPG, JPEG, PNG, and WEBP formats are allowed.');
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ----------------------------------------------------
  // Product Operations
  // ----------------------------------------------------
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('category', productForm.category);
      formData.append('price', String(productForm.price));
      formData.append('quantity', String(productForm.quantity));
      formData.append('sku', productForm.sku);
      formData.append('brand', productForm.brand);
      formData.append('mrp', String(productForm.mrp));
      formData.append('discount_percent', String(productForm.discount_percent));
      formData.append('stock_status', productForm.stock_status);
      formData.append('rating', String(productForm.rating));
      formData.append('reviews_count', String(productForm.reviews_count));
      formData.append('tags', productForm.tags);
      formData.append('specifications', productForm.specifications);
      formData.append('featured', productForm.featured ? 'true' : 'false');
      formData.append('status', productForm.status);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        formData.append('image_url', productForm.image_url);
      }

      if (editingProduct) {
        await api.products.update(editingProduct.id, formData);
        alert('Product updated successfully!');
      } else {
        await api.products.create(formData);
        alert('Product created successfully!');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error processing product.');
    }
  };

  const handleEditProductClick = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      category: prod.category,
      price: parseFloat(prod.price),
      quantity: parseInt(prod.quantity),
      sku: prod.sku,
      image_url: prod.image_url || '',
      gallery_urls: prod.gallery_urls || '',
      brand: prod.brand || '',
      mrp: parseFloat(prod.mrp) || parseFloat(prod.price),
      discount_percent: parseInt(prod.discount_percent) || 0,
      stock_status: prod.stock_status || 'In Stock',
      rating: parseFloat(prod.rating) || 4.0,
      reviews_count: parseInt(prod.reviews_count) || 0,
      tags: prod.tags || '',
      specifications: prod.specifications || '',
      featured: prod.featured === 1 || prod.featured === true,
      status: prod.status || 'active'
    });
    setSelectedFile(null);
    setImagePreview(prod.image_url ? getProductImageUrl(prod.image_url) : '');
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product? This will remove it from catalog.')) return;
    try {
      await api.products.delete(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error deleting product.');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: 'Electronics',
      price: 0,
      quantity: 0,
      sku: '',
      image_url: '',
      gallery_urls: '',
      brand: '',
      mrp: 0,
      discount_percent: 0,
      stock_status: 'In Stock',
      rating: 4.0,
      reviews_count: 0,
      tags: '',
      specifications: '',
      featured: false,
      status: 'active'
    });
    setSelectedFile(null);
    setImagePreview('');
  };

  // ----------------------------------------------------
  // User Operations
  // ----------------------------------------------------
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    const normalizedUsername = userForm.username.trim();
    if (!normalizedUsername || !userForm.password || !userForm.role) {
      setUserFormError('Username, password, and role are required.');
      return;
    }

    setUserFormSubmitting(true);
    try {
      await api.admin.addUser({ ...userForm, username: normalizedUsername });
      setUserManagementMessage(`User "${normalizedUsername}" created successfully.`);
      setShowUserModal(false);
      setUserForm({ username: '', password: '', role: 'user' });
      loadDashboardData();
    } catch (err: any) {
      setUserFormError(err.message || 'Error adding user.');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? All their cart and order histories will be affected.')) return;
    try {
      await api.admin.deleteUser(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error deleting user.');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-[#febd69]" />
              <span>ShopZone</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage e-commerce inventory catalogs, user accounts, and review checkout order logs.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadDashboardData}
              className="px-3.5 py-2 border border-slate-350 bg-white hover:bg-slate-55 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-700 shadow-sm"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <span>Refresh Metrics</span>
            </button>
            <Link href="/" className="px-3.5 py-2 bg-[#febd69] hover:bg-amber-400 text-[#131921] rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-amber-100 border border-amber-200 text-amber-900 rounded-lg p-4 text-xs font-mono shadow-sm">
            <span className="font-bold block mb-1">DASHBOARD WARNING:</span>
            {error}
          </div>
        )}

        {/* Dashboard Tabs & Metrics */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Navigation Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0 space-y-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm h-fit">
            <button
              onClick={() => { setActiveTab('overview'); setError(''); }}
              className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'overview' ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
              }`}
            >
              <Activity className="h-4.5 w-4.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => { setActiveTab('products'); setError(''); }}
              className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'products' ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
              }`}
            >
              <Package className="h-4.5 w-4.5" />
              <span>Manage Products</span>
            </button>
            <button
              onClick={() => { setActiveTab('users'); setError(''); }}
              className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'users' ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setError(''); }}
              className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'orders' ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
              }`}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span>View Orders</span>
            </button>
            <button
              onClick={() => { setActiveTab('security'); setError(''); }}
              className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'security' ? 'bg-amber-50 border border-amber-200 text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
              }`}
            >
              <ShieldAlert className="h-4.5 w-4.5" />
              <span className="flex flex-col leading-tight">
                <span>Security Events</span>
                <span className="text-[10px] font-bold opacity-70">Audit Logs</span>
              </span>
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="flex-grow">
            
            {/* Overview / Stats Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Sales (₹)</span>
                      <span className="text-xl font-extrabold text-slate-800">{formatCurrency(stats.totalSales)}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Orders</span>
                      <span className="text-xl font-extrabold text-slate-800">{stats.totalOrders}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Active Users</span>
                      <span className="text-xl font-extrabold text-slate-800">{stats.totalUsers}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-violet-50 border border-violet-200 text-violet-600 rounded">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Products</span>
                      <span className="text-xl font-extrabold text-slate-800">{stats.totalProducts}</span>
                    </div>
                  </div>
                </div>

                {/* Orders Detailed Status Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block font-semibold">Pending Orders</span>
                      <span className="text-base font-extrabold text-slate-800">{(stats as any).pendingOrders || 0}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block font-semibold">Processing Orders</span>
                      <span className="text-base font-extrabold text-slate-800">{(stats as any).processingOrders || 0}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block font-semibold">Delivered Orders</span>
                      <span className="text-base font-extrabold text-slate-800">{(stats as any).deliveredOrders || 0}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block font-semibold">Cancelled Orders</span>
                      <span className="text-base font-extrabold text-slate-800">{(stats as any).cancelledOrders || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Operations Info Block */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base mb-2">Platform Administration Logs</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    All administrative operations (product catalog additions/removals, user manual updates, and checkout transaction groups) generate structured JSON telemetry in local files for monitoring, analytics, and indexing.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-600">
                      <span className="text-amber-700 block font-bold mb-1">Administrative Audit Logs:</span>
                      logs/security.json.log
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-600">
                      <span className="text-amber-700 block font-bold mb-1">General Application Logs:</span>
                      logs/application.json.log
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base">Product Inventory Management</h3>
                  <button
                    onClick={() => { setEditingProduct(null); resetProductForm(); setShowProductModal(true); }}
                    className="px-3.5 py-1.5 bg-[#febd69] hover:bg-amber-400 text-[#131921] rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Product</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3 text-right">Sale Price</th>
                        <th className="p-3 text-right">MRP</th>
                        <th className="p-3 text-right">Stock Qty</th>
                        <th className="p-3 text-center">Featured</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-amber-750 font-bold">{prod.sku}</td>
                          <td className="p-3 font-bold text-slate-850 max-w-[150px] truncate" title={prod.name}>
                            {prod.name}
                          </td>
                          <td className="p-3 text-slate-500">{prod.category}</td>
                          <td className="p-3 text-slate-550 font-bold uppercase">{prod.brand || 'Generic'}</td>
                          <td className="p-3 text-right text-slate-700">{formatCurrency(prod.price)}</td>
                          <td className="p-3 text-right text-slate-400 line-through">{formatCurrency(prod.mrp || prod.price)}</td>
                          <td className="p-3 text-right text-slate-700 font-bold">{prod.quantity}</td>
                          <td className="p-3 text-center">
                            {prod.featured === 1 || prod.featured === true ? (
                              <span className="bg-amber-100 text-amber-700 border border-amber-200 font-black text-[9px] uppercase px-1.5 py-0.5 rounded">
                                Yes
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[9px] font-bold">No</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {prod.status === 'active' ? (
                              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-[9px] uppercase px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            ) : (
                              <span className="bg-rose-100 text-rose-700 border border-rose-200 font-black text-[9px] uppercase px-1.5 py-0.5 rounded">
                                Hidden
                              </span>
                            )}
                          </td>
                          <td className="p-3 flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditProductClick(prod)}
                              className="p-1 hover:bg-amber-50 rounded text-slate-500 hover:text-amber-600 cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Manage Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base">User Accounts Management</h3>
                  <button
                    onClick={() => {
                      setUserFormError('');
                      setUserFormSuccess('');
                      setShowUserModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#febd69] hover:bg-amber-400 text-[#131921] rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create User</span>
                  </button>
                </div>

                {userManagementMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs font-semibold">
                    {userManagementMessage}
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Created At</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-55 transition-colors">
                          <td className="p-3 text-slate-400 font-mono">#{user.id}</td>
                          <td className="p-3 font-bold text-slate-800">{user.username}</td>
                          <td className="p-3">
                            <select
                              value={user.role}
                              disabled={user.id === currentUser?.id}
                              onChange={async (e) => {
                                const newRole = e.target.value as UserRole;
                                if (confirm(`Are you sure you want to change role of "${user.username}" to "${newRole}"?`)) {
                                  try {
                                    await api.admin.updateUserRole(user.id, newRole);
                                    alert('User role updated successfully');
                                    loadDashboardData();
                                  } catch (err: any) {
                                    alert(err.message || 'Failed to update user role');
                                  }
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-white focus:outline-none focus:border-amber-400 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed ${
                                user.role === 'admin' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200/40 font-bold' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-3 text-slate-450">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 flex items-center justify-center">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer disabled:text-slate-300 disabled:hover:bg-transparent"
                              disabled={user.id === currentUser?.id}
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                
                {/* Search and Filter Section */}
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex-shrink-0">Global Order Registry</h3>
                  
                  <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full max-w-xl">
                    <input
                      type="text"
                      placeholder="Search Order ID, user, SKU, product..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-400"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                    <select
                      className="border border-slate-200 bg-white text-slate-700 text-xs p-2 rounded focus:outline-none focus:border-amber-400 font-semibold"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Product Details</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Total Price</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3 text-center">Manage Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-amber-700 font-bold">{ord.order_group_id}</td>
                          <td className="p-3 text-slate-450">
                            {new Date(ord.order_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-3 text-slate-800">
                            <span className="font-semibold block">{ord.username}</span>
                            <span className="text-[10px] text-slate-400 block">{ord.email}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-slate-50 border rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                {ord.image_url ? (
                                  <img src={getProductImageUrl(ord.image_url)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ShoppingBag className="h-4 w-4 text-slate-350" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 block max-w-[150px] truncate" title={ord.name}>{ord.name}</span>
                                <span className="text-[9px] font-mono text-slate-400 block">SKU: {ord.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right text-slate-700 font-bold">{ord.quantity}</td>
                          <td className="p-3 text-right font-black text-slate-800">
                            {formatCurrency(ord.price_at_purchase * ord.quantity)}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {ord.payment_status || 'Paid'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              className={`border rounded p-1 font-bold text-[10px] focus:outline-none focus:border-amber-400 ${
                                ord.order_status === 'Delivered' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                                ord.order_status === 'Cancelled' ? 'bg-rose-50 border-rose-300 text-rose-700' :
                                ord.order_status === 'Pending' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                                'bg-blue-50 border-blue-300 text-blue-700'
                              }`}
                              value={ord.order_status}
                              onChange={(e) => handleAdminStatusChange(ord.order_group_id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Returned">Returned</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Security Events / Audit Logs Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* SOC-style dashboard header */}
                <div className="bg-[#1e293b] text-white p-6 rounded-lg border border-slate-700 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Subtle decorative glow */}
                  <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[10px] tracking-widest uppercase font-mono text-emerald-400 font-bold">SEC-OPS MONITORING NODE ACTIVE</span>
                    </div>
                    <h2 className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
                      <ShieldAlert className="h-5.5 w-5.5 text-amber-500" />
                      <span>Security Events &amp; Audit Logs</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Real-time database audit record viewer. Monitor user registrations, failed authentication requests, and resource updates.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={exportToCsv}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-550" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportToJson}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-550" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                {/* SOC Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Audit Records</span>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-slate-550" />
                      <span className="text-xl font-extrabold text-slate-800 font-mono">{securityLogs.length}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">High-Risk Alerts</span>
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-rose-500" />
                      <span className="text-xl font-extrabold text-rose-600 font-mono">
                        {securityLogs.filter(log => log.event_type === 'login_failure' || log.event_type === 'unauthorized_access' || log.event_type === 'sql_injection_attempt').length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Admin Operations</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-amber-500" />
                      <span className="text-xl font-extrabold text-amber-700 font-mono">
                        {securityLogs.filter(log => log.role === 'admin').length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Integrity Status</span>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-sm font-extrabold text-emerald-600 font-mono">SECURE</span>
                    </div>
                  </div>
                </div>

                {/* Search & Advanced Filters */}
                <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Filter className="h-4.5 w-4.5 text-slate-450" />
                      <span>Security Log Query Filters</span>
                    </h3>
                    {/* Clear Filters Button */}
                    {(securitySearch || securityEventType || securityRole || securityUsername || securityStartDate || securityEndDate) && (
                      <button
                        onClick={() => {
                          setSecuritySearch('');
                          setSecurityEventType('');
                          setSecurityRole('');
                          setSecurityUsername('');
                          setSecurityStartDate('');
                          setSecurityEndDate('');
                        }}
                        className="text-xs font-bold text-amber-600 hover:text-amber-750 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="h-3.5 w-3.5 animate-spin-once" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                      <input
                        type="text"
                        placeholder="Search action, IP, username..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-400 font-medium"
                        value={securitySearch}
                        onChange={(e) => setSecuritySearch(e.target.value)}
                      />
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>

                    {/* Username Filter */}
                    <div>
                      <input
                        type="text"
                        placeholder="Username"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-400 font-medium"
                        value={securityUsername}
                        onChange={(e) => setSecurityUsername(e.target.value)}
                      />
                    </div>

                    {/* Event Type Filter */}
                    <div>
                      <select
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-400 font-semibold text-slate-700"
                        value={securityEventType}
                        onChange={(e) => setSecurityEventType(e.target.value)}
                      >
                        <option value="">All Event Types</option>
                        <optgroup label="Authentication">
                          <option value="login_success">Login Success</option>
                          <option value="login_failure">Login Failure</option>
                          <option value="logout">User Logout</option>
                          <option value="sql_injection_attempt">SQL Injection Attempt</option>
                          <option value="unauthorized_access">Unauthorized Access</option>
                        </optgroup>
                        <optgroup label="User Management">
                          <option value="user_creation">User Created</option>
                          <option value="user_deletion">User Deleted</option>
                          <option value="user_role_changed">Role Changed</option>
                        </optgroup>
                        <optgroup label="Product Inventory">
                          <option value="product_creation">Product Created</option>
                          <option value="product_update">Product Updated</option>
                          <option value="product_deletion">Product Deleted</option>
                          <option value="price_changed">Price Changed</option>
                          <option value="stock_changed">Stock Changed</option>
                        </optgroup>
                        <optgroup label="Orders / Checkout">
                          <option value="order_created">Order Placed</option>
                          <option value="order_cancelled">Order Cancelled</option>
                          <option value="order_status_changed">Order Status Changed</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                      <select
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-400 font-semibold text-slate-700"
                        value={securityRole}
                        onChange={(e) => setSecurityRole(e.target.value)}
                      >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="anonymous">Anonymous</option>
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded bg-slate-50 px-2 py-1">
                      <span className="text-[9px] uppercase text-slate-400 font-bold block whitespace-nowrap">From:</span>
                      <input
                        type="date"
                        className="bg-transparent text-xs w-full text-slate-705 focus:outline-none font-medium"
                        value={securityStartDate}
                        onChange={(e) => setSecurityStartDate(e.target.value)}
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded bg-slate-50 px-2 py-1">
                      <span className="text-[9px] uppercase text-slate-400 font-bold block whitespace-nowrap">To:</span>
                      <input
                        type="date"
                        className="bg-transparent text-xs w-full text-slate-705 focus:outline-none font-medium"
                        value={securityEndDate}
                        onChange={(e) => setSecurityEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Logs Table Area */}
                {securityLoading ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                    <span className="text-sm font-semibold text-slate-505">Querying database logs...</span>
                  </div>
                ) : securityLogs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-10 w-10 text-slate-350" />
                    <span className="text-sm font-bold text-slate-700">No security events found</span>
                    <span className="text-xs text-slate-400 max-w-sm">No DB entries matched your current search parameters. Try adjusting filters or reset.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-3 w-8"></th>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Event Type</th>
                          <th className="p-3">Username</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {securityLogs.map((log) => {
                          const isExpanded = expandedLogId === log.id;
                          
                          // Color code mapping for event type badges
                          let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                          if (log.event_type === 'login_success' || log.event_type === 'logout') {
                            badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          } else if (log.event_type === 'sql_injection_attempt') {
                            badgeStyle = 'bg-red-100 text-red-800 border-red-300 font-extrabold animate-pulse';
                          } else if (log.event_type === 'login_failure' || log.event_type === 'unauthorized_access') {
                            badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80 font-extrabold animate-pulse';
                          } else if (log.event_type.startsWith('user_')) {
                            badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                          } else if (log.event_type.startsWith('product_') || log.event_type === 'price_changed' || log.event_type === 'stock_changed') {
                            badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                          } else if (log.event_type.startsWith('order_') || log.event_type === 'checkout') {
                            badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                          }

                          return (
                            <React.Fragment key={log.id}>
                              <tr 
                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/70 font-semibold' : ''}`}
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              >
                                <td className="p-3 text-center">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  )}
                                </td>
                                <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeStyle}`}>
                                    {log.event_type.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-800 font-mono">{log.username}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    log.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {log.role}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-500">{log.ip_address}</td>
                                <td className="p-3 text-slate-700 break-words max-w-[280px]" title={log.action}>
                                  {log.action}
                                </td>
                                <td className="p-3 text-slate-500 max-w-[260px]">
                                  <code className="block bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-mono truncate" title={log.details || '{}'}>
                                    {log.details || '{}'}
                                  </code>
                                </td>
                              </tr>
                              
                              {/* Expanded log details container */}
                              {isExpanded && (
                                <tr className="bg-slate-50/30">
                                  <td colSpan={8} className="p-4 border-l-4 border-amber-400">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1">
                                          <FileText className="h-3.5 w-3.5" />
                                          <span>Event Metadata Context</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">Log DB Record ID: #{log.id}</span>
                                      </div>
                                      <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-60 shadow-inner">
                                        <pre className="whitespace-pre-wrap leading-relaxed">
                                          {(() => {
                                            try {
                                              const parsed = JSON.parse(log.details || '{}');
                                              return JSON.stringify(parsed, null, 2);
                                            } catch (e) {
                                              return log.details || '{}';
                                            }
                                          })()}
                                        </pre>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* ----------------------------------------------------
          Product Form Modal (Add / Edit)
          ---------------------------------------------------- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-800 my-8">
            <button
              onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-full hover:bg-slate-105 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h4 className="font-extrabold text-slate-800 text-base">
                {editingProduct ? 'Edit Marketplace Product' : 'Add New Marketplace Product'}
              </h4>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh] scrollbar-thin">
              
              {/* Product SKU, Category and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="e.g. LAP-PRC-15"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Category *</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none font-medium"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Books">Books</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Brand Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="e.g. TechBrand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Precision Pro 15 Laptop"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Product Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 h-20 focus:outline-none focus:border-amber-400"
                  placeholder="Provide comprehensive details about the product..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              {/* Product File Image Upload (replaces manual URL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Product Image Upload (Max 5MB) *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Gallery Image URLs (Comma Separated)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                      placeholder="url1, url2, url3"
                      value={productForm.gallery_urls}
                      onChange={(e) => setProductForm({ ...productForm, gallery_urls: e.target.value })}
                    />
                  </div>
                </div>

                {/* Image Live Preview Container */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Image Preview</label>
                  {imagePreview ? (
                    <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-center h-32 overflow-hidden relative">
                      <img src={imagePreview} alt="Product Preview" className="h-full object-contain rounded" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setImagePreview(''); }}
                        className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-sm hover:scale-105 transition-all cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-lg h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <Package className="h-8 w-8 text-slate-300 mb-1" />
                      <span className="text-[10px]">No image selected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Stock Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="0"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Original Price (MRP) (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="0"
                    value={productForm.mrp || ''}
                    onChange={(e) => setProductForm({ ...productForm, mrp: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Quantity in Stock *</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="0"
                    value={productForm.quantity || ''}
                    onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Stock Status</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none font-medium"
                    value={productForm.stock_status}
                    onChange={(e) => setProductForm({ ...productForm, stock_status: e.target.value })}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Status Toggles & Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product Status</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none font-medium"
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="hidden">Hidden (Admins Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Demo Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="4.5"
                    value={productForm.rating}
                    onChange={(e) => setProductForm({ ...productForm, rating: parseFloat(e.target.value) || 4.0 })}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Demo Reviews Count</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="25"
                    value={productForm.reviews_count}
                    onChange={(e) => setProductForm({ ...productForm, reviews_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Specifications & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Specifications (Format - Key: Value per line)</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 h-20 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                    placeholder="Processor: Core i7&#10;RAM: 16GB&#10;Storage: 512GB SSD"
                    value={productForm.specifications}
                    onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:border-amber-400 focus:outline-none"
                    placeholder="e.g. laptop, gaming, smart"
                    value={productForm.tags}
                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 py-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="featured"
                  className="h-4.5 w-4.5 accent-amber-500 rounded cursor-pointer"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="font-extrabold text-slate-700 cursor-pointer select-none">
                  Mark this product as a **Featured Deal** (will appear in the storefront deals section)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-650 rounded cursor-pointer font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#febd69] hover:bg-amber-400 text-[#131921] font-black rounded cursor-pointer transition-colors shadow-sm"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          User Form Modal (Add User)
          ---------------------------------------------------- */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border border-slate-350 rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative text-slate-800">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-705 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-base">Add New Account</h4>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 text-sm">
              {userFormError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs font-semibold">
                  {userFormError}
                </div>
              )}

              {userFormSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded text-xs font-semibold">
                  {userFormSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-500 uppercase font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-805"
                  placeholder="operator_name"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                />
              </div>



              <div>
                <label className="block text-xs text-slate-500 uppercase font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-805"
                  placeholder="Enter temporary password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase font-semibold mb-1">Access Role</label>
                <select
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-805"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                >
                  <option value="user">User / Customer</option>
                  <option value="admin">Admin / Store Manager</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  className="px-4 py-2 bg-[#febd69] hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-[#131921] font-bold rounded cursor-pointer"
                >
                  {userFormSubmitting ? 'Creating...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
