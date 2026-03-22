'use client';

import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  MagnifyingGlassIcon, TrashIcon, PlusIcon, XMarkIcon, StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/auth';
import { api, Resource, PaginatedResponse } from '@/lib/api';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FileUpload } from '@/components/ui/FileUpload';

const RESOURCE_TYPES = [
  'article', 'video', 'podcast', 'book', 'course', 'tool', 'sermon', 'session',
] as const;

const RESOURCE_CATEGORIES = [
  { value: 'existence_of_god', label: 'Existence of God' },
  { value: 'resurrection',     label: 'Resurrection' },
  { value: 'bible_reliability',label: 'Bible Reliability' },
  { value: 'islam',            label: 'Islam' },
  { value: 'atheism',          label: 'Atheism' },
  { value: 'evolution',        label: 'Evolution' },
  { value: 'morality',         label: 'Morality' },
  { value: 'suffering',        label: 'Suffering' },
  { value: 'world_religions',  label: 'World Religions' },
  { value: 'postmodernism',    label: 'Postmodernism' },
  { value: 'general',          label: 'General' },
] as const;

const BLANK: Partial<Resource> & { title: string; description: string } = {
  title: '',
  description: '',
  type: 'article',
  category: 'general',
  externalUrl: '',
  thumbnailUrl: '',
  content: '',
  tags: [],
  featured: false,
  published: true,
};

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
    )}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 capitalize">
      {type}
    </span>
  );
}

export default function AdminResourcesPage() {
  const { token } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Resource> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sourceMode, setSourceMode] = useState<'link' | 'upload'>('link');

  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 15 };
    if (search) params.search = search;
    api.admin.resources.list(params, token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function openCreate() {
    setEditingResource(null);
    setForm({ ...BLANK });
    setTagsInput('');
    setSourceMode('link');
    setSaveError('');
    setPanelOpen(true);
  }

  function openEdit(r: Resource) {
    setEditingResource(r);
    setForm({
      title: r.title,
      description: r.description,
      type: r.type as any,
      category: r.category as any,
      externalUrl: r.externalUrl ?? '',
      thumbnailUrl: r.thumbnailUrl ?? '',
      content: r.content ?? '',
      tags: r.tags ?? [],
      featured: r.featured,
      published: r.published,
    });
    setTagsInput((r.tags ?? []).join(', '));
    setSourceMode(r.externalUrl ? 'link' : 'link');
    setSaveError('');
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingResource(null);
  }

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaveError('');
    const payload = {
      ...form,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editingResource) {
        await api.admin.resources.update(editingResource.id, payload, token);
      } else {
        await api.admin.resources.create(payload as any, token);
      }
      closePanel();
      fetchData();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublished(resource: Resource) {
    if (!token) return;
    setTogglingId(resource.id);
    try {
      await api.admin.resources.update(resource.id, { published: !resource.published }, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.admin.resources.remove(id, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data ? `${data.total} total` : 'Loading…'}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="w-4 h-4" /> New Resource
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search resources…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Type</th>
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
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No resources found.
                  </td>
                </tr>
              ) : (
                data?.data.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{r.title}</p>
                      {r.author && (
                        <p className="text-xs text-slate-400 mt-0.5">by {r.author.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={r.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {r.category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PublishedBadge published={r.published} />
                        {r.featured && <StarSolid className="w-3.5 h-3.5 text-amber-400" title="Featured" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublished(r)}
                          disabled={togglingId === r.id}
                          className={clsx(
                            'text-xs font-medium px-2 py-1 rounded transition-colors disabled:opacity-50',
                            r.published
                              ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50',
                          )}
                        >
                          {r.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
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

      {/* Create / Edit panel */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closePanel}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-semibold text-slate-900">
                {editingResource ? 'Edit Resource' : 'New Resource'}
              </h2>
              <button
                onClick={closePanel}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Panel body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="input-field"
                  placeholder="e.g. The Case for Christ"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="input-field resize-none"
                  placeholder="Brief description of this resource…"
                />
              </div>

              {/* Type + Category row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    className="input-field capitalize"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="input-field"
                  >
                    {RESOURCE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resource source: link or upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resource Source</label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-3 w-fit">
                  <button
                    type="button"
                    onClick={() => setSourceMode('link')}
                    className={clsx(
                      'px-4 py-1.5 text-sm rounded-md transition-colors',
                      sourceMode === 'link'
                        ? 'bg-white text-slate-900 shadow-sm font-medium'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode('upload')}
                    className={clsx(
                      'px-4 py-1.5 text-sm rounded-md transition-colors',
                      sourceMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-sm font-medium'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    Upload File
                  </button>
                </div>

                {sourceMode === 'link' ? (
                  <input
                    type="url"
                    value={form.externalUrl ?? ''}
                    onChange={(e) => set('externalUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://example.com/resource"
                  />
                ) : (
                  <FileUpload
                    value={form.externalUrl ?? ''}
                    onChange={(url) => set('externalUrl', url)}
                    hint="PDF, MP3, MP4, DOCX, PPTX — max 100 MB"
                  />
                )}
              </div>

              {/* Thumbnail */}
              <ImageUpload
                label="Thumbnail"
                value={form.thumbnailUrl ?? ''}
                onChange={(url) => set('thumbnailUrl', url)}
                hint="Optional cover image for this resource"
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input-field"
                  placeholder="e.g. apologetics, evidence, history"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={5}
                  value={form.content ?? ''}
                  onChange={(e) => set('content', e.target.value)}
                  className="input-field resize-y font-mono text-sm"
                  placeholder="Extended description or transcript…"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured ?? false}
                    onChange={(e) => set('featured', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="text-sm text-slate-700 flex items-center gap-1">
                    {form.featured
                      ? <StarSolid className="w-4 h-4 text-amber-400" />
                      : <StarIcon className="w-4 h-4 text-slate-400" />}
                    Feature on home page
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published ?? true}
                    onChange={(e) => set('published', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="text-sm text-slate-700">Publish immediately</span>
                </label>
              </div>

              {saveError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                  {saveError}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-3 pt-2 pb-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingResource ? 'Save Changes' : 'Create Resource'}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
