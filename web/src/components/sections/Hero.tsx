import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, BookOpenIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[88vh] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80"
          alt="Mount Kilimanjaro"
          fill
          className="object-cover object-[center_60%]"
          priority
          sizes="100vw"
        />
        {/* Deep navy overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-900/90 to-brand-800/85" />
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 60%, #60a5fa 0%, transparent 45%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 45%)',
          }}
        />
      </div>

      <div className="container-xl relative py-24 lg:py-32 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-blue-200 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            Defending the faith across Africa
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6 text-white">
            Every Question{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Deserves
            </span>{' '}
            a Rigorous Answer
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-3 max-w-2xl">
            Apologetics Africa equips Christians — and seekers — with intellectual,
            accessible response to the tough questions to the Christian faith.
          </p>
          <p className="text-base text-blue-200/80 leading-relaxed mb-10 max-w-xl">
            Led by <strong className="text-white">Rev. Dr. John Njoroge</strong>, PhD - University of Georgia.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/resources" className="btn-primary bg-white text-brand-800 hover:bg-blue-50 shadow-lg shadow-brand-900/30">
              <BookOpenIcon className="w-4 h-4" />
              Browse Resources
            </Link>
            <Link href="/questions#ask" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
              <QuestionMarkCircleIcon className="w-4 h-4" />
              Ask a Question
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap gap-10">
            {[
              { label: 'Curated Resources',    value: '100+' },
              { label: 'Questions Answered',   value: '50+' },
              { label: 'Countries Reached',    value: '20+'  },
              { label: 'Years of Ministry',    value: '15+'  },
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-blue-400/40 pl-4">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-300 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-blue-300/60 text-xs">
        <span>Scroll</span>
        <ArrowRightIcon className="w-4 h-4 rotate-90 animate-bounce" />
      </div>
    </section>
  );
}
