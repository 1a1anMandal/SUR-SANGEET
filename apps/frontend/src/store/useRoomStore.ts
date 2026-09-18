import { create } from 'zustand';
import { QueueItem, Bhajan } from '@app/shared';
import { useLibraryStore } from './useLibraryStore';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RoomStore {
  roomId: string;
  leaderId: string;
  currentBhajanId: string | null;
  activeParagraphIndex: number;
  queue: QueueItem[];
  participants: any[];
  channel: RealtimeChannel | null;
  activeBhajan: Bhajan | null;
  isMockLeader: boolean;
  createRoom: (leaderId: string, leaderName: string, bhajanId: string) => Promise<string>;
  joinRoom: (roomId: string, userId: string, name: string) => Promise<boolean>;
  setParagraph: (index: number) => void;
  addToQueue: (bhajanId: string) => void;
  voteQueue: (bhajanId: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  leaveRoom: () => void;
  _subscribeToRoom: (roomId: string, userId: string, userName: string) => void;
  _fetchAndApplyRoomState: (roomId: string) => Promise<void>;
  _updateDbQueue: (roomId: string, queue: QueueItem[]) => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: '',
  leaderId: '',
  currentBhajanId: null,
  activeParagraphIndex: 0,
  queue: [],
  participants: [],
  activeBhajan: null,
  channel: null,
  isMockLeader: false,

  _fetchAndApplyRoomState: async (roomId: string) => {
    const { data: room, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error || !room) {
      console.error('Failed to fetch room state', error);
      return;
    }
    const bhajans = useLibraryStore.getState().bhajans;
    const activeBhajan = bhajans.find(b => b.id === room.current_bhajan_id) || null;
    
    set({
      roomId: room.id,
      leaderId: room.leader_id,
      currentBhajanId: room.current_bhajan_id,
      queue: room.queue || [],
      activeBhajan,
    });
  },

  _subscribeToRoom: (roomId: string, userId: string, userName: string) => {
    const currentChannel = get().channel;
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const participants = Object.values(state).map((p: any) => p[0]);
        set({ participants });
      })
      .on('broadcast', { event: 'scroll' }, ({ payload }) => {
        set({ activeParagraphIndex: payload.index });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const room = payload.new;
        const bhajans = useLibraryStore.getState().bhajans;
        const activeBhajan = bhajans.find(b => b.id === room.current_bhajan_id) || null;
        set({
          currentBhajanId: room.current_bhajan_id,
          queue: room.queue || [],
          activeBhajan
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const isLeader = get().leaderId === userId;
          await channel.track({ id: userId, name: userName, role: isLeader ? 'leader' : 'participant' });
        }
      });

    set({ channel });
  },

  createRoom: async (leaderId, leaderName, bhajanId) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    const { error } = await supabase.from('rooms').insert({
      id: roomId,
      leader_id: leaderId,
      current_bhajan_id: bhajanId,
      active_paragraph_index: 0,
      queue: []
    });

    if (error) {
      alert('Failed to create room in database. Please ensure you ran the provided SQL script in Supabase.');
      console.error(error);
      return '';
    }

    await get()._fetchAndApplyRoomState(roomId);
    set({ isMockLeader: true });
    get()._subscribeToRoom(roomId, leaderId, leaderName);
    
    return roomId;
  },

  joinRoom: async (roomId, userId, name) => {
    // Only fetch rooms created in the last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .gte('created_at', threeHoursAgo)
      .single();

    if (error || !room) {
      alert('Room not found or has expired.');
      return false;
    }

    await get()._fetchAndApplyRoomState(roomId);
    const isLeader = room.leader_id === userId;
    set({ isMockLeader: isLeader });
    get()._subscribeToRoom(roomId, userId, name);

    return true;
  },

  setParagraph: (index) => {
    const { channel, isMockLeader } = get();
    if (!isMockLeader || !channel) return;
    
    // Broadcast for low latency sync
    channel.send({
      type: 'broadcast',
      event: 'scroll',
      payload: { index }
    });
    
    // Also update local state instantly for leader
    set({ activeParagraphIndex: index });
  },

  _updateDbQueue: async (roomId: string, queue: QueueItem[]) => {
    const { error } = await supabase.from('rooms').update({ queue }).eq('id', roomId);
    if (error) console.error('Failed to update DB queue', error);
  },

  addToQueue: async (bhajanId) => {
    const { roomId, queue } = get();
    if (!roomId) return;
    
    const existing = queue.find(q => q.id === bhajanId);
    if (existing) return;

    const newQueue = [...queue, { id: bhajanId, votes: 0, voters: [] }];
    // Optimistic update
    set({ queue: newQueue });
    
    await get()._updateDbQueue(roomId, newQueue);
  },

  voteQueue: async (bhajanId) => {
    const { roomId, queue, participants } = get();
    if (!roomId) return;
    
    const userId = participants.length > 0 ? participants[0].id : 'anonymous';
    
    const newQueue = queue.map(q => {
      if (q.id === bhajanId) {
        const hasVoted = q.voters.includes(userId);
        return {
          ...q,
          votes: hasVoted ? q.votes - 1 : q.votes + 1,
          voters: hasVoted ? q.voters.filter(v => v !== userId) : [...q.voters, userId]
        };
      }
      return q;
    }).sort((a, b) => b.votes - a.votes);

    set({ queue: newQueue });
    await get()._updateDbQueue(roomId, newQueue);
  },

  reorderQueue: async (newQueue) => {
    const { roomId, isMockLeader } = get();
    if (!isMockLeader || !roomId) return;
    
    set({ queue: newQueue });
    await get()._updateDbQueue(roomId, newQueue);
  },

  leaveRoom: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
    }
    set({
      roomId: '',
      leaderId: '',
      currentBhajanId: null,
      activeParagraphIndex: 0,
      queue: [],
      participants: [],
      activeBhajan: null,
      channel: null,
      isMockLeader: false
    });
  }
}));


