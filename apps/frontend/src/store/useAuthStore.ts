import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  username: string;
  mobile: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
}

interface AuthStore {
  user: User | null;
  favorites: string[];
  login: (name: string, mobile: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<boolean>;
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
        try {
          const { data: existingUser } = await supabase.from('users').select('*').eq('mobile', mobile).maybeSingle();
          if (existingUser) {
            set({ user: existingUser });
            get().fetchFavorites();
            return true;
          }
          const username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
          const { data: newUser, error: insertError } = await supabase.from('users').insert([{ name, username, mobile }]).select().single();
          if (!insertError && newUser) {
            set({ user: newUser });
            return true;
          }
          alert('Insert Error: ' + (insertError?.message || 'Unknown'));
          return false;
        } catch (err: any) {
          alert('Exception: ' + err.message);
          return false;
        }
      },
      updateUser: async (data) => {
        const { user } = get();
        if (!user) return false;
        
        try {
          const { error } = await supabase.from('users').update(data).eq('id', user.id);
          if (error) {
            alert('Update Failed: ' + error.message);
            return false;
          }
          set({ user: { ...user, ...data } });
          return true;
        } catch (err: any) {
          alert('Error: ' + err.message);
          return false;
        }
      },
      logout: () => set({ user: null, favorites: [] }),
      fetchFavorites: async () => {
        const { user } = get();
        if (!user) return;
        const { data, error } = await supabase.from('favorites').select('bhajan_id').eq('user_id', user.id);
        if (!error && data) {
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
          await supabase.from('favorites').insert({ user_id: user.id, bhajan_id: bhajanId });
          set({ favorites: [...favorites, bhajanId] });
        }
      }
    }),
    {
      name: 'sur-sangeet-auth',
    }
  )
);
