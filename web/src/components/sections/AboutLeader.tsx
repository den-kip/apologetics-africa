import Image from 'next/image';
import Link from 'next/link';
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  MicrophoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const credentials = [
  {
    icon: AcademicCapIcon,
    label: 'Summa Cum Laude',
    detail: 'Talbot School of Theology, Biola University',
  },
  {
    icon: BuildingLibraryIcon,
    label: 'Philosophy, Theology & NT Studies',
    detail: 'La Mirada, California',
  },
  {
    icon: MicrophoneIcon,
    label: '15+ Years in Apologetics',
    detail: 'Churches, Universities & Broadcasters',
  },
  {
    icon: GlobeAltIcon,
    label: 'Africa-Wide Ministry',
    detail: 'Schools, Workshops & Broadcasting Houses',
  },
];

export function AboutLeader() {
  return (
    <section className="py-20 bg-white">
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Photo column */}
          <div className="relative">
            {/* Decorative frame */}
            <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl border-2 border-brand-200 -z-10" />
            <div className="relative rounded-3xl overflow-hidden bg-brand-50 aspect-[4/5] max-w-md mx-auto lg:mx-0 shadow-xl">
              <Image
                src="/john.jpeg"
                alt="Dr. John Njoroge — Apologetics Africa"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 90vw, 45vw"
                priority
              />
              {/* Name card overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-950/90 via-brand-900/60 to-transparent p-6 pt-16">
                <p className="text-white font-bold text-xl">Dr. John Njoroge</p>
                <p className="text-blue-200 text-sm mt-0.5">
                  Founder &amp; Lead Apologist, Apologetics Africa
                </p>
              </div>
            </div>
          </div>

          {/* Bio column */}
          <div>
            <p className="section-label">About the Ministry</p>
            <h2 className="section-title mb-5">
              Defending the Faith with
              <br />
              <span className="text-brand-600">Rigour and Compassion</span>
            </h2>

            <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
              <p>
                Dr. John Njoroge is the founder and lead apologist of Apologetics Africa, a
                ministry dedicated to equipping African Christians to engage the toughest
                intellectual challenges to the Christian faith.
              </p>
              <p>
                He is an accomplished apologist and writer. He graduated from Talbot School of Theology with a master’s degree 
                in philosophy, a master’s degree in New Testament studies and a ThM. Njoroge earned his PhD in philosophy from 
                the University of Georgia. Dr. Njoroge brings over{' '} <strong className="text-slate-800">15 years of frontline apologetics experience</strong>{' '}
                to every engagement.
              </p>
              <p>
                He regularly visits churches, schools, universities, workshops, and broadcasting
                houses across Africa — helping Christians to love the Lord with their minds, and
                inviting non-Christians to think critically and honestly about the claims of the
                Christian faith.
              </p>
            </div>

            {/* Credential grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {credentials.map(({ icon: Icon, label, detail }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/questions#ask" className="btn-primary">
                Ask Dr. Njoroge a Question
              </Link>
              <Link href="/resources?type=session" className="btn-secondary">
                Watch Apologetics Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
