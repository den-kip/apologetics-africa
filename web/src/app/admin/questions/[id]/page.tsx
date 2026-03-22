'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon, CheckCircleIcon, LockClosedIcon, LockOpenIcon,
  TrashIcon, StarIcon, EyeSlashIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/auth';
import { api, type Question, type QuestionCategory, type Topic, type QuestionComment } from '@/lib/api';

// Session date helpers
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

  const past: Date[] = [];
  for (let offset = 0; offset <= 2 && past.length < 1; offset++) {
    let y = year, m = month - offset;
    if (m < 0) { m += 12; y--; }
    const sats = getSaturdaysInMonth(y, m);
    for (const idx of [3, 1]) {
      if (sats[idx] && sats[idx] < today) { past.push(sats[idx]); break; }
    }
  }

  const upcoming: Date[] = [];
  let y = year, m = month;
  while (upcoming.length < 2) {
    const sats = getSaturdaysInMonth(y, m);
    for (const idx of [1, 3]) {
      if (sats[idx] && sats[idx] >= today && upcoming.length < 2) upcoming.push(sats[idx]);
    }
    m++; if (m > 11) { m = 0; y++; }
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  for (const d of past)     options.push({ value: d.toISOString().split('T')[0], label: `Past — ${fmt(d)}` });
  for (const d of upcoming) options.push({ value: d.toISOString().split('T')[0], label: `Upcoming — ${fmt(d)}` });
  return options;
}

const CATEGORY_LABELS: Record<string, string> = {
  session: 'Session', topic: 'Topic', theme: 'Theme', general: 'General',
};

