'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Music2, Image as ImageIcon, AlignLeft, Loader2, Type } from 'lucide-react';
import { BhajanParagraph } from '@app/shared';
import { supabase } from '@/lib/supabase';
import { useLibraryStore } from '@/store/useLibraryStore';

import ThemeToggle from '@/components/ThemeToggle';

export default function AddBhajan() {
  const router = useRouter();
  const { bhajans, fetchBhajans } = useLibraryStore();
  
  const [title, setTitle] = useState('');
  const [englishTitle, setEnglishTitle] = useState('');
  const [deity, setDeity] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract unique categories for autocomplete
  const categories = useMemo(() => {
    const cats = new Set<string>();
    bhajans.forEach(b => cats.add(b.deity));
    return Array.from(cats);
  }, [bhajans]);

  const filteredCategories = categories.filter(c => c.toLowerCase().includes(deity.toLowerCase()) && c.toLowerCase() !== deity.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!title && !englishTitle) || !lyrics) return alert('Please enter at least one title (Hindi or English) and the lyrics.');

    setIsSubmitting(true);

    // Enforce Category Formatting (Capitalize first letter, lower rest)
    const rawDeity = deity.trim() || 'Unknown';
    const formattedDeity = rawDeity.charAt(0).toUpperCase() + rawDeity.slice(1).toLowerCase();

    // Parse lyrics into exactly 4-line paragraphs
    const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedLyrics: BhajanParagraph[] = [];
    
    for (let i = 0; i < lines.length; i += 4) {
      const chunk = lines.slice(i, i + 4);
      parsedLyrics.push({ hindi: chunk.join('\n') });
    }

    // Insert directly into Supabase
    const { error } = await supabase.from('bhajans').insert([{
      title: title.trim(), // Can be empty if they only provided english
      english_title: englishTitle.trim() || null,
      deity: formattedDeity,
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
    <main className="pb-24 pt-6 px-4 md:px-8 max-w-3xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="glass p-2 rounded-full hover:bg-foreground/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-black">Add Bhajan</h1>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 relative">
        <div className="glass p-6 md:p-10 rounded-3xl space-y-5 md:space-y-6 border-primary/20 shadow-xl">
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Title (Hindi)
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
              <Music2 className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="e.g. अच्युतम केशवं" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              English Title
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors">
              <Type className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="e.g. Achyutam Keshavam" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={englishTitle}
                onChange={(e) => setEnglishTitle(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-foreground/40 ml-1 mt-2">
              Note: At least one title (Hindi or English) must be provided.
            </p>
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Deity / Category *
            </label>
            <div className="bg-foreground/[0.05] rounded-xl flex items-center px-4 py-3 gap-3 border border-foreground/5 focus-within:border-primary/50 transition-colors relative z-10">
              <ImageIcon className="w-5 h-5 text-primary/60" />
              <input 
                type="text" 
                placeholder="e.g. Krishna" 
                className="bg-transparent w-full outline-none text-foreground text-sm font-medium"
                value={deity}
                onChange={(e) => {
                  setDeity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>
            {showSuggestions && filteredCategories.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-background border border-foreground/10 rounded-xl shadow-2xl z-20 overflow-hidden max-h-40 overflow-y-auto">
                {filteredCategories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setDeity(c);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-foreground/5 transition-colors font-bold"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block ml-1">
              Lyrics *
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
