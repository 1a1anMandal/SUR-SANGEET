'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Users, Music, LayoutDashboard, Trash2, CheckCircle, ShieldAlert, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { Bhajan } from '@app/shared';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bhajans'>('dashboard');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bhajansList, setBhajansList] = useState<Bhajan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait a short moment to allow Zustand to hydrate from local storage
    const timer = setTimeout(() => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        router.push('/login');
      } else {
        verifyAdminStatus(currentUser);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [router]);

  const verifyAdminStatus = async (currentUser: any) => {
    const { data } = await supabase.from('users').select('role').eq('id', currentUser.id).single();
    if (data?.role === 'admin') {
      setIsAdmin(true);
      fetchData();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (usersData) setUsersList(usersData);
    
    const { data: bhajansData } = await supabase.from('bhajans').select('*').order('created_at', { ascending: false });
    if (bhajansData) setBhajansList(bhajansData);
    
    setLoading(false);
  };

  const deleteBhajan = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this Bhajan? This cannot be undone.')) return;
    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) {
      setBhajansList((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert('Failed to delete: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-primary font-medium tracking-widest uppercase text-sm animate-pulse">Authenticating Admin...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-white">Access Denied</h1>
        <p className="text-foreground/60 max-w-sm">
          You do not have administrative privileges to view this sanctuary area.
        </p>
        <button onClick={() => router.push('/home')} className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans selection:bg-primary/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <aside className="w-full md:w-72 bg-black/40 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-black shadow-lg shadow-primary/20">
              <ShieldAlert className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-black tracking-wide text-lg leading-none text-white">Admin Hub</h2>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Sur Sangeet</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex md:flex-col gap-3 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all whitespace-nowrap group ' + (activeTab === 'dashboard' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-white/5 hover:text-white')}
          >
            <LayoutDashboard className={'w-5 h-5 transition-transform group-hover:scale-110 ' + (activeTab === 'dashboard' ? 'text-primary' : 'text-foreground/50')} /> 
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all whitespace-nowrap group ' + (activeTab === 'users' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-white/5 hover:text-white')}
          >
            <Users className={'w-5 h-5 transition-transform group-hover:scale-110 ' + (activeTab === 'users' ? 'text-primary' : 'text-foreground/50')} /> 
            Manage Users
            <span className="ml-auto bg-white/5 px-2 py-0.5 rounded-full text-[10px]">{usersList.length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('bhajans')}
            className={'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all whitespace-nowrap group ' + (activeTab === 'bhajans' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-white/5 hover:text-white')}
          >
            <Music className={'w-5 h-5 transition-transform group-hover:scale-110 ' + (activeTab === 'bhajans' ? 'text-primary' : 'text-foreground/50')} /> 
            Bhajan Catalog
            <span className="ml-auto bg-white/5 px-2 py-0.5 rounded-full text-[10px]">{bhajansList.length}</span>
          </button>
        </nav>

        <div className="mt-auto hidden md:block pt-8 border-t border-white/5">
          <Link href="/home" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground/50 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" /> Exit Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto z-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in max-w-5xl">
            <header className="mb-10">
              <h1 className="text-4xl font-black text-white mb-2">Welcome, Admin</h1>
              <p className="text-foreground/60">Here is what is happening across Sur Sangeet today.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden glass p-8 rounded-[2rem] border border-white/10 group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">+ Active</span>
                </div>
                <h3 className="text-foreground/60 font-medium mb-1 relative z-10">Total Devotees</h3>
                <p className="text-6xl font-black text-white relative z-10">{usersList.length}</p>
              </div>

              <div className="relative overflow-hidden glass p-8 rounded-[2rem] border border-white/10 group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Music className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">+ Growing</span>
                </div>
                <h3 className="text-foreground/60 font-medium mb-1 relative z-10">Total Bhajans</h3>
                <p className="text-6xl font-black text-white relative z-10">{bhajansList.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in max-w-6xl">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-white mb-2">Registered Users</h1>
                <p className="text-foreground/60">Manage all devotees registered on the platform.</p>
              </div>
            </header>
            
            <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="p-5 font-bold text-xs uppercase tracking-widest text-foreground/50">Devotee</th>
                      <th className="p-5 font-bold text-xs uppercase tracking-widest text-foreground/50">Mobile</th>
                      <th className="p-5 font-bold text-xs uppercase tracking-widest text-foreground/50 text-right">Access Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                              {u.avatar_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-primary transition-colors">{u.name}</p>
                              <p className="text-xs text-foreground/50">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-foreground/70 font-medium">{u.mobile}</td>
                        <td className="p-5 text-right">
                          <span className={'inline-flex items-center justify-center px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider border ' + (u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(255,122,0,0.2)]' : 'bg-white/5 text-foreground/60 border-white/10')}>
                            {u.role || 'User'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bhajans' && (
          <div className="space-y-8 animate-fade-in max-w-7xl">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-white mb-2">Bhajan Catalog</h1>
                <p className="text-foreground/60">Review, approve, and manage community submissions.</p>
              </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {bhajansList.map((bhajan) => (
                <div key={bhajan.id} className="glass p-6 rounded-[2rem] border border-white/10 flex flex-col group hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-xl leading-tight text-white mb-1 group-hover:text-primary transition-colors">{bhajan.title}</h3>
                        <span className="inline-block px-2 py-1 bg-white/10 rounded-md text-xs font-bold text-foreground/70 uppercase tracking-wider">
                          {bhajan.deity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-2xl max-h-40 overflow-hidden relative mb-6 border border-white/5">
                      <p className="text-sm text-foreground/70 whitespace-pre-line leading-relaxed font-medium">
                        {Array.isArray(bhajan.lyrics) ? bhajan.lyrics.map(l => l.hindi).join('\n') : ''}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <div className="flex-1 flex items-center justify-center py-3 rounded-xl bg-green-500/10 text-sm font-bold text-green-400 gap-2 border border-green-500/20">
                      <CheckCircle className="w-4 h-4" /> Live
                    </div>
                    <button 
                      onClick={() => deleteBhajan(bhajan.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      title="Delete Bhajan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {bhajansList.length === 0 && (
                <div className="col-span-full py-20 text-center glass rounded-[2rem] border border-white/5">
                  <Music className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Bhajans Found</h3>
                  <p className="text-foreground/50">The library is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
