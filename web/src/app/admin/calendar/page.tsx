'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ChevronLeftIcon, ChevronRightIcon, PlusIcon, PlayIcon,
  StopIcon, XCircleIcon, PencilIcon, TrashIcon, CalendarDaysIcon,
  ClockIcon, CheckCircleIcon, Cog6ToothIcon, PhotoIcon, LinkIcon,
  ArrowUpTrayIcon, XMarkIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { api, type LiveSession } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ── Timezones ──────────────────────────────────────────────────────────────────
const TIMEZONES = [
  { label: 'EAT — East Africa Time (UTC+3)',      iana: 'Africa/Nairobi',       abbr: 'EAT' },
  { label: 'CAT — Central Africa Time (UTC+2)',    iana: 'Africa/Harare',        abbr: 'CAT' },
  { label: 'SAST — South Africa Std (UTC+2)',      iana: 'Africa/Johannesburg',  abbr: 'SAST' },
  { label: 'WAT — West Africa Time (UTC+1)',       iana: 'Africa/Lagos',         abbr: 'WAT' },
  { label: 'GMT — Greenwich Mean Time (UTC+0)',    iana: 'Africa/Abidjan',       abbr: 'GMT' },
  { label: 'UTC — Universal Time',                 iana: 'UTC',                  abbr: 'UTC' },
  { label: 'CET — Central European Time (UTC+1)', iana: 'Europe/Paris',          abbr: 'CET' },
  { label: 'EST — Eastern Standard (UTC−5)',       iana: 'America/New_York',     abbr: 'EST' },
] as const;

type TZRecord = typeof TIMEZONES[number];

// Convert a local date+time string in a given IANA timezone to a UTC ISO string
function localToUTCIso(dateStr: string, timeStr: string, ianaTimezone: string): string {
  const d = new Date(`${dateStr}T${timeStr}:00Z`); // treat input as UTC temporarily
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: ianaTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const hour = p.hour === '24' ? '00' : p.hour;
  const tzDate = new Date(`${p.year}-${p.month}-${p.day}T${hour}:${p.minute}:${p.second}Z`);
  return new Date(2 * d.getTime() - tzDate.getTime()).toISOString();
}

// Extract HH:MM from a UTC ISO string in a given timezone
function extractLocalTime(isoStr: string, ianaTimezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: ianaTimezone,
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(isoStr));
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const h = p.hour === '24' ? '00' : p.hour;
  return `${h}:${p.minute}`;
}

// Format a UTC ISO string for display in a given timezone
function fmtTime(isoStr: string, ianaTimezone: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    timeZone: ianaTimezone, hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Get YYYY-MM-DD of a date in a given timezone
function toLocalDateStr(isoStr: string, ianaTimezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(isoStr));
}

// Build calendar grid for a month
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Mon-first: 0=Mon
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function StatusBadge({ status }: { status: LiveSession['status'] }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
    </span>
  );
  if (status === 'scheduled') return (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Scheduled</span>
  );
  if (status === 'cancelled') return (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-600">Cancelled</span>
  );
  return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500">Ended</span>;
}

// ── Poster uploader ────────────────────────────────────────────────────────────

interface PosterFieldProps {
  value: string;
  onChange: (url: string) => void;
  token: string;
  sessionDate?: string; // YYYY-MM-DD — used to name the uploaded poster file
}

