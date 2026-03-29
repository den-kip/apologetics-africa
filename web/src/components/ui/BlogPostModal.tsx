'use client';

import { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  ClockIcon,
  EyeIcon,
  CalendarDaysIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { BlogPost } from '@/lib/api';
import { BookmarkButton } from './BookmarkButton';
import { useAuth } from '@/lib/auth';

const FALLBACKS = [
  'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1200&q=80',
];

interface Props {
  post: BlogPost;
  index?: number;
  onClose: () => void;
}

export function BlogPostModal({ post, index = 0, onClose }: Props) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const imgSrc = post.coverImageUrl || FALLBACKS[index % FALLBACKS.length];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          'bg-white flex flex-col overflow-hidden transition-all duration-200 shadow-2xl',
          expanded
            ? 'fixed inset-0 rounded-none'
            : 'w-full max-w-3xl max-h-[92vh] rounded-2xl',
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 shrink-0">
              Blog
            </span>
            <h2 className="text-sm font-semibold text-slate-900 truncate">{post.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <BookmarkButton type="blog" targetId={post.id} className="!p-2" />
            <button
              onClick={() => setExpanded(v => !v)}
              title={expanded ? 'Shrink' : 'Expand'}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {expanded
                ? <ArrowsPointingInIcon className="w-4 h-4" />
                : <ArrowsPointingOutIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Cover image ── */}
        <div className="relative h-52 bg-slate-200 shrink-0">
          <Image
            src={imgSrc}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized={imgSrc.includes('unsplash.com')}
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-slate-900 leading-tight mb-2">{post.title}</h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-4">
            {(post.publishedAt || post.createdAt) && (
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {post.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              {post.viewCount.toLocaleString()} views
            </span>
          </div>

          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 leading-tight">{post.author.name}</p>
                <p className="text-xs text-slate-400">Apologetics Africa Team</p>
              </div>
            </div>
          )}

          {/* Excerpt */}
          <p className="text-sm text-slate-500 leading-relaxed mb-5 italic border-l-4 border-brand-200 pl-4">
            {post.excerpt}
          </p>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-slate-700">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 leading-relaxed">{para}</p>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border border-slate-100 text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Open full page <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!token && (
            <p className="mt-3 text-xs text-slate-400 italic">
              <a href="/login" className="text-brand-600 hover:underline">Sign in</a> to bookmark this post.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
