import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon, EyeIcon, TagIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await api.blog.get(params.slug);
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
      },
    };
  } catch {
    return { title: 'Article Not Found' };
  }
}

export const revalidate = 300;

export default async function BlogPostPage({ params }: Props) {
  let post;
  try {
    post = await api.blog.get(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="relative h-72 sm:h-96 bg-slate-200">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <div className="container-xl py-12 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Blog
        </Link>

        <article>
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {post.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              {post.viewCount.toLocaleString()} views
            </span>
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </time>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed mb-6 border-b border-slate-100 pb-6">
            {post.excerpt}
          </p>

          {post.author && (
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{post.author.name}</p>
                <p className="text-xs text-slate-400">Apologetics Africa Team</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-10 pt-6 border-t border-slate-100">
              <TagIcon className="w-4 h-4 text-slate-400" />
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="badge bg-slate-50 text-slate-600 border border-slate-100 hover:border-brand-200 hover:text-brand-600 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </article>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-8 border border-brand-100">
          <h3 className="font-semibold text-slate-900 mb-2">Have a question about this topic?</h3>
          <p className="text-sm text-slate-600 mb-4">
            Submit your question and our team will provide a thorough answer.
          </p>
          <Link href="/questions#ask" className="btn-primary text-sm">
            Ask a Question
          </Link>
        </div>
      </div>
    </div>
  );
}
