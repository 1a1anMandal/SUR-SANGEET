'use client';
import { useEffect } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function DataFetcher() {
  const fetchBhajans = useLibraryStore(state => state.fetchBhajans);
  const fetchFavorites = useAuthStore(state => state.fetchFavorites);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchBhajans();
  }, [fetchBhajans]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  return null;
}
