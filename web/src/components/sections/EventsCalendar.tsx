'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, ArrowRightIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// ─── Shared settings hook ────────────────────────────────────────────────────

interface SessionSettings {
  topic: string;
  time: string;
  venue: string;
  description: string;
  poster: string;
}

const DEFAULTS: SessionSettings = {
  topic: 'Truth and Postmodernism',
  time: '7:00 PM EAT',
  venue: 'Online & In-Person (Nairobi)',
  description:
    'Is there such a thing as objective truth? How does postmodernism challenge the gospel\'s claim that Jesus is "the way, the truth, and the life"?',
  poster: '/Posters/poster.png',
};

function useSessionSettings(): SessionSettings {
  const [settings, setSettings] = useState<SessionSettings>(DEFAULTS);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/api/v1/settings`)
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          topic: data.session_topic || DEFAULTS.topic,
          time: data.session_time || DEFAULTS.time,
          venue: data.session_venue || DEFAULTS.venue,
          description: data.session_description || DEFAULTS.description,
          poster: data.session_poster || DEFAULTS.poster,
        });
      })
      .catch(() => {}); // fail silently, use defaults
  }, []);

  return settings;
}

// ─── Next session hook (fetches from API) ────────────────────────────────────

interface NextSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  posterUrl?: string | null;
  link?: string | null;
}

function useNextSession(): NextSession | null {
  const [session, setSession] = useState<NextSession | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/api/v1/sessions/next`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSession(data || null))
      .catch(() => {});
  }, []);

  return session;
}

// ─── Scheduled sessions map (date string → session) ──────────────────────────

