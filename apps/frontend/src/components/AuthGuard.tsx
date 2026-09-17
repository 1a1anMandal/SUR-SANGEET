'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user && pathname !== '/login') {
      router.replace('/login');
    } else if (user && (pathname === '/login' || pathname === '/')) {
      router.replace('/library');
    }
  }, [user, pathname, router]);

  // Don't render until redirect resolves to prevent flashing
  if (!user && pathname !== '/login') return null;
  
  return <>{children}</>;
}
