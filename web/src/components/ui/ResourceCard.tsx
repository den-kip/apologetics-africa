'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  EyeIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  PlayCircleIcon,
  SpeakerWaveIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import type { Resource } from '@/lib/api';
import { BookmarkButton } from './BookmarkButton';
import { ResourceModal } from './ResourceModal';

// ─── Type meta ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, {
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  cta: string;
}> = {
  video: {
    label: 'Video',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    Icon: VideoCameraIcon,
    placeholder: 'https://images.unsplash.com/photo-1561489396-888724a1543d?auto=format&fit=crop&w=800&q=80',
    cta: 'Watch',
  },
  sermon: {
    label: 'Sermon',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    Icon: BookOpenIcon,
    placeholder: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
    cta: 'Listen',
  },
  session: {
    label: 'Session',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    Icon: AcademicCapIcon,
    placeholder: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    cta: 'Watch',
  },
  podcast: {
    label: 'Podcast',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    Icon: MicrophoneIcon,
    placeholder: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    cta: 'Listen',
  },
  book: {
    label: 'Book',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    Icon: RectangleStackIcon,
    placeholder: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
    cta: 'Read',
  },
  course: {
    label: 'Course',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    Icon: AcademicCapIcon,
    placeholder: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    cta: 'View',
  },
  tool: {
    label: 'Tool',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    Icon: WrenchScrewdriverIcon,
    placeholder: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
    cta: 'Open',
  },
  article: {
    label: 'Article',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    Icon: DocumentTextIcon,
    placeholder: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
    cta: 'Read',
  },
};

const FALLBACK_META = {
  label: 'Resource',
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  Icon: DocumentTextIcon,
  placeholder: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
  cta: 'View',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function resolveThumbnail(raw: string | undefined | null, placeholder: string): { src: string; isApiImage: boolean } {
  if (!raw) return { src: placeholder, isApiImage: false };
  if (raw.startsWith('/uploads/')) return { src: `${API_BASE}${raw}`, isApiImage: true };
  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/uploads/')) return { src: `${API_BASE}${u.pathname}`, isApiImage: true };
  } catch {}
  return { src: raw, isApiImage: false };
}

// Icon shown as overlay on the thumbnail based on type
function OverlayIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    video:   <PlayCircleIcon   className="w-14 h-14 text-white drop-shadow-lg" />,
    session: <PlayCircleIcon   className="w-14 h-14 text-white drop-shadow-lg" />,
    sermon:  <SpeakerWaveIcon  className="w-14 h-14 text-white drop-shadow-lg" />,
    podcast: <SpeakerWaveIcon  className="w-14 h-14 text-white drop-shadow-lg" />,
  };
  const icon = icons[type];
  if (!icon) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  resource: Resource;
}

export function ResourceCard({ resource }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const meta = TYPE_META[resource.type] ?? FALLBACK_META;
  const { src: imgSrc, isApiImage } = resolveThumbnail(resource.thumbnailUrl, meta.placeholder);

  return (
    <>
      <div className="card flex flex-col overflow-hidden group h-full">
        {/* Thumbnail — click opens modal */}
        <div
          className="relative h-44 bg-slate-100 overflow-hidden shrink-0 cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <Image
            src={imgSrc}
            alt={resource.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={isApiImage || imgSrc.includes('unsplash.com')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          <OverlayIcon type={resource.type} />

          {/* Type badge */}
          <span className={clsx(
            'absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
            meta.bg, meta.color,
          )}>
            <meta.Icon className="w-3 h-3" />
            {meta.label}
          </span>

          {resource.featured && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 backdrop-blur-sm">
              Featured
            </span>
          )}

          {(resource as any).bookOfBible && (
            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white/90 backdrop-blur-sm">
              {(resource as any).bookOfBible}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          {resource.category && (
            <p className="text-xs text-slate-400 mb-2 capitalize">
              {resource.category.replace(/_/g, ' ')}
            </p>
          )}

          {/* Title — click opens modal */}
          <h3
            className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors cursor-pointer"
            onClick={() => setModalOpen(true)}
          >
            {resource.title}
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
            {resource.description}
          </p>

          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {resource.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border border-slate-100 text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <EyeIcon className="w-3.5 h-3.5" />
              {resource.viewCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <BookmarkButton type="resource" targetId={resource.id} />
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                {meta.cta} →
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ResourceModal resource={resource} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
