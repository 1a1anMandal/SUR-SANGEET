import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { QueueItem, Bhajan } from '@app/shared';
import { useLibraryStore } from './useLibraryStore';

interface RoomStore {
  roomId: string;
  leaderId: string;
  currentBhajanId: string | null;
  activeParagraphIndex: number;
  queue: QueueItem[];
  participants: any[];
  socket: Socket | null;
  activeBhajan: Bhajan | null;
  isMockLeader: boolean;
  initSocket: () => void;
  createRoom: (leaderId: string, leaderName: string, bhajanId: string) => Promise<string>;
  joinRoom: (roomId: string, userId: string, name: string) => Promise<boolean>;
  setParagraph: (index: number) => void;
  addToQueue: (bhajanId: string) => void;
  voteQueue: (bhajanId: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: '',
  leaderId: '',
  currentBhajanId: null,
  activeParagraphIndex: 0,
  queue: [],
  participants: [],
  activeBhajan: null,
  socket: null,
  isMockLeader: false,

  initSocket: () => {
    if (get().socket) return;
    
    // Auto-detect production URL if env var is missing
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const fallbackUrl = isLocal ? 'http://localhost:3001' : 'https://sur-sangeet-production.up.railway.app';
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || fallbackUrl;
    
    console.log('Connecting to Live Server:', socketUrl);
    
    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      timeout: 30000,
    });
    
    socket.on('room_updated', (room) => {
      const bhajans = useLibraryStore.getState().bhajans;
      const activeBhajan = bhajans.find(b => b.id === room.currentBhajanId) || null;
      set({ ...room, activeBhajan });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket });
  },

  createRoom: (leaderId, leaderName, bhajanId) => {
    return new Promise((resolve) => {
      get().initSocket();
      const socket = get().socket!;
      const roomId = Math.floor(1000 + Math.random() * 9000).toString();
      
      const timeout = setTimeout(() => {
        alert('Live Server took too long to wake up (30s). Please check your NEXT_PUBLIC_SOCKET_URL in Vercel or try again.');
        resolve('');
      }, 30000); // 20 second timeout for cold starts

      socket.emit('create_room', { leaderId, leaderName, bhajanId, roomId }, (res: any) => {
        clearTimeout(timeout);
        if (res?.success) {
          const bhajans = useLibraryStore.getState().bhajans;
          const activeBhajan = bhajans.find(b => b.id === bhajanId) || null;
          set({ ...res.room, activeBhajan, isMockLeader: true, roomId });
          resolve(roomId);
        } else {
          alert('Failed to create room on server.');
          resolve('');
        }
      });
    });
  },

  joinRoom: (roomId, userId, name) => {
    return new Promise((resolve) => {
      get().initSocket();
      const socket = get().socket!;
      
      const timeout = setTimeout(() => {
        alert('Live Server took too long to wake up. Please try again.');
        resolve(false);
      }, 30000);

      socket.emit('join_room', { roomId, userId, name }, (res: any) => {
        clearTimeout(timeout);
        if (res?.success) {
          const bhajans = useLibraryStore.getState().bhajans;
          const activeBhajan = bhajans.find(b => b.id === res.room.currentBhajanId) || null;
          const isLeader = res.room.leaderId === userId;
          set({ ...res.room, activeBhajan, isMockLeader: isLeader, roomId });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  setParagraph: (index) => {
    const { socket, roomId, isMockLeader } = get();
    if (!isMockLeader || !socket || !roomId) return;
    socket.emit('update_lyrics_index', { roomId, index });
  },

  addToQueue: (bhajanId) => {
    const { socket, roomId } = get();
    if (!socket || !roomId) return;
    socket.emit('add_to_queue', { roomId, bhajanId });
  },

  voteQueue: (bhajanId) => {
    const { socket, roomId, participants } = get();
    if (!socket || !roomId) return;
    const userId = participants.length > 0 ? participants[0].id : 'anonymous';
    socket.emit('vote_queue', { roomId, bhajanId, userId });
  },

  reorderQueue: (newQueue) => {
    const { socket, roomId, isMockLeader } = get();
    if (!isMockLeader || !socket || !roomId) return;
    socket.emit('reorder_queue', { roomId, queue: newQueue });
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave_room', { roomId });
    }
    set({
      roomId: '',
      leaderId: '',
      currentBhajanId: null,
      activeParagraphIndex: 0,
      queue: [],
      participants: [],
      activeBhajan: null,
      isMockLeader: false
    });
  }
}));


