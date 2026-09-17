'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Users, Music, LayoutDashboard, Trash2, CheckCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { Bhajan } from '@app/shared';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bhajans'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [bhajans, setBhajans] = useState<Bhajan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/home');
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);
    const { data: bhajansData } = await supabase.from('bhajans').select('*').order('created_at', { ascending: false });
    if (bhajansData) setBhajans(bhajansData);
    setLoading(false);
  };

  const deleteBhajan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Bhajan?')) return;
    const { error } = await supabase.from('bhajans').delete().eq('id', id);
    if (!error) {
      setBhajans((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert('Failed to delete: ' + error.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="h-screen flex items-center justify-center">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white">
              <LayoutDashboard className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold tracking-wide">Admin</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={'flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ' + (activeTab === 'dashboard' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5')}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={'flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ' + (activeTab === 'users' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5')}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button
            onClick={() => setActiveTab('bhajans')}
            className={'flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ' + (activeTab === 'bhajans' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5')}
          >
            <Music className="w-5 h-5" /> Bhajans
          </button>
        </nav>

        <div className="mt-auto hidden md:block pt-8">
          <Link href="/home" className="text-sm text-foreground/50 hover:text-foreground">
            &larr; Back to Home
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black text-glow text-primary mb-8">Platform Overview</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-foreground/80">Total Users</h3>
                    </div>
                    <p className="text-5xl font-black">{users.length}</p>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/20 rounded-2xl text-primary">
                        <Music className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-foreground/80">Total Bhajans</h3>
                    </div>
                    <p className="text-5xl font-black">{bhajans.length}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black text-glow text-primary mb-8">Registered Users</h1>
                
                <div className="glass rounded-3xl border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="p-4 font-bold text-sm text-foreground/60">Name</th>
                        <th className="p-4 font-bold text-sm text-foreground/60">Mobile</th>
                        <th className="p-4 font-bold text-sm text-foreground/60">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4">{u.mobile}</td>
                          <td className="p-4">
                            <span className={'px-2 py-1 text-xs rounded-full font-bold uppercase ' + (u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-foreground/70')}>
                              {u.role || 'User'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'bhajans' && (
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black text-glow text-primary mb-8">Manage Bhajans</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {bhajans.map((bhajan) => (
                    <div key={bhajan.id} className="glass p-5 rounded-3xl border border-white/5 flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-1">{bhajan.title}</h3>
                        <p className="text-sm text-primary font-medium mb-4">{bhajan.deity}</p>
                        
                        <div className="bg-black/30 p-3 rounded-xl max-h-32 overflow-hidden relative mb-4">
                          <p className="text-xs text-foreground/60 whitespace-pre-line line-clamp-4">
                            {Array.isArray(bhajan.lyrics) ? bhajan.lyrics.join('\n') : ''}
                          </p>
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <div className="flex-1 flex items-center justify-center py-2 rounded-xl bg-white/5 text-sm font-bold text-green-400 gap-1">
                          <CheckCircle className="w-4 h-4" /> {bhajan.status || 'Approved'}
                        </div>
                        <button 
                          onClick={() => deleteBhajan(bhajan.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

