'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Flame, Copy, Share2, Mic, Users, Search, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/components/Navigation/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomeDashboard() {
  const router = useRouter();
  const { createRoom, joinRoom, roomId } = useRoomStore();
  const user = useAuthStore(state => state.user);
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomName, setRoomName] = useState('');
  const [startingBhajan, setStartingBhajan] = useState('');

  useEffect(() => {
    if (bhajans.length > 0 && !startingBhajan) {
      setStartingBhajan(bhajans[0].id);
    }
  }, [bhajans, startingBhajan]);

  const handleCreateRoom = async () => {
    if (!user) return;
    if (!roomName) return alert('Enter room name');
    if (!startingBhajan) return alert('Please select a bhajan to start with');
    await createRoom(user.id, user.name, startingBhajan);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (joinCode.length === 4) {
      const success = await joinRoom(joinCode, user.id, user.name);
      if (success) {
        router.push('/live');
      } else {
        alert('Room not found or disconnected. Ensure Socket backend is running.');
      }
    } else {
      alert('Please enter a valid 4-digit code');
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/join/' + roomId : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="pb-24 pt-6 px-4 relative h-screen overflow-y-auto">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Sur Sangeet</h1>
            <p className="text-xs text-foreground/60 uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {!roomId && (
        <div className="flex flex-col gap-6 mt-6 animate-fade-in">
          <div className="glass p-6 rounded-3xl border-primary/20 space-y-6 shadow-xl">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 block">Room Name</label>
              <input 
                type="text" 
                placeholder="e.g. Evening Satsang" 
                className="w-full bg-foreground/[0.08] border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-colors"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/60 block">Starting Bhajan</label>
                <div className="flex items-center gap-2 bg-foreground/[0.08] px-3 py-1.5 rounded-full border border-foreground/5">
                  <Search className="w-3 h-3 text-foreground/40" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent text-xs outline-none w-20 focus:w-28 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 pt-1">
                {bhajans.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(b => (
                  <div 
                    key={b.id}
                    onClick={() => setStartingBhajan(b.id)}
                    className={cn(
                      "w-32 shrink-0 p-3 rounded-2xl cursor-pointer transition-all border",
                      startingBhajan === b.id 
                        ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,122,0,0.2)]" 
                        : "glass border-foreground/5 opacity-60 hover:opacity-100 hover:border-foreground/20"
                    )}
                  >
                    <div className="w-full h-16 rounded-xl bg-foreground/[0.12] flex items-center justify-center mb-2 overflow-hidden relative">
                       {b.coverImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                       ) : (
                          <Mic className={startingBhajan === b.id ? "text-primary" : "text-foreground/40"} />
                       )}
                       {startingBhajan === b.id && <div className="absolute inset-0 bg-primary/20" />}
                    </div>
                    <p className="text-xs font-bold text-center line-clamp-2 leading-tight">{b.title}</p>
                  </div>
                ))}
                
                {bhajans.length === 0 && (
                  <div className="w-full text-center py-6 glass rounded-2xl text-primary text-xs flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    No bhajans in library. Please add one first!
                  </div>
                )}
                
                {bhajans.length > 0 && bhajans.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="w-full text-center py-6 text-foreground/40 text-xs">No matches found.</div>
                )}
              </div>
            </div>

            <button 
              onClick={handleCreateRoom}
              disabled={!startingBhajan}
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-black font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,122,0,0.3)] active:scale-95 transition-transform disabled:opacity-50"
            >
              <Mic className="w-5 h-5" />
              Create Room
            </button>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-foreground/10" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">OR</span>
            <div className="flex-1 h-px bg-foreground/10" />
          </div>

          <div className="glass p-6 rounded-3xl border-foreground/5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Join Existing Room
            </h2>
            <form onSubmit={handleJoinSubmit} className="flex gap-3">
              <input 
                type="text" 
                maxLength={4}
                placeholder="0000"
                className="flex-1 w-0 min-w-0 shrink bg-foreground/[0.12] border border-foreground/10 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.3em] focus:border-primary/50 outline-none transition-colors"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                type="submit"
                className="bg-white text-black px-6 rounded-xl font-bold active:scale-95 transition-transform shrink-0"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      )}

      {roomId && (
        <div className="flex flex-col gap-6 mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="glass rounded-3xl p-6 border-primary/30 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Room Active
              </h3>
              <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full uppercase font-bold tracking-wider">Live</span>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-2 mb-6 p-4 glass bg-foreground/[0.12] rounded-2xl border border-foreground/5">
              <p className="text-xs text-foreground/50 uppercase tracking-widest">Access Code</p>
              <p className="text-6xl font-black text-primary tracking-[0.2em] ml-3">{roomId}</p>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <QRCodeSVG value={shareUrl} size={80} />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="glass px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-foreground/10 transition-colors"
                >
                  <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button className="glass px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-foreground/10 transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            <button 
              onClick={() => router.push('/live')}
              className="w-full bg-gradient-to-r from-primary to-orange-500 text-black py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-black shadow-lg active:scale-95 transition-transform"
            >
              Enter Studio <Flame className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}


