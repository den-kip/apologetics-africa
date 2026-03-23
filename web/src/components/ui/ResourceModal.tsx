'use client';

import { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  BookOpenIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import type { Resource } from '@/lib/api';
import { BookmarkButton } from './BookmarkButton';
import { useAuth } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── URL / media helpers ──────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0];
      return u.searchParams.get('v');
    }
  } catch {}
  return null;
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(?:video\/)?(\d+)/);
      return m ? m[1] : null;
    }
  } catch {}
  return null;
}

type MediaKind = 'youtube' | 'vimeo' | 'video' | 'audio' | 'pdf' | 'external' | 'none';

function classifyMedia(url: string): { kind: MediaKind; embedUrl?: string } {
  if (!url) return { kind: 'none' };

  const ytId = getYouTubeId(url);
  if (ytId) return { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0` };

  const vimeoId = getVimeoId(url);
  if (vimeoId) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoId}` };

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return { kind: 'video' };
  if (/\.(mp3|wav|aac|m4a|flac|opus|oga)(\?.*)?$/i.test(url)) return { kind: 'audio' };
  if (/\.pdf(\?.*)?$/i.test(url)) return { kind: 'pdf' };

  return { kind: 'external' };
}

/** Resolve any stored thumbnail URL to a browser-fetchable full URL. */
function resolveUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('/')) return `${API_BASE}${raw}`;
  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/uploads/')) return `${API_BASE}${u.pathname}`;
  } catch {}
  return raw;
}

// ─── Type badge meta ──────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  video:   { label: 'Video',   color: 'text-rose-700',    bg: 'bg-rose-50'    },
  sermon:  { label: 'Sermon',  color: 'text-violet-700',  bg: 'bg-violet-50'  },
  session: { label: 'Session', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  podcast: { label: 'Podcast', color: 'text-amber-700',   bg: 'bg-amber-50'   },
  book:    { label: 'Book',    color: 'text-slate-700',   bg: 'bg-slate-100'  },
  course:  { label: 'Course',  color: 'text-teal-700',    bg: 'bg-teal-50'    },
  tool:    { label: 'Tool',    color: 'text-orange-700',  bg: 'bg-orange-50'  },
  article: { label: 'Article', color: 'text-blue-700',    bg: 'bg-blue-50'    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AspectIframe({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
      />
    </div>
  );
}

function AudioPlayer({ src, poster, title }: { src: string; poster: string | null; title: string }) {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center py-8 px-6 gap-5">
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="w-40 h-40 object-cover rounded-2xl shadow-xl"
        />
      ) : (
        <div className="w-40 h-40 rounded-2xl bg-slate-700 flex items-center justify-center shadow-xl">
          <SpeakerWaveIcon className="w-16 h-16 text-slate-400" />
        </div>
      )}
      <audio
        src={src}
        controls
        className="w-full max-w-sm"
        style={{ colorScheme: 'dark' }}
      >
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

function PdfViewer({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      className="w-full"
      style={{ height: '65vh', border: 'none' }}
      title="PDF Viewer"
    />
  );
}

function ExternalPreview({
  url,
  poster,
  type,
  title,
}: {
  url: string | null;
  poster: string | null;
  type: string;
  title: string;
}) {
  const label =
    type === 'podcast' || type === 'sermon' ? 'Listen'
    : type === 'book'   ? 'Read Book'
    : type === 'course' ? 'Go to Course'
    : type === 'tool'   ? 'Open Tool'
    : 'Open Resource';

  const Icon =
    type === 'podcast' || type === 'sermon' ? SpeakerWaveIcon
    : type === 'book'   ? BookOpenIcon
    : type === 'course' ? BookOpenIcon
    : DocumentTextIcon;

  return (
    <div className="bg-slate-50 flex flex-col items-center justify-center py-10 px-8 gap-5 text-center">
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="w-full max-h-56 object-cover rounded-xl shadow"
        />
      ) : (
        <div className="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center">
          <Icon className="w-12 h-12 text-slate-400" />
        </div>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {label} <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  resource: Resource;
  onClose: () => void;
}

export function ResourceModal({ resource, onClose }: Props) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

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

  const rawUrl   = resource.externalUrl ?? '';
  const mediaUrl = resolveUrl(rawUrl) ?? rawUrl;
  const thumbSrc = resolveUrl(resource.thumbnailUrl);
  const { kind, embedUrl } = classifyMedia(mediaUrl);

  const badge = TYPE_BADGE[resource.type] ?? { label: resource.type, color: 'text-slate-700', bg: 'bg-slate-100' };

  // Wider modal for PDF, standard otherwise
  const maxWidth = kind === 'pdf' ? 'max-w-5xl' : 'max-w-3xl';

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
            : `w-full ${maxWidth} max-h-[92vh] rounded-2xl`,
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 capitalize', badge.bg, badge.color)}>
              {badge.label}
            </span>
            <h2 className="text-sm font-semibold text-slate-900 truncate">{resource.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <BookmarkButton type="resource" targetId={resource.id} className="!p-2" />
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

        {/* ── Media section ── */}
        <div className="shrink-0">
          {kind === 'youtube' || kind === 'vimeo' ? (
            <AspectIframe src={embedUrl!} title={resource.title} />
          ) : kind === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full bg-black"
              style={{ maxHeight: '55vh' }}
              poster={thumbSrc ?? undefined}
            >
              Your browser does not support the video tag.
            </video>
          ) : kind === 'audio' ? (
            <AudioPlayer src={mediaUrl} poster={thumbSrc} title={resource.title} />
          ) : kind === 'pdf' ? (
            <PdfViewer src={mediaUrl} />
          ) : (
            <ExternalPreview
              url={mediaUrl || null}
              poster={thumbSrc}
              type={resource.type}
              title={resource.title}
            />
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {resource.category && (
            <p className="text-xs text-slate-400 mb-1 capitalize">
              {resource.category.replace(/_/g, ' ')}
            </p>
          )}

          <h3 className="text-base font-semibold text-slate-900 leading-snug mb-2">
            {resource.title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed">
            {resource.description}
          </p>

          {resource.content && (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed whitespace-pre-line">
              {resource.content}
            </p>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {resource.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border border-slate-100 text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              {resource.viewCount.toLocaleString()} views
            </span>

            <div className="flex items-center gap-3">
              {/* For embedded media, still offer "open original" */}
              {mediaUrl && (kind === 'youtube' || kind === 'vimeo' || kind === 'video' || kind === 'audio') && (
                <a
                  href={rawUrl || mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-600 font-medium transition-colors"
                >
                  Open original <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </a>
              )}
              {/* For external/pdf, show a prominent link */}
              {(kind === 'external' || kind === 'pdf') && mediaUrl && (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                  Open <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {!token && (
            <p className="mt-3 text-xs text-slate-400 italic">
              <a href="/login" className="text-brand-600 hover:underline">Sign in</a> to bookmark this resource.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
