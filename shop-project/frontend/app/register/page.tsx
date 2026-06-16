"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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

    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.register({ username, email, password });
      
      localStorage.setItem('cybersec_token', res.token);
      localStorage.setItem('cybersec_user', JSON.stringify(res.user));
      
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check if database & backend are running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-slate-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111] border border-slate-800 rounded-lg shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-cyan-950/50 rounded-full border border-cyan-800/50 mb-3">
            <ShieldAlert className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Security Account</h2>
          <p className="text-xs text-slate-400 mt-1">Register to access cybersecurity lab equipment</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-950/30 border border-rose-800/50 text-rose-300 rounded p-3 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 rounded p-3 text-sm flex items-start gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-[#1c1c1c] border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2 bg-[#1c1c1c] border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="operator@cybersec.lab"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2 bg-[#1c1c1c] border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 disabled:bg-slate-700 text-[#0f1111] rounded font-bold text-sm transition-colors cursor-pointer mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400 border-t border-slate-800 pt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
