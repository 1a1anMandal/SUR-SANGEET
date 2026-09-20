'use client';

import { useState } from 'react';
import { X, Save, Music2, Image as ImageIcon, AlignLeft, Type } from 'lucide-react';
import { Bhajan, BhajanParagraph } from '@app/shared';
import { supabase } from '@/lib/supabase';

interface EditBhajanModalProps {
  bhajan: Bhajan;
  onClose: () => void;
  onSuccess: (updatedBhajan: Bhajan) => void;
}

export default function EditBhajanModal({ bhajan, onClose, onSuccess }: EditBhajanModalProps) {
  const [title, setTitle] = useState(bhajan.title);
  const [englishTitle, setEnglishTitle] = useState(bhajan.english_title || '');
  const [deity, setDeity] = useState(bhajan.deity);
  const [lyrics, setLyrics] = useState(bhajan.lyrics.map(p => p.hindi).join('\n\n'));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !lyrics) return alert('Title and Lyrics are required.');
    setIsSaving(true);

    const rawDeity = deity.trim() || 'Unknown';
    const formattedDeity = rawDeity.charAt(0).toUpperCase() + rawDeity.slice(1).toLowerCase();

    const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedLyrics: BhajanParagraph[] = [];
    for (let i = 0; i < lines.length; i += 4) {
      const chunk = lines.slice(i, i + 4);
      parsedLyrics.push({ hindi: chunk.join('\n') });
    }

    const updates = {
      title: title.trim(),
      english_title: englishTitle.trim() || null,
      deity: formattedDeity,
      lyrics: parsedLyrics,
    };

    const { error } = await supabase.from('bhajans').update(updates).eq('id', bhajan.id);
    setIsSaving(false);

    if (error) {
      alert('Error updating: ' + error.message);
    } else {
      onSuccess({ ...bhajan, ...updates });
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-foreground/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-foreground/10">
          <h2 className="text-xl font-black">Edit Bhajan</h2>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Title (Hindi)</label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5">
              <Music2 className="w-5 h-5 text-primary/60" />
              <input value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent w-full outline-none font-bold" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">English Title</label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5">
              <Type className="w-5 h-5 text-primary/60" />
              <input value={englishTitle} onChange={e => setEnglishTitle(e.target.value)} className="bg-transparent w-full outline-none font-medium" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Category / Deity</label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5">
              <ImageIcon className="w-5 h-5 text-primary/60" />
              <input value={deity} onChange={e => setDeity(e.target.value)} className="bg-transparent w-full outline-none font-medium" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Lyrics</label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-start px-4 py-3 gap-3 border border-foreground/5">
              <AlignLeft className="w-5 h-5 text-primary/60 mt-1" />
              <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} className="bg-transparent w-full outline-none text-sm font-medium min-h-[250px] resize-y" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-foreground/10 bg-background/50 rounded-b-3xl flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 py-3 font-black rounded-xl bg-primary text-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,122,0,0.3)] hover:shadow-[0_0_25px_rgba(255,122,0,0.5)] transition-all"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
