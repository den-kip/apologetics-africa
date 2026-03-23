import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import type { Resource } from '@/lib/api';
import { BookmarkButton } from './BookmarkButton';

// ─── Type meta ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, {
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ className?: string }>;
  placeholder: string; // Unsplash URL for this type
}> = {
  article: {
    label: 'Article',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    Icon: DocumentTextIcon,
    placeholder: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
  },
  sermon: {
    label: 'Sermon',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    Icon: BookOpenIcon,
    placeholder: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
  },
  session: {
    label: 'Session',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    Icon: AcademicCapIcon,
    placeholder: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  },
  video: {
    label: 'Video',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    Icon: VideoCameraIcon,
    placeholder: 'https://images.unsplash.com/photo-1561489396-888724a1543d?auto=format&fit=crop&w=800&q=80',
  },
  podcast: {
    label: 'Podcast',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    Icon: MicrophoneIcon,
    placeholder: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
  },
  book: {
    label: 'Book',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    Icon: RectangleStackIcon,
    placeholder: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
  },
  course: {
    label: 'Course',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    Icon: AcademicCapIcon,
    placeholder: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
  },
  tool: {
    label: 'Tool',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    Icon: DocumentTextIcon,
    placeholder: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
  },
};

const FALLBACK_META = {
  label: 'Resource',
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  Icon: DocumentTextIcon,
  placeholder: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  resource: Resource;
}

export function ResourceCard({ resource }: Props) {
  const meta = TYPE_META[resource.type] ?? FALLBACK_META;
  const href = resource.externalUrl || `/resources/${resource.slug}`;
  const isExternal = !!resource.externalUrl;
  const imgSrc = resource.thumbnailUrl || meta.placeholder;

  return (
    <div className="card flex flex-col overflow-hidden group h-full">
      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
        <Image
          src={imgSrc}
          alt={resource.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={imgSrc.includes('unsplash.com')}
        />
        {/* Gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Type badge */}
        <span
          className={clsx(
            'absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
            meta.bg,
            meta.color,
          )}
        >
          <meta.Icon className="w-3 h-3" />
          {meta.label}
        </span>

        {resource.featured && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-gold-100 text-gold-600 backdrop-blur-sm">
            Featured
          </span>
        )}

        {/* Book of the Bible chip */}
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

        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {resource.title}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {resource.description}
        </p>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border border-slate-100 text-slate-500"
              >
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
            <Link
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {isExternal ? (
                <>Visit <ArrowTopRightOnSquareIcon className="w-3 h-3" /></>
              ) : (
                <>Read more →</>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
