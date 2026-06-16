"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, ArrowLeft, ShieldCheck, Tag, ShoppingBag, 
  Clock, CheckCircle, Package, Truck, AlertCircle, XCircle, RefreshCw 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { getProductImageUrl } from '../../services/image';
import { formatCurrency } from '../../utils/currency';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.history();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderGroupId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This will restore the items to store inventory.')) return;
    
    setActionLoading(orderGroupId);
    try {
      await api.orders.cancel(orderGroupId);
      alert('Order cancelled successfully!');
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(null);
    }
  };

  // Group items by order_group_id
  const groupOrders = (ordersList: any[]) => {
    const groups: Record<string, { date: string; status: string; paymentStatus: string; items: any[]; total: number }> = {};
    
    ordersList.forEach((order) => {
      if (!groups[order.order_group_id]) {
        groups[order.order_group_id] = {
          date: order.order_date,
          status: order.order_status || 'Pending',
          paymentStatus: order.payment_status || 'Paid',
          items: [],
          total: 0
        };
      }
      groups[order.order_group_id].items.push(order);
      groups[order.order_group_id].total += (order.price_at_purchase * order.quantity);
    });

    return groups;
  };

  const groupedOrders = groupOrders(orders);

  // Status styling colors helper
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Returned':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Visual status stepper helper
  const renderVisualTracker = (status: string) => {
    if (status === 'Cancelled' || status === 'Returned') {
      return (
        <div className={`mt-4 p-3 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
          status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-slate-100 text-slate-800 border-slate-200'
        }`}>
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>
            {status === 'Cancelled' 
              ? 'This order has been Cancelled. If payment was deducted, refunds will be credited shortly.' 
              : 'This order has been Returned.'}
          </span>
        </div>
      );
    }

    const currentStepIndex = STATUS_STEPS.indexOf(status);

    return (
      <div className="mt-6 border-t border-slate-100 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-medium text-slate-500">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Delivery progress</span>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;

              return (
                <React.Fragment key={step}>
                  {idx > 0 && (
                    <div className={`h-0.5 w-5 sm:w-8 hidden xs:block ${
                      idx <= currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                  <div className="flex items-center gap-1">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      isActive 
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-white text-slate-400 border-slate-200'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      isActive ? 'text-amber-600' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        
        {/* Welcome Dashboard Profile Card */}
        {currentUser && (
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Hello, {currentUser.username}! Happy Shopping 🛒
              </h2>
              <p className="text-xs text-slate-500 mt-1">Review tracking details, cancel requests, and catalog checkouts.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-bold capitalize">
                {currentUser.role} Account
              </span>
              <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded text-xs font-semibold">
                ID: #{currentUser.id}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-amber-500" />
            <span>Order History</span>
          </h1>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors font-bold">
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 text-sm shadow-sm">
            <span className="font-bold">Error loading orders:</span> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-lg shadow-sm">
            <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-lg">No Orders Placed Yet</h3>
            <p className="text-sm text-slate-500 mt-1">You have not completed any checkouts on our store.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-[#febd69] hover:bg-amber-400 text-[#131921] font-bold text-sm rounded transition-colors shadow-sm"
            >
              <span>Explore Marketplace Products</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([groupId, group]) => {
              const isCancellable = ['Pending', 'Confirmed', 'Processing'].includes(group.status);
              
              return (
                <div
                  key={groupId}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow p-5 space-y-4"
                >
                  {/* Order Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                      <div>
                        <span className="uppercase block text-[9px] text-slate-400 font-black">Order Placed</span>
                        <span className="font-bold text-slate-700">
                          {new Date(group.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="uppercase block text-[9px] text-slate-400 font-black">Order ID</span>
                        <span className="font-mono font-bold text-amber-700">{groupId}</span>
                      </div>
                      <div>
                        <span className="uppercase block text-[9px] text-slate-400 font-black">Payment Status</span>
                        <span className="font-semibold text-slate-600 bg-slate-55 border px-1.5 py-0.5 rounded text-[10px]">
                          {group.paymentStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="uppercase block text-[9px] text-slate-400 font-black">Order Total</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(group.total)}</span>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2.5 py-1 border text-[10px] font-black uppercase tracking-wider rounded ${getStatusBadgeStyles(group.status)}`}>
                        {group.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-slate-100">
                    {group.items.map((item) => (
                      <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-slate-50 rounded border overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={getProductImageUrl(item.image_url)} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-slate-350" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                              SKU: <span className="font-mono">{item.sku}</span> | Qty: {item.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {formatCurrency(item.price_at_purchase * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Stepper */}
                  {renderVisualTracker(group.status)}

                  {/* Cancel Button */}
                  {isCancellable && (
                    <div className="flex justify-end pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => handleCancelOrder(groupId)}
                        disabled={actionLoading === groupId}
                        className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold rounded cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading === groupId ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            <span>Cancel Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
