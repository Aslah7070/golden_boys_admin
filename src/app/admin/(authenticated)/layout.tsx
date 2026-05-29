import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import NavbarLinks from '@/components/NavbarLinks';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_session')?.value === 'true'; 

  // Server-side redirect to login if not authenticated
  if (!isAdmin) {
    redirect('/admin/login');
  }

  // Logout handler form action
  const handleLogout = async () => {
    'use server';
    const store = await cookies();
    store.delete('admin_session');
    redirect('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05080c] relative">
      {/* Background ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-[10%] w-[600px] h-[600px] rounded-full bg-rose-500/5 blur-[120px]" />
      </div>

      {/* Admin Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-red-500/10 bg-slate-950/90 backdrop-blur-md relative">
        {/* Neon admin alert border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-amber-500/20 via-yellow-500/40 to-amber-500/20" />
        
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white uppercase leading-none">
                GOLDEN BOYS
              </span>
              <span className="text-[9px] uppercase font-black text-amber-400 mt-1 tracking-widest leading-none">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Middle Links */}
          <div className="hidden md:block">
            <NavbarLinks />
          </div>

          {/* Navigation & Logout */}
          <div className="flex items-center gap-4">
            <a
              href="http://localhost:3000"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </a>

            <form action={handleLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-950/30 border border-red-900/30 px-3.5 py-2 text-xs font-bold text-red-400 shadow-sm transition-all hover:bg-red-900/20 hover:text-red-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
