'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { ChevronLeft, MoreVertical, Music2, ArrowUp, Users, Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/components/Navigation/BottomNav';
import { User } from '@app/shared';

export default function LiveRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewLyricsId = searchParams.get('viewLyrics');
  
  const { 
    roomId, isMockLeader, activeBhajan: roomBhajan, activeParagraphIndex: roomParaIdx, 
    queue, participants, leaveRoom
  } = useRoomStore();
  const { isQueueSheetOpen, setQueueSheetOpen } = useUIStore();
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [showMembers, setShowMembers] = useState(false);

  // Standalone lyrics view state
  const isViewMode = !!viewLyricsId;
  const viewBhajan = bhajans.find(b => b.id === viewLyricsId);
  const [viewParaIdx, setViewParaIdx] = useState(0);

  const activeBhajan = isViewMode ? viewBhajan : roomBhajan;
  const activeParagraphIndex = isViewMode ? viewParaIdx : roomParaIdx;
  
  const lyricsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeBhajan && lyricsRef.current[activeParagraphIndex]) {
      lyricsRef.current[activeParagraphIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeParagraphIndex, activeBhajan]);

  if (!isViewMode && !roomId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Music2 className="w-10 h-10 text-foreground/40" />
        </div>
        <h2 className="text-xl font-bold mb-2">Not joined any room</h2>
        <p className="text-sm text-foreground/50 mb-8">Join a room from the Dashboard to sing together.</p>
        <button onClick={() => router.push('/home')} className="bg-primary text-black px-8 py-3 rounded-xl font-bold shadow-lg">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!activeBhajan) {
    return (
      <main className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">No Active Room</h2>
        <p className="text-foreground/60 mb-6">You are not currently in a satsang room.</p>
        <button onClick={() => router.push('/home')} className="bg-primary text-black px-6 py-3 rounded-full font-bold">
          Create or Join a Room
        </button>
      </main>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerCenter = container.getBoundingClientRect().top + (container.clientHeight / 2);

    let closestIdx = 0;
    let minDistance = Infinity;

    lyricsRef.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + (rect.height / 2);
      const distance = Math.abs(containerCenter - elCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeParagraphIndex) {
      if (isViewMode) setViewParaIdx(closestIdx);
      else if (isMockLeader) useRoomStore.getState().setParagraph(closestIdx);
    }
  };

  return (
    <main className="h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background Watermark/Gradient */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-primary/20 blur-[100px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 border-[40px] border-primary/5 rounded-full blur-xl" />
        </div>
      </div>

      {/* Header - Transparent overlay style */}
      <header className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center">
        <button 
          onClick={() => {
            if (roomId) leaveRoom();
            router.push('/home');
          }}
          className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          {!isViewMode && (
            <button onClick={() => setShowMembers(true)} className="glass px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{participants.length} / 100</span>
            </button>
          )}
          <button className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Title Area */}
      <div className="relative z-10 px-6 py-6 text-center">
        <p className="text-[10px] text-primary font-bold tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
          <span>ॐ</span> {activeBhajan.deity} BHAJAN
        </p>
        <h2 className="text-3xl font-black text-primary text-glow">{activeBhajan.title}</h2>
        <div className="flex justify-center mt-3 opacity-50">
          <span className="text-xl">🪷</span>
        </div>
      </div>

      {/* Center Orange Gradient Focus Area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-64 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.15)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Lyrics Scroll Area */}
      <div 
        className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 scroll-smooth pb-32"
        onScroll={handleScroll}
      >
        <div className="space-y-4 pt-[30vh] pb-[50vh]">
          {activeBhajan.lyrics.map((paragraph, idx) => {
            // An active block spans the closest index AND the next one (to make 4 lines total)
            const isActive = idx === activeParagraphIndex || idx === activeParagraphIndex + 1;
            
            return (
              <div
                key={idx}
                ref={(el) => { lyricsRef.current[idx] = el; }}
                className={cn(
                  "text-center transition-all duration-500 ease-out cursor-pointer whitespace-pre-wrap leading-relaxed px-2",
                  isActive 
                    ? "text-[22px] sm:text-[26px] text-white font-bold scale-105" 
                    : "text-lg text-black dark:text-foreground/40 scale-95 opacity-70"
                )}
                onClick={() => {
                  if (isViewMode) setViewParaIdx(idx);
                  else if (isMockLeader) useRoomStore.getState().setParagraph(idx);
                }}
              >
                {paragraph.hindi}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Trigger & Footer (Only in Room mode) */}
      {!isViewMode && (
        <div className="absolute bottom-0 left-0 w-full z-50">
          <div className="glass bg-background/95 rounded-t-3xl p-4 flex items-center justify-between mx-2 mb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border border-white/5">
            <button 
              onClick={() => setQueueSheetOpen(!isQueueSheetOpen)}
              className="flex items-center gap-2 glass px-4 py-2 rounded-full"
            >
              <Music2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Now Singing</span>
            </button>
            
            <div className="flex-1 px-4 text-center">
              <span className="text-xs text-foreground/60 line-clamp-1">{activeBhajan.title}</span>
            </div>
  
            <div className="flex items-center gap-1">
              <div className="w-1 h-3 bg-primary rounded-full animate-[bounce_1s_infinite]" />
              <div className="w-1 h-5 bg-primary rounded-full animate-[bounce_1s_infinite_100ms]" />
              <div className="w-1 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1 h-4 bg-primary rounded-full animate-[bounce_1s_infinite_300ms]" />
            </div>
          </div>
        </div>
      )}

      {/* Queue Bottom Sheet */}
      {!isViewMode && (
        <div className={cn(
          "absolute bottom-0 left-0 w-full h-[70vh] glass bg-background/95 z-[60] rounded-t-[40px] transition-transform duration-500 flex flex-col border-t border-primary/20 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]",
          isQueueSheetOpen ? "translate-y-0" : "translate-y-full"
        )}>
           <div className="p-6 flex-1 flex flex-col">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setQueueSheetOpen(false)} />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-primary">Up Next <span className="text-xs text-white/50">({queue.length}/5)</span></h3>
              {isMockLeader && (
                <button onClick={() => router.push('/library')} className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                  Suggest <Music2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pb-20">
              {queue.map((q, idx) => {
                const b = bhajans.find(b => b.id === q.id);
                if (!b) return null;
                return (
                  <div 
                    key={q.id} 
                    draggable={isMockLeader}
                    onDragStart={(e) => e.dataTransfer.setData('idx', idx.toString())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      if (!isMockLeader) return;
                      const fromIdx = parseInt(e.dataTransfer.getData('idx'));
                      const newQueue = [...queue];
                      const [moved] = newQueue.splice(fromIdx, 1);
                      newQueue.splice(idx, 0, moved);
                      useRoomStore.getState().reorderQueue(newQueue);
                    }}
                    className="flex justify-between items-center glass p-3 rounded-2xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {isMockLeader && <Menu className="w-4 h-4 text-white/20 cursor-grab active:cursor-grabbing" />}
                      <span className="font-bold text-sm">{b.title}</span>
                    </div>
                    <button 
                      onClick={() => useRoomStore.getState().voteQueue(q.id)}
                      className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full"
                    >
                      <ArrowUp className="w-3 h-3 text-primary" />
                      <span className="text-xs font-bold">{q.votes}</span>
                    </button>
                  </div>
                );
              })}
              {queue.length === 0 && (
                <p className="text-center text-white/40 mt-10 text-sm">No bhajans in queue.</p>
              )}
            </div>
           </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end p-4 animate-in fade-in">
           <div className="glass w-full max-w-sm rounded-3xl p-6 relative bg-black/90 mb-10">
              <h2 className="text-xl font-bold mb-4">Room Members ({participants.length}/100)</h2>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {participants.map((p: User) => (
                  <div key={p.id} className="flex justify-between items-center glass p-3 rounded-xl">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-primary capitalize">{p.role}</p>
                    </div>
                    {isMockLeader && p.role !== 'leader' && (
                      <button className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                        Make Co-Leader
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMembers(false)} className="mt-6 w-full py-3 bg-white/10 rounded-xl font-bold">Close</button>
           </div>
        </div>
      )}
    </main>
  );
}
