import { create } from 'zustand';
import { QueueItem, Bhajan } from '@app/shared';
import { useLibraryStore } from './useLibraryStore';
import { useAuthStore } from './useAuthStore';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RoomStore {
  roomId: string;
  roomName: string;
  leaderId: string;
  coLeaders: string[];
  currentBhajanId: string | null;
  activeParagraphIndex: number;
  queue: QueueItem[];
  participants: any[];
  channel: RealtimeChannel | null;
  activeBhajan: Bhajan | null;
  isMockLeader: boolean;
  createRoom: (leaderId: string, leaderName: string, bhajanId: string, roomName: string) => Promise<string>;
  joinRoom: (roomId: string, userId: string, name: string) => Promise<boolean>;
  setParagraph: (index: number) => void;
  addToQueue: (bhajanId: string) => void;
  voteQueue: (bhajanId: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  leaveRoom: () => void;
  _subscribeToRoom: (roomId: string, userId: string, userName: string) => void;
  _fetchAndApplyRoomState: (roomId: string) => Promise<void>;
  _updateDbQueue: (roomId: string, queue: QueueItem[]) => Promise<void>;
  assignCoLeader: (userId: string) => Promise<void>;
  removeCoLeader: (userId: string) => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: '',
  roomName: '',
  leaderId: '',
  coLeaders: [],
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
      roomName: room.name || 'Live Room',
      leaderId: room.leader_id,
      coLeaders: room.co_leaders || [],
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

        // Auto-disband if no leaders are left in presence (grace period for refresh)
        const hasLeader = participants.some((p: any) => p.role === 'leader' || p.role === 'co-leader');
        if (!(window as any).disbandTimeout && !hasLeader && participants.length > 0) {
          (window as any).disbandTimeout = setTimeout(() => {
            const currentParticipants = get().participants;
            if (!currentParticipants.some((p: any) => p.role === 'leader' || p.role === 'co-leader')) {
              alert("The room has been closed as all leaders have left.");
              get().leaveRoom();
              window.location.href = '/home';
            }
          }, 10000); // 10 seconds grace period for leader page refresh
        } else if (hasLeader && (window as any).disbandTimeout) {
          clearTimeout((window as any).disbandTimeout);
          (window as any).disbandTimeout = null;
        }
      })
      .on('broadcast', { event: 'scroll' }, ({ payload }) => {
        set({ activeParagraphIndex: payload.index });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
(payload) => {
        const room = payload.new;
        const bhajans = useLibraryStore.getState().bhajans;
        const activeBhajan = bhajans.find(b => b.id === room.current_bhajan_id) || null;
        
        const isLeader = get().leaderId === userId;
        const isCoLeader = (room.co_leaders || []).includes(userId);
        
        set({
          currentBhajanId: room.current_bhajan_id,
          queue: room.queue || [],
          coLeaders: room.co_leaders || [],
          activeBhajan,
          isMockLeader: isLeader || isCoLeader
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
() => {
        alert("The room has been closed by the leader.");
        get().leaveRoom();
        window.location.href = '/home';
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const isLeader = get().leaderId === userId;
          const isCoLeader = get().coLeaders.includes(userId);
          let role = 'participant';
          if (isLeader) role = 'leader';
          else if (isCoLeader) role = 'co-leader';
          await channel.track({ id: userId, name: userName, role });
        }
      });

    set({ channel });
  },

  createRoom: async (leaderId, leaderName, bhajanId, roomName) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Auto-queue 10 random bhajans
    const allBhajans = useLibraryStore.getState().bhajans;
    const availableBhajans = allBhajans.filter(b => b.id !== bhajanId && b.lyrics && b.lyrics.length > 0);
    const shuffled = availableBhajans.sort(() => 0.5 - Math.random());
    const initialQueue = shuffled.slice(0, 10).map(b => ({
      id: b.id,
      votes: 0,
      voters: []
    }));
    
    const { error } = await supabase.from('rooms').insert({
      id: roomId,
      name: roomName,
      leader_id: leaderId,
      co_leaders: [],
      current_bhajan_id: bhajanId,
      active_paragraph_index: 0,
      queue: initialQueue
    });

    if (error) {
      alert('Failed to create room in database. Please ensure you ran the provided SQL script in Supabase.');
      console.error(error);
      return '';
    }

    await get()._fetchAndApplyRoomState(roomId);
    
    // Auto-save to recently joined rooms
    const recent = JSON.parse(localStorage.getItem('recent_rooms') || '[]');
    const updatedRecent = [{ roomId, roomName, lastSeenLiveAt: Date.now() }, ...recent.filter((r: any) => r.roomId !== roomId)].slice(0, 5);
    localStorage.setItem('recent_rooms', JSON.stringify(updatedRecent));
    
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
      .gt('created_at', threeHoursAgo)
      .single();

    if (error || !room) {
      console.error(error);
      localStorage.removeItem('active_room_id');
      return false;
    }

    await get()._fetchAndApplyRoomState(roomId);
    
    // Save to local storage for persistence on refresh
    localStorage.setItem('active_room_id', roomId);

    // Auto-save to recently joined rooms
    const roomName = room.name || 'Live Room';
    const recent = JSON.parse(localStorage.getItem('recent_rooms') || '[]');
    const updatedRecent = [{ roomId, roomName, lastSeenLiveAt: Date.now() }, ...recent.filter((r: any) => r.roomId !== roomId)].slice(0, 5);
    localStorage.setItem('recent_rooms', JSON.stringify(updatedRecent));
    
    // Check if the joining user is the leader or a co-leader
    const isLeader = room.leader_id === userId;
    const isCoLeader = Array.isArray(room.co_leaders) && room.co_leaders.includes(userId);
    
    set({ isMockLeader: isLeader || isCoLeader });
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

    // FILO approach with a strict limit of 10. (Add to front, keep top 10)
    const newQueue = [{ id: bhajanId, votes: 0, voters: [] }, ...queue].slice(0, 10);
    
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

  assignCoLeader: async (userId: string) => {
    const { roomId, coLeaders, leaderId } = get();
    // Only leader can assign
    const currentUserId = get().participants.length > 0 ? get().participants.find(p => p.role === 'leader')?.id : null;
    if (currentUserId !== leaderId || !roomId) return;
    
    if (coLeaders.length >= 3) {
      alert('Maximum 3 co-leaders allowed.');
      return;
    }

    if (coLeaders.includes(userId)) return;

    const newCoLeaders = [...coLeaders, userId];
    set({ coLeaders: newCoLeaders });
    const { error } = await supabase.from('rooms').update({ co_leaders: newCoLeaders }).eq('id', roomId);
    if (error) console.error('Error updating co-leaders', error);
  },

  removeCoLeader: async (userId: string) => {
    const { roomId, coLeaders, leaderId } = get();
    const currentUserId = get().participants.length > 0 ? get().participants.find(p => p.role === 'leader')?.id : null;
    if (currentUserId !== leaderId || !roomId) return;
    
    const newCoLeaders = coLeaders.filter(id => id !== userId);
    set({ coLeaders: newCoLeaders });
    const { error } = await supabase.from('rooms').update({ co_leaders: newCoLeaders }).eq('id', roomId);
    if (error) console.error('Error removing co-leader', error);
  },

  leaveRoom: async () => {
    const { channel, roomId, leaderId, coLeaders, participants } = get();
    
    // Check if we are the last leader/co-leader leaving
    const { user } = useAuthStore.getState();
    if (user && roomId) {
      const isLeader = leaderId === user.id;
      const isCoLeader = coLeaders.includes(user.id);
      
      if (isLeader || isCoLeader) {
        const otherLeaders = participants.filter(p => 
          p.id !== user.id && (p.role === 'leader' || p.role === 'co-leader')
        );
        
        if (otherLeaders.length === 0) {
          // Delete room from DB, this triggers the DELETE postgres event for everyone else
          await supabase.from('rooms').delete().eq('id', roomId);
        }
      }
    }

    if (channel) {
      supabase.removeChannel(channel);
    }
    localStorage.removeItem('active_room_id');
    
    // Also remove from recently joined list if it's there
    const recent = JSON.parse(localStorage.getItem('recent_rooms') || '[]');
    const updatedRecent = recent.filter((r: any) => r.roomId !== roomId);
    localStorage.setItem('recent_rooms', JSON.stringify(updatedRecent));

    set({
      roomId: '',
      roomName: '',
      leaderId: '',
      coLeaders: [],
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


