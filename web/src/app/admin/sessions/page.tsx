'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, LiveSession } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  PlusIcon, PlayIcon, StopIcon, TrashIcon, PencilIcon,
  ArchiveBoxIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon,
  SignalIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

function StatusBadge({ status }: { status: LiveSession['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === 'scheduled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <CalendarDaysIcon className="w-3 h-3" />
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
      <ArchiveBoxIcon className="w-3 h-3" />
      Ended
    </span>
  );
}

interface SessionFormData {
  title: string;
  description: string;
  scheduledAt: string;
}

const EMPTY_FORM: SessionFormData = { title: '', description: '', scheduledAt: '' };

export default function AdminSessionsPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState<LiveSession | null>(null);
  const [form, setForm] = useState<SessionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    api.sessions.listAll(token)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPanel(true);
  };

  const openEdit = (s: LiveSession) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description || '',
      scheduledAt: s.scheduledAt ? s.scheduledAt.slice(0, 16) : '',
    });
    setShowPanel(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      };
      if (editing) {
        await api.sessions.update(editing.id, payload, token);
      } else {
        await api.sessions.create(payload, token);
      }
      setShowPanel(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async (s: LiveSession) => {
    if (!token || !confirm(`Start "${s.title}"? This will open the chat.`)) return;
    setActionId(s.id);
    try {
      await api.sessions.start(s.id, token);
      load();
    } finally {
      setActionId(null);
    }
  };

  const handleEnd = async (s: LiveSession) => {
    if (!token || !confirm(`End "${s.title}"? The chat will be archived.`)) return;
    setActionId(s.id);
    try {
      await api.sessions.end(s.id, token);
      load();
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (s: LiveSession) => {
    if (!token || !confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    setActionId(s.id);
    try {
      await api.sessions.remove(s.id, token);
      load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create and manage live chat sessions for Saturday apologetics.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 card">
          <SignalIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No sessions yet. Create the first one.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Duration</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.title}
                    {s.description && (
                      <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">{s.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {s.scheduledAt
                      ? new Date(s.scheduledAt).toLocaleDateString([], {
                          weekday: 'short', month: 'short', day: 'numeric',
                        }) + ', ' + new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {s.startedAt && s.endedAt ? (
                      `${Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)} min`
                    ) : s.startedAt ? (
                      'In progress'
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {s.status === 'ended' && (
                        <Link
                          href={`/live/${s.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View archive"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                      )}
                      {s.status === 'live' && (
                        <Link
                          href={`/live/${s.id}`}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                          title="Open live chat"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </Link>
                      )}
                      {s.status === 'scheduled' && (
                        <button
                          onClick={() => handleStart(s)}
                          disabled={actionId === s.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                          title="Start session"
                        >
                          <PlayIcon className="w-4 h-4" />
                        </button>
                      )}
                      {s.status === 'live' && (
                        <button
                          onClick={() => handleEnd(s)}
                          disabled={actionId === s.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                          title="End session"
                        >
                          <StopIcon className="w-4 h-4" />
                        </button>
                      )}
                      {s.status !== 'live' && (
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={actionId === s.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowPanel(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                {editing ? 'Edit Session' : 'New Session'}
              </h2>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Session 47 — Answering Atheist Objections"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field resize-none"
                  placeholder="Brief overview of what will be discussed…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Scheduled date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Session'}
                </button>
                <button type="button" onClick={() => setShowPanel(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
