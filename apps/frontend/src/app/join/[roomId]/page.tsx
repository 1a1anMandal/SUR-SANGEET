'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoomStore } from '@/store/useRoomStore';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function JoinRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const joinRoom = useRoomStore(state => state.joinRoom);

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('pendingJoinRoom', roomId as string);
      router.push('/login');
      return;
    }

    const attemptJoin = async () => {
      const success = await joinRoom(roomId as string, user.id, user.name);
      if (success) {
        router.push('/live');
      } else {
        alert('Invalid Room Code or Room not found');
        router.push('/home');
      }
    };

    attemptJoin();
  }, [user, roomId, router, joinRoom]);

  return <FullScreenLoader text="Joining Room..." />;
}
