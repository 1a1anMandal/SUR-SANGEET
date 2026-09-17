'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="dark min-h-screen bg-background text-foreground">{children}</div>; // default fallback
  }

  return (
    <div className={`${theme} min-h-screen bg-background text-foreground font-sans`}>
      {children}
    </div>
  );
}
