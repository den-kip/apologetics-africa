'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, LiveSession } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  CalendarDaysIcon, ClockIcon, LockClosedIcon, SignalIcon,
} from '@heroicons/react/24/outline';

// ─── Next 2nd / 4th Saturday at 7 PM EAT ─────────────────────────────────────

function getNextScheduledSaturday(): Date {
  const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3
  const SESSION_HOUR_UTC = 16; // 7 PM EAT = 4 PM UTC

  const now = new Date();
  const candidates: Date[] = [];

  for (let monthDelta = 0; monthDelta <= 2; monthDelta++) {
    const ref = new Date(now);
    ref.setUTCDate(1);
    ref.setUTCMonth(ref.getUTCMonth() + monthDelta);

    const year = ref.getUTCFullYear();
    const month = ref.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const saturdays: Date[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(Date.UTC(year, month, d, SESSION_HOUR_UTC, 0, 0, 0));
      if (day.getUTCDay() === 6) saturdays.push(day); // 6 = Saturday
    }

    // 2nd Saturday = index 1, 4th Saturday = index 3
    [1, 3].forEach((i) => {
      if (saturdays[i]) candidates.push(saturdays[i]);
    });
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates.find((d) => d.getTime() > now.getTime()) ?? candidates[candidates.length - 1];
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(target: Date | null) {
  const calc = () => {
    if (!target) return null;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
      total: diff,
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
    };
  };

  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [target?.getTime()]);

  return remaining;
}

// ─── Countdown tiles ──────────────────────────────────────────────────────────

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-2xl flex items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ─── Countdown card ───────────────────────────────────────────────────────────

function NextSessionCard({
  title,
  description,
  target,
}: {
  title: string;
  description?: string;
  target: Date;
}) {
  const remaining = useCountdown(target);
  const started = remaining?.total === 0;

  return (
    <div className="mb-12 bg-slate-900 rounded-2xl overflow-hidden">
      <div className="px-8 pt-8 pb-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-900/60 text-brand-300 border border-brand-700/40">
          <CalendarDaysIcon className="w-3.5 h-3.5" />
          Next Session
        </span>
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-2 text-slate-400 max-w-lg mx-auto text-sm">{description}</p>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-400">
          <CalendarDaysIcon className="w-4 h-4" />
          {target.toLocaleDateString([], {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
          {' · '}
          {target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
        </p>
      </div>

      <div className="bg-slate-800/60 px-8 py-8">
        {!started && remaining ? (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
              Session starts in
            </p>
            <div className="flex items-start justify-center gap-3 sm:gap-5">
              {remaining.days > 0 && <CountdownUnit value={remaining.days} label="Days" />}
              <CountdownUnit value={remaining.hours} label="Hours" />
              <CountdownUnit value={remaining.minutes} label="Min" />
              <CountdownUnit value={remaining.seconds} label="Sec" />
            </div>
          </>
        ) : (
          <p className="text-center text-green-400 font-semibold animate-pulse">
            Starting any moment…
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.list()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const live = sessions.find((s) => s.status === 'live');
  const upcoming = sessions
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => {
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  const nextDbSession = upcoming[0];
  const otherUpcoming = upcoming.slice(1);

  // Determine what to show as the "next session" countdown
  const nextTarget: Date = nextDbSession?.scheduledAt
    ? new Date(nextDbSession.scheduledAt)
    : getNextScheduledSaturday();

  const nextTitle = nextDbSession?.title ?? 'Saturday Apologetics Session';
  const nextDescription = nextDbSession?.description;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20">
        <div className="container-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <SignalIcon className="w-5 h-5 text-brand-400" />
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest">
              Live Sessions
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Saturday Apologetics
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Join our live interactive sessions every 2nd &amp; 4th Saturday at 7:00 PM EAT.
            Ask questions, comment, and engage in real time.
          </p>
        </div>
      </section>

      <section className="container-xl py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Active live session */}
            {live ? (
              <div className="mb-12 bg-green-50 border border-green-200 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <SignalIcon className="w-6 h-6 text-green-600 animate-pulse" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live Now
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{live.title}</h2>
                    {live.description && (
                      <p className="text-slate-600 text-sm mt-1">{live.description}</p>
                    )}
                    {live.startedAt && (
                      <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Started {new Date(live.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {user ? (
                    <Link href={`/live/${live.id}`} className="btn-primary px-6 py-3 text-base">
                      Join Session →
                    </Link>
                  ) : (
                    <Link href={`/login?redirect=/live/${live.id}`} className="btn-primary px-6 py-3 text-base">
                      Sign in to Join →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              /* Next session countdown — always shown */
              <NextSessionCard
                title={nextTitle}
                description={nextDescription}
                target={nextTarget}
              />
            )}

            {/* Additional upcoming sessions */}
            {otherUpcoming.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-5">More Upcoming Sessions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherUpcoming.map((s) => (
                    <div key={s.id} className="card p-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        Upcoming
                      </span>
                      <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                      {s.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                      )}
                      {s.scheduledAt && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {new Date(s.scheduledAt).toLocaleDateString([], {
                            weekday: 'long', month: 'long', day: 'numeric',
                          })}{' at '}
                          {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign-in reminder */}
            {!user && (
              <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-5 flex items-start gap-3">
                <LockClosedIcon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-brand-900">Sign in to participate</p>
                  <p className="text-sm text-brand-700 mt-0.5">
                    You need an account to join the chat, ask questions, and react to messages.{' '}
                    <Link href="/login" className="font-semibold underline">Sign in</Link>{' '}
                    or{' '}
                    <Link href="/register" className="font-semibold underline">create an account</Link>.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
