'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, type SocialPost } from '@/lib/api';

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  twitter:  'bg-sky-100 text-sky-700',
  linkedin: 'bg-indigo-100 text-indigo-700',
};

const TYPE_COLORS: Record<string, string> = {
  resource: 'bg-purple-100 text-purple-700',
  blog:     'bg-teal-100 text-teal-700',
};

export default function SocialLogsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<{ data: SocialPost[]; total: number; page: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api.admin.social.logs(token, { page, limit: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Media Posts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data ? `${data.total} posts logged` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/settings?tab=social" className="text-sm text-brand-600 hover:underline">
            Configure platforms →
          </Link>
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Platform</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Content</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Message</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Posted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                    <p className="font-medium mb-1">No posts yet</p>
                    <p>Posts will appear here when content is published to enabled social platforms.</p>
                    <Link href="/admin/settings?tab=social" className="mt-2 inline-block text-brand-600 hover:underline text-xs">
                      Configure social media →
                    </Link>
                  </td>
                </tr>
              ) : (
                data?.data.map((post) => (
                  <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
                        PLATFORM_COLORS[post.platform] ?? 'bg-slate-100 text-slate-600',
                      )}>
                        {post.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={clsx(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mb-1 capitalize',
                          TYPE_COLORS[post.contentType] ?? 'bg-slate-100 text-slate-600',
                        )}>
                          {post.contentType}
                        </span>
                        <p className="text-slate-700 font-medium text-xs truncate max-w-[180px]">
                          {post.contentTitle || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-500 text-xs truncate">{post.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      {post.status === 'success' ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircleIcon className="w-4 h-4" /> Success
                        </span>
                      ) : (
                        <div>
                          <span className="flex items-center gap-1 text-xs text-rose-600">
                            <XCircleIcon className="w-4 h-4" /> Failed
                          </span>
                          {post.error && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]" title={post.error}>
                              {post.error}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(post.postedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {data.page} of {data.pages}
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
