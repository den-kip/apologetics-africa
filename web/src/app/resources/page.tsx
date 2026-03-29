'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { SearchBar } from '@/components/ui/SearchBar';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { Pagination } from '@/components/ui/Pagination';
import { EventsCalendar } from '@/components/sections/EventsCalendar';
import { api, type Resource, type PaginatedResponse } from '@/lib/api';
import { clsx } from 'clsx';

// ─── Constants ───────────────────────────────────────────────────────────────

// Non-multimedia types excluded from the Resources page (they live under Blog)
const EXCLUDED_TYPES = 'article,book,tool';

const MEDIA_TYPES = [
  { value: '',         label: 'All Media'  },
  { value: 'session',  label: 'Sessions'   },
  { value: 'sermon',   label: 'Sermons'    },
  { value: 'video',    label: 'Videos'     },
  { value: 'podcast',  label: 'Podcasts'   },
  { value: 'course',   label: 'Courses'    },
];

const CATEGORIES = [
  { value: '',                  label: 'All Topics'        },
  { value: 'existence_of_god',  label: 'Existence of God'  },
  { value: 'resurrection',      label: 'Resurrection'      },
  { value: 'bible_reliability', label: 'Bible Reliability' },
  { value: 'islam',             label: 'Islam'             },
  { value: 'atheism',           label: 'Atheism'           },
  { value: 'evolution',         label: 'Evolution'         },
  { value: 'morality',          label: 'Morality'          },
  { value: 'suffering',         label: 'Suffering & Evil'  },
  { value: 'postmodernism',     label: 'Postmodernism'     },
  { value: 'world_religions',   label: 'World Religions'   },
  { value: 'general',           label: 'General'           },
];

const BIBLE_BOOKS = [
  '', // All
  // OT
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah',
  'Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah',
  'Haggai','Zechariah','Malachi',
  // NT
  'Matthew','Mark','Luke','John',
  'Acts','Romans','1 Corinthians','2 Corinthians','Galatians',
  'Ephesians','Philippians','Colossians','1 Thessalonians',
  '2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter',
  '1 John','2 John','3 John','Jude','Revelation',
];

const YEARS = ['', '2026', '2025', '2024', '2023'];
const MONTHS = [
  { value: '', label: 'Any Month' },
  { value: '1',  label: 'January'   }, { value: '2',  label: 'February'  },
  { value: '3',  label: 'March'     }, { value: '4',  label: 'April'     },
  { value: '5',  label: 'May'       }, { value: '6',  label: 'June'      },
  { value: '7',  label: 'July'      }, { value: '8',  label: 'August'    },
  { value: '9',  label: 'September' }, { value: '10', label: 'October'   },
  { value: '11', label: 'November'  }, { value: '12', label: 'December'  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [result, setResult] = useState<PaginatedResponse<Resource> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [category, setCategory] = useState('');
  const [book, setBook] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(mediaType || category || book || year || month);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (search) params.search = search;
      if (mediaType) params.type = mediaType;
      else params.excludeTypes = EXCLUDED_TYPES;
      if (category) params.category = category;
      if (book) params.bookOfBible = book;
      if (year) params.year = year;
      if (month) params.month = month;
      const data = await api.resources.list(params);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, mediaType, category, book, year, month]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  useEffect(() => { setPage(1); }, [search, mediaType, category, book, year, month]);

  function clearFilters() {
    setSearch(''); setMediaType(''); setCategory('');
    setBook(''); setYear(''); setMonth('');
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Page header */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="container-xl py-14">
          <p className="section-label">Library</p>
          <h1 className="section-title">Apologetics Resources</h1>
          <p className="section-subtitle max-w-2xl">
            Sessions, sermons, videos, podcasts, and courses — curated multimedia
            to equip you in defending and sharing the Christian faith across Africa.
          </p>
        </div>
      </div>

      <div className="container-xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Search + filter toggle */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} placeholder="Search sermons, sessions, videos…" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  hasActiveFilters
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">
                    {[mediaType, category, book, year, month].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Media type pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {MEDIA_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setMediaType(t.value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    mediaType === t.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Theme */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Theme
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Book of the Bible */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Book of the Bible
                  </label>
                  <select
                    value={book}
                    onChange={(e) => setBook(e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    <option value="">All Books</option>
                    <optgroup label="Old Testament">
                      {BIBLE_BOOKS.slice(1, 40).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                    <optgroup label="New Testament">
                      {BIBLE_BOOKS.slice(40).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    <option value="">Any Year</option>
                    {YEARS.filter(Boolean).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <button onClick={clearFilters} className="text-xs text-rose-600 hover:text-rose-700 font-medium">
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { label: CATEGORIES.find(c => c.value === category)?.label, clear: () => setCategory('') },
                  { label: book || undefined, clear: () => setBook('') },
                  { label: year || undefined, clear: () => setYear('') },
                  { label: MONTHS.find(m => m.value === month)?.label, clear: () => setMonth('') },
                ].filter(f => f.label && f.label !== 'All Topics' && f.label !== 'Any Month').map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium"
                  >
                    {f.label}
                    <button onClick={f.clear} className="hover:text-brand-900 text-brand-500 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : result && result.data.length > 0 ? (
              <>
                <p className="text-sm text-slate-500 mb-5">
                  {result.total} result{result.total !== 1 ? 's' : ''}
                  {(mediaType || category || book) && ' for current filters'}
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {result.data.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
                <Pagination page={result.page} pages={result.pages} onPage={setPage} />
              </>
            ) : (
              <div className="text-center py-24">
                <p className="text-slate-400 text-lg mb-2">No resources found.</p>
                <p className="text-slate-300 text-sm mb-6">Try adjusting your filters or search term.</p>
                <button className="btn-secondary" onClick={clearFilters}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="lg:w-80 shrink-0 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">
                Upcoming Sessions
              </p>
              <EventsCalendar variant="card" />
            </div>

            {/* Quick topic links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">
                Browse by Topic
              </p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {CATEGORIES.filter(c => c.value).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { setCategory(c.value); setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-brand-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl',
                      category === c.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600',
                    )}
                  >
                    {c.label}
                    <span className="text-slate-300">→</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
