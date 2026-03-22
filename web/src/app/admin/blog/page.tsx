'use client';

import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, BlogPost, PaginatedResponse } from '@/lib/api';

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
    )}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

export default function AdminBlogPage() {
  const { token } = useAuth();
  const [data, setData] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 15 };
    if (search) params.search = search;
    api.admin.blog.list(params, token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  async function handleTogglePublished(post: BlogPost) {
    if (!token) return;
    setTogglingId(post.id);
    try {
      await api.admin.blog.update(post.id, { published: !post.published }, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.admin.blog.remove(id, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data ? `${data.total} total` : 'Loading…'}
          </p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary text-sm px-4 py-2">
          New Post
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Tags</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-28" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No posts found.
                  </td>
                </tr>
              ) : (
                data?.data.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{p.title}</p>
                      {p.author && (
                        <p className="text-xs text-slate-400 mt-0.5">by {p.author.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {p.tags && p.tags.length > 0 ? (
                        <p className="text-xs text-slate-500 truncate">{p.tags.join(', ')}</p>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PublishedBadge published={p.published} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePublished(p)}
                          disabled={togglingId === p.id}
                          className={clsx(
                            'text-xs font-medium px-2 py-1 rounded transition-colors disabled:opacity-50',
                            p.published
                              ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50',
                          )}
                        >
                          {p.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link
                          href={`/admin/blog/${p.id}/edit`}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {data.page} of {data.pages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
