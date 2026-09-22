'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { UserCircle2, LogOut, Edit2, Heart, Music2, Check, Camera, Loader2, Info, ChevronLeft } from 'lucide-react';
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
    <main className="pb-24 pt-6 px-4 md:px-8 relative min-h-screen max-w-7xl mx-auto">
      {isSaving && <FullScreenLoader text="Saving Profile..." />}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <header className="flex justify-between items-center mb-8 md:mb-12 relative z-10">
        <h1 className="text-2xl md:text-3xl font-black text-glow">My Profile</h1>
        <ThemeToggle />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative z-10">
        {/* Profile Section */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="flex flex-col items-center w-full mb-8 glass p-6 md:p-8 rounded-3xl border-foreground/5 shadow-xl">
            <div className="relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden bg-foreground/[0.08] mb-4">
                {(isEditing ? editAvatar : user.avatar_url) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={isEditing ? editAvatar : user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
                )}
              </div>
              
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-0 bg-primary text-black p-2 md:p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
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
                <h2 className="text-xl md:text-2xl font-bold">{user.name}</h2>
                <p className="text-sm md:text-base text-foreground/50">@{user.username}</p>
                {user.role === 'admin' ? (
                  <button 
                    onClick={() => router.push('/admin')} 
                    className="mt-2 flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,122,0,0.2)]"
                  >
                    Admin Panel →
                  </button>
                ) : (
                  <span className="mt-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                    {user.role || 'Devotee'}
                  </span>
                )}
              </>
            ) : (
              <div className="w-full space-y-4 max-w-sm mt-4">
                <input 
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 md:py-4 text-center text-sm md:text-base font-bold focus:border-primary/50 outline-none transition-colors"
                  placeholder="Your Name"
                />
                <input 
                  type="tel"
                  value={editMobile}
                  onChange={e => setEditMobile(e.target.value)}
                  className="w-full bg-foreground/[0.05] border border-foreground/5 rounded-xl px-4 py-3 md:py-4 text-center text-sm md:text-base font-bold focus:border-primary/50 outline-none transition-colors"
                  placeholder="Mobile Number"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 glass py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-foreground/5 transition-colors md:text-lg"
              >
                <Edit2 className="w-4 h-4 md:w-5 md:h-5" /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-black py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 font-black shadow-[0_0_15px_rgba(255,122,0,0.3)] active:scale-95 transition-transform md:text-lg"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Changes</>}
              </button>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 text-red-400 py-4 font-bold active:scale-95 transition-transform md:text-lg hover:text-red-300 glass rounded-xl"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" /> Sign Out
          </button>
        </div>

        {/* Right Section: Favorites & About */}
        <div className="md:col-span-8 space-y-6">
          <div className="glass p-6 md:p-8 rounded-3xl border-foreground/5 shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4 md:mb-6 md:text-xl">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-500 fill-current" /> Liked Bhajans
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favouriteBhajans.map(bhajan => (
                <div key={bhajan.id} onClick={() => router.push(`/live?viewLyrics=${bhajan.id}`)} className="glass p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-foreground/5 transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-foreground/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                    <Music2 className="text-primary/40 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-sm md:text-base leading-tight truncate">{bhajan.title}</h4>
                    <p className="text-xs md:text-sm text-primary uppercase tracking-widest mt-1">{bhajan.deity}</p>
                  </div>
                </div>
              ))}
              {favouriteBhajans.length === 0 && (
                <div className="col-span-full text-center py-8 glass rounded-2xl border-foreground/5 border-dashed border-2">
                  <p className="text-foreground/40 text-xs md:text-sm">No favorites yet.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => router.push('/about')}
            className="w-full glass flex items-center justify-between p-4 md:p-6 rounded-3xl hover:bg-foreground/5 transition-colors group shadow-xl"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Info className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="font-bold md:text-lg">About Sur Sangeet</span>
            </div>
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-foreground/40 group-hover:text-primary transition-colors rotate-180" />
          </button>
        </div>
      </div>
    </main>
  );
}
