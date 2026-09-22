'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Mic2, Users, Search, Play, Copy, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ThemeToggle from '@/components/ThemeToggle';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function HomeDashboard() {
  const router = useRouter();
  const { createRoom, joinRoom, roomId } = useRoomStore();
  const user = useAuthStore(state => state.user);
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomName, setRoomName] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Set first bhajan as default
  const [startingBhajan, setStartingBhajan] = useState(bhajans.length > 0 ? bhajans[0].id : '');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const validBhajans = bhajans.filter(b => b.lyrics && b.lyrics.length > 0);
  const categories = ['All', ...Array.from(new Set(validBhajans.map(b => b.deity)))].filter(Boolean);

  const filteredBhajans = validBhajans.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || b.deity === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateRoom = async () => {
    if (!user) return;
    if (!roomName) return alert('Enter room name');
    if (!startingBhajan) return alert('Please select a bhajan to start with');
    
    setIsCreating(true);
    await createRoom(user.id, user.name, startingBhajan);
    setIsCreating(false);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (joinCode.length !== 4) {
      alert('Please enter a valid 4-digit code');
      return;
    }
    
    setIsJoining(true);
    const success = await joinRoom(joinCode, user.id, user.name);
    setIsJoining(false);
    if (success) {
      router.push('/live');
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/join/' + roomId : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <main className="pb-24 pt-6 px-4 md:px-8 relative min-h-screen max-w-7xl mx-auto">
      {(isCreating || isJoining) && <FullScreenLoader text={isCreating ? "Waking Server..." : "Joining Room..."} />}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <header className="flex justify-between items-center mb-8 md:mb-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            <Mic2 className="w-5 h-5 md:w-6 md:h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black leading-none tracking-wide text-glow">Sur Sangeet</h1>
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-foreground/50 font-bold">Dashboard</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {roomId ? (
        <div className="space-y-6 relative z-10 animate-fade-in max-w-xl mx-auto mt-12 md:mt-24">
          <div className="glass p-8 md:p-12 rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center shadow-[0_0_30px_rgba(255,122,0,0.1)]">
            <div className="bg-white p-4 md:p-6 rounded-2xl inline-block mb-6 md:mb-8 shadow-xl">
              <QRCodeSVG value={shareUrl} size={150} className="md:w-[200px] md:h-[200px]" fgColor="#000" bgColor="#fff" />
            </div>

            <div className="bg-foreground/[0.12] rounded-2xl p-6 mb-6 inline-block w-full max-w-[250px] md:max-w-[300px] border border-foreground/10 mx-auto block">
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-foreground/40 font-bold mb-2 block">Access Code</span>
              <span className="text-5xl md:text-6xl font-black tracking-widest text-primary text-glow">{roomId}</span>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-8">
              <button 
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 py-3 md:py-4 rounded-xl font-bold transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Invite Link'}
              </button>
              <button 
                onClick={() => router.push('/live')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 py-4 rounded-xl text-black font-black uppercase tracking-wider shadow-[0_0_15px_rgba(255,122,0,0.3)] hover:shadow-[0_0_25px_rgba(255,122,0,0.4)] transition-all active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> Enter Studio
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-start">
          <div className="glass p-6 md:p-8 rounded-3xl border-foreground/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Room Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Evening Aarti"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 md:py-4 text-sm font-bold focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-foreground/60">Starting Bhajan</label>
                  <div className="flex items-center gap-2 bg-foreground/[0.05] border border-foreground/10 rounded-full px-3 py-1.5 md:py-2 focus-within:border-primary/50 transition-colors">
                    <Search className="w-3 h-3 text-foreground/40" />
                    <input 
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-[10px] md:text-xs font-bold w-20 md:w-32"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={'px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold border transition-all ' + (activeCategory === cat ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-foreground/[0.03] border-foreground/5 hover:bg-foreground/[0.08] text-foreground/60')}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Vertical Selection List */}
                <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto pr-2 no-scrollbar">
                  {filteredBhajans.map(bhajan => (
                    <button
                      key={bhajan.id}
                      onClick={() => setStartingBhajan(bhajan.id)}
                      className={'w-full flex items-center gap-3 p-3 md:p-4 rounded-2xl text-left border transition-all ' + (startingBhajan === bhajan.id ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(255,122,0,0.1)]' : 'bg-foreground/[0.03] border-foreground/5 hover:bg-foreground/[0.08]')}
                    >
                      <div className={'w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ' + (startingBhajan === bhajan.id ? 'bg-primary/20 text-primary' : 'bg-foreground/[0.1] text-foreground/40')}>
                        <Mic2 className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs md:text-sm font-bold leading-tight truncate">{bhajan.title}</p>
                        <p className="text-[10px] md:text-xs text-foreground/50 uppercase tracking-widest mt-0.5">{bhajan.deity}</p>
                      </div>
                      {startingBhajan === bhajan.id && <Check className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />}
                    </button>
                  ))}
                  {filteredBhajans.length === 0 && (
                    <div className="p-4 text-center glass rounded-2xl">
                      <p className="text-xs text-foreground/40 italic">No bhajans found</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-black py-4 md:py-5 rounded-xl flex items-center justify-center gap-2 font-black shadow-[0_0_15px_rgba(255,122,0,0.3)] active:scale-95 transition-transform"
              >
                {isCreating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Waking Server...</>
                ) : (
                  <><Mic2 className="w-5 h-5" /> Create Room</>
                )}
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center md:absolute md:inset-0 md:pointer-events-none z-0">
             <div className="w-px h-full bg-foreground/10 absolute top-0 left-1/2 -translate-x-1/2 hidden md:block"></div>
             <span className="bg-background text-[10px] font-bold text-foreground/40 uppercase tracking-widest px-4 py-2 rounded-full border border-foreground/10 relative z-10 hidden md:inline-block">or</span>
          </div>

          <div className="flex items-center gap-4 px-4 md:hidden">
            <div className="flex-1 h-px bg-foreground/10" />
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-foreground/10" />
          </div>

          <div className="glass p-6 md:p-8 rounded-3xl border-foreground/5 shadow-xl md:mt-24">
            <h2 className="text-sm md:text-lg font-bold flex items-center gap-2 mb-4 md:mb-6">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Join Existing Room
            </h2>
            <form onSubmit={handleJoinSubmit} className="flex flex-col lg:flex-row gap-3 md:gap-4">
              <input 
                type="text" 
                maxLength={4}
                placeholder="0000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 w-full shrink bg-foreground/[0.05] border border-foreground/10 rounded-xl px-4 py-3 md:py-5 text-center text-2xl md:text-4xl font-black tracking-[0.3em] focus:border-primary/50 outline-none transition-colors"
              />
              <button 
                type="submit"
                disabled={isJoining}
                className="bg-foreground text-background py-4 lg:py-0 px-6 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 w-full lg:w-auto shrink-0 md:text-lg"
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Room'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
