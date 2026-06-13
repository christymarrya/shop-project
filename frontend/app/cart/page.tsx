"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowLeft, ShieldAlert, CreditCard } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartCountTrigger, setCartCountTrigger] = useState(0);

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!api.auth.getCurrentUser()) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [router]);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await api.cart.get();
      setCartItems(items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cart items. Verify server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = async (itemId: number, newQty: number, maxStock: number) => {
    if (newQty <= 0) return;
    if (newQty > maxStock) {
      alert(`Cannot exceed available stock of ${maxStock} units.`);
      return;
    }
    try {
      await api.cart.update(itemId, newQty);
      setCartItems(items => items.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
      setCartCountTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update quantity.');
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await api.cart.delete(itemId);
      setCartItems(items => items.filter(item => item.id !== itemId));
      setCartCountTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to remove item.');
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError('');
    try {
      const res = await api.orders.checkout();
      alert(`Checkout Successful! Order Group ID: ${res.orderGroupId}`);
      setCartItems([]);
      setCartCountTrigger(prev => prev + 1);
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Verify your stock availability or account status.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col">
      <Navbar cartCount={cartCountTrigger} />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 mb-6">
          <ShoppingCart className="h-8 w-8 text-amber-500" />
          <span>Shopping Cart</span>
        </h1>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-250 text-rose-800 rounded p-4 text-sm flex items-start gap-2 shadow-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div>
              <span className="font-bold">Checkout Error:</span>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-lg shadow-sm">
            <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-lg">Your Cart is Empty</h3>
            <p className="text-sm text-slate-500 mt-1">There are no items currently in your checkout queue.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-[#febd69] hover:bg-amber-400 text-[#131921] font-bold text-sm rounded transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="flex-grow space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{item.category}</span>
                    <h4 className="font-bold text-slate-800 text-base mt-0.5">{item.name}</h4>
                    <span className="text-xs font-mono text-slate-400">SKU: {item.sku}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity selectors */}
                    <div className="flex items-center border border-slate-300 rounded bg-slate-50 h-8 overflow-hidden">
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity - 1, item.stock_quantity)}
                        className="px-2.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity + 1, item.stock_quantity)}
                        className="px-2.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total cost</span>
                      <span className="font-extrabold text-slate-800 text-sm">{formatCurrency(item.price * item.quantity)}</span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Summary Card */}
            <div className="w-full lg:w-80 bg-white border border-slate-200 p-6 rounded-lg shadow-sm self-start space-y-6">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 uppercase tracking-wide">
                Order Summary
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Total Items</span>
                  <span className="font-bold text-slate-800">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-2 text-base">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-black text-amber-600">{formatCurrency(getSubtotal())}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full h-11 bg-[#febd69] hover:bg-amber-400 active:bg-amber-500 disabled:bg-slate-300 disabled:text-slate-500 text-[#131921] font-bold text-sm rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <CreditCard className="h-5 w-5" />
                <span>{checkoutLoading ? 'Verifying Checkout...' : 'Proceed to Checkout'}</span>
              </button>

              <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-4 text-center">
                Shop with confidence. Secure checkout with standard SSL encryption.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
