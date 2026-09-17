'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Flame, UserCircle2, Phone } from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) {
      alert('Please enter both Name and Mobile Number');
      return;
    }
    if (mobile.length < 10) {
      alert('Please enter a valid mobile number');
      return;
    }
    
    const success = await login(name, mobile);
    if (success) {
      router.push('/library'); // Default route after login
    } else {
      // handled in store
    }
  };

  return (
    <main className="h-screen flex flex-col p-6 relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Header */}
      <header className="z-10 flex justify-between items-center mb-10 w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold tracking-wide">Sur Sangeet</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="z-10 w-full max-w-sm mx-auto flex-1 flex flex-col justify-center pb-20">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-black tracking-wide text-glow text-primary mb-2">Welcome</h1>
          <p className="text-sm text-foreground/60">Connect. Sing. Devote.</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-6 rounded-3xl space-y-5 shadow-xl border-primary/20">
          <h2 className="text-lg font-bold text-center mb-6">Create Account / Login</h2>
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Full Name
            </label>
            <div className="bg-black/20 rounded-xl flex items-center px-4 py-3 gap-3 border border-white/5 focus-within:border-primary/50 transition-colors">
              <UserCircle2 className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="Enter your name" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Mobile Number
            </label>
            <div className="bg-black/20 rounded-xl flex items-center px-4 py-3 gap-3 border border-white/5 focus-within:border-primary/50 transition-colors">
              <Phone className="w-5 h-5 text-primary/60" />
              <input 
                type="tel" 
                placeholder="Enter 10-digit number" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-black font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            Continue to Sanctuary
          </button>
        </form>
      </div>
    </main>
  );
}

