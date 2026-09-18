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
import MembersOverlay from '@/components/LiveRoom/MembersOverlay';

export default function LiveRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewLyricsId = searchParams.get('viewLyrics');
  
  const { 
    isMockLeader, activeBhajan: roomBhajan, activeParagraphIndex: roomParaIdx, 
    queue, participants, leaveRoom
  } = useRoomStore();
  const { setQueueSheetOpen } = useUIStore();
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [showMembers, setShowMembers] = useState(false);

  // Standalone lyrics view state
  const isViewMode = !!viewLyricsId;
  const viewBhajan = bhajans.find(b => b.id === viewLyricsId);
  const [viewParaIdx, setViewParaIdx] = useState(0);
  const [randomSuggestions, setRandomSuggestions] = useState<any[]>([]);
  
  const scrollState = useRef<'IDLE' | 'USER_SCROLLING' | 'PROGRAMMATIC_SCROLLING'>('IDLE');
  const userScrollTimeout = useRef<NodeJS.Timeout>();
  const programmaticScrollTimeout = useRef<NodeJS.Timeout>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  const activeBhajan = isViewMode ? viewBhajan : roomBhajan;
  const activeParagraphIndex = isViewMode ? viewParaIdx : roomParaIdx;
  
  const lyricsRef = useRef<(HTMLDivElement | null)[]>([]);


  useEffect(() => {
    // Pick 3 random bhajans for suggestions
    const currentId = isViewMode ? viewLyricsId : roomBhajan?.id;
    const others = bhajans.filter(b => b.id !== currentId);
    const shuffled = [...others].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 3));
  }, [viewLyricsId, roomBhajan, bhajans, isViewMode]);

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


if (!activeBhajan) {
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
            className="w-10 h-10 flex items-center justify-center bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-black shadow-[0_0_10px_rgba(255,122,0,0.4)]">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold tracking-wide text-foreground">Sur Sangeet</span>
          </div>
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
            <span className="text-orange-500">?</span> {activeBhajan.deity} BHAJAN
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

            {/* Random Suggestions (Only in View Mode) */}
            {isViewMode && (
              <div className="mt-10 mb-32 px-4 animate-fade-in relative z-20">
                <div className="w-12 h-1 bg-foreground/10 rounded-full mx-auto mb-8" />
                <h3 className="text-center font-bold text-foreground/50 mb-4 text-sm tracking-widest uppercase">You Might Also Like</h3>
                <div className="flex flex-col gap-3 max-w-sm mx-auto pb-20">
                    {randomSuggestions.map(b => (
                      <button 
                        key={b.id} 
                        onClick={() => router.push(`/live?viewLyrics=${b.id}`)}
                        className="flex items-center gap-4 p-4 glass bg-foreground/[0.02] rounded-2xl hover:bg-foreground/5 transition-colors border border-foreground/5 w-full text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Music2 className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate">{b.title}</p>
                          <p className="text-[10px] text-foreground/50 uppercase tracking-widest">{b.deity}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sheet Trigger & Footer (Only in Room mode) */}
        {!isViewMode && (
          <div className="absolute bottom-0 left-0 w-full z-50">
            <div className="glass bg-background/95 rounded-t-3xl p-4 flex items-center justify-between mx-2 mb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border border-foreground/5">
              <button 
                onClick={() => setQueueSheetOpen(true)}
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

      {/* Overlays (Queue & Members) */}
      {!isViewMode && (
        <>
          <QueueSheet />

          {/* Members Overlay */}
          {showMembers && (
            <MembersOverlay onClose={() => setShowMembers(false)} />
          )}
        </>
      )}
    </div>
  );
}





