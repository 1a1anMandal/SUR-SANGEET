'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { UserCircle2, Phone, LogOut, Edit2, Heart, Music2, Flame, Check, Camera, Loader2, Info, ChevronLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function Profile() {
  const router = useRouter();
  const { user, updateUser, logout, favorites } = useAuthStore();
  const bhajans = useLibraryStore(state => state.bhajans);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (!editName || !editMobile) return alert('Name and mobile required');
    setIsSaving(true);
    const success = await updateUser({ name: editName, mobile: editMobile, avatar_url: editAvatar });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setEditAvatar(canvas.toDataURL('image/jpeg', 0.7)); 
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="pb-24 pt-6 px-4 relative h-screen overflow-y-auto">
      {isSaving && <FullScreenLoader text="Saving Profile..." />}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <header className="flex justify-between items-center mb-8 relative z-10">
        <h1 className="text-2xl font-black text-glow">My Profile</h1>
        <ThemeToggle />
      </header>

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden bg-foreground/[0.08] mb-4">
            {(isEditing ? editAvatar : user.avatar_url) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={isEditing ? editAvatar : user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-12 h-12 text-primary/40" />
            )}
          </div>
          
          {isEditing && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-0 bg-primary text-black p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {!isEditing ? (
          <>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-foreground/50">@{user.username}</p>
            {user.role === 'admin' ? (
              <button 
                onClick={() => router.push('/admin')} 
                className="mt-2 flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,122,0,0.2)]"
              >
                Admin Panel ?
              </button>
            ) : (
              <span className="mt-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                {user.role || 'Devotee'}
              </span>
            )}
          </>
        ) : (
          <div className="w-full space-y-4 max-w-sm">
            <input 
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 text-center text-sm font-bold focus:border-primary/50 outline-none transition-colors"
              placeholder="Your Name"
            />
            <input 
              type="tel"
              value={editMobile}
              onChange={e => setEditMobile(e.target.value)}
              className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 text-center text-sm font-bold focus:border-primary/50 outline-none transition-colors"
              placeholder="Mobile Number"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex-1 glass py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-foreground/5 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-black py-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-[0_0_15px_rgba(255,122,0,0.3)] active:scale-95 transition-transform"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Changes</>}
          </button>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500 fill-current" /> Liked Bhajans
        </h3>
        
        <div className="space-y-3">
          {favouriteBhajans.map(bhajan => (
            <div key={bhajan.id} onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)} className="glass p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-foreground/5 transition-all active:scale-[0.98]">
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.08] flex items-center justify-center overflow-hidden">
                <Music2 className="text-primary/40" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm leading-tight">{bhajan.title}</h4>
                <p className="text-xs text-primary">{bhajan.deity}</p>
              </div>
            </div>
          ))}
          {favouriteBhajans.length === 0 && (
            <div className="text-center py-6 glass rounded-2xl border-foreground/5 border-dashed border-2">
              <p className="text-foreground/40 text-xs">No favorites yet.</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => router.push('/about')}
          className="w-full mt-6 glass flex items-center justify-between p-4 rounded-2xl hover:bg-foreground/5 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Info className="w-5 h-5" />
            </div>
            <span className="font-bold">About Sur Sangeet</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors rotate-180" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full mt-8 flex items-center justify-center gap-2 text-red-400 py-4 font-bold active:scale-95 transition-transform"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </main>
  );
}


