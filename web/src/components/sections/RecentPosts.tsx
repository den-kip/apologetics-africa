import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import type { BlogPost } from '@/lib/api';
import { PostCard } from '@/components/ui/PostCard';

interface Props {
  posts: BlogPost[];
}

export function RecentPosts({ posts }: Props) {
  if (posts.length === 0) return null;
  return (
    <section className="py-20 bg-white">
      <div className="container-xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label">Blog</p>
            <h2 className="section-title">Latest Articles</h2>
            <p className="section-subtitle max-w-xl">
              Thoughtful commentary on apologetics, theology, and faith from across Africa.
            </p>
          </div>
          <Link href="/blog" className="btn-secondary hidden sm:flex shrink-0">
            Read All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {posts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/blog" className="btn-secondary">
            Read All Articles <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
