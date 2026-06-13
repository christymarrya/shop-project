"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, User, Lock, AlertCircle, CheckCircle, ShoppingCart, Package } from 'lucide-react';
import { api } from '../../services/api';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to home
    if (api.auth.getCurrentUser()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.login({ username, password });
      
      localStorage.setItem('shopzone_token', res.token);
      localStorage.setItem('shopzone_user', JSON.stringify(res.user));
      
      setSuccess('Sign in successful! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials or database status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animated-gradient-premium text-slate-900 p-4 relative overflow-hidden pb-24">
      {/* Decorative floating shapes in the background (5% opacity) */}
      <ShoppingCart className="h-24 w-24 absolute left-12 top-20 opacity-5 text-white animate-pattern-slow hidden sm:block pointer-events-none" />
      <Package className="h-32 w-32 absolute right-12 top-24 opacity-5 text-white animate-pattern-slow hidden sm:block pointer-events-none" />
      <ShoppingBag className="h-20 w-20 absolute left-[20%] bottom-16 opacity-5 text-white animate-pattern-slow hidden sm:block pointer-events-none" />
      <Lock className="h-16 w-16 absolute right-[25%] bottom-24 opacity-5 text-white animate-pattern-slow hidden sm:block pointer-events-none" />

      {/* Grid background mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-5 pointer-events-none"></div>

      <div 
        className="w-full max-w-lg bg-white/90 border border-white/20 shadow-2xl relative z-10 p-10 flex flex-col"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px' }}
      >
        {/* ShopZone Logo inside the card */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2.5 group mb-3">
            <ShoppingBag className="h-11 w-11 text-[#febd69] group-hover:text-amber-500 transition-colors" />
            <span className="font-extrabold text-3xl tracking-tight text-[#0f172a] group-hover:text-slate-800 transition-colors">
              Shop<span className="text-[#febd69]">Zone</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-[#0f172a]">ShopZone</h2>
          <p className="text-sm text-slate-500 mt-1">Welcome to ShopZone</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded p-3 text-xs flex items-start gap-2">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 text-xs flex items-start gap-2">
            <CheckCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-205 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#febd69] focus:ring-1 focus:ring-[#febd69] transition-colors"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-205 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#febd69] focus:ring-1 focus:ring-[#febd69] transition-colors"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e49635] disabled:bg-slate-200 disabled:text-slate-400 text-[#131921] rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500 border-t border-slate-100 pt-4">
          New to ShopZone?{' '}
          <Link href="/register" className="text-[#0F172A] hover:text-[#febd69] hover:underline font-bold transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}