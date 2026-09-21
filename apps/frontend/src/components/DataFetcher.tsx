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
      
      // Restore active room if present
      const savedRoomId = localStorage.getItem('active_room_id');
      if (savedRoomId) {
        import('@/store/useRoomStore').then(({ useRoomStore }) => {
          const { roomId, joinRoom } = useRoomStore.getState();
          if (!roomId || roomId !== savedRoomId) {
            joinRoom(savedRoomId, user.id, user.name);
          }
        });
      }
    }
  }, [user, fetchFavorites]);

  if (isLoading) {
    return <FullScreenLoader text="Loading Library..." />;
  }

  return null;
}
