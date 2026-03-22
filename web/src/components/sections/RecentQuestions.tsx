import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { Question } from '@/lib/api';
import { QuestionCard } from '@/components/ui/QuestionCard';

interface Props {
  questions: Question[];
}

export function RecentQuestions({ questions }: Props) {
  return (
    <section className="py-20 bg-white">
      <div className="container-xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label">Q&amp;A</p>
            <h2 className="section-title">Recent Answers</h2>
            <p className="section-subtitle max-w-xl">
              Real questions from real people across Africa — answered by our apologetics team.
            </p>
          </div>
          <Link href="/questions" className="btn-secondary hidden sm:flex shrink-0">
            Browse All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {questions.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}

        {/* CTA Band */}
        <div className="mt-14 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-700 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-medium text-blue-200">Have a question?</span>
            </div>
            <h3 className="text-xl font-bold">We want to hear from you.</h3>
            <p className="text-blue-200 text-sm mt-1">
              Submit any question about the Christian faith — no question is too hard.
            </p>
          </div>
          <Link
            href="/questions#ask"
            className="btn-primary bg-white text-brand-800 hover:bg-blue-50 shrink-0"
          >
            Ask Your Question
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
