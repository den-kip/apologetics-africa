'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, type Bookmark, type BookmarkType, type BlogPost, type Resource, type Question } from '@/lib/api';
import { PostCard } from '@/components/ui/PostCard';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { QuestionCard } from '@/components/ui/QuestionCard';

const TABS: { label: string; value: BookmarkType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Articles', value: 'blog' },
  { label: 'Resources', value: 'resource' },
  { label: 'Questions', value: 'question' },
];

export default function BookmarksPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tab, setTab] = useState<BookmarkType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.bookmarks.list(token, tab === 'all' ? undefined : tab);
      setBookmarks(data);
    } catch {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <BookmarkIcon className="w-12 h-12 text-slate-300" />
        <h1 className="text-xl font-semibold text-slate-700">Sign in to view your bookmarks</h1>
        <Link href="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  const visible = tab === 'all' ? bookmarks : bookmarks.filter((b) => b.type === tab);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookmarkIcon className="w-6 h-6 text-brand-600" />
            My Bookmarks
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Articles, resources and questions you've saved for later.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.value
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <BookmarkIcon className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm">No bookmarks yet in this category.</p>
            <p className="text-slate-400 text-xs">
              Click the bookmark icon on any article, resource, or question to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((b) => (
              <div key={b.id}>
                {b.type === 'blog' && (
                  <PostCard post={b.content as BlogPost} />
                )}
                {b.type === 'resource' && (
                  <ResourceCard resource={b.content as Resource} />
                )}
                {b.type === 'question' && (
                  <QuestionCard question={b.content as Question} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
