'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function NewBlogPostPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await api.admin.blog.create(
        {
          title,
          excerpt,
          content,
          coverImageUrl: coverImageUrl || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          featured,
          published,
        },
        token,
      );
      router.push('/admin/blog');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-900">New Blog Post</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create a new article</p>
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
                  <span className="text-sm text-slate-700">Publish immediately</span>
                </label>
              </div>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Create Post'}
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
