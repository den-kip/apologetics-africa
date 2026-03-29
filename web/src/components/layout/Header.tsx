'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, Cog6ToothIcon, QuestionMarkCircleIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const nav = [
  { label: 'Home',      href: '/' },
  { label: 'Resources', href: '/resources' },
  { label: 'Questions', href: '/questions' },
  { label: 'Blog',      href: '/blog' },
  { label: 'Live',      href: '/live', live: true },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [liveSession, setLiveSession] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    api.sessions.getLive()
      .then((s) => setLiveSession(!!s))
      .catch(() => {});
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="container-xl flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img src="/logo.png" alt="Apologetics Africa" className="h-20 w-auto my-1 mx-1" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="btn-ghost text-sm relative">
                {item.label}
                {(item as any).live && liveSession && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5 text-slate-400" />
                    {user.name.split(' ')[0]}
                    <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-sm font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/questions?tab=mine"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400" />
                        My Questions
                      </Link>
                      <Link
                        href="/bookmarks"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <BookmarkIcon className="w-4 h-4 text-slate-400" />
                        My Bookmarks
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Cog6ToothIcon className="w-4 h-4 text-slate-400" />
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                  <Link href="/questions#ask" className="btn-primary text-sm">
                    Ask a Question
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? (
              <XMarkIcon className="w-5 h-5 text-slate-700" />
            ) : (
              <Bars3Icon className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
                {(item as any).live && liveSession && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-1 border-t border-slate-100">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link href="/questions" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                    <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400" /> My Questions
                  </Link>
                  <Link href="/bookmarks" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                    <BookmarkIcon className="w-4 h-4 text-slate-400" /> My Bookmarks
                  </Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                    <UserCircleIcon className="w-4 h-4 text-slate-400" /> Account Settings
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                      <Cog6ToothIcon className="w-4 h-4 text-slate-400" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-sm justify-start" onClick={() => setOpen(false)}>Sign In</Link>
                  <Link href="/questions#ask" className="btn-primary w-full justify-center text-sm" onClick={() => setOpen(false)}>
                    Ask a Question
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

    </>
  );
}
