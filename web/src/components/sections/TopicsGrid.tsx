import Link from 'next/link';
import type { Topic } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const COLORS = [
  'bg-blue-50   text-blue-700   border-blue-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-amber-50  text-amber-700  border-amber-100',
  'bg-green-50  text-green-700  border-green-100',
  'bg-rose-50   text-rose-700   border-rose-100',
  'bg-orange-50 text-orange-700 border-orange-100',
  'bg-teal-50   text-teal-700   border-teal-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-pink-50   text-pink-700   border-pink-100',
  'bg-slate-50  text-slate-700  border-slate-200',
];

async function fetchTopics(): Promise<Topic[]> {
  try {
    const res = await fetch(`${BASE}/api/v1/topics`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function TopicsGrid() {
  const topics = await fetchTopics();
  if (topics.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="section-label">Topics</p>
          <h2 className="section-title">Browse by Subject</h2>
          <p className="section-subtitle mx-auto max-w-lg">
            Find sermons, sessions, and articles on the questions that matter most.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/resources?category=${topic.slug}`}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border
                         ${COLORS[i % COLORS.length]}
                         hover:shadow-md transition-all duration-200 text-center group`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">✦</span>
              <span className="font-medium text-xs leading-tight">{topic.name}</span>
              {topic.type === 'theme' && (
                <span className="absolute top-2 right-2 text-xs bg-indigo-400 text-white px-1.5 py-0.5 rounded-full font-semibold leading-tight">
                  Theme
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
