'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon, PaperAirplaneIcon, ShieldCheckIcon,
  EyeSlashIcon, EyeIcon, XCircleIcon, LockClosedIcon, LockOpenIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from '@/components/ui/SearchBar';
import { QuestionCard } from '@/components/ui/QuestionCard';
import { Pagination } from '@/components/ui/Pagination';
import { api, type Question, type QuestionCategory, type Topic, type PaginatedResponse, type SubmitQuestionPayload } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

// ── Session date helpers (mirrors EventsCalendar logic) ─────────────────────
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

function getSessionOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let year = today.getFullYear();
  let month = today.getMonth();

  // Past: go back up to 2 months to find the most recent 2nd/4th Saturday that has passed
  const past: Date[] = [];
  for (let offset = 0; offset <= 2 && past.length < 1; offset++) {
    let y = year, m = month - offset;
    if (m < 0) { m += 12; y--; }
    const sats = getSaturdaysInMonth(y, m);
    for (const idx of [3, 1]) {
      if (sats[idx] && sats[idx] < today) {
        past.push(sats[idx]);
        break;
      }
    }
  }

  // Upcoming: next 2 sessions
  const upcoming: Date[] = [];
  let y = year, m = month;
  while (upcoming.length < 2) {
    const sats = getSaturdaysInMonth(y, m);
    for (const idx of [1, 3]) {
      if (sats[idx] && sats[idx] >= today && upcoming.length < 2) {
        upcoming.push(sats[idx]);
      }
    }
    m++;
    if (m > 11) { m = 0; y++; }
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  for (const d of past) {
    options.push({ value: d.toISOString().split('T')[0], label: `Past — ${fmt(d)}` });
  }
  for (const d of upcoming) {
    options.push({ value: d.toISOString().split('T')[0], label: `Upcoming — ${fmt(d)}` });
  }
  return options;
}

// ── Category filter tabs ─────────────────────────────────────────────────────
const CATEGORIES: { value: QuestionCategory | 'all'; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'session', label: 'Session' },
  { value: 'topic',   label: 'Topic' },
  { value: 'theme',   label: 'Theme' },
  { value: 'general', label: 'General' },
];

type MainTab = 'browse' | 'mine' | 'review';

