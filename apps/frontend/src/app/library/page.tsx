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
  const { favorites, toggleFavorite } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState('All');

  let bhajans = filteredBhajans();
  if (activeCategory !== 'All') {
    bhajans = bhajans.filter(b => b.deity.toLowerCase() === activeCategory.toLowerCase());
  }

  const mostPlayed = allBhajans.slice(0, 4);

  return (
    <main className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 md:mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-foreground">
            <Flame className="w-6 h-6 md:w-7 md:h-7 fill-current" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide">Library</h1>
            <p className="text-xs md:text-sm text-foreground/60">Sur Sangeet</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <ThemeToggle />
          <button 
            onClick={() => router.push('/library/add')}
            className="bg-primary/20 text-primary px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold flex items-center gap-1 hover:bg-primary/30 transition-colors"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="glass rounded-full flex items-center px-4 py-3 md:py-4 gap-3 mb-6 md:mb-10 max-w-2xl focus-within:border-primary/50 transition-colors">
        <Search className="w-5 h-5 text-foreground/40" />
        <input 
          type="text" 
          placeholder="Search by title, deity, or lyrics..." 
          className="bg-transparent w-full outline-none text-sm md:text-base text-foreground placeholder:text-foreground/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar mb-8 md:mb-12 pb-2">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
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
        <div className="mb-8 md:mb-12">
          <h2 className="font-bold text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Most Played
          </h2>
          <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-4">
            {mostPlayed.map(bhajan => (
              <div key={bhajan.id} className="w-48 md:w-64 shrink-0 glass p-3 md:p-5 rounded-2xl cursor-pointer hover:bg-foreground/5 transition-colors" onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)}>
                <div className="w-full h-24 md:h-32 rounded-xl bg-gradient-to-br from-primary/20 to-black flex items-center justify-center mb-3 md:mb-4">
                  <Music2 className="w-6 h-6 md:w-8 md:h-8 text-primary/40" />
                </div>
                <h3 className="font-bold text-sm md:text-base truncate">{bhajan.title}</h3>
                <p className="text-[10px] md:text-xs text-foreground/50 line-clamp-2 mt-1 leading-snug">{bhajan.lyrics[0].hindi}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h2 className="font-bold text-lg md:text-xl">{activeCategory === 'All' ? 'All Bhajans' : `${activeCategory} Bhajans`}</h2>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {bhajans.map((bhajan) => (
          <div key={bhajan.id} className="glass rounded-2xl p-4 md:p-6 relative overflow-hidden group flex flex-col">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-gradient-to-br from-primary/20 to-black shrink-0 relative overflow-hidden flex items-center justify-center">
                <Music2 className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg md:text-xl mb-1 leading-tight pr-6">{bhajan.title}</h3>
                  <Heart 
                    onClick={() => toggleFavorite(bhajan.id)}
                    className={`w-5 h-5 md:w-6 md:h-6 cursor-pointer shrink-0 transition-colors ${
                      favorites.includes(bhajan.id) ? 'text-primary fill-primary' : 'text-foreground/40 hover:text-primary'
                    }`} 
                  />
                </div>
                <p className="text-xs md:text-sm text-foreground/60 line-clamp-2 leading-relaxed mb-2">
                  {bhajan.lyrics[0].hindi}
                </p>
                <div className="mt-auto flex gap-2">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-wider bg-foreground/5 px-2 py-1 md:px-3 md:py-1.5 rounded">{bhajan.deity}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)}
                className="w-full glass py-2 md:py-3 rounded-xl text-sm md:text-base font-semibold flex items-center justify-center gap-2 hover:bg-foreground/10 transition-colors"
              >
                <Music2 className="w-4 h-4 md:w-5 md:h-5" /> View Lyrics
              </button>
            </div>
          </div>
        ))}
        {bhajans.length === 0 && (
          <div className="col-span-full text-center text-foreground/50 py-10 md:py-16 glass rounded-2xl">
            No bhajans found in this category.
          </div>
        )}
      </div>
    </main>
  );
}
