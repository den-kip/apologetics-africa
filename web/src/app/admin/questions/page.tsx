'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { MagnifyingGlassIcon, TrashIcon, LockClosedIcon, LockOpenIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, Question, PaginatedResponse } from '@/lib/api';

const STATUS_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Answered', value: 'answered' },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      status === 'pending'  && 'bg-amber-100 text-amber-700',
      status === 'answered' && 'bg-green-100 text-green-700',
      status === 'rejected' && 'bg-rose-100 text-rose-700',
    )}>
      {status}
    </span>
  );
}

export default function AdminQuestionsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Question> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 15 };
    if (status) params.status = status;
    if (search) params.search = search;
    api.admin.questions.list(params, token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, status, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleTabChange(val: string) {
    setStatus(val);
    setPage(1);
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm('Delete this question? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.questions.remove(id, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLock(q: Question) {
    if (!token) return;
    setLockingId(q.id);
    try {
      await api.questions.lock(q.id, !q.locked, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLockingId(null);
    }
  }

  async function handleHide(q: Question) {
    if (!token) return;
    setHidingId(q.id);
    try {
      await api.questions.hide(q.id, !q.hidden, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setHidingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Questions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data ? `${data.total} total` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                status === t.value
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Question</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Asker</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Category</th>
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
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No questions found.
                  </td>
                </tr>
              ) : (
                data?.data.map((q) => (
                  <tr
                    key={q.id}
                    className={clsx(
                      'border-b border-slate-50 hover:bg-slate-50 transition-colors',
                      q.status === 'pending' && 'bg-amber-50/40',
                      q.hidden && 'opacity-60',
                    )}
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{q.title}</p>
                      {q.tags && q.tags.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{q.tags.join(', ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {q.anonymous
                        ? <span className="italic text-slate-400">Anonymous</span>
                        : q.askerName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                        {q.category ?? 'general'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={q.status} />
                        {q.locked && (
                          <LockClosedIcon className="w-3 h-3 text-slate-400" title="Locked" />
                        )}
                        {q.hidden && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                            <EyeSlashIcon className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/questions/${q.id}`}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                        >
                          {q.status === 'pending' ? 'Answer' : 'Edit'}
                        </Link>
                        <button
                          onClick={() => handleLock(q)}
                          disabled={lockingId === q.id}
                          title={q.locked ? 'Unlock' : 'Lock'}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                        >
                          {q.locked
                            ? <LockClosedIcon className="w-3.5 h-3.5" />
                            : <LockOpenIcon className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => handleHide(q)}
                          disabled={hidingId === q.id}
                          title={q.hidden ? 'Unhide' : 'Hide'}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                        >
                          {q.hidden
                            ? <EyeIcon className="w-3.5 h-3.5" />
                            : <EyeSlashIcon className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
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
