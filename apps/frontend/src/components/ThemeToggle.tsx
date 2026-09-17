'use client';

import { useUIStore } from '@/store/useUIStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  
  return (
    <button 
      onClick={toggleTheme}
      className="text-[10px] bg-foreground/10 px-3 py-1.5 rounded-full uppercase tracking-wider border border-foreground/5 shadow-sm active:scale-95 transition-transform"
    >
      {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
    </button>
  );
}
