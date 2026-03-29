'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { PostCard } from '@/components/ui/PostCard';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { Pagination } from '@/components/ui/Pagination';
import { api, type BlogPost, type Resource, type PaginatedResponse } from '@/lib/api';
import { clsx } from 'clsx';

const TAGS = ['Africa', 'Truth', 'Church', 'Postmodernism', 'Suffering'];

type Tab = 'blog' | 'articles';

export default function BlogPage() {
  const [tab, setTab] = useState<Tab>('blog');

  // ── Blog posts state ──────────────────────────────────────────────────────
  const [blogResult, setBlogResult] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogPage, setBlogPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  // ── Articles (resource type=article) state ────────────────────────────────
  const [articleResult, setArticleResult] = useState<PaginatedResponse<Resource> | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [articlePage, setArticlePage] = useState(1);
  const [articleSearch, setArticleSearch] = useState('');

  // ── Fetch blog posts ──────────────────────────────────────────────────────
  const fetchBlog = useCallback(async () => {
    setBlogLoading(true);
    try {
      const params: Record<string, string | number> = { page: blogPage, limit: 9 };
      if (search) params.search = search;
      if (tag) params.tag = tag;
      setBlogResult(await api.blog.list(params));
    } catch (e) {
      console.error(e);
    } finally {
      setBlogLoading(false);
    }
  }, [blogPage, search, tag]);

  // ── Fetch articles ────────────────────────────────────────────────────────
  const fetchArticles = useCallback(async () => {
    setArticleLoading(true);
    try {
      const params: Record<string, string | number> = { page: articlePage, limit: 9, type: 'article' };
      if (articleSearch) params.search = articleSearch;
      setArticleResult(await api.resources.list(params));
    } catch (e) {
      console.error(e);
    } finally {
      setArticleLoading(false);
    }
  }, [articlePage, articleSearch]);

  useEffect(() => {
    const t = setTimeout(fetchBlog, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchBlog]);

  useEffect(() => {
    const t = setTimeout(fetchArticles, articleSearch ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchArticles]);

  useEffect(() => { setBlogPage(1); }, [search, tag]);
  useEffect(() => { setArticlePage(1); }, [articleSearch]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="container-xl py-14">
          <p className="section-label">Blog</p>
          <h1 className="section-title">Apologetics Writing</h1>
          <p className="section-subtitle max-w-2xl">
            Thoughtful commentary, deep dives, and accessible explanations of the
            greatest questions facing African Christianity.
          </p>
        </div>
      </div>

      <div className="container-xl py-10">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 mb-8">
          {([
            { id: 'blog',     label: 'Blog Posts' },
            { id: 'articles', label: 'Articles'   },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={clsx(
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Blog Posts tab ──────────────────────────────────────────────── */}
        {tab === 'blog' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 max-w-sm">
                <SearchBar value={search} onChange={setSearch} placeholder="Search posts…" />
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

            {blogLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : blogResult && blogResult.data.length > 0 ? (
              <>
                <p className="text-sm text-slate-500 mb-6">
                  {blogResult.total} post{blogResult.total !== 1 ? 's' : ''}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogResult.data.map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} />
                  ))}
                </div>
                <Pagination page={blogResult.page} pages={blogResult.pages} onPage={setBlogPage} />
              </>
            ) : (
              <div className="text-center py-24 text-slate-400">No posts found.</div>
            )}
          </>
        )}

        {/* ── Articles tab ────────────────────────────────────────────────── */}
        {tab === 'articles' && (
          <>
            <div className="mb-8 max-w-sm">
              <SearchBar value={articleSearch} onChange={setArticleSearch} placeholder="Search articles…" />
            </div>

            {articleLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : articleResult && articleResult.data.length > 0 ? (
              <>
                <p className="text-sm text-slate-500 mb-6">
                  {articleResult.total} article{articleResult.total !== 1 ? 's' : ''}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articleResult.data.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
                <Pagination page={articleResult.page} pages={articleResult.pages} onPage={setArticlePage} />
              </>
            ) : (
              <div className="text-center py-24 text-slate-400">No articles found.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