export default function AdminQuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [answerText, setAnswerText] = useState('');
  const [answerTags, setAnswerTags] = useState('');
  const [answerFeatured, setAnswerFeatured] = useState(false);
  const [answerCategory, setAnswerCategory] = useState<QuestionCategory>('general');
  const [answerTopicId, setAnswerTopicId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [topics, setTopics] = useState<Topic[]>([]);
  const sessionOptions = getSessionOptions();

  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [hidingCommentId, setHidingCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api.admin.questions
      .getById(id, token)
      .then((q) => {
        setQuestion(q);
        setAnswerText(q.answer ?? '');
        setAnswerTags(q.tags?.join(', ') ?? '');
        setAnswerFeatured(q.featured);
        setAnswerCategory(q.category ?? 'general');
        setAnswerTopicId(q.topicId ?? '');
      })
      .catch((err: any) => setFetchError(err.message || 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    api.questions.getCommentsAdmin(id, token).then(setComments).catch(() => setComments([]));
  }, [token, id]);

  // Fetch topics when category changes
  useEffect(() => {
    if (answerCategory === 'topic' || answerCategory === 'theme') {
      api.topics.list(answerCategory).then(setTopics).catch(() => setTopics([]));
    } else {
      setTopics([]);
    }
  }, [answerCategory]);

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !question) return;
    setSaving(true);
    setSaveError('');
    setSaved(false);
    const tags = answerTags.split(',').map((t) => t.trim()).filter(Boolean);
    try {
      const updated = await api.questions.answer(
        question.id,
        {
          answer: answerText,
          tags,
          featured: answerFeatured,
          category: answerCategory,
          topicId: answerTopicId || undefined,
        },
        token,
      );
      setQuestion(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  }

  async function handleLock() {
    if (!token || !question) return;
    try {
      const updated = await api.questions.lock(question.id, !question.locked, token);
      setQuestion(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  }

  async function handleHide() {
    if (!token || !question) return;
    try {
      const updated = await api.questions.hide(question.id, !question.hidden, token);
      setQuestion(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  }

  async function handleHideComment(comment: QuestionComment) {
    if (!token) return;
    setHidingCommentId(comment.id);
    try {
      const updated = await api.questions.hideComment(question!.id, comment.id, !comment.hidden, token);
      setComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, hidden: updated.hidden } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setHidingCommentId(null);
    }
  }

  async function handleDelete() {
    if (!token || !question) return;
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await api.questions.remove(question.id, token);
      router.push('/admin/questions');
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError || !question) {
    return (
      <div>
        <p className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm">
          {fetchError || 'Question not found.'}
        </p>
        <Link href="/admin/questions" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Back to Questions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link
          href="/admin/questions"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors mt-0.5 shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              question.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
              question.status === 'answered' ? 'bg-green-100 text-green-700' :
                                               'bg-rose-100  text-rose-700'
            }`}>
              {question.status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {CATEGORY_LABELS[question.category] ?? question.category}
            </span>
            {question.topic && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {question.topic.name}
              </span>
            )}
            {question.locked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                <LockClosedIcon className="w-3 h-3" /> Locked
              </span>
            )}
            {question.hidden && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <EyeSlashIcon className="w-3 h-3" /> Hidden from public
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {question.anonymous ? 'Anonymous' : question.askerName} ·{' '}
            {new Date(question.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleLock}
            title={question.locked ? 'Unlock' : 'Lock'}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {question.locked ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleHide}
            title={question.hidden ? 'Unhide' : 'Hide from public'}
            className={`p-2 rounded-lg transition-colors ${question.hidden ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            {question.hidden ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDelete}
            title="Delete question"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question body */}
      <div className="card p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Question</p>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{question.body}</p>
      </div>

      {/* Answer form */}
      <form onSubmit={handleAnswer} className="card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {question.status === 'answered' ? 'Edit Answer' : 'Write Answer'}
        </p>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <select
            value={answerCategory}
            onChange={(e) => { setAnswerCategory(e.target.value as QuestionCategory); setAnswerTopicId(''); }}
            className="input-field"
          >
            <option value="general">General</option>
            <option value="session">Session</option>
            <option value="topic">Topic</option>
            <option value="theme">Theme</option>
          </select>
        </div>

        {/* Topic / Theme dropdown */}
        {(answerCategory === 'topic' || answerCategory === 'theme') && topics.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 capitalize">
              {answerCategory === 'topic' ? 'Topic' : 'Theme'}
            </label>
            <select
              value={answerTopicId}
              onChange={(e) => setAnswerTopicId(e.target.value)}
              className="input-field"
            >
              <option value="">— None</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Session dropdown */}
        {answerCategory === 'session' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Date</label>
            <select
              value={answerTopicId}
              onChange={(e) => setAnswerTopicId(e.target.value)}
              className="input-field"
            >
              <option value="">— None</option>
              {sessionOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Answer <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={10}
            required
            className="input-field resize-y font-mono text-sm"
            placeholder="Write a thorough answer here…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
          <input
            type="text"
            value={answerTags}
            onChange={(e) => setAnswerTags(e.target.value)}
            className="input-field"
            placeholder="e.g. epistemology, scripture, history"
          />
          <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={answerFeatured}
            onChange={(e) => setAnswerFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-600"
          />
          <span className="text-sm text-slate-700 flex items-center gap-1">
            {answerFeatured
              ? <StarSolid className="w-4 h-4 text-amber-400" />
              : <StarIcon className="w-4 h-4 text-slate-400" />}
            Feature this question on the home page
          </span>
        </label>

        {saveError && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            {saveError}
          </p>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircleIcon className="w-4 h-4 shrink-0" />
            Answer saved and question published.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : question.status === 'answered' ? 'Update Answer' : 'Publish Answer'}
          </button>
          <Link href="/admin/questions" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="mt-6 card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Comments ({comments.length})
          </p>
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  c.hidden
                    ? 'border-amber-200 bg-amber-50/50 opacity-70'
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700">
                      {c.author?.alias ?? c.author?.name ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {c.hidden && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5">
                        <EyeSlashIcon className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                </div>
                <button
                  onClick={() => handleHideComment(c)}
                  disabled={hidingCommentId === c.id}
                  title={c.hidden ? 'Unhide comment' : 'Hide comment'}
                  className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors disabled:opacity-50"
                >
                  {c.hidden
                    ? <EyeIcon className="w-3.5 h-3.5" />
                    : <EyeSlashIcon className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
