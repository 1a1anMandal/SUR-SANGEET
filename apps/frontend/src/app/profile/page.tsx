'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { UserCircle2, Phone, LogOut, Edit2, Heart, Music2, Flame, Check, Camera } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Profile() {
  const router = useRouter();
  const { user, updateUser, logout, favorites } = useAuthStore();
  const bhajans = useLibraryStore(state => state.bhajans);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter actual favorites from library
  const favouriteBhajans = bhajans.filter(b => favorites.includes(b.id));

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Please login first.</p>
        <button onClick={() => router.push('/login')} className="ml-4 text-primary underline">Go to Login</button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSave = () => {
    if (!editName || !editMobile) return alert('Name and mobile required');
    updateUser({ name: editName, mobile: editMobile, avatar_url: editAvatar });
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="pb-24 pt-6 px-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">My Profile</h1>
            <p className="text-xs text-foreground/60 uppercase tracking-widest">Sur Sangeet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={handleLogout} className="glass p-2 rounded-full text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="glass p-6 rounded-3xl flex flex-col items-center mb-8 relative border-primary/20 overflow-hidden">
        {/* Soft Orange Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        {isEditing ? (
           <button onClick={handleSave} className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full text-primary flex items-center gap-1 text-xs font-bold hover:bg-primary/10 z-20">
             <Check className="w-3 h-3" /> Save
           </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 glass p-2 rounded-full text-foreground/60 hover:text-primary z-20">
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        <div className="w-24 h-24 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center mb-4 relative overflow-hidden z-10 shadow-lg">
          {(isEditing ? editAvatar : user.avatar_url) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={isEditing ? editAvatar : user.avatar_url!} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserCircle2 className="w-16 h-16 text-primary/40" />
          )}
          {isEditing && (
            <div 
              className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        </div>
        
        {isEditing ? (
          <div className="w-full space-y-3 z-10 px-4">
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full text-center bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-lg font-bold outline-none focus:border-primary/50" 
              placeholder="Your Name"
            />
            <input 
              type="text" 
              value={editMobile}
              onChange={e => setEditMobile(e.target.value)}
              className="w-full text-center bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50" 
              placeholder="Your Mobile"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center z-10">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-xs text-primary mb-4 font-mono bg-primary/10 px-3 py-1 rounded-full mt-1">@{user.username}</p>
            
            <div className="flex items-center gap-2 text-foreground/60 bg-black/20 px-4 py-2 rounded-full border border-white/5">
              <Phone className="w-4 h-4" />
              <span className="text-sm tracking-widest">{user.mobile}</span>
            </div>
          </div>
        )}
      </div>

      {/* Favourite Bhajans */}
      <div className="mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary fill-primary/20" />
        <h3 className="text-lg font-bold">Favourite Bhajans</h3>
      </div>
      
      <div className="space-y-4">
        {favouriteBhajans.map((bhajan) => (
          <div key={bhajan.id} className="glass rounded-2xl p-4 flex gap-4 cursor-pointer active:scale-95 transition-transform" onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)}>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-black shrink-0 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary/40" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="font-bold text-base mb-1">{bhajan.title}</h4>
              <p className="text-xs text-foreground/50 line-clamp-1">{bhajan.lyrics[0].hindi}</p>
            </div>
            <div className="flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary fill-primary" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
