'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClockIcon, EyeIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { BlogPost } from '@/lib/api';
import { BookmarkButton } from './BookmarkButton';
import { BlogPostModal } from './BlogPostModal';

// Themed fallback images by tag keywords
const FALLBACKS = [
  'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=800&q=80', // Africa
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80', // philosophy/reading
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80', // bible
  'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80', // cross/faith
];

interface Props {
  post: BlogPost;
  index?: number;
}

export function PostCard({ post, index = 0 }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const imgSrc = post.coverImageUrl || FALLBACKS[index % FALLBACKS.length];

  return (
    <>
      <div
        className="card flex flex-col overflow-hidden group h-full cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Cover */}
        <div className="relative h-52 bg-slate-100 overflow-hidden shrink-0">
          <Image
            src={imgSrc}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={imgSrc.includes('unsplash.com')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-3">
              {(post.publishedAt || post.createdAt) && (
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />
                {post.readingTimeMinutes} min
              </span>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <BookmarkButton type="blog" targetId={post.id} />
              <span className="font-semibold text-brand-600 group-hover:text-brand-700">Read →</span>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <BlogPostModal post={post} index={index} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
