'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function EditBlogPostPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    api.admin.blog
      .getById(id, token)
      .then((post) => {
        setTitle(post.title);
        setExcerpt(post.excerpt);
        setCoverImageUrl(post.coverImageUrl || '');
        setTags(post.tags ? post.tags.join(', ') : '');
        setContent(post.content);
        setFeatured(post.featured);
        setPublished(post.published);
      })
      .catch((err: any) => setFetchError(err.message || 'Failed to load post'))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitError('');

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await api.admin.blog.update(
        id,
        {
          title,
          excerpt,
          content,
          coverImageUrl: coverImageUrl || undefined,
          tags: tagsArray,
          featured,
          published,
        },
        token,
      );
      router.push('/admin/blog');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update post');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <p className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm">
          {fetchError}
        </p>
        <Link href="/admin/blog" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Back to Blog Posts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/blog"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Post</h1>
          <p className="text-slate-500 text-sm mt-0.5 truncate max-w-xs">{title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Excerpt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  placeholder="Short summary shown in listings…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="input-field resize-y font-mono text-sm"
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder="Write the full article here…"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Supports plain text. Markdown formatting will be preserved.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-6 space-y-5">
              <ImageUpload
                label="Cover Image"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. apologetics, truth, culture"
                />
                <p className="text-xs text-slate-400 mt-1.5">Comma-separated</p>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">Featured post</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">Published</span>
                </label>
              </div>

              {submitError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
                <Link
                  href="/admin/blog"
                  className="text-sm text-center text-slate-500 hover:text-slate-700 py-1.5 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
