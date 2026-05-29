'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuctionStore } from '@/store/auctionStore';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const showToast = useAuctionStore((state) => state.showToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      showToast('Welcome back, Administrator!', 'success');
      
      // Hard refresh to reload server layout session states
      window.location.href = '/admin';
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message);
      showToast(error.message, 'error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#05080c]">
      {/* Back button */}
      <div className="mb-6 self-start max-w-sm mx-auto w-full">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournament Boards</span>
        </a>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl glass-card border-white/10 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Glow border decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center font-bold mb-3 shadow-lg">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Admin Portal Access</h2>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Provide the administrative credentials to manage teams, players, and manual biddings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email..."
                className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-3 pr-10 text-slate-200 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <div className="absolute right-3 top-3.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password..."
                className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-3 pr-10 text-slate-200 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-black text-slate-950 shadow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>{isPending ? 'Verifying...' : 'Access Console'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
