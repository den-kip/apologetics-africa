'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircleIcon, ArrowLeftIcon, EyeIcon, TagIcon,
  LockClosedIcon, LockOpenIcon, ChatBubbleLeftIcon,
  TrashIcon, PencilSquareIcon, UserCircleIcon,
  ShieldCheckIcon, NoSymbolIcon, EyeSlashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { api, type Question, type QuestionComment } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LoginModal } from '@/components/ui/LoginModal';

const REACTION_EMOJIS = ['👍', '❤️', '🙏', '💡'];

export default function QuestionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';

  const [question, setQuestion] = useState<Question | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Track which emoji+comment pairs the current user has reacted to (optimistic)
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());

  // Admin state
  const [answerMode, setAnswerMode] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerTags, setAnswerTags] = useState('');
  const [answerFeatured, setAnswerFeatured] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    api.questions.get(slug)
      .then((q) => {
        setQuestion(q);
        setAnswerText(q.answer ?? '');
        setAnswerTags(q.tags?.join(', ') ?? '');
        setAnswerFeatured(q.featured);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!question) return;
    setLoadingComments(true);
    const fetchComments = isAdmin && token
      ? api.questions.getCommentsAdmin(question.id, token)
      : api.questions.getComments(question.id);
    fetchComments
      .then((cs) => {
        setComments(cs);
        // Seed myReactions from server data if user is logged in
        if (user) {
          const mine = new Set<string>();
          for (const c of cs) {
            for (const r of (c.reactions ?? [])) {
              if (r.userIds.includes(user.id)) mine.add(`${c.id}:${r.emoji}`);
            }
          }
          setMyReactions(mine);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [question?.id, user?.id, isAdmin, token]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !question) return;
    setSubmittingComment(true);
    try {
      const c = await api.questions.addComment(question.id, commentBody, token);
      setComments((prev) => [...prev, { ...c, reactions: [] }]);
      setCommentBody('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!token || !question || !confirm('Delete this comment?')) return;
    await api.questions.deleteComment(question.id, commentId, token);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  async function handleReaction(commentId: string, emoji: string) {
    if (!token || !question) { setLoginOpen(true); return; }
    const key = `${commentId}:${emoji}`;
    const wasReacted = myReactions.has(key);

    // Optimistic update
    setMyReactions((prev) => {
      const next = new Set(prev);
      wasReacted ? next.delete(key) : next.add(key);
      return next;
    });
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const reactions = [...(c.reactions ?? [])];
        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (wasReacted) {
          if (idx !== -1) {
            const updated = { ...reactions[idx], count: reactions[idx].count - 1, userIds: reactions[idx].userIds.filter((id) => id !== user!.id) };
            if (updated.count <= 0) reactions.splice(idx, 1);
            else reactions[idx] = updated;
          }
        } else {
          if (idx !== -1) {
            reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, userIds: [...reactions[idx].userIds, user!.id] };
          } else {
            reactions.push({ emoji, count: 1, userIds: [user!.id] });
          }
        }
        return { ...c, reactions };
      }),
    );

    try {
      await api.questions.toggleReaction(question.id, commentId, emoji, token);
    } catch {
      // Revert on failure
      setMyReactions((prev) => {
        const next = new Set(prev);
        wasReacted ? next.add(key) : next.delete(key);
        return next;
      });
    }
  }

  async function handleSaveAnswer() {
    if (!token || !question) return;
    setSavingAnswer(true);
    setAdminMsg('');
    try {
      const updated = await api.questions.answer(question.id, {
        answer: answerText,
        tags: answerTags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: answerFeatured,
      }, token);
      setQuestion(updated);
      setAnswerMode(false);
      setAdminMsg('Answer saved.');
    } catch (err: any) {
      setAdminMsg(err.message);
    } finally {
      setSavingAnswer(false);
    }
  }

  async function handleReject() {
    if (!token || !question || !confirm('Reject this question? It will be marked as rejected.')) return;
    const updated = await api.questions.reject(question.id, token);
    setQuestion(updated);
  }

  async function handleHide(hidden: boolean) {
    if (!token || !question) return;
    const updated = await api.questions.hide(question.id, hidden, token);
    setQuestion(updated);
  }

  async function handleHideComment(commentId: string, hidden: boolean) {
    if (!token || !question) return;
    const updated = await api.questions.hideComment(question.id, commentId, hidden, token);
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, hidden: updated.hidden } : c));
  }

  async function handleLock(locked: boolean) {
    if (!token || !question) return;
    const updated = await api.questions.lock(question.id, locked, token);
    setQuestion(updated);
  }

  async function handleContributions(allow: boolean) {
    if (!token || !question) return;
    const updated = await api.questions.toggleContributions(question.id, allow, token);
    setQuestion(updated);
  }

  async function handleDelete() {
    if (!token || !question || !confirm('Permanently delete this question?')) return;
    await api.questions.remove(question.id, token);
    window.location.href = '/questions';
  }

  if (notFound) {
    return (
      <div className="container-xl py-24 text-center text-slate-400">
        Question not found.{' '}
        <Link href="/questions" className="text-brand-600 hover:underline">Back to Questions</Link>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container-xl py-24">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 bg-slate-100 rounded animate-pulse w-3/4" />
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const canComment = token && !question.locked;

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="container-xl py-12 max-w-3xl">
          <Link href="/questions" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Questions
          </Link>

          {/* Admin bar */}
          {isAdmin && (
            <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4" />
                Admin Controls
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAnswerMode(!answerMode)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  {question.answer ? 'Edit Answer' : 'Answer'}
                </button>
                <button
                  onClick={() => handleContributions(!question.allowContributions)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                  {question.allowContributions ? 'Close Contributions' : 'Open Contributions'}
                </button>
                <button
                  onClick={() => handleLock(!question.locked)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {question.locked ? <LockOpenIcon className="w-3.5 h-3.5" /> : <LockClosedIcon className="w-3.5 h-3.5" />}
                  {question.locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  onClick={() => handleHide(!question.hidden)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {question.hidden ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                  {question.hidden ? 'Unhide' : 'Hide'}
                </button>
                {question.status !== 'rejected' && (
                  <button
                    onClick={handleReject}
                    className="btn-secondary text-xs text-amber-600 border-amber-200 hover:bg-amber-50 flex items-center gap-1.5"
                  >
                    <XCircleIcon className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="btn-secondary text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1.5"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
              {adminMsg && <p className="text-xs text-brand-700 mt-2">{adminMsg}</p>}
            </div>
          )}

          <article>
            {/* Status badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {question.status === 'answered' ? (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Answered
                </span>
              ) : question.status === 'rejected' ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <XCircleIcon className="w-3.5 h-3.5" /> Rejected
                </span>
              ) : (
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Pending
                </span>
              )}
              {question.locked && (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <LockClosedIcon className="w-3 h-3" /> Locked
                </span>
              )}
              {isAdmin && question.hidden && (
                <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <EyeSlashIcon className="w-3 h-3" /> Hidden
                </span>
              )}
              {question.viewCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                  <EyeIcon className="w-3.5 h-3.5" />
                  {question.viewCount.toLocaleString()} views
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">{question.title}</h1>

            {question.body && question.body.trim().length > 1 && (
              <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Full Question</p>
                <p className="text-slate-700 leading-relaxed">{question.body}</p>
                {!question.anonymous && (
                  <p className="text-xs text-slate-400 mt-3">— {question.askerName}</p>
                )}
              </div>
            )}

            {/* Admin answer editor */}
            {isAdmin && answerMode && (
              <div className="mb-8 border border-brand-200 rounded-xl p-6 bg-brand-50/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3">Write Answer</p>
                <textarea
                  rows={8}
                  className="input-field resize-y mb-3"
                  placeholder="Write a thorough, rigorous answer…"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tags (comma-separated)</label>
                    <input
                      className="input-field text-sm"
                      placeholder="e.g. resurrection, evidence"
                      value={answerTags}
                      onChange={(e) => setAnswerTags(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        checked={answerFeatured}
                        onChange={(e) => setAnswerFeatured(e.target.checked)}
                      />
                      Feature this question
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveAnswer} disabled={savingAnswer} className="btn-primary text-sm">
                    {savingAnswer ? 'Saving…' : 'Save Answer'}
                  </button>
                  <button onClick={() => setAnswerMode(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Official Answer */}
            {question.answer && (
              <div className="border-l-4 border-brand-500 pl-6 mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">Answer</p>
                <div className="prose text-slate-700 leading-relaxed space-y-3">
                  {question.answer.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {question.answeredBy && (
                  <p className="text-sm text-slate-500 mt-4">
                    — {question.answeredBy.name}
                    {question.answeredAt && (
                      <span className="ml-1 text-slate-400">
                        ·{' '}{new Date(question.answeredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-2 mb-8">
                <TagIcon className="w-4 h-4 text-slate-400" />
                {question.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/questions?search=${encodeURIComponent(tag)}`}
                    className="badge bg-slate-50 text-slate-600 border border-slate-100 hover:border-brand-200 hover:text-brand-600 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </article>

          {/* Comments section */}
          <div className="mt-10 border-t border-slate-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5 text-slate-400" />
                Discussion
                {comments.length > 0 && (
                  <span className="text-sm font-normal text-slate-400">({comments.length})</span>
                )}
              </h2>
              {question.locked && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <NoSymbolIcon className="w-3.5 h-3.5" /> Locked
                </span>
              )}
            </div>

            {/* Comments list */}
            {loadingComments ? (
              <div className="space-y-3 mb-6">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 mb-8">
                {comments.map((c) => {
                  const reactions = c.reactions ?? [];
                  return (
                    <div key={c.id} className={`flex gap-3 group ${c.hidden ? 'opacity-50' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCircleIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`rounded-xl p-4 border ${c.hidden ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                              {c.author?.username || c.author?.name || 'Anonymous'}
                              {c.hidden && (
                                <span className="text-xs font-normal text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">hidden</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleHideComment(c.id, !c.hidden)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 transition-opacity"
                                    title={c.hidden ? 'Unhide comment' : 'Hide comment'}
                                  >
                                    {c.hidden ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity"
                                    title="Delete comment"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
                        </div>

                        {/* Reactions */}
                        <div className="flex items-center gap-1.5 mt-1.5 pl-1 flex-wrap">
                          {/* Existing reaction counts */}
                          {REACTION_EMOJIS.map((emoji) => {
                            const r = reactions.find((x) => x.emoji === emoji);
                            const count = r?.count ?? 0;
                            const reacted = myReactions.has(`${c.id}:${emoji}`);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(c.id, emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                                  reacted
                                    ? 'bg-brand-50 border-brand-200 text-brand-700 font-medium'
                                    : count > 0
                                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700'
                                    : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-500'
                                }`}
                                title={token ? undefined : 'Sign in to react'}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span>{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-6">
                {question.locked ? 'This question is locked.' : 'No comments yet — be the first.'}
              </p>
            )}

            {/* Add comment */}
            {!question.locked && (
              !token ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-500 mb-3">Sign in to join the discussion.</p>
                  <button onClick={() => setLoginOpen(true)} className="btn-secondary text-sm">
                    Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleComment} className="space-y-3">
                  <textarea
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Share your thoughts or a related perspective…"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    required
                    minLength={5}
                  />
                  <button type="submit" disabled={submittingComment} className="btn-primary text-sm">
                    {submittingComment ? 'Posting…' : 'Post Comment'}
                  </button>
                </form>
              )
            )}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-8 border border-brand-100">
            <h3 className="font-semibold text-slate-900 mb-2">Have a related question?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Our apologetics team reviews every question and responds personally.
            </p>
            <Link href="/questions#ask" className="btn-primary text-sm">
              Ask Your Question
            </Link>
          </div>
        </div>
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        reason="Sign in to join the discussion"
      />
    </>
  );
}
