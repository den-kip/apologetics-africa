'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpenIcon, QuestionMarkCircleIcon, PencilSquareIcon, UsersIcon,
  SignalIcon, PlayIcon, StopIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, LiveSession } from '@/lib/api';

interface Stats {
  questions: { total: number; pending: number; answered: number };
  resources: { total: number; published: number; featured: number };
  users: { total: number; admins: number; editors: number };
}

const quickLinks = [
  { label: 'Add Resource',      href: '/admin/resources' },
  { label: 'Answer a Question', href: '/admin/questions' },
  { label: 'Write a Blog Post', href: '/admin/blog' },
  { label: 'Manage Users',      href: '/admin/users' },
  { label: 'New Session',       href: '/admin/sessions' },
];

// ─── Live session panel ───────────────────────────────────────────────────────

function LiveSessionPanel({ token }: { token: string }) {
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);
  const [acting, setActing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');

  const load = useCallback(() => {
    api.sessions.getLive()
      .then((s) => setSession(s))
      .catch(() => setSession(null));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setActing(true);
    try {
      const created = await api.sessions.create({ title: title.trim() }, token);
      await api.sessions.start(created.id, token);
      setShowCreate(false);
      setTitle('');
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to start session');
    } finally {
      setActing(false);
    }
  };

  const handleEnd = async () => {
    if (!session || !confirm('End the live session? The chat will be archived.')) return;
    setActing(true);
    try {
      await api.sessions.end(session.id, token);
      load();
    } finally {
      setActing(false);
    }
  };

  // Still loading
  if (session === undefined) return null;

  // Active live session
  if (session) {
    return (
      <div className="card p-6 border-2 border-green-200 bg-green-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <SignalIcon className="w-5 h-5 text-green-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
                  Session Live
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="font-semibold text-slate-900">{session.title}</p>
              {session.startedAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/live/${session.id}`}
              target="_blank"
              className="btn-ghost text-sm flex items-center gap-1.5"
            >
              Open Chat
            </Link>
            <button
              onClick={handleEnd}
              disabled={acting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <StopIcon className="w-4 h-4" />
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No active session
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <SignalIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Live Session</p>
            <p className="text-xs text-slate-400 mt-0.5">No session is currently live</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
        >
          <PlayIcon className="w-4 h-4" />
          Go Live
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleGoLive} className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title, e.g. Session 48 — The Problem of Evil"
            className="input-field flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={acting || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 transition-colors shrink-0"
          >
            <PlayIcon className="w-4 h-4" />
            {acting ? 'Starting…' : 'Start Now'}
          </button>
          <button
            type="button"
            onClick={() => { setShowCreate(false); setTitle(''); }}
            className="btn-ghost text-sm shrink-0"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.admin.stats(token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const statCards = [
    {
      label: 'Total Resources',
      value: stats?.resources.total ?? '—',
      icon: BookOpenIcon,
      href: '/admin/resources',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending Questions',
      value: stats?.questions.pending ?? '—',
      icon: QuestionMarkCircleIcon,
      href: '/admin/questions',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Published Posts',
      value: stats?.resources.published ?? '—',
      icon: PencilSquareIcon,
      href: '/admin/blog',
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Total Users',
      value: stats?.users.total ?? '—',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Welcome back. Here's what's happening.</p>

      {/* Live session control */}
      {token && (
        <div className="mb-8">
          <LiveSessionPanel token={token} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              {loading ? (
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              )}
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn-secondary justify-center text-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
