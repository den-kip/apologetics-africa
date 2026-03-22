'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, QuestionMarkCircleIcon, PencilSquareIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Stats {
  questions: { total: number; pending: number; answered: number };
  resources: { total: number; published: number; featured: number };
  users: { total: number; admins: number; editors: number };
}

const quickLinks = [
  { label: 'Add Resource',      href: '/admin/resources/new' },
  { label: 'Answer a Question', href: '/admin/questions' },
  { label: 'Write a Blog Post', href: '/admin/blog/new' },
  { label: 'Manage Users',      href: '/admin/users' },
];

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.admin.stats(token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const statCards = [
    {
      label: 'Total Resources',
      value: stats?.resources.total ?? '—',
      icon: BookOpenIcon,
      href: '/admin/resources',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending Questions',
      value: stats?.questions.pending ?? '—',
      icon: QuestionMarkCircleIcon,
      href: '/admin/questions',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Published Posts',
      value: stats?.resources.published ?? '—',
      icon: PencilSquareIcon,
      href: '/admin/blog',
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Total Users',
      value: stats?.users.total ?? '—',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Welcome back. Here's what's happening.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              {loading ? (
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              )}
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn-secondary justify-center text-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
