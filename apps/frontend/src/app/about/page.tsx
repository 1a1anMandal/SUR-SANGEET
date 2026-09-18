'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Heart, Code2 } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 pb-20">
      <header className="px-4 py-4 flex items-center gap-3 sticky top-0 z-50 glass border-b border-foreground/5 bg-background/80">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-xl font-black">About Sur Sangeet</h1>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8 animate-fade-in">
        
        {/* App Title */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-400 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary/20 mb-4 rotate-3">
            <MusicIcon className="w-10 h-10 text-black fill-current" />
          </div>
          <h2 className="text-3xl font-black text-glow text-primary">Sur Sangeet</h2>
          <p className="text-sm text-foreground/50 mt-1 uppercase tracking-widest font-bold">Divine Connection</p>
        </div>

        {/* Why the app serves */}
        <section className="glass p-6 rounded-3xl border border-foreground/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <h3 className="font-black text-lg mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Our Purpose
          </h3>
          <p className="text-sm text-foreground/70 leading-relaxed font-medium">
            Sur Sangeet serves as a digital sanctuary for devotees to connect, sing, and experience the divine together. 
            It seamlessly synchronizes lyrics across multiple devices in real-time, completely eliminating the need for physical books during kirtans and satsangs.
          </p>
        </section>

        {/* Why we made it */}
        <section className="glass p-6 rounded-3xl border border-foreground/10 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          <h3 className="font-black text-lg mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> The Inspiration
          </h3>
          <p className="text-sm text-foreground/70 leading-relaxed font-medium">
            The idea was born out of a simple problem: during large gatherings, sharing a single lyric book or struggling to find the right bhajan was disrupting the flow of devotion. 
            We envisioned a platform where a single leader could guide the entire congregation effortlessly, allowing everyone to focus purely on the devotion rather than the logistics.
          </p>
        </section>

        {/* Developer Info */}
        <section className="mt-12 text-center relative pt-8 border-t border-foreground/10">
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/40 mb-6">Designed & Developed By</h3>
          
          <div className="inline-block relative">
            <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-br from-primary via-orange-400 to-red-500 relative z-10 shadow-2xl">
              <div className="w-full h-full bg-background rounded-full overflow-hidden border-2 border-background flex items-center justify-center">
                {/* Developer Photo */}
                <div className="w-full h-full bg-foreground/[0.05] flex items-center justify-center text-4xl font-black text-foreground/20">
                  MK
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background p-1.5 rounded-full z-20 shadow-lg">
              <div className="bg-primary/20 p-2 rounded-full">
                <Code2 className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <h2 className="text-2xl font-black text-foreground">MILAN KUMAR</h2>
            <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">Creator & Developer</p>
          </div>
        </section>

      </main>
    </div>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="currentColor" d="M21 3v12.5a3.5 3.5 0 0 1-3.5 3.5 3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5c.54 0 1.05.12 1.5.34V6.47L9 8.6v8.9A3.5 3.5 0 0 1 5.5 21 3.5 3.5 0 0 1 2 17.5 3.5 3.5 0 0 1 5.5 14c.54 0 1.05.12 1.5.34V6l14-3Z" />
    </svg>
  );
}
