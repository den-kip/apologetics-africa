'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { ChatMessageData, LiveSession } from '@/lib/api';
import {
  PaperAirplaneIcon, XMarkIcon, FaceSmileIcon,
  BookmarkIcon, TrashIcon, ArrowUturnLeftIcon, SignalIcon,
  LockClosedIcon, UsersIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

const BASE_WS = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const QUICK_EMOJIS = ['👍', '❤️', '🙏', '🔥', '👏', '😂', '🤔', '✝️'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600',
  'bg-rose-600',   'bg-cyan-600', 'bg-indigo-600',  'bg-teal-600',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function needsDateSeparator(prev: ChatMessageData | undefined, curr: ChatMessageData) {
  if (!prev) return true;
  return new Date(prev.createdAt).toDateString() !== new Date(curr.createdAt).toDateString();
}

function isGrouped(prev: ChatMessageData | undefined, curr: ChatMessageData) {
  if (!prev) return false;
  if (prev.userId !== curr.userId) return false;
  return new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { params: { id: string } }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveChatPage({ params }: Props) {
  const { id } = params;
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState('');
  const [emojiTarget, setEmojiTarget] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';

  // Unique participants
  const participants = useMemo(() => {
    const seen = new Map<string, string>();
    messages.forEach((m) => { if (m.userId && !seen.has(m.userId)) seen.set(m.userId, m.authorName); });
    return seen.size;
  }, [messages]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    setNewMsgCount(0);
  }, []);

  useEffect(() => {
    if (atBottom) scrollToBottom(false);
    else setNewMsgCount((n) => n + 1);
  }, [messages.length]);

  // Socket
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { router.push(`/login?redirect=/live/${id}`); return; }

    const socket = io(`${BASE_WS}/chat`, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('session:join', id, (res: any) => {
        setJoining(false);
        if (res?.error) { setError(res.error); return; }
        setSession(res.session);
        setMessages(res.messages || []);
        setTimeout(() => scrollToBottom(false), 50);
      });
    });

    socket.on('connect_error', () => { setJoining(false); setError('Could not connect to the session.'); });

    socket.on('message:new', (msg: ChatMessageData) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('message:reaction', (data: any) => {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== data.messageId) return m;
        const reactions = { ...m.reactions };
        if (data.count === 0) delete reactions[data.emoji];
        else reactions[data.emoji] = { count: data.count, userIds: data.userIds };
        return { ...m, reactions };
      }));
    });

    socket.on('message:pinned', (data: any) => {
      setMessages((prev) => prev.map((m) => m.id === data.messageId ? { ...m, pinned: data.pinned } : m));
    });

    socket.on('message:deleted', (data: any) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on('session:update', (data: any) => {
      setSession((s) => s ? { ...s, status: data.status } : s);
    });

    return () => { socket.disconnect(); };
  }, [authLoading, user, token, id, router]);

  const sendMessage = useCallback(() => {
    const body = input.trim();
    if (!body || !socketRef.current) return;
    socketRef.current.emit('message:send', { sessionId: id, body, replyToId: replyTo?.id });
    setInput('');
    setReplyTo(null);
    setTimeout(() => scrollToBottom(), 100);
  }, [input, id, replyTo, scrollToBottom]);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    socketRef.current?.emit('message:react', { sessionId: id, messageId, emoji });
    setEmojiTarget(null);
  }, [id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const pinnedMsg = messages.filter((m) => m.pinned).at(-1);
  const sessionEnded = session?.status === 'ended';
  const isLive = connected && session?.status === 'live';

  // ── Loading ──
  if (authLoading || joining) {
    return (
      <div className="bg-[#0f1117] flex items-center justify-center" style={{ height: 'calc(100dvh - 64px)' }}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-brand-700/30" />
            <div className="absolute inset-0 rounded-full border-2 border-t-brand-500 animate-spin" />
            <SignalIcon className="absolute inset-0 m-auto w-6 h-6 text-brand-400" />
          </div>
          <p className="text-slate-400 text-sm">Joining session…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-[#0f1117] flex items-center justify-center p-6" style={{ height: 'calc(100dvh - 64px)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <LockClosedIcon className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Unable to join</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link href="/live" className="btn-primary">← Back to Sessions</Link>
        </div>
      </div>
    );
  }

  // ── Chat UI ──
  return (
    <div className="flex flex-col bg-[#0f1117] overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }} onClick={() => setEmojiTarget(null)}>

      {/* ── Top bar ── */}
      <header className="shrink-0 bg-[#161b27] border-b border-white/[0.06] px-4 py-0 flex items-center h-14">
        {/* Left: logo + session name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">AA</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {session?.title ?? 'Live Session'}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {isLive ? 'Session in progress' : sessionEnded ? 'Session ended' : 'Connecting…'}
            </p>
          </div>
        </div>

        {/* Center: status */}
        <div className="hidden sm:flex items-center gap-4 px-6">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
          {sessionEnded && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Archived
            </span>
          )}
          {participants > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <UsersIcon className="w-3.5 h-3.5" />
              {participants} participant{participants !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Right: exit */}
        <Link
          href="/live"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Leave session"
        >
          <XMarkIcon className="w-4 h-4" />
        </Link>
      </header>

      {/* ── Pinned message ── */}
      {pinnedMsg && (
        <div className="shrink-0 bg-amber-500/[0.08] border-b border-amber-500/20 px-4 py-2 flex items-center gap-2.5">
          <BookmarkSolidIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-amber-300 shrink-0">Pinned</span>
            <span className="text-xs text-slate-400 truncate">
              <span className="text-slate-300 font-medium">{pinnedMsg.authorName}: </span>
              {pinnedMsg.body}
            </span>
          </div>
        </div>
      )}

      {/* ── Session ended notice ── */}
      {sessionEnded && (
        <div className="shrink-0 bg-slate-800/50 border-b border-white/[0.04] px-4 py-2 text-center">
          <p className="text-xs text-slate-500">This session has ended — chat is archived and read-only</p>
        </div>
      )}

      {/* ── Message list ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
              <SignalIcon className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No messages yet — say something!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-0.5">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const grouped = isGrouped(prev, msg);
              const showSep = needsDateSeparator(prev, msg);
              return (
                <div key={msg.id}>
                  {showSep && (
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <span className="text-[11px] font-medium text-slate-600 px-2">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>
                  )}
                  <MessageRow
                    msg={msg}
                    grouped={grouped && !showSep}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    emojiTarget={emojiTarget}
                    onEmojiToggle={(mid) => setEmojiTarget((v) => v === mid ? null : mid)}
                    onReact={sendReaction}
                    onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                    onPin={(mid, p) => socketRef.current?.emit('message:pin', { sessionId: id, messageId: mid, pinned: p })}
                    onDelete={(mid) => { if (confirm('Delete this message?')) socketRef.current?.emit('message:delete', { sessionId: id, messageId: mid }); }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Scroll-to-bottom pill ── */}
      {!atBottom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => scrollToBottom()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-full shadow-lg transition-colors"
          >
            {newMsgCount > 0 ? `${newMsgCount} new message${newMsgCount > 1 ? 's' : ''}` : 'Scroll to bottom'}
            <ChevronDownIcon className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Input area ── */}
      {!sessionEnded && (
        <div className="shrink-0 bg-[#161b27] border-t border-white/[0.06] px-4 pt-3 pb-4">
          <div className="max-w-3xl mx-auto">
            {/* Reply preview */}
            {replyTo && (
              <div className="mb-2 flex items-start gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2">
                <div className="w-0.5 h-full bg-brand-500 rounded-full self-stretch shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-400 mb-0.5">{replyTo.authorName}</p>
                  <p className="text-xs text-slate-400 truncate">{replyTo.body}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 focus-within:border-brand-500/40 focus-within:bg-white/[0.06] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message the session…"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none leading-relaxed py-1 min-h-[24px]"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEmojiTarget((v) => v === 'input' ? null : 'input'); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
                  title="Emoji"
                >
                  <FaceSmileIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-30 flex items-center justify-center transition-colors"
                  title="Send (Enter)"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Inline emoji picker for input */}
            {emojiTarget === 'input' && (
              <div
                className="mt-2 flex gap-1 bg-[#1e2535] border border-white/[0.08] rounded-xl p-2 shadow-xl w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { setInput((v) => v + e); setEmojiTarget(null); inputRef.current?.focus(); }}
                    className="w-9 h-9 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-xl transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-1.5 text-[11px] text-slate-700 text-right">
              As <span className="text-slate-600">{user?.username || user?.name}</span>
              {' · '}Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({
  msg, grouped, currentUserId, isAdmin, emojiTarget,
  onEmojiToggle, onReact, onReply, onPin, onDelete,
}: {
  msg: ChatMessageData;
  grouped: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  emojiTarget: string | null;
  onEmojiToggle: (id: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: ChatMessageData) => void;
  onPin: (msgId: string, pinned: boolean) => void;
  onDelete: (msgId: string) => void;
}) {
  const isOwn = msg.userId === currentUserId;
  const color = avatarColor(msg.authorName);

  return (
    <div
      className={clsx(
        'group relative flex items-end gap-2.5 px-2 py-0.5 rounded-lg transition-colors',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        !isOwn && 'hover:bg-white/[0.025]',
        msg.pinned && 'bg-amber-500/[0.04] hover:bg-amber-500/[0.06]',
      )}
    >
      {/* Avatar / spacer */}
      <div className="w-8 shrink-0 flex flex-col justify-end">
        {!grouped ? (
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none shrink-0',
            isOwn ? 'bg-brand-600' : color,
          )}>
            {msg.authorName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      {/* Content */}
      <div className={clsx(
        'flex flex-col gap-0.5 max-w-[72%] sm:max-w-[60%]',
        isOwn ? 'items-end' : 'items-start',
      )}>
        {/* Name + timestamp (only for first in group) */}
        {!grouped && (
          <div className={clsx(
            'flex items-baseline gap-1.5 px-1',
            isOwn ? 'flex-row-reverse' : 'flex-row',
          )}>
            <span className={clsx(
              'text-xs font-semibold leading-none',
              isOwn ? 'text-brand-300' : 'text-slate-300',
            )}>
              {isOwn ? 'You' : msg.authorName}
            </span>
            <span className="text-[11px] text-slate-600">{formatTime(msg.createdAt)}</span>
            {msg.pinned && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                <BookmarkSolidIcon className="w-2.5 h-2.5" />
                Pinned
              </span>
            )}
          </div>
        )}

        {/* Reply context */}
        {msg.replyTo && (
          <div className={clsx(
            'text-[11px] px-2.5 py-1.5 rounded-lg mb-0.5 max-w-full',
            isOwn
              ? 'bg-brand-900/40 border border-brand-700/30 text-right'
              : 'bg-white/[0.04] border border-white/[0.06]',
          )}>
            <span className="font-semibold text-slate-400 mr-1">{msg.replyTo.authorName}:</span>
            <span className="text-slate-600 line-clamp-1">{msg.replyTo.body}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={clsx(
          'px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isOwn
            ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm'
            : 'bg-[#1e2535] text-slate-200 rounded-2xl rounded-bl-sm',
          msg.pinned && 'ring-1 ring-amber-400/30',
        )}>
          {msg.body}
        </div>

        {/* Reactions */}
        {Object.keys(msg.reactions).length > 0 && (
          <div className={clsx('flex flex-wrap gap-1 mt-0.5', isOwn ? 'justify-end' : 'justify-start')}>
            {Object.entries(msg.reactions).map(([emoji, { count, userIds }]) => (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji); }}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border',
                  userIds.includes(currentUserId ?? '')
                    ? 'bg-brand-600/20 border-brand-500/50 text-brand-200'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08]',
                )}
              >
                {emoji} <span className="tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover timestamp for grouped messages */}
      {grouped && (
        <span className={clsx(
          'text-[10px] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center',
          isOwn ? 'order-first' : '',
        )}>
          {formatTime(msg.createdAt)}
        </span>
      )}

      {/* Action toolbar — appears on hover, flips side for own messages */}
      <div
        className={clsx(
          'absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5',
          'bg-[#1e2535] border border-white/[0.08] rounded-lg shadow-xl p-0.5 z-10',
          isOwn ? 'left-2' : 'right-2',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji */}
        <div className="relative">
          <ActionBtn title="React" onClick={() => onEmojiToggle(msg.id)}>
            <FaceSmileIcon className="w-3.5 h-3.5" />
          </ActionBtn>
          {emojiTarget === msg.id && (
            <div className={clsx(
              'absolute bottom-full mb-1 flex gap-0.5 bg-[#1e2535] border border-white/[0.08] rounded-xl p-1.5 shadow-2xl z-20',
              isOwn ? 'left-0' : 'right-0',
            )}>
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => onReact(msg.id, e)}
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-base transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply */}
        <ActionBtn title="Reply" onClick={() => onReply(msg)}>
          <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
        </ActionBtn>

        {/* Admin actions */}
        {isAdmin && (
          <>
            <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
            <ActionBtn
              title={msg.pinned ? 'Unpin' : 'Pin'}
              onClick={() => onPin(msg.id, !msg.pinned)}
              active={msg.pinned}
              activeClass="text-amber-400"
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
            </ActionBtn>
            <ActionBtn title="Delete" onClick={() => onDelete(msg.id)} danger>
              <TrashIcon className="w-3.5 h-3.5" />
            </ActionBtn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  children, title, onClick, active, activeClass, danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={clsx(
        'w-7 h-7 rounded-md flex items-center justify-center text-sm transition-colors',
        danger
          ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
          : active
          ? (activeClass ?? 'text-brand-400') + ' hover:bg-white/[0.06]'
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]',
      )}
    >
      {children}
    </button>
  );
}
