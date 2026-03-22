'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api, type Topic } from '@/lib/api';

type TopicType = 'topic' | 'theme';

const TYPE_TABS: { label: string; value: TopicType }[] = [
  { label: 'Topics', value: 'topic' },
  { label: 'Themes', value: 'theme' },
];

interface FormState {
  name: string;
  type: TopicType;
  description: string;
  order: number;
  published: boolean;
}

const EMPTY_FORM: FormState = { name: '', type: 'topic', description: '', order: 0, published: true };

export default function AdminTopicsPage() {
  const { token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<TopicType>('topic');

  // Modal state
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadTopics() {
    if (!token) return;
    setLoading(true);
    api.admin.topics.list(token)
      .then(setTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTopics(); }, [token]);

  const filtered = topics.filter((t) => t.type === activeType);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: activeType });
    setSaveError('');
    setSaved(false);
    setShowForm(true);
  }

  function openEdit(t: Topic) {
    setEditingId(t.id);
    setForm({ name: t.name, type: t.type as TopicType, description: t.description ?? '', order: t.order, published: t.published });
    setSaveError('');
    setSaved(false);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editingId) {
        await api.admin.topics.update(editingId, form, token);
      } else {
        await api.admin.topics.create(form, token);
      }
      setSaved(true);
      loadTopics();
      setTimeout(() => { setShowForm(false); setSaved(false); }, 1200);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm('Delete this entry? Questions linked to it will be unlinked.')) return;
    setDeletingId(id);
    try {
      await api.admin.topics.remove(id, token);
      loadTopics();
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
          <h1 className="text-2xl font-bold text-slate-900">Topics &amp; Themes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage the list used in question categorisation
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add {activeType === 'topic' ? 'Topic' : 'Theme'}
        </button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              activeType === t.value
                ? 'bg-white text-slate-900 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Description</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Order</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                  No {activeType}s yet. Add one above.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{t.order}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                        title="Delete"
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

      {/* Slide-in form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {editingId ? 'Edit' : 'New'} {form.type === 'topic' ? 'Topic' : 'Theme'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Existence of God"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TopicType })}
                  className="input-field"
                >
                  <option value="topic">Topic</option>
                  <option value="theme">Theme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Optional short description…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: +e.target.value })}
                  className="input-field w-24"
                />
                <p className="text-xs text-slate-400 mt-1">Lower numbers appear first.</p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600"
                />
                <span className="text-sm text-slate-700">Visible on site</span>
              </label>

              {saveError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                  {saveError}
                </p>
              )}

              {saved && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircleIcon className="w-4 h-4" /> Saved successfully.
                </div>
              )}

              <button type="submit" disabled={saving} className="btn-primary w-full justify-center disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