function useScheduledSessions(): Map<string, NextSession> {
  const [map, setMap] = useState<Map<string, NextSession>>(new Map());

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/api/v1/sessions?status=scheduled`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NextSession[]) => {
        const m = new Map<string, NextSession>();
        for (const s of Array.isArray(data) ? data : []) {
          if (s.scheduledAt) m.set(new Date(s.scheduledAt).toDateString(), s);
        }
        setMap(m);
      })
      .catch(() => {});
  }, []);

  return map;
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getSaturdaysInMonth(year: number, month: number): Date[] {
  const saturdays: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    saturdays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return saturdays;
}

function getUpcomingEvents(count = 6): Date[] {
  const events: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let year = today.getFullYear();
  let month = today.getMonth();

  while (events.length < count) {
    const saturdays = getSaturdaysInMonth(year, month);
    // 2nd Saturday = index 1, 4th Saturday = index 3
    for (const idx of [1, 3]) {
      if (saturdays[idx] && saturdays[idx] >= today) {
        events.push(saturdays[idx]);
      }
    }
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return events.slice(0, count);
}

function isToday(date: Date): boolean {
  const t = new Date();
  return (
    date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear()
  );
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

// ─── Dynamic poster placeholder ───────────────────────────────────────────────

function SessionPosterPlaceholder({
  date,
  title = 'APOLOGETICS SESSION',
  speaker = 'Dr John Njoroge',
}: {
  date?: Date;
  title?: string;
  speaker?: string;
}) {
  const dateStr = date
    ? date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="w-full aspect-[3/4] bg-gradient-to-b from-brand-900 via-brand-800 to-brand-950 flex flex-col items-center justify-between p-8 text-center relative overflow-hidden select-none">
      {/* Decorative rings */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] border border-white rounded-full" />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-blue-300">
          Apologetics Africa
        </p>
        <div className="w-10 h-px bg-gold-400" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-gold-300">
          Presents
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase leading-tight tracking-wide">
          {title}
        </h2>
        <div className="w-14 h-px bg-gold-400" />
        <div className="flex flex-col items-center gap-0.5 mt-1">
          <p className="text-[0.6rem] uppercase tracking-widest text-blue-300">Speaker</p>
          <p className="text-lg font-bold text-gold-300">{speaker}</p>
        </div>
      </div>

      {/* Date */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        {dateStr && (
          <>
            <p className="text-[0.6rem] uppercase tracking-widest text-blue-300">Date</p>
            <p className="text-sm font-semibold text-white">{dateStr}</p>
          </>
        )}
        <p className="text-[0.6rem] text-blue-400 mt-1">7:00 PM EAT · Online &amp; In-Person</p>
      </div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

interface Props {
  /** Show as a full section (default), compact sidebar card, or announcement banner */
  variant?: 'section' | 'card' | 'banner';
}

/** Slim announcement strip — place immediately after <Hero /> */
export function NextSessionBanner() {
  const settings = useSessionSettings();
  const nextSession = useNextSession();
  const events = useMemo(() => getUpcomingEvents(1), []);

  // Use scheduled session date if available, else fall back to computed Saturday
  const nextDate = nextSession?.scheduledAt
    ? new Date(nextSession.scheduledAt)
    : events[0];

  if (!nextDate) return null;

  const dateStr = nextDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const today = isToday(nextDate);
  const soon = isThisWeek(nextDate);
  const title = nextSession?.title || settings.topic;

  return (
    <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 border-y border-brand-700/60">
      <div className="container-xl py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-300 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            {today ? 'Tonight!' : soon ? 'This Saturday' : 'Saturday Session'}
          </span>
          <span className="text-white font-medium">
            <strong className="text-gold-300">{title}</strong>
            <span className="text-blue-200 ml-2">·</span>
            <span className="text-blue-200 ml-2">{dateStr}</span>
            <span className="text-blue-300 ml-2">at {settings.time}</span>
          </span>
        </div>
        <Link
          href={nextSession?.link || '/questions#ask'}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full transition-colors shrink-0"
        >
          {nextSession?.link ? 'Join Session' : 'Submit a Question'}
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function EventsCalendar({ variant = 'section' }: Props) {
  const settings = useSessionSettings();
  const nextSession = useNextSession();
  const scheduledSessions = useScheduledSessions();
  const allEvents = useMemo(() => getUpcomingEvents(4), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Compute the next session date for the placeholder
  const nextDate = nextSession?.scheduledAt
    ? new Date(nextSession.scheduledAt)
    : allEvents[0];

  // Upcoming dates: exclude whichever date is already shown as "next session"
  const events = useMemo(() => {
    const nextTs = nextDate?.toDateString();
    return allEvents.filter((d) => d.toDateString() !== nextTs).slice(0, 3);
  }, [allEvents, nextDate]);

  function handleDateClick(date: Date) {
    setSelectedDate((prev) =>
      prev?.toDateString() === date.toDateString() ? null : date,
    );
  }

  // Derive what to display in the poster panel
  const activeSession = selectedDate
    ? (scheduledSessions.get(selectedDate.toDateString()) ?? null)
    : nextSession;
  const activeDate = selectedDate ?? nextDate;
  const activePosterSrc = activeSession?.posterUrl ?? (!selectedDate ? settings.poster : null);
  const showActivePlaceholder = !activePosterSrc;

  // Keep these for backwards-compat within the card header / share text
  const posterSrc = activePosterSrc ?? '';

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-800 to-brand-700 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Upcoming Sessions
            </span>
          </div>
          <p className="text-white font-semibold text-sm leading-snug">
            {nextSession?.title || settings.topic}
          </p>
          <p className="text-blue-200 text-xs mt-1">
            2nd &amp; 4th Saturday · {settings.time}
          </p>
        </div>

        {/* Poster */}
        <div className="border-b border-slate-100">
          {showActivePlaceholder ? (
            <SessionPosterPlaceholder date={activeDate} />
          ) : (
            <img
              src={activePosterSrc!}
              alt={`Session poster — ${activeSession?.title || settings.topic}`}
              className="w-full object-contain"
            />
          )}
        </div>

        {/* Event list */}
        <div className="divide-y divide-slate-50">
          {events.map((date, i) => {
            const soon = isThisWeek(date);
            const today = isToday(date);
            const selected = selectedDate?.toDateString() === date.toDateString();
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDateClick(date)}
                className={clsx(
                  'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors',
                  selected
                    ? 'bg-brand-100 ring-1 ring-inset ring-brand-300'
                    : today
                    ? 'bg-brand-50 hover:bg-brand-100'
                    : soon
                    ? 'bg-amber-50/50 hover:bg-amber-50'
                    : 'hover:bg-slate-50',
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 text-center',
                    selected || today ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700',
                  )}
                >
                  <span className="text-xs leading-none font-bold">
                    {date.getDate()}
                  </span>
                  <span className="text-xs leading-none mt-0.5">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                    {today && <span className="ml-1.5 text-brand-600 font-semibold">· Today!</span>}
                    {soon && !today && <span className="ml-1.5 text-amber-600 font-semibold">· This week</span>}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <ClockIcon className="w-3 h-3" />
                    {settings.time}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <Link
            href="/questions#ask"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Submit a question for the session →
          </Link>
        </div>
      </div>
    );
  }

  // Full section variant
  return (
    <section id="saturday-sessions" className="py-20 bg-brand-950 text-white">
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy + upcoming dates */}
          <div>
            <p className="section-label text-blue-300">Saturday Sessions</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
              Join Us Live — Every 2nd &amp; 4th Saturday
            </h2>
            <p className="text-blue-200 text-lg leading-relaxed mb-6">
              An open forum for rigorous discussion of the Christian faith. Christians
              and seekers welcome. No question is off-limits.
            </p>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className={clsx(
                'w-full text-left rounded-2xl p-6 mb-6 backdrop-blur-sm border transition-colors',
                selectedDate === null
                  ? 'bg-white/25 border-white/60 ring-1 ring-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/15',
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
                {nextSession ? 'Next Session' : 'Current Topic'}
              </p>
              <p className="text-xl font-bold text-white">
                {nextSession?.title || settings.topic}
              </p>
              {nextSession?.scheduledAt && (
                <p className="text-blue-300 text-sm mt-1">
                  {new Date(nextSession.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              )}
              <p className="text-blue-200 text-sm mt-2 leading-relaxed">
                {nextSession?.description || settings.description}
              </p>
            </button>

            <div className="flex flex-col gap-2 text-sm text-blue-200 mb-8">
              <span className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-blue-300 shrink-0" />
                {settings.time} (East Africa Time)
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-blue-300 shrink-0" />
                {settings.venue}
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">
              Upcoming Dates
            </p>
            <div className="space-y-3 mb-8">
              {events.map((date, i) => {
                const today = isToday(date);
                const soon = isThisWeek(date);
                const selected = selectedDate?.toDateString() === date.toDateString();
                const sessionForDate = scheduledSessions.get(date.toDateString());
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left',
                      selected
                        ? 'bg-white/25 border-white/60 ring-1 ring-white/40'
                        : today
                        ? 'bg-white/20 border-white/40 hover:bg-white/25'
                        : soon
                        ? 'bg-white/10 border-white/20 hover:bg-white/15'
                        : 'bg-white/5 border-white/10 hover:bg-white/10',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0',
                        selected || today ? 'bg-white text-brand-800' : 'bg-white/10 text-white',
                      )}
                    >
                      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                      <span className="text-xs font-medium mt-0.5 opacity-70">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {today && (
                          <span className="ml-2 text-xs bg-gold-500 text-white px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                        {soon && !today && (
                          <span className="ml-2 text-xs bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                            This week
                          </span>
                        )}
                        {sessionForDate?.posterUrl && (
                          <span className="ml-2 text-xs bg-blue-500/60 text-white px-2 py-0.5 rounded-full">
                            Poster
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-blue-200 mt-0.5">
                        {settings.time} · {sessionForDate?.title || settings.topic}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/questions#ask" className="btn-primary bg-white text-brand-800 hover:bg-blue-50">
                Submit a Question for the Session
              </Link>
              {nextSession?.link && (
                <a
                  href={nextSession.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary bg-gold-500 hover:bg-gold-400 text-brand-900 border-transparent"
                >
                  Join Session →
                </a>
              )}
            </div>
          </div>

          {/* Right: poster */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl sticky top-8">
            {showActivePlaceholder ? (
              <SessionPosterPlaceholder date={activeDate} />
            ) : (
              <img
                src={activePosterSrc!}
                alt={`Session poster — ${activeSession?.title || settings.topic}`}
                className="w-full object-contain"
              />
            )}
            {/* Download / Share actions */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-t border-white/10">
              {!showActivePlaceholder && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(activePosterSrc!);
                        const blob = await res.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = objectUrl;
                        a.download = `session-poster-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(objectUrl);
                      } catch {
                        window.open(activePosterSrc!, '_blank');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-200 hover:text-white transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Poster
                  </button>
                  <span className="text-white/20">·</span>
                </>
              )}
              <button
                type="button"
                onClick={async () => {
                  const title = activeSession?.title || settings.topic;
                  const sessionUrl = `${window.location.origin}/#saturday-sessions`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Session: ${title}`,
                        text: `Join us for "${title}" — an Apologetics Africa Saturday session.`,
                        url: sessionUrl,
                      });
                    } catch {}
                  } else {
                    await navigator.clipboard.writeText(sessionUrl);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-200 hover:text-white transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share Poster
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
