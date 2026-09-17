'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Users, Music, LayoutDashboard, Trash2, CheckCircle, ShieldAlert, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { Bhajan } from '@app/shared';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bhajans'>('dashboard');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bhajansList, setBhajansList] = useState<Bhajan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
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
    setActionLoading('Deleting Bhajan...');
    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) {
      setBhajansList((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert('Failed to delete: ' + error.message);
    }
    setActionLoading('');
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(Are you absolutely sure you want to delete the user " + name + "? This cannot be undone.)) return;
    setActionLoading('Deleting User...');
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } else {
      alert('Failed to delete user: ' + error.message);
    }
    setActionLoading('');
  };

  if (loading) {
    return <FullScreenLoader text="Authenticating Admin..." />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-foreground">Access Denied</h1>
        <p className="text-foreground/60 max-w-sm">
          You do not have administrative privileges to view this sanctuary area.
        </p>
        <button onClick={() => router.push('/home')} className="mt-4 px-8 py-3 bg-foreground/10 hover:bg-foreground/20 rounded-xl transition-all font-bold flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans selection:bg-primary/30 relative overflow-hidden">
      {actionLoading && <FullScreenLoader text={actionLoading} />}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <aside className="w-full md:w-64 bg-background/80 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-foreground/5 p-5 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-black shadow-lg shadow-primary/20">
              <ShieldAlert className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-black tracking-wide text-base leading-none text-foreground">Admin Hub</h2>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Sur Sangeet</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all whitespace-nowrap group ' + (activeTab === 'dashboard' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground')}
          >
            <LayoutDashboard className={'w-4 h-4 transition-transform group-hover:scale-110 ' + (activeTab === 'dashboard' ? 'text-primary' : 'text-foreground/50')} /> 
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all whitespace-nowrap group ' + (activeTab === 'users' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground')}
          >
            <Users className={'w-4 h-4 transition-transform group-hover:scale-110 ' + (activeTab === 'users' ? 'text-primary' : 'text-foreground/50')} /> 
            Manage Users
            <span className="ml-auto bg-foreground/5 px-2 py-0.5 rounded-full text-[9px]">{usersList.length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('bhajans')}
            className={'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all whitespace-nowrap group ' + (activeTab === 'bhajans' ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary font-bold border-l-2 border-primary' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground')}
          >
            <Music className={'w-4 h-4 transition-transform group-hover:scale-110 ' + (activeTab === 'bhajans' ? 'text-primary' : 'text-foreground/50')} /> 
            Bhajan Catalog
            <span className="ml-auto bg-foreground/5 px-2 py-0.5 rounded-full text-[9px]">{bhajansList.length}</span>
          </button>
        </nav>

        <div className="mt-auto hidden md:block pt-6 border-t border-foreground/5">
          <Link href="/home" className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all">
            <LogOut className="w-4 h-4" /> Exit Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 overflow-y-auto z-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-foreground mb-1">Welcome, Admin</h1>
              <p className="text-sm text-foreground/60">Here is what is happening across Sur Sangeet today.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative overflow-hidden glass p-6 rounded-2xl border border-foreground/10 group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+ Active</span>
                </div>
                <h3 className="text-xs uppercase tracking-widest text-foreground/60 font-bold mb-1 relative z-10">Total Devotees</h3>
                <p className="text-4xl font-black text-foreground relative z-10">{usersList.length}</p>
              </div>

              <div className="relative overflow-hidden glass p-6 rounded-2xl border border-foreground/10 group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Music className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+ Growing</span>
                </div>
                <h3 className="text-xs uppercase tracking-widest text-foreground/60 font-bold mb-1 relative z-10">Total Bhajans</h3>
                <p className="text-4xl font-black text-foreground relative z-10">{bhajansList.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-foreground mb-1">Registered Users</h1>
                <p className="text-sm text-foreground/60">Manage all devotees registered on the platform.</p>
              </div>
            </header>
            
            <div className="glass rounded-2xl border border-foreground/10 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-foreground/[0.02] border-b border-foreground/5">
                    <tr>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-foreground/50">Devotee</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-foreground/50">Mobile</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-foreground/50">Access Level</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-foreground/50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-foreground/[0.02] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold overflow-hidden shrink-0">
                              {u.avatar_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{u.name}</p>
                              <p className="text-[10px] text-foreground/50">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-foreground/70 font-medium text-xs">{u.mobile}</td>
                        <td className="p-4">
                          <span className={'inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border ' + (u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(255,122,0,0.2)]' : 'bg-foreground/5 text-foreground/60 border-foreground/10')}>
                            {u.role || 'User'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => deleteUser(u.id, u.name)}
                            disabled={u.id === user?.id}
                            className={'p-2 rounded-lg transition-all ' + (u.id === user?.id ? 'opacity-30 cursor-not-allowed text-foreground/50' : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20')}
                            title={u.id === user?.id ? "You cannot delete yourself" : "Delete User"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-foreground mb-1">Bhajan Catalog</h1>
                <p className="text-sm text-foreground/60">Review, approve, and manage community submissions.</p>
              </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {bhajansList.map((bhajan) => (
                <div key={bhajan.id} className="glass p-5 rounded-2xl border border-foreground/10 flex flex-col group hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-lg leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">{bhajan.title}</h3>
                        <span className="inline-block px-2 py-0.5 bg-foreground/5 rounded text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                          {bhajan.deity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-foreground/[0.03] p-4 rounded-xl max-h-32 overflow-hidden relative mb-5 border border-foreground/5">
                      <p className="text-xs text-foreground/70 whitespace-pre-line leading-relaxed font-medium">
                        {Array.isArray(bhajan.lyrics) ? bhajan.lyrics.map(l => l.hindi).join('\n') : ''}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t border-foreground/10">
                    <div className="flex-1 flex items-center justify-center py-2 rounded-lg bg-green-500/10 text-xs font-bold text-green-500 gap-2 border border-green-500/20">
                      <CheckCircle className="w-3 h-3" /> Live
                    </div>
                    <button 
                      onClick={() => deleteBhajan(bhajan.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/20"
                      title="Delete Bhajan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {bhajansList.length === 0 && (
                <div className="col-span-full py-16 text-center glass rounded-2xl border border-foreground/5">
                  <Music className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No Bhajans Found</h3>
                  <p className="text-sm text-foreground/50">The library is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
