'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ChevronLeft, Flame, Music2, Users, Menu, Power } from 'lucide-react';
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

  const user = useAuthStore(state => state.user);
  const leaderId = useRoomStore(state => state.leaderId);
  const isCreator = user?.id === leaderId;

  const [showMembers, setShowMembers] = useState(false);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);

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
    <div className="fixed top-0 left-0 w-full h-[100dvh] flex flex-col bg-background font-sans overflow-hidden selection:bg-primary/20 z-[9999] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      {/* NO TOP HEADER - All controls moved to Bottom Footer */}
      {isViewMode && (
        <button 
          onClick={() => router.back()} 
          className="absolute top-[env(safe-area-inset-top,1rem)] left-4 md:left-8 w-10 h-10 md:w-12 md:h-12 z-50 rounded-full glass flex items-center justify-center text-foreground hover:bg-foreground/10 transition-colors shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden w-full max-w-4xl mx-auto pt-8 md:pt-12">
        {/* Title Area */}
          <div className="text-center mt-2 mb-4 md:mb-8 relative z-10 animate-fade-in px-4 shrink-0">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-2 flex items-center justify-center gap-2">
              <Flame className="w-3 h-3 text-orange-500" /> {activeBhajan.deity} BHAJAN
            </p>
            <h2 className="text-3xl font-black text-primary text-glow mb-2">{activeBhajan.title}</h2>
          </div>

        {/* Center Orange Gradient Focus Area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-64 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.15)_0%,transparent_70%)] pointer-events-none z-0" />

        {/* Lyrics Scroll Area */}
        <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col min-h-0">
          <div className="absolute top-0 left-0 w-full h-8 md:h-12 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto no-scrollbar px-6 scroll-smooth pb-32 w-full"
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

        {/* Bottom Bar Footer (Only in Room mode) */}
        {!isViewMode && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-2xl z-50">
            <div className="glass bg-background/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t border-foreground/5 md:mx-4 md:mb-6 md:rounded-3xl">
              
              {/* Left Side: Menu + More Lyrics */}
              <div className="flex items-center gap-3">
                {/* Menu Button (QueueSheet) */}
                <button 
                  onClick={() => setQueueSheetOpen(true)}
                  className="w-12 h-12 bg-foreground/5 hover:bg-foreground/10 rounded-full flex items-center justify-center text-foreground transition-colors relative shrink-0"
                >
                  <Menu className="w-5 h-5" />
                  {queue.length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                  )}
                </button>

                {/* More Lyrics Button */}
                {isMockLeader && (
                  <button 
                    onClick={() => setLibrarySheetOpen(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-foreground/5 rounded-2xl active:scale-95 transition-transform"
                  >
                    <Music2 className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold text-foreground truncate max-w-[80px] sm:max-w-none">More Lyrics</span>
                  </button>
                )}
              </div>

              {/* Right Side: Members + Exit Room */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowMembers(true)}
                  className="w-12 h-12 md:w-auto md:px-4 flex items-center justify-center bg-foreground/5 rounded-full md:rounded-2xl hover:bg-foreground/10 transition-colors relative"
                >
                  <Users className="w-5 h-5 text-foreground" />
                  <span className="absolute -top-1 -right-1 md:relative md:top-auto md:right-auto md:ml-2 w-4 h-4 md:w-auto md:h-auto md:bg-transparent bg-primary rounded-full text-[9px] md:text-xs font-bold text-black md:text-foreground flex items-center justify-center border-2 border-background md:border-none">
                    {participants.length}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    if (isCreator) {
                      setShowDisbandConfirm(true);
                    } else {
                      leaveRoom();
                      router.back();
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-12 h-12 md:w-auto md:px-5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full md:rounded-2xl transition-colors shrink-0"
                >
                  <Power className="w-5 h-5" />
                  <span className="hidden md:inline font-bold text-sm">Exit</span>
                </button>
              </div>

            </div>
          </div>
        )}
        </div>
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

          {/* Disband Confirm Modal */}
          {showDisbandConfirm && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
              <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl border-foreground/10 flex flex-col text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Power className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2">Disband Room?</h3>
                <p className="text-sm text-foreground/70 mb-6">You are the creator. Disbanding will permanently close this room for everyone. If you just leave, co-leaders can continue running it.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={async () => {
                      const { supabase } = await import('@/lib/supabase');
                      await supabase.from('rooms').delete().eq('id', useRoomStore.getState().roomId);
                      leaveRoom();
                      router.push('/home');
                    }}
                    className="w-full py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold transition-colors"
                  >
                    Disband for Everyone
                  </button>
                  <button 
                    onClick={() => {
                      leaveRoom();
                      router.push('/home');
                    }}
                    className="w-full py-3 bg-foreground/10 hover:bg-foreground/20 rounded-xl font-bold transition-colors"
                  >
                    Just Leave
                  </button>
                  <button 
                    onClick={() => setShowDisbandConfirm(false)}
                    className="w-full py-3 text-foreground/60 hover:text-foreground font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}





