import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  username: string;
  mobile: string;
  avatar_url?: string;
}

interface AuthStore {
  user: User | null;
  favorites: string[];
  login: (name: string, mobile: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  toggleFavorite: (bhajanId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      favorites: [],
      login: async (name, mobile) => {
        // Find existing user by mobile
        const { data: existingUser } = await supabase.from('users').select('*').eq('mobile', mobile).single();
        if (existingUser) {
          set({ user: existingUser });
          get().fetchFavorites();
          return true;
        }

        // Create new user
        const username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
        const { data: newUser, error } = await supabase.from('users').insert([{ name, username, mobile }]).select().single();
        
        if (!error && newUser) {
          set({ user: newUser });
          return true;
        }
        return false;
      },
      updateUser: async (data) => {
        const { user } = get();
        if (!user) return;
        const { error } = await supabase.from('users').update(data).eq('id', user.id);
        if (!error) {
          set((state) => ({ user: state.user ? { ...state.user, ...data } : null }));
        }
      },
      logout: () => set({ user: null, favorites: [] }),
      fetchFavorites: async () => {
        const { user } = get();
        if (!user) return;
        const { data } = await supabase.from('favorites').select('bhajan_id').eq('user_id', user.id);
        if (data) {
          set({ favorites: data.map(f => f.bhajan_id) });
        }
      },
      toggleFavorite: async (bhajanId) => {
        const { user, favorites } = get();
        if (!user) return;
        
        const isFav = favorites.includes(bhajanId);
        if (isFav) {
          await supabase.from('favorites').delete().match({ user_id: user.id, bhajan_id: bhajanId });
          set({ favorites: favorites.filter(id => id !== bhajanId) });
        } else {
          await supabase.from('favorites').insert([{ user_id: user.id, bhajan_id: bhajanId }]);
          set({ favorites: [...favorites, bhajanId] });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

