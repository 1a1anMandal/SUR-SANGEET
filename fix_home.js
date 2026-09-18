const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/app/home/page.tsx', 'utf-8');

if (!content.includes('FullScreenLoader')) {
  content = content.replace(import ThemeToggle, import ThemeToggle from '@/components/ThemeToggle';\nimport FullScreenLoader from '@/components/FullScreenLoader';);
  // also clean up duplicate ThemeToggle import if it happens
  content = content.replace(import ThemeToggle from '@/components/ThemeToggle';\nimport ThemeToggle from '@/components/ThemeToggle';, import ThemeToggle from '@/components/ThemeToggle';);
}

// Add activeCategory state
if (!content.includes('activeCategory')) {
  content = content.replace(const [roomName, setRoomName] = useState('');, const [roomName, setRoomName] = useState('');\n  const [activeCategory, setActiveCategory] = useState('All'););
}

// Update filteredBhajans logic
const oldFilteredLogic = const filteredBhajans = bhajans.filter(b => \n    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || \n    b.deity.toLowerCase().includes(searchQuery.toLowerCase())\n  );;

const newFilteredLogic = const categories = ['All', ...Array.from(new Set(bhajans.map(b => b.deity)))];\n\n  const filteredBhajans = bhajans.filter(b => {\n    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.deity.toLowerCase().includes(searchQuery.toLowerCase());\n    const matchesCategory = activeCategory === 'All' || b.deity === activeCategory;\n    return matchesSearch && matchesCategory;\n  });;

content = content.replace(oldFilteredLogic, newFilteredLogic);

const oldStartingBhajanUI = <div>
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
              </div>;

const newStartingBhajanUI = <div>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Starting Bhajan</label>
                  <div className="flex items-center gap-2 bg-foreground/[0.05] border border-foreground/10 rounded-full px-3 py-1.5 focus-within:border-primary/50 transition-colors">
                    <Search className="w-3 h-3 text-foreground/40" />
                    <input 
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-[10px] font-bold w-20"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={'px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ' + (activeCategory === cat ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-foreground/[0.03] border-foreground/5 hover:bg-foreground/[0.08] text-foreground/60')}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Vertical Selection List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {filteredBhajans.map(bhajan => (
                    <button
                      key={bhajan.id}
                      onClick={() => setStartingBhajan(bhajan.id)}
                      className={'w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition-all ' + (startingBhajan === bhajan.id ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(255,122,0,0.1)]' : 'bg-foreground/[0.03] border-foreground/5 hover:bg-foreground/[0.08]')}
                    >
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' + (startingBhajan === bhajan.id ? 'bg-primary/20 text-primary' : 'bg-foreground/[0.1] text-foreground/40')}>
                        <Mic2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold leading-tight truncate">{bhajan.title}</p>
                        <p className="text-[10px] text-foreground/50 uppercase tracking-widest mt-0.5">{bhajan.deity}</p>
                      </div>
                      {startingBhajan === bhajan.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                  {filteredBhajans.length === 0 && (
                    <div className="p-4 text-center glass rounded-2xl">
                      <p className="text-xs text-foreground/40 italic">No bhajans found</p>
                    </div>
                  )}
                </div>
              </div>;

content = content.replace(oldStartingBhajanUI, newStartingBhajanUI);

const mainTag = '<main className="pb-24 pt-6 px-4 relative h-screen overflow-y-auto">';
const mainWithLoader = '<main className="pb-24 pt-6 px-4 relative h-screen overflow-y-auto">\n      {(isCreating || isJoining) && <FullScreenLoader text={isCreating ? "Waking Server..." : "Joining..."} />}';

content = content.replace(mainTag, mainWithLoader);

fs.writeFileSync('apps/frontend/src/app/home/page.tsx', content, 'utf-8');
console.log("Done");
