const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/app/live/page.tsx', 'utf-8');

// We need to add Search to lucide-react imports
content = content.replace('ChevronLeft, Flame, MoreVertical, Music2, ArrowUp, Users, Menu', 'ChevronLeft, Flame, MoreVertical, Music2, ArrowUp, Users, Menu, Search');

// Inject new state variables and refs after const [viewParaIdx, setViewParaIdx] = useState(0);
const new_state = \
  const [searchQuery, setSearchQuery] = useState('');
  const [randomSuggestions, setRandomSuggestions] = useState<any[]>([]);
  
  const scrollState = useRef<'IDLE' | 'USER_SCROLLING' | 'PROGRAMMATIC_SCROLLING'>('IDLE');
  const userScrollTimeout = useRef<NodeJS.Timeout>();
  const programmaticScrollTimeout = useRef<NodeJS.Timeout>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
\;
content = content.replace('const [viewParaIdx, setViewParaIdx] = useState(0);', 'const [viewParaIdx, setViewParaIdx] = useState(0);' + new_state);

// Inject useEffect for random suggestions and search results inside the component
const suggestions_effect = \
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
        lyricsRef.current[activeParagraphIndex].scrollIntoView({
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
\;
content = content.replace('  if (!activeBhajan) {', suggestions_effect + '\\n  if (!activeBhajan) {');

const old_title_area = \        {/* Title Area */}
        <div className="text-center mt-2 mb-8 relative z-10 animate-fade-in px-4">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-2 flex items-center justify-center gap-2">
            <span className="text-orange-500">?</span> {activeBhajan.deity} BHAJAN
          </p>
          <h2 className="text-3xl font-black text-primary text-glow">{activeBhajan.title}</h2>
          <div className="flex justify-center mt-3 opacity-50">
            <span className="text-xl">??</span>
          </div>
        </div>\;

const new_title_area = \        {/* Title & Search Area */}
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
                      if (isViewMode) router.push(\/live?viewLyrics=\\);
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
        </div>\;

content = content.replace(old_title_area, new_title_area);

const old_scroll_div = \        {/* Lyrics Scroll Area */}
        <div 
          className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 scroll-smooth pb-32"
          
        >\;

const new_scroll_div = \        {/* Lyrics Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 scroll-smooth pb-32"
          onScroll={handleScroll}
          onWheel={handleUserInteraction}
          onTouchMove={handleUserInteraction}
        >\;

content = content.replace(old_scroll_div, new_scroll_div);

const old_bottom = \            })}
          </div>
        </div>\;

const new_bottom = \            })}
          </div>

          {/* Random Suggestions */}
          <div className="mt-10 mb-32 px-4 animate-fade-in relative z-20">
             <div className="w-12 h-1 bg-foreground/10 rounded-full mx-auto mb-8" />
             <h3 className="text-center font-bold text-foreground/50 mb-4 text-sm tracking-widest uppercase">You Might Also Like</h3>
             <div className="flex flex-col gap-3 max-w-sm mx-auto pb-20">
                {randomSuggestions.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => {
                      if (isViewMode) router.push(\/live?viewLyrics=\\);
                      else useRoomStore.getState().addBhajanToQueue(b.id);
                    }}
                    className="flex items-center gap-4 p-4 glass bg-foreground/[0.02] rounded-2xl hover:bg-foreground/5 transition-colors border border-foreground/5 w-full"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-sm truncate">{b.title}</p>
                      <p className="text-[10px] text-foreground/50 uppercase tracking-widest">{b.deity}</p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </div>\;

content = content.replace(old_bottom, new_bottom);

fs.writeFileSync('apps/frontend/src/app/live/page.tsx', content, 'utf-8');
console.log("Modification complete");
