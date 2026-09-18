'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoomStore } from '@/store/useRoomStore';
import { Flame, UserCircle2, Phone } from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    
    setIsLoading(true);
    const success = await login(name, mobile);
    if (success) {
      router.push('/library'); 
    } else {
      setIsLoading(false);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {isLoading && <FullScreenLoader text="Authenticating..." />}
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="z-10 flex justify-between items-center mb-10 w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold tracking-wide">Sur Sangeet</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-sm z-10">
        <div className="glass p-8 rounded-[2rem] shadow-2xl border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 text-glow">Welcome</h1>
            <p className="text-sm text-foreground/60 font-medium">Enter your details to join the sanctuary.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
                Full Name
              </label>
              <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
                <UserCircle2 className="w-5 h-5 text-primary/60" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent flex-1 outline-none font-bold text-foreground placeholder:text-foreground/30"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
                Mobile Number
              </label>
              <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
                <Phone className="w-5 h-5 text-primary/60" />
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  className="bg-transparent flex-1 outline-none font-bold text-foreground placeholder:text-foreground/30 tracking-widest"
                  placeholder="0000000000"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-orange-500 text-black font-black py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:shadow-[0_0_30px_rgba(255,122,0,0.5)] active:scale-95 transition-all"
            >
              Enter Sanctuary
            </button>
          </form>
        </div>
        
        <p className="text-center mt-6 text-xs font-medium text-foreground/40">
          By entering, you agree to sing with devotion.
        </p>
      </div>
    </main>
  );
}
