'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TakeFreeTestCtaProps {
  className?: string;
  variant?: 'hero' | 'pricing' | 'footer';
  label?: string;
}

export function TakeFreeTestCta({
  className,
  variant = 'hero',
  label = 'Take the free test',
}: TakeFreeTestCtaProps) {
  const [targetHref, setTargetHref] = useState('/auth?redirect=/onboarding/profile');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (!data.user.dob) {
            setTargetHref('/auth/consent?redirect=/onboarding/profile');
          } else {
            setTargetHref('/onboarding/profile');
          }
        }
      })
      .catch(() => {});
  }, []);

  if (variant === 'pricing') {
    return (
      <Link
        href={targetHref}
        className={
          className ||
          'w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#004C99] bg-white px-6 py-3.5 text-sm font-bold text-[#004C99] hover:bg-[#EBF3FB] transition-colors shadow-2xs'
        }
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={targetHref}
      className={
        className ||
        'w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#6ABF4E] hover:bg-[#54A03A] px-8 py-4 text-base font-bold text-white shadow-md hover:shadow-lg active:scale-98 transition-all'
      }
    >
      <span>{label}</span>
      <ArrowRight className="h-5 w-5" />
    </Link>
  );
}