function PosterField({ value, onChange, token, sessionDate }: PosterFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const form = new FormData();
      form.append('file', file);
      const dateParam = sessionDate ? `?sessionDate=${encodeURIComponent(sessionDate)}` : '';
      const res = await fetch(`${base}/api/v1/upload/poster${dateParam}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }
      const { url } = await res.json();
      onChange(url.startsWith('http') ? url : `${base}${url}`);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">Poster Image</label>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <img src={value} alt="poster preview" className="w-full max-h-48 object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 hover:bg-white shadow text-slate-500 hover:text-rose-600 transition-colors"
            title="Remove poster"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-colors disabled:opacity-50 text-xs"
        >
          {uploading ? (
            <><ArrowUpTrayIcon className="w-5 h-5 animate-bounce" /> Uploading…</>
          ) : (
            <><PhotoIcon className="w-5 h-5" /> Click to upload poster</>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

// ── Edit session modal ────────────────────────────────────────────────────────

interface EditModalProps {
  session: LiveSession;
  tz: TZRecord;
  token: string;
  onSave: () => void;
  onClose: () => void;
}

function EditModal({ session, tz, token, onSave, onClose }: EditModalProps) {
  const [title, setTitle]       = useState(session.title);
  const [desc, setDesc]         = useState(session.description ?? '');
  const [date, setDate]         = useState(
    session.scheduledAt ? toLocalDateStr(session.scheduledAt, tz.iana) : ''
  );
  const [time, setTime]         = useState(
    session.scheduledAt ? extractLocalTime(session.scheduledAt, tz.iana) : '10:00'
  );
  const [editTz, setEditTz]     = useState<TZRecord>(tz);
  const [poster, setPoster]     = useState(session.posterUrl ?? '');
  const [link, setLink]         = useState(session.link ?? '');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const scheduledAt = date && time ? localToUTCIso(date, time, editTz.iana) : undefined;
      await api.sessions.update(session.id, {
        title: title.trim(),
        description: desc.trim() || undefined,
        scheduledAt,
        posterUrl: poster || undefined,
        link: link.trim() || undefined,
      }, token);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Edit Session</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-rose-500">*</span></label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className="input-field resize-none" placeholder="Optional description…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
            <select
              value={editTz.iana}
              onChange={(e) => { const f = TIMEZONES.find(t => t.iana === e.target.value); if (f) setEditTz(f); }}
              className="input-field"
            >
              {TIMEZONES.map(t => <option key={t.iana} value={t.iana}>{t.label}</option>)}
            </select>
          </div>

          <PosterField value={poster} onChange={setPoster} token={token} sessionDate={date || undefined} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5"><LinkIcon className="w-4 h-4" /> Session Link <span className="text-slate-400 font-normal text-xs">(optional — e.g. Zoom, YouTube)</span></span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="input-field"
              placeholder="https://…"
            />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const { token } = useAuth();

  // Calendar state
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // "YYYY-MM-DD"
  const [tz, setTz] = useState<TZRecord>(TIMEZONES[0]); // default EAT

  // Sessions
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // New session form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc,  setNewDesc]  = useState('');
  const [newTime,  setNewTime]  = useState('10:00');
  const [newTz,    setNewTz]    = useState<TZRecord>(TIMEZONES[0]);
  const [newPoster, setNewPoster] = useState('');
  const [newLink,  setNewLink]  = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editSession, setEditSession] = useState<LiveSession | null>(null);

  // Settings tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar');
  const [settingsTopic,    setSettingsTopic]    = useState('');
  const [settingsTime,     setSettingsTime]     = useState('');
  const [settingsVenue,    setSettingsVenue]    = useState('');
  const [settingsDesc,     setSettingsDesc]     = useState('');
  const [settingsSaving,   setSettingsSaving]   = useState(false);
  const [settingsSaved,    setSettingsSaved]    = useState(false);
  const [settingsError,    setSettingsError]    = useState('');

  const loadSessions = useCallback(() => {
    if (!token) return;
    setLoadingSessions(true);
    api.sessions.listAll(token)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Load session settings
  useEffect(() => {
    api.admin.settings.get()
      .then((d) => {
        setSettingsTopic(d.session_topic || '');
        setSettingsTime(d.session_time || '');
        setSettingsVenue(d.session_venue || '');
        setSettingsDesc(d.session_description || '');
      })
      .catch(console.error);
  }, []);

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSettingsSaving(true); setSettingsError(''); setSettingsSaved(false);
    try {
      await api.admin.settings.update({
        session_topic: settingsTopic, session_time: settingsTime,
        session_venue: settingsVenue, session_description: settingsDesc,
      }, token);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save');
    } finally {
      setSettingsSaving(false);
    }
  }

  // Calendar grid
  const cells = buildCalendarDays(viewYear, viewMonth);

  // Map sessions to their date string in selected TZ
  const sessionsByDay = sessions.reduce<Record<string, LiveSession[]>>((acc, s) => {
    if (!s.scheduledAt) return acc;
    const key = toLocalDateStr(s.scheduledAt, tz.iana);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  function dayStr(d: number) {
    return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function isPastDay(ds: string): boolean {
    return ds < todayStr;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
    setSelectedDay(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedDay) return;
    if (isPastDay(selectedDay)) {
      alert('Cannot schedule a session on a past date.');
      return;
    }
    setCreating(true);
    try {
      const scheduledAt = localToUTCIso(selectedDay, newTime, newTz.iana);
      await api.sessions.create({
        title: newTitle,
        description: newDesc || undefined,
        scheduledAt,
        posterUrl: newPoster || undefined,
        link: newLink.trim() || undefined,
      }, token);
      setShowForm(false);
      setNewTitle(''); setNewDesc(''); setNewTime('10:00'); setNewPoster(''); setNewLink('');
      loadSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(s: LiveSession) {
    if (!token || !confirm(`Start "${s.title}"?`)) return;
    setActionId(s.id);
    try { await api.sessions.start(s.id, token); loadSessions(); }
    finally { setActionId(null); }
  }
  async function handleEnd(s: LiveSession) {
    if (!token || !confirm(`End "${s.title}"?`)) return;
    setActionId(s.id);
    try { await api.sessions.end(s.id, token); loadSessions(); }
    finally { setActionId(null); }
  }
  async function handleCancel(s: LiveSession) {
    if (!token || !confirm(`Cancel "${s.title}"?`)) return;
    setActionId(s.id);
    try { await api.sessions.cancel(s.id, token); loadSessions(); }
    finally { setActionId(null); }
  }
  async function handleUncancel(s: LiveSession) {
    if (!token || !confirm(`Restore "${s.title}" as scheduled?`)) return;
    setActionId(s.id);
    try { await api.sessions.uncancel(s.id, token); loadSessions(); }
    finally { setActionId(null); }
  }
  async function handleDelete(s: LiveSession) {
    if (!token || !confirm(`Delete "${s.title}"? Cannot be undone.`)) return;
    setActionId(s.id);
    try { await api.sessions.remove(s.id, token); loadSessions(); setSelectedDay(null); }
    finally { setActionId(null); }
  }

  // Pre-fill title when selecting a day
  function selectDay(d: number) {
    const ds = dayStr(d);
    setSelectedDay(ds);
    setShowForm(false);
    const label = new Date(ds + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    setNewTitle(`Session — ${label}`);
    setNewTz(tz);
  }

  const selectedSessions = selectedDay ? (sessionsByDay[selectedDay] ?? []).sort((a, b) => {
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return a.scheduledAt.localeCompare(b.scheduledAt);
  }) : [];

  const canAddSession = selectedDay !== null && !isPastDay(selectedDay);

  return (
    <div>
      {/* Edit modal */}
      {editSession && token && (
        <EditModal
          session={editSession}
          tz={tz}
          token={token}
          onSave={() => { setEditSession(null); loadSessions(); }}
          onClose={() => setEditSession(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Schedule and manage live apologetics sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('calendar')}
              className={clsx('px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700')}
            >
              <CalendarDaysIcon className="w-4 h-4" /> Schedule
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={clsx('px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700')}
            >
              <Cog6ToothIcon className="w-4 h-4" /> Session Settings
            </button>
          </div>
        </div>
      </div>

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSave} className="max-w-2xl space-y-6">
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Saturday Session Defaults</h2>
              <p className="text-xs text-slate-400 mt-0.5">These details appear on the Live page and the home page events section.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Topic</label>
              <input type="text" className="input-field" value={settingsTopic}
                onChange={(e) => setSettingsTopic(e.target.value)}
                placeholder="e.g. Truth and Postmodernism" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Typical Start Time</label>
              <input type="text" className="input-field" value={settingsTime}
                onChange={(e) => setSettingsTime(e.target.value)}
                placeholder="e.g. 10:00 AM EAT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue</label>
              <input type="text" className="input-field" value={settingsVenue}
                onChange={(e) => setSettingsVenue(e.target.value)}
                placeholder="e.g. Online & In-Person (Nairobi)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic Description</label>
              <textarea className="input-field resize-none" rows={3} value={settingsDesc}
                onChange={(e) => setSettingsDesc(e.target.value)}
                placeholder="Brief description of the current topic…" />
            </div>
          </div>
          {settingsError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{settingsError}</p>
          )}
          {settingsSaved && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircleIcon className="w-4 h-4" /> Settings saved.
            </div>
          )}
          <button type="submit" disabled={settingsSaving} className="btn-primary disabled:opacity-50">
            {settingsSaving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}

      {/* ── Calendar tab ── */}
      {activeTab === 'calendar' && (
        <div className="flex gap-6 items-start">
          {/* Left: calendar grid */}
          <div className="flex-1 min-w-0">
            {/* Month nav + TZ selector */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-semibold text-slate-900 w-44 text-center">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </h2>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Timezone selector */}
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  <select
                    value={tz.iana}
                    onChange={(e) => {
                      const found = TIMEZONES.find(t => t.iana === e.target.value);
                      if (found) setTz(found);
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {TIMEZONES.map(t => (
                      <option key={t.iana} value={t.iana}>{t.abbr} — {t.label.split('—')[0].trim()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const ds = dayStr(day);
                  const daySessions = sessionsByDay[ds] ?? [];
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedDay;
                  const isPast = isPastDay(ds);
                  const hasSessions = daySessions.length > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => selectDay(day)}
                      className={clsx(
                        'relative flex flex-col items-center py-2 px-1 rounded-xl text-sm transition-all min-h-[56px]',
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : isToday
                          ? 'bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-300'
                          : isPast
                          ? 'text-slate-300 cursor-default'
                          : hasSessions
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <span>{day}</span>
                      {hasSessions && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {daySessions.slice(0, 3).map((s) => (
                            <span
                              key={s.id}
                              className={clsx('w-1.5 h-1.5 rounded-full', {
                                'bg-green-400': s.status === 'live',
                                'bg-blue-400': s.status === 'scheduled',
                                'bg-slate-300': s.status === 'ended' || s.status === 'cancelled',
                              }, isSelected && 'opacity-80')}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Live</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Scheduled</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Ended / Cancelled</span>
              </div>
            </div>
          </div>

          {/* Right: selected day panel */}
          <div className="w-80 shrink-0">
            {selectedDay ? (
              <div className="card p-5 space-y-4">
                {/* Day header */}
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-semibold text-slate-900">
                    {new Date(selectedDay + 'T12:00:00Z').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewYear} · {tz.abbr}
                    {isPastDay(selectedDay) && (
                      <span className="ml-2 text-amber-500 font-medium">· Past date</span>
                    )}
                  </p>
                </div>

                {/* Sessions for this day */}
                {loadingSessions ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : selectedSessions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSessions.map(s => (
                      <div key={s.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                        {/* Poster thumbnail */}
                        {s.posterUrl && (
                          <img src={s.posterUrl} alt="poster" className="w-full rounded-lg object-cover max-h-32" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 leading-snug flex-1 min-w-0 line-clamp-2">{s.title}</p>
                          <StatusBadge status={s.status} />
                        </div>
                        {s.scheduledAt && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {fmtTime(s.scheduledAt, tz.iana)} {tz.abbr}
                          </p>
                        )}
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:underline flex items-center gap-1 truncate">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{s.link}</span>
                          </a>
                        )}
                        {s.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{s.description}</p>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          {/* Edit always available */}
                          <button onClick={() => setEditSession(s)} disabled={actionId === s.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-40" title="Edit">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          {s.status === 'scheduled' && (
                            <>
                              <button onClick={() => handleStart(s)} disabled={actionId === s.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40" title="Start">
                                <PlayIcon className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleCancel(s)} disabled={actionId === s.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40" title="Cancel session">
                                <XCircleIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {s.status === 'live' && (
                            <button onClick={() => handleEnd(s)} disabled={actionId === s.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40" title="End">
                              <StopIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {s.status === 'cancelled' && (
                            <button onClick={() => handleUncancel(s)} disabled={actionId === s.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40" title="Restore to scheduled">
                              <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(s)} disabled={actionId === s.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 ml-auto" title="Delete">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No sessions on this day.</p>
                )}

                {/* New session button / form — only for future dates */}
                {canAddSession && (
                  !showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" /> Add session for this day
                    </button>
                  ) : (
                    <form onSubmit={handleCreate} className="space-y-3 border border-slate-100 rounded-xl p-4 bg-slate-50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Session</p>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Title <span className="text-rose-500">*</span></label>
                        <input
                          required
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="input-field text-sm py-1.5"
                          placeholder="Session title…"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="input-field text-sm py-1.5 resize-none"
                          placeholder="Optional…"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Time <span className="text-rose-500">*</span></label>
                          <input
                            required
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="input-field text-sm py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Timezone</label>
                          <select
                            value={newTz.iana}
                            onChange={(e) => {
                              const found = TIMEZONES.find(t => t.iana === e.target.value);
                              if (found) setNewTz(found);
                            }}
                            className="input-field text-sm py-1.5"
                          >
                            {TIMEZONES.map(t => (
                              <option key={t.iana} value={t.iana}>{t.abbr}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {token && (
                        <PosterField value={newPoster} onChange={setNewPoster} token={token} sessionDate={selectedDay ?? undefined} />
                      )}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Session Link (optional)</label>
                        <input
                          type="url"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          className="input-field text-sm py-1.5"
                          placeholder="https://…"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={creating} className="btn-primary text-xs py-1.5 flex-1 justify-center disabled:opacity-50">
                          {creating ? 'Creating…' : 'Create Session'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-xs py-1.5">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )
                )}

                {selectedDay && isPastDay(selectedDay) && !loadingSessions && selectedSessions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Past dates cannot be scheduled.</p>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center text-slate-400">
                <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-sm">Select a day to view or schedule sessions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
