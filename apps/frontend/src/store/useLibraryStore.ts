import { create } from 'zustand';
import { Bhajan } from '@app/shared';
import { supabase } from '../lib/supabase';

interface LibraryStore {
  bhajans: Bhajan[];
  searchQuery: string;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  filteredBhajans: () => Bhajan[];
  fetchBhajans: () => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  bhajans: [],
  searchQuery: '',
  isLoading: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  filteredBhajans: () => {
    const { bhajans, searchQuery } = get();
    if (!searchQuery) return bhajans;
    const lowerQuery = searchQuery.toLowerCase();
    return bhajans.filter(b => 
      b.title.toLowerCase().includes(lowerQuery) || 
      b.deity.toLowerCase().includes(lowerQuery) ||
      b.lyrics.some(p => p.hindi.includes(lowerQuery))
    );
  },
  fetchBhajans: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('bhajans').select('*');
    if (!error && data) {
      set({ bhajans: data as Bhajan[] });
    }
    set({ isLoading: false });
  }
}));

