// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ListTodo, Plus, ArrowRight, Check, Calendar, LogIn, UserPlus, LogOut, Trash2 } from 'lucide-react';

interface TaskItem {
  _id: string;
  title: string;
  status: 'all' | 'in-progress' | 'completed';
  priority: 'normal' | 'medium' | 'high';
  dueDate?: string;
}

export default function Home() {
  // Authentication States
  const [token, setToken] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignupView, setIsSignupView] = useState(false);
  const [authError, setAuthError] = useState('');

  // Task Board States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'medium' | 'high'>('normal');
  const [newDueDate, setNewDueDate] = useState('');

  // Session Token Initialization
  useEffect(() => {
    const savedToken = localStorage.getItem('task_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tasks?status=all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) handleLogout();
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      setTasks([]);
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isSignupView ? 'signup' : 'login',
          email: authEmail,
          password: authPassword
        })
      });

      const data = await res.json().catch(() => {
        throw new Error(`Server response error code: ${res.status}`);
      });

      if (!res.ok) throw new Error(data.error || 'Authentication rejected');

      if (isSignupView) {
        alert('Signup complete! Please switch back to log into your account.');
        setIsSignupView(false);
      } else {
        localStorage.setItem('task_token', data.token);
        setToken(data.token);
      }
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Network stack failure');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('task_token');
    setToken(null);
    setTasks([]);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, priority: newPriority, dueDate: newDueDate || undefined }),
    });

    if (res.ok) {
      setNewTitle('');
      setNewDueDate('');
      setNewPriority('normal');
      fetchTasks();
    }
  };

  const updateTaskStatus = async (id: string, newStatus: 'in-progress' | 'completed') => {
    try {
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'update', id, status: newStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) fetchTasks(); 
    } catch (error) {
      console.error(error);
    }
  };

  const newTasks = tasks.filter(t => t.status === 'all' || (t.status as string) === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // ─── AUTHENTICATION SHIELD RENDER ───
  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Taskspace Identity</h1>
            <p className="text-xs text-slate-400">{isSignupView ? 'Create an account to start tracking operations' : 'Authenticate credentials to sync workload updates'}</p>
          </div>

          {authError && <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-3 text-xs font-semibold text-red-400 text-center">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-black px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="name@domain.com" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Password</label>
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-black px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-xl transition-all">
              {isSignupView ? <UserPlus size={16} /> : <LogIn size={16} />} {isSignupView ? 'Register Account' : 'Authenticate Session'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button type="button" onClick={() => { setIsSignupView(!isSignupView); setAuthError(''); }} className="text-xs text-blue-400 hover:underline">
              {isSignupView ? 'Already registered? Access active session' : "Don't have an account yet? Register here"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PROTECTED OPERATIONAL WORKSPACE ───
  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Block Row */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Taskspace Board</h1>
            <p className="text-sm text-slate-400">Track and advance your operations dynamically.</p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-red-950/30 hover:border-red-900/40 px-4 py-2 text-xs font-bold text-slate-300 hover:text-red-400 transition-all">
            <LogOut size={14} /> Exit Board
          </button>
        </div>

        {/* Kanban Board Container Deck */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          
          {/* COLUMN 1: NEW TASKS CONTAINER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-600 p-1.5 text-white"><ListTodo size={16} /></div>
                <h2 className="font-bold text-white">New Tasks</h2>
              </div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">{newTasks.length}</span>
            </div>

            {/* 🌟 EMBEDDED CONSOLIDATED CONTENT CARD FORM 🌟 */}
            <div className="space-y-3">
              <form onSubmit={handleAddTask} className="rounded-xl border border-slate-800 bg-black p-4 space-y-4 shadow-2xl">
                
                {/* Feature Element 1: Task Title Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Task Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter objective..." 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none placeholder-slate-700" 
                  />
                </div>

                {/* Feature Element 2: Expiry Date Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Calendar size={11} /> Expiry Date</label>
                  <input 
                    type="date" 
                    value={newDueDate} 
                    onChange={(e) => setNewDueDate(e.target.value)} 
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]" 
                  />
                </div>

                {/* Feature Element 3: Task Priority Selector Options */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Task Priority</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['normal', 'medium', 'high'] as const).map((p) => (
                      <button 
                        key={p} 
                        type="button" 
                        onClick={() => setNewPriority(p)} 
                        className={`capitalize py-1.5 text-[10px] font-bold rounded-md border transition-all ${
                          newPriority === p ? 'bg-blue-950/50 text-blue-400 border-blue-500/40 shadow-sm' : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature Element 4: Include Tasks Button Wrapper */}
                <div className="pt-2 border-t border-slate-800/40">
                  <button type="submit" className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.99] py-2 text-xs font-bold text-white shadow-md transition-all">
                    <Plus size={14} /> Include Tasks
                  </button>
                </div>
              </form>

              {/* Loop Streaming Entries below the Input Form Block */}
              <div className="space-y-3 pt-1">
                {newTasks.map(task => (
                  <div key={task._id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-md group relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <button onClick={() => updateTaskStatus(task._id, 'completed')} className="mt-0.5 h-4 w-4 rounded-md border border-slate-700 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-950/30 text-emerald-400 transition-all">
                          <Check size={10} className="opacity-0 hover:opacity-100" />
                        </button>
                        <div>
                          <span className="text-sm font-medium text-slate-200 block">{task.title}</span>
                          {task.dueDate && <span className="text-[11px] text-red-400">Exp: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded-md opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                        <Trash2 size={14} />
                    </button>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-400 mr-5">{task.priority}</span>
                    </div>
                    <button onClick={() => updateTaskStatus(task._id, 'in-progress')} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors">Start Task <ArrowRight size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS WORKSPACE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2"><div className="rounded-md bg-amber-600 p-1.5 text-white"><Clock size={16} /></div><h2 className="font-bold text-white">In Progress</h2></div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">{inProgressTasks.length}</span>
            </div>
            <div className="space-y-3 min-h-[350px]">
              {inProgressTasks.map(task => (
                <div key={task._id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-md group relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button onClick={() => updateTaskStatus(task._id, 'completed')} className="mt-0.5 h-4 w-4 rounded-md border border-amber-500 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 text-white transition-all">
                        <Check size={10} className="opacity-0 hover:opacity-100" />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-slate-200 block">{task.title}</span>
                        {task.dueDate && <span className="text-[11px] text-red-400">Exp: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded-md opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                      <Trash2 size={14} />
                    </button>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 mr-5">{task.priority}</span>
                  </div>
                  <button onClick={() => updateTaskStatus(task._id, 'completed')} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow-sm">Complete <Check size={14} /></button>
                </div>
              ))}
              {inProgressTasks.length === 0 && <p className="text-center text-xs text-slate-600 py-8">No active operations</p>}
            </div>
          </div>

          {/* COLUMN 3: COMPLETED ARCHIVE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2"><div className="rounded-md bg-emerald-600 p-1.5 text-white"><CheckCircle2 size={16} /></div><h2 className="font-bold text-white">Completed</h2></div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">{completedTasks.length}</span>
            </div>
            <div className="space-y-3 min-h-[350px]">
              {completedTasks.map(task => (
                <div key={task._id} className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 shadow-sm opacity-50 group relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="max-w-[75%]">
                      <span className="text-sm font-medium line-through text-slate-500 block truncate">{task.title}</span>
                      {task.dueDate && <span className="text-[11px] text-slate-500 block">Exp: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                    <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded-md opacity-0 group-hover:opacity-100 absolute top-3 right-2">
                      <Trash2 size={14} />
                    </button>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase shrink-0 mr-5">{task.priority}</span>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && <p className="text-center text-xs text-slate-600 py-8">No completed tasks yet</p>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
