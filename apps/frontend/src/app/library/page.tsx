'use client';

import { useLibraryStore } from '@/store/useLibraryStore';
import { useRoomStore } from '@/store/useRoomStore';
import { Search, Heart, Music2, Plus, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/useAuthStore';

const CATEGORIES = ['All', 'Krishna', 'Ram', 'Shiva', 'Devi', 'Hanuman'];

export default function Library() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, filteredBhajans, bhajans: allBhajans } = useLibraryStore();
  const { addToQueue, roomId } = useRoomStore();
  const { favorites, toggleFavorite } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState('All');

  let bhajans = filteredBhajans();
  if (activeCategory !== 'All') {
    bhajans = bhajans.filter(b => b.deity.toLowerCase() === activeCategory.toLowerCase());
  }

  const handleAddToQueue = (id: string) => {
    addToQueue(id);
    if (!roomId) {
      alert('You need to join or create a room first to add to queue.');
    } else {
      alert('Added to queue!');
    }
  };

  const mostPlayed = allBhajans.slice(0, 4);

  return (
    <main className="pb-24 pt-6 px-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Library</h1>
            <p className="text-xs text-foreground/60">Sur Sangeet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => router.push('/library/add')}
            className="bg-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-primary/30 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="glass rounded-full flex items-center px-4 py-3 gap-3 mb-6 focus-within:border-primary/50 transition-colors">
        <Search className="w-5 h-5 text-foreground/40" />
        <input 
          type="text" 
          placeholder="Search by title, deity, or lyrics..." 
          className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-foreground/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              activeCategory === cat 
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(255,122,0,0.4)]' 
                : 'glass text-foreground/60 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Most Played */}
      {activeCategory === 'All' && !searchQuery && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" /> Most Played
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {mostPlayed.map(bhajan => (
              <div key={bhajan.id} className="w-48 shrink-0 glass p-3 rounded-2xl cursor-pointer" onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)}>
                <div className="w-full h-24 rounded-xl bg-gradient-to-br from-primary/20 to-black flex items-center justify-center mb-3">
                  <Music2 className="w-6 h-6 text-primary/40" />
                </div>
                <h3 className="font-bold text-sm truncate">{bhajan.title}</h3>
                <p className="text-[10px] text-foreground/50 line-clamp-2 mt-1 leading-snug">{bhajan.lyrics[0].hindi}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{activeCategory === 'All' ? 'All Bhajans' : `${activeCategory} Bhajans`}</h2>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {bhajans.map((bhajan) => (
          <div key={bhajan.id} className="glass rounded-2xl p-4 relative overflow-hidden group">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-black shrink-0 relative overflow-hidden flex items-center justify-center">
                <Music2 className="w-8 h-8 text-primary/40" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg mb-1 leading-tight pr-6">{bhajan.title}</h3>
                  <Heart 
                    onClick={() => toggleFavorite(bhajan.id)}
                    className={`w-5 h-5 cursor-pointer shrink-0 transition-colors ${
                      favorites.includes(bhajan.id) ? 'text-primary fill-primary' : 'text-foreground/40 hover:text-primary'
                    }`} 
                  />
                </div>
                <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed mb-2">
                  {bhajan.lyrics[0].hindi}
                </p>
                <div className="mt-auto flex gap-2">
                  <span className="text-[9px] uppercase tracking-wider bg-foreground/5 px-2 py-1 rounded">{bhajan.deity}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)}
                className="glass py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-foreground/10"
              >
                <Music2 className="w-4 h-4" /> View Lyrics
              </button>
              <button 
                onClick={() => handleAddToQueue(bhajan.id)}
                className="bg-primary/10 text-primary py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/20"
              >
                <Plus className="w-4 h-4" /> Add to Queue
              </button>
            </div>
          </div>
        ))}
        {bhajans.length === 0 && (
          <div className="text-center text-foreground/50 py-10 glass rounded-2xl">
            No bhajans found in this category.
          </div>
        )}
      </div>
    </main>
  );
}
