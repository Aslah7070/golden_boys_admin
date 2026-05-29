'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gavel, Coins, Users } from 'lucide-react';

export default function NavbarLinks() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Auction Manager', icon: Gavel },
    { href: '/admin/teams', label: 'Manage Teams', icon: Coins },
    { href: '/admin/players', label: 'Manage Players', icon: Users },
  ];

  return (
    <nav className="flex items-center gap-1.5">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
