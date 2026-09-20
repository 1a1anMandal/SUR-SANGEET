'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Users, Music, LayoutDashboard, Trash2, CheckCircle, LogOut, Flame, Edit3, Merge, ArrowRight, FolderKanban, ShieldAlert } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { Bhajan } from '@app/shared';
import FullScreenLoader from '@/components/FullScreenLoader';
import EditBhajanModal from '@/components/Admin/EditBhajanModal';
import { LineChart, Line, BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bhajans' | 'rooms' | 'categories'>('dashboard');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bhajansList, setBhajansList] = useState<Bhajan[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [editingBhajan, setEditingBhajan] = useState<Bhajan | null>(null);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

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

    const { data: roomsData } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (roomsData) setRoomsList(roomsData);
    
    setLoading(false);
  };

  // --- Actions ---

  const disbandRoom = async (id: string) => {
    if (!confirm('Are you sure you want to disband this Live Room?')) return;
    setActionLoading('Disbanding Room...');
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (!error) setRoomsList(roomsList.filter(r => r.id !== id));
    setActionLoading('');
  };

  const deleteBhajan = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this Bhajan?')) return;
    setActionLoading('Deleting Bhajan...');
    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) setBhajansList(prev => prev.filter(b => b.id !== id));
    setActionLoading('');
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user ${name}?`)) return;
    setActionLoading('Deleting User...');
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) setUsersList(prev => prev.filter(u => u.id !== id));
    setActionLoading('');
  };

  const mergeCategory = async () => {
    if (!mergeSource || !mergeTarget) return alert('Select both source and target categories to merge.');
    if (mergeSource === mergeTarget) return alert('Source and Target cannot be the same.');
    if (!confirm(`Merge "${mergeSource}" INTO "${mergeTarget}"? This will update all affected bhajans.`)) return;
    
    setActionLoading('Merging Categories...');
    const formattedTarget = mergeTarget.trim().charAt(0).toUpperCase() + mergeTarget.trim().slice(1).toLowerCase();
    
    const { error } = await supabase.from('bhajans').update({ deity: formattedTarget }).eq('deity', mergeSource);
    if (!error) {
      setBhajansList(prev => prev.map(b => b.deity === mergeSource ? { ...b, deity: formattedTarget } : b));
      setMergeSource('');
      setMergeTarget('');
      alert('Categories merged successfully!');
    } else {
      alert('Error merging categories: ' + error.message);
    }
    setActionLoading('');
  };

  // --- Derived Data for Charts & Categories ---

  const { categories, chartData, sortedBhajans } = useMemo(() => {
    // Categories
    const catMap = new Map<string, number>();
    bhajansList.forEach(b => {
      catMap.set(b.deity, (catMap.get(b.deity) || 0) + 1);
    });
    const uniqueCategories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

    // Mock Chart Data for recent 7 days
    const dates = Array.from({length: 7}, (_, _i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - _i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    // Distribute actual users/bhajans counts into these buckets (simplified mock distribution based on totals)
    const baseUsers = Math.max(10, Math.floor(usersList.length / 7));
    const baseBhajans = Math.max(5, Math.floor(bhajansList.length / 7));

    const charts = dates.map((date, i) => ({
      name: date,
      Users: Math.floor(baseUsers * (0.5 + Math.random())),
      Bhajans: Math.floor(baseBhajans * (0.5 + Math.random())),
      Traffic: Math.floor(100 + Math.random() * 500)
    }));

    const sortedBhajans = [...bhajansList].sort((a, b) => {
      const aIncomplete = !a.title || !a.english_title;
      const bIncomplete = !b.title || !b.english_title;
      if (aIncomplete && !bIncomplete) return -1;
      if (!aIncomplete && bIncomplete) return 1;
      return 0;
    });

    return { categories: uniqueCategories, chartData: charts, sortedBhajans };
  }, [bhajansList, usersList]);

  // --- Renders ---

  if (loading) return <FullScreenLoader text="Authenticating Admin..." />;
  if (isAdmin === false) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-foreground/50 mb-8">You do not have administrative privileges.</p>
        <Link href="/home" className="bg-primary px-6 py-3 rounded-full text-black font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {actionLoading && <FullScreenLoader text={actionLoading} />}
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-foreground/5 flex flex-col fixed md:sticky top-0 z-50 h-[70px] md:h-screen">
        <div className="p-4 md:p-6 flex justify-between items-center md:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-black">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="font-black tracking-wide hidden md:block">Sur Sangeet</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 hidden md:flex flex-col gap-2 overflow-y-auto mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-2 px-4">Menu</p>
          
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary/20 text-primary font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button onClick={() => setActiveTab('rooms')} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === 'rooms' ? 'bg-primary/20 text-primary font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}>
            <Flame className="w-4 h-4" /> Live Rooms <span className="ml-auto bg-foreground/10 px-2 py-0.5 rounded-full text-[9px]">{roomsList.length}</span>
          </button>
          
          <button onClick={() => setActiveTab('bhajans')} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === 'bhajans' ? 'bg-primary/20 text-primary font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}>
            <Music className="w-4 h-4" /> Bhajans <span className="ml-auto bg-foreground/10 px-2 py-0.5 rounded-full text-[9px]">{bhajansList.length}</span>
          </button>

          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary/20 text-primary font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}>
            <FolderKanban className="w-4 h-4" /> Categories
          </button>
          
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === 'users' ? 'bg-primary/20 text-primary font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}>
            <Users className="w-4 h-4" /> Users
          </button>
        </nav>

        <div className="mt-auto hidden md:block pt-6 border-t border-foreground/5 p-4">
          <Link href="/home" className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-foreground/50 hover:bg-foreground/5">
            <LogOut className="w-4 h-4" /> Exit Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 mt-[70px] md:mt-0 pb-32">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-black">Analytics Overview</h1>
              <p className="text-sm text-foreground/60">Real-time insights and growth metrics.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-5 rounded-2xl border-foreground/5">
                <Users className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-3xl font-black">{usersList.length}</p>
                <p className="text-xs text-foreground/50 font-bold uppercase mt-1">Total Users</p>
              </div>
              <div className="glass p-5 rounded-2xl border-foreground/5">
                <Music className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-3xl font-black">{bhajansList.length}</p>
                <p className="text-xs text-foreground/50 font-bold uppercase mt-1">Total Bhajans</p>
              </div>
              <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5">
                <Flame className="w-6 h-6 text-primary mb-3" />
                <p className="text-3xl font-black text-primary">{roomsList.length}</p>
                <p className="text-xs text-foreground/50 font-bold uppercase mt-1">Active Live Rooms</p>
              </div>
              <div className="glass p-5 rounded-2xl border-foreground/5">
                <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-3xl font-black">~{Math.floor(usersList.length * 0.4)}</p>
                <p className="text-xs text-foreground/50 font-bold uppercase mt-1">Est. Daily Active</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="glass p-6 rounded-3xl border-foreground/5">
                <h3 className="font-bold mb-6 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Weekly Engagement (Traffic)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#8884d8" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1c1c', border: 'none', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="Traffic" stroke="#FF7A00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border-foreground/5">
                <h3 className="font-bold mb-6 flex items-center gap-2"><Users className="w-4 h-4"/> New Growth (Users & Bhajans)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#8884d8" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1c1c', border: 'none', borderRadius: '12px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Bhajans" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ACTIVE ROOMS (Dashboard Overview) */}
            <div className="mt-12 mb-6">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2"><Flame className="w-6 h-6 text-primary"/> Active Live Rooms</h2>
                  <p className="text-sm text-foreground/60">Monitor and manage currently running sessions.</p>
                </div>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {roomsList.map((room) => {
                  const b = bhajansList.find(x => x.id === room.current_bhajan_id);
                  return (
                    <div key={room.id} className="glass p-5 rounded-2xl border border-foreground/10 flex flex-col group relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-2xl font-black text-primary tracking-[0.2em]">{room.id}</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1 border border-green-500/20">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                        </span>
                      </div>
                      <div className="mb-4 relative z-10 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1">Now Playing</p>
                        <p className="font-bold text-foreground text-sm truncate">{b?.title || 'Unknown'}</p>
                      </div>
                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={async () => {
                            const { useRoomStore } = await import('@/store/useRoomStore');
                            const success = await useRoomStore.getState().joinRoom(room.id, user!.id, user!.name);
                            if(success) router.push('/live');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-sm font-bold transition-colors border border-primary/20"
                        >
                          <LogOut className="w-4 h-4" /> Join
                        </button>
                        <button onClick={() => disbandRoom(room.id)} className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20" title="Disband Room">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {roomsList.length === 0 && (
                  <div className="col-span-full py-16 text-center glass rounded-2xl border border-foreground/5">
                    <Flame className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No Active Rooms</h3>
                    <p className="text-sm text-foreground/50">There are no live sessions running right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black mb-1">Live Rooms</h1>
                <p className="text-sm text-foreground/60">Monitor and manage all active sessions.</p>
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {roomsList.map((room) => {
                const b = bhajansList.find(x => x.id === room.current_bhajan_id);
                return (
                  <div key={room.id} className="glass p-5 rounded-2xl border border-foreground/10 flex flex-col group relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-2xl font-black text-primary tracking-[0.2em]">{room.id}</span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1 border border-green-500/20">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                      </span>
                    </div>
                    <div className="mb-4 relative z-10 flex-1">
                      <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1">Now Playing</p>
                      <p className="font-bold text-foreground text-sm truncate">{b?.title || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <button 
                        onClick={async () => {
                          const { useRoomStore } = await import('@/store/useRoomStore');
                          const success = await useRoomStore.getState().joinRoom(room.id, user!.id, user!.name);
                          if(success) router.push('/live');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-sm font-bold transition-colors border border-primary/20"
                      >
                        <LogOut className="w-4 h-4" /> Join
                      </button>
                      <button onClick={() => disbandRoom(room.id)} className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20" title="Disband Room">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {roomsList.length === 0 && (
                <div className="col-span-full py-16 text-center glass rounded-2xl border border-foreground/5">
                  <Flame className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No Active Rooms</h3>
                  <p className="text-sm text-foreground/50">There are no live sessions running right now.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-black mb-1">Category Management</h1>
              <p className="text-sm text-foreground/60">Merge duplicates and enforce formatting.</p>
            </header>
            
            <div className="glass p-6 rounded-3xl border-primary/20 bg-primary/5 mb-8">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Merge className="w-5 h-5"/> Merge Categories</h3>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="w-full md:flex-1 p-3 rounded-xl bg-background border border-foreground/10 outline-none">
                  <option value="">Select Source Category...</option>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                </select>
                <ArrowRight className="w-6 h-6 text-foreground/40 rotate-90 md:rotate-0" />
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="w-full md:flex-1 p-3 rounded-xl bg-background border border-foreground/10 outline-none">
                  <option value="">Select Target Category...</option>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                </select>
                <button onClick={mergeCategory} className="w-full md:w-auto bg-primary text-black font-bold px-6 py-3 rounded-xl hover:scale-95 transition-transform shadow-lg shadow-primary/20">
                  Merge
                </button>
              </div>
              <p className="text-[10px] text-foreground/50 mt-4 leading-relaxed">
                Merging updates all bhajans in the source category to the target category. The target category name will be auto-capitalized properly. Once merged, the source category ceases to exist.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(c => (
                <div key={c.name} className="glass p-4 rounded-xl flex justify-between items-center border border-foreground/5">
                  <span className="font-bold text-sm truncate pr-2">{c.name}</span>
                  <span className="bg-foreground/10 text-xs px-2 py-1 rounded-md">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BHAJANS TAB */}
        {activeTab === 'bhajans' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black mb-1">Bhajan Library</h1>
                <p className="text-sm text-foreground/60">Total: {bhajansList.length} bhajans</p>
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedBhajans.map((bhajan) => {
                const isIncomplete = !bhajan.title || !bhajan.english_title;
                return (
                <div key={bhajan.id} className={`glass p-5 rounded-2xl border flex flex-col group hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 ${isIncomplete ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-foreground/10'}`}>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-lg leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">{bhajan.title || <span className="text-red-500 text-sm italic">Missing Hindi Title</span>}</h3>
                        <p className="text-xs text-foreground/60 font-medium mb-1">{bhajan.english_title || <span className="text-red-500 text-xs italic">Missing English Title</span>}</p>
                        <span className="inline-block px-2 py-0.5 bg-foreground/5 rounded text-[10px] font-bold text-foreground/70 uppercase tracking-wider mt-1">
                          {bhajan.deity}
                        </span>
                      </div>
                      <button 
                        onClick={() => setEditingBhajan(bhajan)}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                        title="Edit Bhajan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
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
                );
              })}
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

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border ${u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(255,122,0,0.2)]' : 'bg-foreground/5 text-foreground/60 border-foreground/10'}`}>
                            {u.role || 'User'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => deleteUser(u.id, u.name)}
                            disabled={u.id === user?.id}
                            className={`p-2 rounded-lg transition-all ${u.id === user?.id ? 'opacity-30 cursor-not-allowed text-foreground/50' : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20'}`}
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
      </main>

      {/* MODALS */}
      {editingBhajan && (
        <EditBhajanModal 
          bhajan={editingBhajan}
          onClose={() => setEditingBhajan(null)}
          onSuccess={(updated) => {
            setBhajansList(prev => prev.map(b => b.id === updated.id ? updated : b));
            setEditingBhajan(null);
          }}
        />
      )}
    </div>
  );
}
