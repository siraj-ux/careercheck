'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How long does the test take, and can I pause anytime?',
    a: 'The test takes about 35 minutes for Undergraduate students (4 parts: Interests, Aptitude, Personality, Values) and ~45 minutes for Postgraduate graduates (adding Domain Knowledge). You can pause and exit whenever you like — your progress is automatically saved to the exact question. Only the Aptitude section is timed (12 minutes).',
  },
  {
    q: 'Are there right or wrong answers in the test?',
    a: 'For Interests, Personality, and Values, there are NO right or wrong answers — only honest answers about what you enjoy and how you work. For the Aptitude section, questions evaluate logical deduction, verbal comprehension, and spatial problem-solving.',
  },
  {
    q: 'How are the college Safe, Target, and Reach tiers calculated?',
    a: 'We compare your academic marks/percentile, budget, and location preferences with realistic cutoffs across 60+ top Indian institutions. Safe means your marks exceed recent cutoffs (+5%), Target is within range (±5%), and Reach requires an aspirational push (up to 15% above cutoff). We always present these as guidance, never as a verdict.',
  },
  {
    q: 'What happens during the 1-on-1 human consultant session?',
    a: 'You meet a verified human career specialist for 45 minutes over video. Your consultant reviews your aptitude, personality traits, and college aspirations, answers parent questions, and publishes a personalised dated roadmap with key exam deadlines (e.g. CUET, UCEED, BITSAT) and application milestones.',
  },
  {
    q: 'Can parents view the test report and join the session?',
    a: 'Yes, absolutely! We encourage parent involvement. Students can generate an expiring 7-day read-only share link to give parents full visibility into their scores, and parents are welcome to attend the 45-minute consultant session.',
  },
  {
    q: 'What is your refund policy?',
    a: 'We offer a 100% full refund if no session is held within 14 days of booking due to a consultant or platform delay. No hidden catches.',
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.q}
            className="rounded-2xl border border-zinc-200/90 bg-white transition-all overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between p-5 text-left font-semibold text-zinc-900 hover:text-indigo-600 transition-colors"
            >
              <span className="text-base">{faq.q}</span>
              <ChevronDown
                className={`h-5 w-5 text-zinc-600 transition-transform duration-200 shrink-0 ml-4 ${
                  isOpen ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-600 border-t border-zinc-50 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
