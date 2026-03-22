'use client';

import { useState } from 'react';
import {
  EnvelopeIcon, MapPinIcon, ClockIcon,
  CheckCircleIcon, PhoneIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

const SUBJECTS = [
  'General Enquiry',
  'Speaking / Events',
  'Partnership & Collaboration',
  'Media & Press',
  'Technical Issue',
  'Other',
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.contact.send({ name, email, subject: subject || undefined, message });
      setSent(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20">
        <div className="container-xl text-center">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Get in Touch
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Have a question, want to collaborate, or simply want to say hello?
            We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-xl py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Info panel */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Get in touch</h2>
              <div className="space-y-5">
                <InfoRow icon={EnvelopeIcon} label="Email">
                  <a
                    href="mailto:info@apologeticsafrica.com"
                    className="text-brand-600 hover:underline"
                  >
                    info@apologeticsafrica.com
                  </a>
                </InfoRow>
                <InfoRow icon={MapPinIcon} label="Location">
                  Nairobi, Kenya<br />
                  <span className="text-slate-500 text-sm">
                    Sessions held in-person &amp; online
                  </span>
                </InfoRow>
                <InfoRow icon={ClockIcon} label="Sessions">
                  Every 2nd &amp; 4th Saturday<br />
                  <span className="text-slate-500 text-sm">7:00 PM EAT</span>
                </InfoRow>
                <InfoRow icon={PhoneIcon} label="Response time">
                  We aim to respond within 2–3 business days.
                </InfoRow>
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider mb-4">
                What can we help with?
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {[
                  'Questions about Christian apologetics',
                  'Inviting us to speak at your church or event',
                  'Partnership and collaboration opportunities',
                  'Media enquiries and interviews',
                  'Feedback on our resources',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                For theological questions, please use our{' '}
                <a href="/questions#ask" className="text-brand-600 hover:underline">
                  Ask a Question
                </a>{' '}
                form so our team can answer publicly.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-green-50 border border-green-200 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Message sent!</h2>
                <p className="text-slate-600 max-w-sm">
                  Thank you for reaching out. We'll get back to you within 2–3 business days.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 btn-primary"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Send a message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Your name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a subject…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={7}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Tell us how we can help…"
                    minLength={10}
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50 py-3 text-base"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>

                <p className="text-xs text-center text-slate-400">
                  We read every message and aim to respond within 2–3 business days.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map / CTA banner */}
      <section className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="container-xl text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Come to a Saturday Session
          </h2>
          <p className="text-slate-500 mb-6">
            The best way to engage with us is at one of our live apologetics sessions —
            open to everyone, free of charge.
          </p>
          <a href="/questions#ask" className="btn-primary mr-3">
            Ask a Question
          </a>
          <a href="/resources" className="btn-ghost">
            Browse Resources
          </a>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
          {label}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
