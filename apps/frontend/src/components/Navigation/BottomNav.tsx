'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Mic2, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const pathname = usePathname();
  // Hide on login
  if (pathname === '/login') return null;

  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Live Room', href: '/live', icon: Mic2 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] z-50 glass rounded-t-2xl px-6 py-4 flex justify-between items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link href={item.href} key={item.name} className="flex flex-col items-center gap-1">
            <item.icon
              className={cn(
                'w-6 h-6 transition-colors',
                isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,122,0,0.8)]' : 'text-foreground/50'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-foreground/50'
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