export default function QuestionsPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<MainTab>(
    searchParams.get('tab') === 'mine' ? 'mine' : 'browse',
  );

  // Browse tab state
  const [result, setResult] = useState<PaginatedResponse<Question> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | 'all'>('all');

  // My questions tab state
  const [myResult, setMyResult] = useState<PaginatedResponse<Question> | null>(null);
  const [myLoading, setMyLoading] = useState(false);
  const [myPage, setMyPage] = useState(1);

  // Review queue tab state (admin/editor only)
  const [reviewResult, setReviewResult] = useState<PaginatedResponse<Question> | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [formCategory, setFormCategory] = useState<QuestionCategory>('general');
  const [formSessionDate, setFormSessionDate] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const sessionOptions = getSessionOptions();

  // Fetch topics/themes when category changes to topic or theme
  useEffect(() => {
    if (formCategory === 'topic' || formCategory === 'theme') {
      api.topics.list(formCategory).then(setTopics).catch(() => setTopics([]));
    }
  }, [formCategory]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (search) params.search = search;
      if (activeCategory !== 'all') params.category = activeCategory;
      const data = await api.questions.list(params);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeCategory]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  useEffect(() => { setPage(1); }, [search, activeCategory]);

  // My questions
  useEffect(() => {
    if (mainTab !== 'mine' || !token) return;
    setMyLoading(true);
    api.questions.mine(token, { page: myPage, limit: 10 })
      .then(setMyResult)
      .catch(console.error)
      .finally(() => setMyLoading(false));
  }, [mainTab, token, myPage]);

  // Review queue (admin/editor)
  const fetchReview = useCallback(() => {
    if (!token || !isAdmin) return;
    setReviewLoading(true);
    api.admin.questions.list({ page: reviewPage, limit: 20, status: 'pending' }, token)
      .then(setReviewResult)
      .catch(console.error)
      .finally(() => setReviewLoading(false));
  }, [token, isAdmin, reviewPage]);

  useEffect(() => {
    if (mainTab === 'review') fetchReview();
  }, [mainTab, fetchReview]);

  async function handleReviewReject(id: string) {
    if (!token || !confirm('Reject this question?')) return;
    setReviewActionId(id);
    try { await api.questions.reject(id, token); fetchReview(); }
    finally { setReviewActionId(null); }
  }

  async function handleReviewHide(id: string, hidden: boolean) {
    if (!token) return;
    setReviewActionId(id);
    try { await api.questions.hide(id, hidden, token); fetchReview(); }
    finally { setReviewActionId(null); }
  }

  async function handleReviewLock(id: string, locked: boolean) {
    if (!token) return;
    setReviewActionId(id);
    try { await api.questions.lock(id, locked, token); fetchReview(); }
    finally { setReviewActionId(null); }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as any;
    const payload: SubmitQuestionPayload = {
      title: data.title,
      body: data.body,
      askerName: data.askerName,
      askerEmail: data.askerEmail,
      anonymous: data.anonymous === 'on',
      category: formCategory,
      topicId: formCategory !== 'session' ? (data.topicId || undefined) : undefined,
      sessionDate: formCategory === 'session' ? (data.topicId || undefined) : undefined,
    };
    try {
      await api.questions.submit(payload);
      setSubmitted(true);
      form.reset();
      setFormCategory('general');
      setFormSessionDate('');
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="container-xl py-14">
          <p className="section-label">Q&amp;A</p>
          <h1 className="section-title">Questions &amp; Answers</h1>
          <p className="section-subtitle max-w-2xl">
            Browse answers to questions submitted by Christians and seekers from
            across Africa — and ask your own.
          </p>
        </div>
      </div>

      <div className="container-xl py-10">
        {/* Main tabs */}
        {user && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
            <button
              onClick={() => setMainTab('browse')}
              className={`px-5 py-2 text-sm rounded-lg transition-colors font-medium ${
                mainTab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Browse Q&amp;As
            </button>
            <button
              onClick={() => setMainTab('mine')}
              className={`px-5 py-2 text-sm rounded-lg transition-colors font-medium ${
                mainTab === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Questions
            </button>
            {isAdmin && (
              <button
                onClick={() => setMainTab('review')}
                className={`px-5 py-2 text-sm rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                  mainTab === 'review' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                Review Queue
              </button>
            )}
          </div>
        )}

        {/* ── My Questions tab ── */}
        {mainTab === 'mine' && (
          <div>
            {myLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : myResult && myResult.data.length > 0 ? (
              <div className="space-y-3">
                {myResult.data.map((q) => (
                  <div key={q.id} className="card p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          q.status === 'answered' ? 'bg-green-100 text-green-700' :
                          q.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                        }`}>
                          {q.status}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{q.category}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{q.title}</p>
                      {q.answer && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{q.answer}</p>
                      )}
                    </div>
                    {q.slug && (
                      <a
                        href={`/questions/${q.slug}`}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0 mt-1"
                      >
                        View →
                      </a>
                    )}
                  </div>
                ))}
                {myResult.pages > 1 && (
                  <Pagination page={myResult.page} pages={myResult.pages} onPage={setMyPage} />
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <p className="mb-4">You haven't submitted any questions yet.</p>
                <a href="#ask" className="btn-secondary text-sm">Ask Your First Question</a>
              </div>
            )}
          </div>
        )}

        {/* ── Review Queue tab (admin/editor only) ── */}
        {mainTab === 'review' && isAdmin && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheckIcon className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-900">Pending Questions</h2>
              {reviewResult && (
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {reviewResult.total}
                </span>
              )}
            </div>
            {reviewLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : reviewResult && reviewResult.data.length > 0 ? (
              <div className="space-y-3">
                {reviewResult.data.map((q) => (
                  <div key={q.id} className={`card p-5 flex items-start gap-4 ${q.hidden ? 'opacity-60' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          Pending
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{q.category}</span>
                        {q.hidden && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">hidden</span>
                        )}
                        {q.locked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">locked</span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 line-clamp-2">{q.title}</p>
                      {q.body && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.body}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">— {q.askerName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/questions/${q.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 border border-brand-200 hover:bg-brand-50 transition-colors"
                        title="Open in admin"
                      >
                        Answer
                      </Link>
                      <button
                        onClick={() => handleReviewLock(q.id, !q.locked)}
                        disabled={reviewActionId === q.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                        title={q.locked ? 'Unlock' : 'Lock'}
                      >
                        {q.locked ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleReviewHide(q.id, !q.hidden)}
                        disabled={reviewActionId === q.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40"
                        title={q.hidden ? 'Unhide' : 'Hide'}
                      >
                        {q.hidden ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleReviewReject(q.id)}
                        disabled={reviewActionId === q.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        title="Reject"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {reviewResult.pages > 1 && (
                  <Pagination page={reviewResult.page} pages={reviewResult.pages} onPage={setReviewPage} />
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <CheckCircleIcon className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p>No pending questions — all caught up!</p>
              </div>
            )}
          </div>
        )}

        {/* ── Browse tab ── */}
        {mainTab === 'browse' && (
          <>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat.value
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto max-w-xs w-full">
            <SearchBar value={search} onChange={setSearch} placeholder="Search questions…" />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : result && result.data.length > 0 ? (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {result.total} question{result.total !== 1 ? 's' : ''}
              {activeCategory !== 'all' && (
                <span className="ml-1 text-brand-600 font-medium capitalize">
                  · {activeCategory}
                </span>
              )}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.data.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
            <Pagination page={result.page} pages={result.pages} onPage={setPage} />
          </>
        ) : (
          <div className="text-center py-16 text-slate-400">No questions found.</div>
        )}
          </>
        )}

        {/* Ask form */}
        <div id="ask" className="mt-16 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="section-label">Ask Us</p>
            <h2 className="section-title">Submit Your Question</h2>
            <p className="section-subtitle">
              No question is too hard or too simple. Our team reviews every submission.
              You can submit anonymously — no sign-in required.
            </p>
          </div>

          {submitted ? (
            <div className="card p-8 text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Question Received!</h3>
              <p className="text-slate-500 text-sm">
                Thank you for your question. We'll send a confirmation to your email
                and notify you when it's answered.
              </p>
              <button className="btn-secondary mt-6" onClick={() => setSubmitted(false)}>
                Ask Another Question
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input name="askerName" required className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input name="askerEmail" type="email" required className="input-field" placeholder="john@example.com" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select
                  name="category"
                  value={formCategory}
                  onChange={(e) => { setFormCategory(e.target.value as QuestionCategory); setFormSessionDate(''); }}
                  className="input-field"
                >
                  <option value="general">General — open apologetics question</option>
                  <option value="session">Session — related to a Saturday Session</option>
                  <option value="topic">Topic — specific theological topic</option>
                  <option value="theme">Theme — broader thematic question</option>
                </select>
              </div>

              {/* Topic / Theme dropdown */}
              {(formCategory === 'topic' || formCategory === 'theme') && topics.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 capitalize">
                    {formCategory === 'topic' ? 'Topic' : 'Theme'}
                  </label>
                  <select name="topicId" className="input-field">
                    <option value="">— Select a {formCategory} (optional)</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Session dropdown */}
              {formCategory === 'session' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Session Date
                  </label>
                  <select
                    name="topicId"
                    required
                    className="input-field"
                    value={formSessionDate}
                    onChange={(e) => setFormSessionDate(e.target.value)}
                  >
                    <option value="">— Select a session date</option>
                    {sessionOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Select the Saturday Session your question is for.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Question Title <span className="text-rose-500">*</span>
                </label>
                <input
                  name="title"
                  required
                  minLength={10}
                  className="input-field"
                  placeholder="e.g. How do we know the Bible is reliable?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  More Detail <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="body"
                  rows={5}
                  required
                  minLength={20}
                  className="input-field resize-none"
                  placeholder="Add context, background, or specific aspects you'd like addressed…"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input type="checkbox" name="anonymous" id="anon" className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                <label htmlFor="anon" className="text-sm text-slate-600">
                  Keep my name anonymous when published
                </label>
              </div>

              {formError && (
                <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-lg">{formError}</p>
              )}

              <button type="submit" disabled={submitting || (formCategory === 'session' && !formSessionDate)} className="btn-primary w-full justify-center">
                <PaperAirplaneIcon className="w-4 h-4" />
                {submitting ? 'Sending…' : 'Submit Question'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
