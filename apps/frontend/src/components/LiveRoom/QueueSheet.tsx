'use client';

import React, { useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { useUIStore } from '@/store/useUIStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Search, ArrowUp, X, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

function SortableQueueItem({ q, b, index, isMockLeader, voteQueue, removeQueueItem }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id, disabled: !isMockLeader });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      drag={isMockLeader ? "x" : false}
      dragConstraints={{ left: 0, right: 100 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 80) {
          removeQueueItem(q.id);
        }
      }}
      className={cn(
        "relative flex items-center justify-between glass p-4 rounded-2xl border-foreground/5 bg-foreground/[0.02] touch-pan-y",
        isDragging && "opacity-50 shadow-2xl scale-[1.02]"
      )}
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden relative z-10">
        {isMockLeader && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-foreground/30 p-1 shrink-0 touch-none">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <span className="text-foreground/30 font-black text-sm w-4 shrink-0 text-center">{index + 1}</span>
        <span className="font-bold text-sm truncate">{b.title}</span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 relative z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            voteQueue(q.id);
          }}
          className="flex items-center gap-1 bg-foreground/10 px-3 py-1.5 rounded-full hover:bg-foreground/20 transition-colors"
        >
          <ArrowUp className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold">{q.votes}</span>
        </button>
      </div>

      {/* Swipe to delete indicator (behind the card) */}
      {isMockLeader && (
        <div className="absolute inset-y-0 -left-14 flex items-center text-red-500 opacity-50 z-0">
          <Trash2 className="w-6 h-6" />
        </div>
      )}
    </motion.div>
  );
}

export default function QueueSheet() {
  const { queue, isMockLeader, reorderQueue, voteQueue, addToQueue } = useRoomStore();
  const { isQueueSheetOpen, setQueueSheetOpen } = useUIStore();
  const bhajans = useLibraryStore(state => state.bhajans);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((q) => q.id === active.id);
      const newIndex = queue.findIndex((q) => q.id === over.id);
      reorderQueue(arrayMove(queue, oldIndex, newIndex));
    }
  };

  const removeQueueItem = (id: string) => {
    const newQueue = queue.filter(q => q.id !== id);
    reorderQueue(newQueue);
  };

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 w-full h-[85vh] glass bg-background/95 backdrop-blur-2xl rounded-t-[2.5rem] z-[100] transition-transform duration-500 ease-out border-t border-foreground/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]",
        isQueueSheetOpen ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="w-12 h-1.5 bg-foreground/20 rounded-full mx-auto mt-4 mb-4" />
      
      <div className="px-6 flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-foreground">Live Queue</h3>
        <button onClick={() => setQueueSheetOpen(false)} className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2">
          <X className="w-4 h-4" /> Close
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 no-scrollbar overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest">
            {queue.length} / 10 Songs
          </p>
          {isMockLeader && queue.length > 0 && (
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest text-right">
              Drag to reorder • Swipe right to remove
            </p>
          )}
        </div>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={queue.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 relative">
              {queue.map((q, idx) => {
                const b = bhajans.find(x => x.id === q.id);
                if (!b) return null;
                return (
                  <SortableQueueItem 
                    key={q.id} 
                    q={q} 
                    b={b} 
                    index={idx} 
                    isMockLeader={isMockLeader} 
                    voteQueue={voteQueue} 
                    removeQueueItem={removeQueueItem} 
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        
        {queue.length === 0 && (
          <div className="text-center text-foreground/40 mt-10">
            <p className="text-sm font-medium">No bhajans in queue.</p>
            <p className="text-xs mt-1">Search above to add songs!</p>
          </div>
        )}
      </div>
    </div>
  );
}
