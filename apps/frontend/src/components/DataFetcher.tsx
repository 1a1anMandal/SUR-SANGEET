'use client';
import { useEffect } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import FullScreenLoader from './FullScreenLoader';

export default function DataFetcher() {
  const fetchBhajans = useLibraryStore(state => state.fetchBhajans);
  const isLoading = useLibraryStore(state => state.isLoading);
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

  if (isLoading) {
    return <FullScreenLoader text="Loading Library..." />;
  }

  return null;
}
