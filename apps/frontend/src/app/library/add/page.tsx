'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Music2, Image as ImageIcon, AlignLeft, Loader2 } from 'lucide-react';
import { BhajanParagraph } from '@app/shared';
import { supabase } from '@/lib/supabase';
import { useLibraryStore } from '@/store/useLibraryStore';

import ThemeToggle from '@/components/ThemeToggle';

export default function AddBhajan() {
  const router = useRouter();
  const fetchBhajans = useLibraryStore(state => state.fetchBhajans);
  
  const [title, setTitle] = useState('');
  const [deity, setDeity] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lyrics) return alert('Please enter title and lyrics');

    setIsSubmitting(true);

    // Parse lyrics into exactly 4-line paragraphs
    const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedLyrics: BhajanParagraph[] = [];
    
    for (let i = 0; i < lines.length; i += 4) {
      const chunk = lines.slice(i, i + 4);
      parsedLyrics.push({ hindi: chunk.join('\n') });
    }

    // Insert directly into Supabase
    const { error } = await supabase.from('bhajans').insert([{
      title,
      deity: deity || 'Unknown',
      lyrics: parsedLyrics,
      status: 'approved'
    }]);

    setIsSubmitting(false);

    if (error) {
      alert('Failed to upload bhajan: ' + error.message);
      return;
    }

    // Refresh global store so it shows up instantly
    fetchBhajans();
    
    alert('Bhajan uploaded successfully!');
    router.back();
  };

  return (
    <main className="pb-24 pt-6 px-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="glass p-2 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black">Add Bhajan</h1>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 rounded-3xl space-y-5 border-primary/20">
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Title
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
              <Music2 className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="e.g. Achyutam Keshavam" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Deity / Category
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
              <ImageIcon className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="e.g. Krishna" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={deity}
                onChange={(e) => setDeity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Lyrics (Hindi)
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-start px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
              <AlignLeft className="w-5 h-5 text-primary/60 mt-1" />
              <textarea 
                placeholder="Paste the lyrics here..." 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium min-h-[200px] resize-y"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-foreground/40 ml-1 mt-2">
              Note: Lines will automatically be grouped into 4-line paragraphs for live sync.
            </p>
          </div>

        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-orange-500 text-black font-black uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
            </>
          ) : (
            'Publish Bhajan'
          )}
        </button>
      </form>
    </main>
  );
}

