import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import type { Resource } from '@/lib/api';
import { ResourceCard } from '@/components/ui/ResourceCard';

interface Props {
  resources: Resource[];
}

export function FeaturedResources({ resources }: Props) {
  if (resources.length === 0) return null;
  return (
    <section className="py-20 bg-slate-50">
      <div className="container-xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label">Library</p>
            <h2 className="section-title">Featured Resources</h2>
            <p className="section-subtitle max-w-xl">
              Curated sermons, sessions, and videos to deepen your understanding and
              strengthen your defence of the faith.
            </p>
          </div>
          <Link href="/resources" className="btn-secondary hidden sm:flex shrink-0">
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {resources.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/resources" className="btn-secondary">
            View All Resources
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
