'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAuctionStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-lg shadow-lg border animate-slide-in duration-300 transition-all ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                : isError
                ? 'bg-red-950/90 border-red-500/30 text-red-100'
                : 'bg-blue-950/90 border-blue-500/30 text-blue-100'
            }`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {isInfo && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-full text-inherit opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
