export interface BhajanParagraph {
  hindi: string;
}

export interface Bhajan {
  id: string;
  title: string;
  deity: string;
  lyrics: BhajanParagraph[];
  coverImage?: string;
  status: 'approved' | 'pending';
}

export interface User {
  id: string;
  name: string;
  role?: 'leader' | 'co-leader' | 'participant';
}

export interface QueueItem {
  id: string; // Bhajan ID
  votes: number;
}

export interface RoomState {
  roomId: string;
  leaderId: string;
  currentBhajanId: string | null;
  activeParagraphIndex: number;
  queue: QueueItem[];
  participants: User[];
}
