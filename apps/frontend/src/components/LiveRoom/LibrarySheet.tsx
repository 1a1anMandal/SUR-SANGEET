'use client';

import React, { useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { useUIStore } from '@/store/useUIStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Search, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LibrarySheet() {
  const { isMockLeader, addToQueue } = useRoomStore();
  const { isLibrarySheetOpen, setLibrarySheetOpen } = useUIStore();
  const bhajans = useLibraryStore(state => state.bhajans);
  
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery.trim() 
    ? bhajans.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (b.english_title && b.english_title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : bhajans;

  if (!isMockLeader) return null;

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-xl h-[85vh] glass bg-background/95 backdrop-blur-2xl rounded-t-[2.5rem] md:rounded-t-3xl z-[100] transition-transform duration-500 ease-out border-t md:border-x border-foreground/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]",
        isLibrarySheetOpen ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="w-12 h-1.5 bg-foreground/20 rounded-full mx-auto mt-4 mb-4" />
      
      <div className="px-6 flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-black text-foreground">Add to Queue</h3>
          <p className="text-xs text-foreground/50">Select bhajans from the library</p>
        </div>
        <button onClick={() => setLibrarySheetOpen(false)} className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2 shrink-0">
          <X className="w-4 h-4" /> Close
        </button>
      </div>

      {/* Search Area */}
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Search library..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-foreground/5 border border-foreground/10 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Library List */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 no-scrollbar space-y-3">
        {searchResults.map(b => (
          <div key={b.id} className="relative flex items-center justify-between glass p-4 rounded-2xl border-foreground/5 bg-foreground/[0.02]">
            <div className="flex flex-col flex-1 overflow-hidden pr-4">
              <span className="font-bold text-sm truncate">{b.title}</span>
              {b.english_title && <span className="text-xs text-foreground/50 truncate">{b.english_title}</span>}
              <span className="text-[10px] uppercase text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded w-fit mt-1">{b.deity}</span>
            </div>
            <button 
              onClick={() => {
                addToQueue(b.id);
                setLibrarySheetOpen(false);
              }}
              className="w-10 h-10 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        ))}
        {searchResults.length === 0 && (
          <div className="text-center text-foreground/40 mt-10">
            <p className="text-sm font-medium">No bhajans found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
