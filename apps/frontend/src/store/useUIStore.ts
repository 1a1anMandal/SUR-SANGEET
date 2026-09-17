import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isQueueSheetOpen: boolean;
  setQueueSheetOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark', // Default to dark as per images
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      isQueueSheetOpen: false,
      setQueueSheetOpen: (isOpen) => set({ isQueueSheetOpen: isOpen }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
