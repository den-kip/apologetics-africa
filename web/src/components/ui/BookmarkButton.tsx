'use client';

import { useState, useEffect } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { api, type BookmarkType } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { clsx } from 'clsx';

interface Props {
  type: BookmarkType;
  targetId: string;
  className?: string;
}

export function BookmarkButton({ type, targetId, className }: Props) {
  const { token } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.bookmarks.check(type, targetId, token)
      .then((r) => setBookmarked(r.bookmarked))
      .catch(() => {});
  }, [token, type, targetId]);

  if (!token) return null;

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.bookmarks.toggle(type, targetId, token!);
      setBookmarked(result.bookmarked);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      className={clsx(
        'inline-flex items-center justify-center rounded-full p-1.5 transition-colors',
        bookmarked
          ? 'text-brand-600 hover:text-brand-700'
          : 'text-slate-400 hover:text-slate-600',
        loading && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {bookmarked
        ? <BookmarkSolidIcon className="w-4 h-4" />
        : <BookmarkIcon className="w-4 h-4" />}
    </button>
  );
}
