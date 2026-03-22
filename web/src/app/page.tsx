import { Hero } from '@/components/sections/Hero';
import { NextSessionBanner, EventsCalendar } from '@/components/sections/EventsCalendar';
import { AboutLeader } from '@/components/sections/AboutLeader';
import { TopicsGrid } from '@/components/sections/TopicsGrid';
import { FeaturedResources } from '@/components/sections/FeaturedResources';
import { RecentQuestions } from '@/components/sections/RecentQuestions';
import { RecentPosts } from '@/components/sections/RecentPosts';
import { api } from '@/lib/api';

export const revalidate = 300;

export default async function HomePage() {
  const [resources, questions, posts] = await Promise.allSettled([
    api.resources.featured(6),
    api.questions.list({ limit: 6 }),
    api.blog.recent(3),
  ]);

  return (
    <>
      <Hero />
      <NextSessionBanner />
      <EventsCalendar />
      <AboutLeader />
      <TopicsGrid />
      <FeaturedResources
        resources={resources.status === 'fulfilled' ? resources.value : []}
      />
      <RecentQuestions
        questions={questions.status === 'fulfilled' ? questions.value.data : []}
      />
      <RecentPosts
        posts={posts.status === 'fulfilled' ? posts.value : []}
      />
    </>
  );
}
