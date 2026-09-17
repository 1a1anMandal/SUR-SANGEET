'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Music2, Image as ImageIcon, AlignLeft } from 'lucide-react';
import { BhajanParagraph } from '@app/shared';

import ThemeToggle from '@/components/ThemeToggle';

export default function AddBhajan() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [deity, setDeity] = useState('');
  const [lyrics, setLyrics] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lyrics) return alert('Please enter title and lyrics');

    // Parse lyrics into exactly 4-line paragraphs
    const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedLyrics: BhajanParagraph[] = [];
    
    for (let i = 0; i < lines.length; i += 4) {
      const chunk = lines.slice(i, i + 4);
      parsedLyrics.push({ hindi: chunk.join('\n') });
    }

    // For mock purposes, just alert.
    console.log({ title, deity, parsedLyrics });
    alert('Bhajan submitted successfully for review!');
    router.back();
  };

  return (
    <main className="pb-24 pt-6 px-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="glass p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Add New Bhajan</h1>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Bhajan Title</label>
          <div className="glass rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-primary/50 transition-colors">
            <Music2 className="w-5 h-5 text-primary/60" />
            <input 
              type="text" 
              placeholder="e.g. Hanuman Chalisa" 
              className="bg-transparent w-full outline-none text-foreground font-medium"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">Deity / Category</label>
          <div className="glass rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-primary/50 transition-colors">
            <ImageIcon className="w-5 h-5 text-primary/60" />
            <input 
              type="text" 
              placeholder="e.g. Hanuman, Krishna" 
              className="bg-transparent w-full outline-none text-foreground font-medium"
              value={deity}
              onChange={e => setDeity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
            Full Lyrics
            <span className="text-primary/60 font-normal lowercase float-right">Will be chunked automatically</span>
          </label>
          <div className="glass rounded-xl flex items-start px-4 py-3 gap-3 focus-within:border-primary/50 transition-colors">
            <AlignLeft className="w-5 h-5 text-primary/60 mt-1 shrink-0" />
            <textarea 
              rows={12}
              placeholder="Paste full lyrics here..." 
              className="bg-transparent w-full outline-none text-foreground font-medium resize-none leading-relaxed whitespace-pre-wrap"
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,122,0,0.3)] active:scale-95 transition-transform"
        >
          Submit Bhajan
        </button>
      </form>
    </main>
  );
}
