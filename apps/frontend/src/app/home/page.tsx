'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Mic2, Users, Search, Play, Copy, Check, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomeDashboard() {
  const router = useRouter();
  const { createRoom, joinRoom, roomId, initSocket } = useRoomStore();
  const user = useAuthStore(state => state.user);
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomName, setRoomName] = useState('');
  
  // Set first bhajan as default
  const [startingBhajan, setStartingBhajan] = useState(bhajans.length > 0 ? bhajans[0].id : '');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Eagerly initialize socket to wake up backend (Railway) from sleep
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const filteredBhajans = bhajans.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.deity.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    if (joinCode.length === 4) {
      setIsJoining(true);
      const success = await joinRoom(joinCode, user.id, user.name);
      setIsJoining(false);
      if (success) {
        router.push('/live');
      } else {
        alert('Invalid Room Code or Room not found');
      }
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
    <main className="pb-24 pt-6 px-4 relative h-screen overflow-y-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <header className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            <Mic2 className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none tracking-wide text-glow">Sur Sangeet</h1>
            <span className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">Dashboard</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {roomId ? (
        <div className="space-y-6 relative z-10 animate-fade-in">
          <div className="glass p-8 rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center shadow-[0_0_30px_rgba(255,122,0,0.1)]">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <Mic2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-2 text-foreground">Room Created!</h2>
            <p className="text-foreground/60 mb-6 font-medium">Your sanctuary is ready. Share the code below.</p>
            
            <div className="bg-foreground/[0.12] rounded-2xl p-6 mb-6 inline-block w-full max-w-[250px] border border-foreground/10">
              <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-2 block">Access Code</span>
              <span className="text-5xl font-black tracking-widest text-primary text-glow">{roomId}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 py-3 rounded-xl font-bold transition-all"
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
        <div className="space-y-8 relative z-10">
          <div className="glass p-6 rounded-3xl border-foreground/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Room Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Evening Aarti"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Starting Bhajan</label>
                
                <div className="bg-foreground/[0.05] border border-foreground/5 rounded-xl px-3 py-2 flex items-center gap-2 mb-3 focus-within:border-primary/50 transition-colors">
                  <Search className="w-4 h-4 text-foreground/40" />
                  <input 
                    type="text"
                    placeholder="Search bhajans..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium w-full"
                  />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {filteredBhajans.map(bhajan => (
                    <button
                      key={bhajan.id}
                      onClick={() => setStartingBhajan(bhajan.id)}
                      className={'flex-shrink-0 w-32 p-3 rounded-2xl text-left border transition-all ' + (startingBhajan === bhajan.id ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(255,122,0,0.1)]' : 'bg-foreground/[0.03] border-foreground/5 hover:border-foreground/10')}
                    >
                      <div className={'w-full h-16 rounded-xl flex items-center justify-center mb-2 ' + (startingBhajan === bhajan.id ? 'bg-primary/20 text-primary' : 'bg-foreground/[0.12] text-foreground/40')}>
                        <Mic2 className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-bold leading-tight line-clamp-2">{bhajan.title}</p>
                    </button>
                  ))}
                  {filteredBhajans.length === 0 && (
                    <p className="text-xs text-foreground/40 italic py-2">No bhajans found</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-black py-4 rounded-xl flex items-center justify-center gap-2 font-black shadow-[0_0_15px_rgba(255,122,0,0.3)] active:scale-95 transition-transform"
              >
                {isCreating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Waking Server...</>
                ) : (
                  <><Mic2 className="w-5 h-5" /> Create Room</>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4">
            <div className="flex-1 h-px bg-foreground/10" />
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-foreground/10" />
          </div>

          <div className="glass p-6 rounded-3xl border-foreground/5 shadow-xl">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" /> Join Existing Room
            </h2>
            <form onSubmit={handleJoinSubmit} className="flex gap-3">
              <input 
                type="text" 
                maxLength={4}
                placeholder="0000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 w-0 min-w-0 shrink bg-foreground/[0.05] border border-foreground/10 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.3em] focus:border-primary/50 outline-none transition-colors"
              />
              <button 
                type="submit"
                disabled={isJoining}
                className="bg-foreground text-background px-6 rounded-xl font-bold active:scale-95 transition-transform shrink-0 flex items-center gap-2"
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


