'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { PostCard } from '@/components/ui/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { api, type BlogPost, type PaginatedResponse } from '@/lib/api';
import { clsx } from 'clsx';

export default function BlogPage() {
  const [result, setResult] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  const TAGS = ['Africa', 'Truth', 'Church', 'Postmodernism', 'Suffering'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (search) params.search = search;
      if (tag) params.tag = tag;
      const data = await api.blog.list(params);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, tag]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  useEffect(() => { setPage(1); }, [search, tag]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="container-xl py-14">
          <p className="section-label">Blog</p>
          <h1 className="section-title">Apologetics Articles</h1>
          <p className="section-subtitle max-w-2xl">
            Thoughtful commentary, deep dives, and accessible explanations of the
            greatest questions facing African Christianity.
          </p>
        </div>
      </div>

      <div className="container-xl py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder="Search articles…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTag('')}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                !tag
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300',
              )}
            >
              All
            </button>
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t === tag ? '' : t)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  tag === t
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : result && result.data.length > 0 ? (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {result.total} article{result.total !== 1 ? 's' : ''}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.data.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
            <Pagination page={result.page} pages={result.pages} onPage={setPage} />
          </>
        ) : (
          <div className="text-center py-24 text-slate-400">No articles found.</div>
        )}
      </div>
    </div>
  );
}
