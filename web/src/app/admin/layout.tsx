'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon, BookOpenIcon, QuestionMarkCircleIcon,
  PencilSquareIcon, UsersIcon, ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon, CalendarDaysIcon, TagIcon, ShareIcon, SignalIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

const adminNav = [
  { label: 'Overview',  href: '/admin',            icon: HomeIcon },
  { label: 'Resources', href: '/admin/resources',  icon: BookOpenIcon },
  { label: 'Questions', href: '/admin/questions',  icon: QuestionMarkCircleIcon },
  { label: 'Topics',    href: '/admin/topics',     icon: TagIcon },
  { label: 'Blog',      href: '/admin/blog',       icon: PencilSquareIcon },
  { label: 'Users',     href: '/admin/users',      icon: UsersIcon },
  { label: 'Sessions',  href: '/admin/sessions',   icon: SignalIcon },
  { label: 'Social',    href: '/admin/social',     icon: ShareIcon },
  { label: 'Calendar',  href: '/admin/calendar',   icon: CalendarDaysIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AA</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Admin Panel</p>
              <p className="text-slate-500 text-xs">Apologetics Africa</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {adminNav.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-0.5">
          {/* User info */}
          <div className="px-3 py-2.5 mb-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400
                       hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            Back to Site
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400
                       hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
