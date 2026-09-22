'use client';

import React from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { Shield, Star } from 'lucide-react';

interface MembersOverlayProps {
  onClose: () => void;
}

export default function MembersOverlay({ onClose }: MembersOverlayProps) {
  const { participants, leaderId, coLeaders, assignCoLeader, removeCoLeader } = useRoomStore();

  const currentUserId = participants.length > 0 ? participants.find(p => p.role === 'leader')?.id || participants[0]?.id : null;
  const isCurrentUserLeader = currentUserId === leaderId;

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl border-foreground/10 flex flex-col max-h-[80vh]">
        <h3 className="text-xl font-black mb-4 flex items-center gap-2 shrink-0">
          <Star className="w-5 h-5 text-primary" /> Live Devotees
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
          {participants.map((p, idx) => {
            const isLeader = p.id === leaderId;
            const isCoLeader = coLeaders.includes(p.id);

            return (
              <div key={idx} className="flex items-center justify-between bg-foreground/[0.03] p-3 rounded-xl border border-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {p.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{p.name} {p.id === currentUserId && '(You)'}</p>
                    {isLeader && <p className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1"><Star className="w-3 h-3" /> Leader</p>}
                    {!isLeader && isCoLeader && <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest flex items-center gap-1"><Shield className="w-3 h-3" /> Co-Leader</p>}
                  </div>
                </div>

                {isCurrentUserLeader && !isLeader && (
                  <div className="shrink-0 ml-2">
                    {isCoLeader ? (
                      <button 
                        onClick={() => removeCoLeader(p.id)}
                        className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded font-bold uppercase transition-colors"
                      >
                        Remove Role
                      </button>
                    ) : (
                      <button 
                        onClick={() => assignCoLeader(p.id)}
                        disabled={coLeaders.length >= 3}
                        className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded font-bold uppercase transition-colors disabled:opacity-50"
                      >
                        Make Co-Leader
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-6 w-full py-3 bg-foreground/10 hover:bg-foreground/20 rounded-xl font-bold transition-colors shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
}
