import { create } from 'zustand';
import { RoomState, Bhajan, QueueItem } from '@app/shared';
import { io, Socket } from 'socket.io-client';
import { useLibraryStore } from './useLibraryStore';

interface RoomStore extends RoomState {
  socket: Socket | null;
  activeBhajan: Bhajan | null;
  isMockLeader: boolean; // Keeping this purely as a role check for now
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
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    
    socket.on('room_updated', (room) => {
      const bhajans = useLibraryStore.getState().bhajans;
      const activeBhajan = bhajans.find(b => b.id === room.currentBhajanId) || null;
      set({ ...room, activeBhajan });
    });

    socket.on('sync_lyrics', (index: number) => {
      set({ activeParagraphIndex: index });
    });

    socket.on('queue_updated', (queue: QueueItem[]) => {
      set({ queue });
    });

    set({ socket });
  },

  createRoom: (leaderId, leaderName, bhajanId) => {
    return new Promise((resolve) => {
      get().initSocket();
      const socket = get().socket!;
      const roomId = Math.floor(1000 + Math.random() * 9000).toString();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.emit('create_room', { leaderId, leaderName, bhajanId, roomId }, (res: { success: boolean, room: any }) => {
        if (res.success) {
          const bhajans = useLibraryStore.getState().bhajans;
          const activeBhajan = bhajans.find(b => b.id === bhajanId) || null;
          set({ ...res.room, activeBhajan, isMockLeader: true });
          resolve(roomId);
        }
      });
    });
  },

  joinRoom: (roomId, userId, name) => {
    return new Promise((resolve) => {
      get().initSocket();
      const socket = get().socket!;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.emit('join_room', { roomId, userId, name }, (res: { success: boolean, room: any, error?: string }) => {
        if (res.success) {
          const bhajans = useLibraryStore.getState().bhajans;
          const activeBhajan = bhajans.find(b => b.id === res.room.currentBhajanId) || null;
          // Determine if they are leader
          const isLeader = res.room.leaderId === userId;
          set({ ...res.room, activeBhajan, isMockLeader: isLeader });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  setParagraph: (index) => {
    const { socket, roomId, isMockLeader } = get();
    if (!isMockLeader) return;
    set({ activeParagraphIndex: index });
    socket?.emit('update_lyrics_index', { roomId, index });
  },

  addToQueue: (bhajanId) => {
    const { socket, roomId } = get();
    socket?.emit('add_to_queue', { roomId, bhajanId });
  },
  
  voteQueue: (bhajanId) => {
    const { socket, roomId } = get();
    socket?.emit('vote_queue', { roomId, bhajanId });
  },

  reorderQueue: (newQueue) => {
    const { socket, roomId, isMockLeader } = get();
    if (!isMockLeader) return;
    socket?.emit('reorder_queue', { roomId, newQueue });
  },

  leaveRoom: () => {
    const { socket } = get();
    socket?.disconnect();
    set({ socket: null, roomId: '', activeBhajan: null, participants: [], queue: [] });
  }
}));
