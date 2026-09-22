'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { ChevronLeft, Flame, Music2, Users, Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import QueueSheet from '@/components/LiveRoom/QueueSheet';
import LibrarySheet from '@/components/LiveRoom/LibrarySheet';
import MembersOverlay from '@/components/LiveRoom/MembersOverlay';

export default function LiveRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewLyricsId = searchParams.get('viewLyrics');
  
  const { 
    isMockLeader, activeParagraphIndex: roomParaIdx, 
    queue, participants, leaveRoom, currentBhajanId
  } = useRoomStore();
  const { setQueueSheetOpen, setLibrarySheetOpen } = useUIStore();
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const roomBhajan = bhajans.find(b => b.id === currentBhajanId) || null;

  const [showMembers, setShowMembers] = useState(false);

  // Standalone lyrics view state
  const isViewMode = !!viewLyricsId;
  const viewBhajan = bhajans.find(b => b.id === viewLyricsId);
  const [viewParaIdx, setViewParaIdx] = useState(0);
  
  const scrollState = useRef<'IDLE' | 'USER_SCROLLING' | 'PROGRAMMATIC_SCROLLING'>('IDLE');
  const userScrollTimeout = useRef<NodeJS.Timeout>();
  const programmaticScrollTimeout = useRef<NodeJS.Timeout>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeBhajan = isViewMode ? viewBhajan : roomBhajan;
  const activeParagraphIndex = isViewMode ? viewParaIdx : roomParaIdx;
  
  const lyricsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleUserInteraction = () => {
    scrollState.current = 'USER_SCROLLING';
    clearTimeout(userScrollTimeout.current);
    userScrollTimeout.current = setTimeout(() => {
      scrollState.current = 'IDLE';
    }, 200);
  };

  const handleScroll = () => {
    if (scrollState.current === 'PROGRAMMATIC_SCROLLING') {
      clearTimeout(programmaticScrollTimeout.current);
      programmaticScrollTimeout.current = setTimeout(() => {
        scrollState.current = 'IDLE';
      }, 100);
      return;
    }

    if (scrollState.current !== 'USER_SCROLLING') return;
    if (!isViewMode && !isMockLeader) return;
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const center = container.getBoundingClientRect().top + container.clientHeight / 2;
    let closestIdx = activeParagraphIndex;
    let minDistance = Infinity;

    lyricsRef.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elCenter - center);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeParagraphIndex) {
      if (isViewMode) setViewParaIdx(closestIdx);
      else useRoomStore.getState().setParagraph(closestIdx);
    }
  };

  // Programmatic scroll effect
  useEffect(() => {
    if (activeBhajan && lyricsRef.current[activeParagraphIndex]) {
      if (scrollState.current !== 'USER_SCROLLING') {
        scrollState.current = 'PROGRAMMATIC_SCROLLING';
        lyricsRef.current[activeParagraphIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        clearTimeout(programmaticScrollTimeout.current);
        programmaticScrollTimeout.current = setTimeout(() => {
          scrollState.current = 'IDLE';
        }, 1000);
      }
    }
  }, [activeParagraphIndex, activeBhajan]);


  const [isRestoring, setIsRestoring] = useState(true);
  useEffect(() => {
    const savedRoomId = localStorage.getItem('active_room_id');
    if (savedRoomId && !useRoomStore.getState().roomId) {
      setIsRestoring(true);
      // Failsafe in case restore fails or takes too long
      const t = setTimeout(() => setIsRestoring(false), 3000);
      return () => clearTimeout(t);
    } else {
      setIsRestoring(false);
    }
  }, [useRoomStore.getState().roomId]);

  if (!activeBhajan) {
    if (isRestoring && !isViewMode) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-foreground/50 animate-pulse">Restoring room...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">No bhajan selected.</p>
        {!isViewMode && <button onClick={() => router.push('/home')} className="ml-4 text-primary">Go Home</button>}
      </div>
    );
  }

  // Get next in queue title safely
  const nextInQueueBhajan = queue.length > 0 ? bhajans.find(b => b.id === queue[0].id) : null;

  return (
    <div className="h-screen flex flex-col bg-background font-sans overflow-hidden relative selection:bg-primary/20">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <header className="px-4 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!isViewMode) leaveRoom();
              router.back();
            }} 
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors shadow-lg border border-foreground/5"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {!isViewMode && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">Room ID</span>
              <span className="text-sm font-black text-primary tracking-widest">{useRoomStore.getState().roomId}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-black shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold tracking-wide text-foreground">Sur Sangeet</span>
        </div>

        <div className="flex gap-2 items-center">
          {!isViewMode && (
            <button 
              onClick={() => setShowMembers(true)}
              className="w-10 h-10 flex items-center justify-center bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors relative"
            >
              <Users className="w-5 h-5 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-black flex items-center justify-center">
                {participants.length}
              </span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Title Area */}
          <div className="text-center mt-2 mb-8 relative z-10 animate-fade-in px-4">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-2 flex items-center justify-center gap-2">
              <Flame className="w-3 h-3 text-orange-500" /> {activeBhajan.deity} BHAJAN
            </p>
            <h2 className="text-3xl font-black text-primary text-glow mb-2">{activeBhajan.title}</h2>
          </div>

        {/* Center Orange Gradient Focus Area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-64 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.15)_0%,transparent_70%)] pointer-events-none z-0" />

        {/* Lyrics Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 scroll-smooth pb-32"
          onScroll={handleScroll}
          onWheel={handleUserInteraction}
          onTouchMove={handleUserInteraction}
        >
          <div className="space-y-6 pt-[50vh] pb-[70vh]">
            {activeBhajan.lyrics.map((paragraph, idx) => {
              const isActive = idx === activeParagraphIndex;
              
              return (
                <div
                  key={idx}
                  ref={(el) => { lyricsRef.current[idx] = el; }}
                  className={cn(
                    "text-center transition-all duration-700 ease-in-out cursor-pointer whitespace-pre-wrap leading-relaxed px-2",
                    isActive 
                      ? "text-[22px] sm:text-[28px] text-foreground font-black scale-100 opacity-100 drop-shadow-md" 
                      : "text-[14px] sm:text-[16px] text-foreground/60 font-medium scale-95 opacity-100"
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
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-xl z-50">
            <div className={`glass bg-background/95 rounded-t-3xl md:rounded-3xl p-4 flex items-center mx-2 mb-2 md:mb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border border-foreground/5 ${isMockLeader ? 'justify-between' : 'justify-center'}`}>
              
              {isMockLeader && (
                <button 
                  onClick={() => setLibrarySheetOpen(true)}
                  className="flex items-center gap-3 px-4 py-3 bg-foreground/5 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="relative">
                    <Music2 className="w-5 h-5 text-primary" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">Up Next</p>
                    <p className="text-[10px] text-foreground/50 truncate w-24">
                      {nextInQueueBhajan ? nextInQueueBhajan.title : 'Add to queue'}
                    </p>
                  </div>
                </button>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setQueueSheetOpen(true)}
                  className="w-12 h-12 bg-gradient-to-br from-primary to-orange-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Overlays (Queue, Library & Members) */}
      {!isViewMode && (
        <>
          <QueueSheet />
          <LibrarySheet />

          {/* Members Overlay */}
          {showMembers && (
            <MembersOverlay onClose={() => setShowMembers(false)} />
          )}
        </>
      )}
    </div>
  );
}





