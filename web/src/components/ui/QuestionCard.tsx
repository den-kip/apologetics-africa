import Link from 'next/link';
import { CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import type { Question } from '@/lib/api';

interface Props {
  question: Question;
}

export function QuestionCard({ question }: Props) {
  const href = question.slug ? `/questions/${question.slug}` : '#';

  return (
    <Link href={href} className="card flex flex-col p-5 group cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-3">
        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <EyeIcon className="w-3.5 h-3.5" />
          {question.viewCount.toLocaleString()}
        </div>
      </div>

      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3 group-hover:text-brand-600 transition-colors line-clamp-3">
        {question.title}
      </h3>

      {question.answer && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {question.answer}
        </p>
      )}

      {question.tags && question.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="badge bg-slate-50 text-slate-500 border border-slate-100 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {question.answeredAt
            ? `Answered ${new Date(question.answeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Recently answered'}
        </span>
        <span className="text-xs font-medium text-brand-600 group-hover:text-brand-700">
          Read →
        </span>
      </div>
    </Link>
  );
}
