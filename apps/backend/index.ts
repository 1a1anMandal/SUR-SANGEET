import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
// @ts-ignore
import { QueueItem } from '@app/shared';

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface RoomData {
  roomId: string;
  leaderId: string;
  currentBhajanId: string | null;
  activeParagraphIndex: number;
  queue: QueueItem[];
  participants: any[];
}

const rooms = new Map<string, RoomData>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', ({ leaderId, leaderName, bhajanId, roomId }, callback) => {
    const room: RoomData = {
      roomId,
      leaderId,
      currentBhajanId: bhajanId,
      activeParagraphIndex: 0,
      queue: [],
      participants: [{ id: leaderId, name: leaderName, role: 'leader' }]
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    if (callback) callback({ success: true, room });
  });

  socket.on('join_room', ({ roomId, userId, name }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      if (callback) callback({ error: 'Room not found' });
      return;
    }
    
    const existing = room.participants.find(p => p.id === userId);
    if (!existing) {
      room.participants.push({ id: userId, name, role: 'participant' });
    }
    
    socket.join(roomId);
    io.to(roomId).emit('room_updated', room);
    if (callback) callback({ success: true, room });
  });

  socket.on('update_lyrics_index', ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.activeParagraphIndex = index;
      io.to(roomId).emit('sync_lyrics', index);
    }
  });

  socket.on('add_to_queue', ({ roomId, bhajanId }) => {
    const room = rooms.get(roomId);
    if (room && !room.queue.find((q: any) => q.id === bhajanId) && room.queue.length < 5) {
      room.queue.push({ id: bhajanId, votes: 0 });
      io.to(roomId).emit('queue_updated', room.queue);
    }
  });

  socket.on('vote_queue', ({ roomId, bhajanId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.queue = room.queue.map((q: any) => 
        q.id === bhajanId ? { ...q, votes: q.votes + 1 } : q
      ).sort((a: any, b: any) => b.votes - a.votes);
      io.to(roomId).emit('queue_updated', room.queue);
    }
  });

  socket.on('reorder_queue', ({ roomId, newQueue }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.queue = newQueue;
      io.to(roomId).emit('queue_updated', room.queue);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});


