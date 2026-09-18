'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { ChevronLeft, Flame, MoreVertical, Music2, ArrowUp, Users, Menu, Search } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/components/Navigation/BottomNav';
import { User } from '@app/shared';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [searchQuery, setSearchQuery] = useState('');
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

  const searchResults = searchQuery.trim() 
    ? bhajans.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.deity.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

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
        {/* Title & Search Area */}
        <div className="text-center mt-2 mb-8 relative z-10 animate-fade-in px-4">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-2 flex items-center justify-center gap-2">
            <span className="text-orange-500">?</span> {activeBhajan.deity} BHAJAN
          </p>
          <h2 className="text-3xl font-black text-primary text-glow mb-6">{activeBhajan.title}</h2>
          
          <div className="relative max-w-sm mx-auto z-50">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Search bhajans to sing..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-2xl p-2 shadow-2xl z-50 max-h-48 overflow-y-auto text-left">
                {searchResults.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => {
                      setSearchQuery('');
                      if (isViewMode) router.push(`/live?viewLyrics=${b.id}`);
                      else useRoomStore.getState().addBhajanToQueue(b.id);
                    }}
                    className="w-full p-3 hover:bg-foreground/5 rounded-xl text-sm font-bold truncate text-left"
                  >
                    {b.title}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          <div className="space-y-6 pt-[30vh] pb-[50vh]">
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

            {/* Random Suggestions */}
            <div className="mt-10 mb-32 px-4 animate-fade-in relative z-20">
              <div className="w-12 h-1 bg-foreground/10 rounded-full mx-auto mb-8" />
              <h3 className="text-center font-bold text-foreground/50 mb-4 text-sm tracking-widest uppercase">You Might Also Like</h3>
              <div className="flex flex-col gap-3 max-w-sm mx-auto pb-20">
                  {randomSuggestions.map(b => (
                    <button 
                      key={b.id} 
                      onClick={() => {
                        if (isViewMode) router.push(`/live?viewLyrics=${b.id}`);
                        else useRoomStore.getState().addBhajanToQueue(b.id);
                      }}
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
          {/* Queue Sheet Overlay */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 w-full h-[85vh] glass bg-background/95 backdrop-blur-2xl rounded-t-[2.5rem] z-[100] transition-transform duration-500 ease-out border-t border-foreground/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]",
              isQueueSheetOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="w-12 h-1.5 bg-foreground/20 rounded-full mx-auto mt-4 mb-6" />
            
            <div className="px-6 flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-foreground">Live Queue</h3>
              <button onClick={() => setQueueSheetOpen(false)} className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10">
              {queue.map((q, idx) => {
                const b = bhajans.find(x => x.id === q.id);
                if (!b) return null;
                return (
                  <div key={q.id} className="flex items-center justify-between glass p-4 rounded-2xl border-foreground/5 bg-foreground/[0.02]">
                    <div className="flex items-center gap-4">
                      <span className="text-foreground/30 font-black text-lg w-4">{idx + 1}</span>
                      <span className="font-bold text-sm">{b.title}</span>
                    </div>
                    <button 
                      onClick={() => useRoomStore.getState().voteQueue(q.id)}
                      className="flex items-center gap-1 bg-foreground/10 px-3 py-1.5 rounded-full"
                    >
                      <ArrowUp className="w-3 h-3 text-primary" />
                      <span className="text-xs font-bold">{q.votes}</span>
                    </button>
                  </div>
                );
              })}
              {queue.length === 0 && (
                <p className="text-center text-foreground/40 mt-10 text-sm">No bhajans in queue.</p>
              )}
            </div>
          </div>

          {/* Members Overlay */}
          {showMembers && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl border-foreground/10">
                <h3 className="text-xl font-black mb-4">Live Devotees</h3>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-foreground/[0.03] p-3 rounded-xl">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {p.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        {p.id === roomId && <p className="text-[10px] text-primary">Leader</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowMembers(false)} className="mt-6 w-full py-3 bg-foreground/10 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}




