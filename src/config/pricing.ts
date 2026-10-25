/**
 * Pricing and Plan Configurations
 * Values per docs/product.md Section 9.2
 */

export interface PricingPlan {
  id: 'free' | 'career_plan';
  name: string;
  badge?: string;
  pricePaise: number;
  priceFormatted: string;
  currency: string;
  headline: string;
  description: string;
  ctaText: string;
  features: {
    label: string;
    included: boolean;
    note?: string;
  }[];
}

export const PRICING_PLANS: Record<'free' | 'career_plan', PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free Discovery',
    pricePaise: 0,
    priceFormatted: '₹0',
    currency: 'INR',
    headline: 'Foundational Self-Awareness',
    description: 'Explore your interest profile and fundamental aptitude sub-scores at zero cost.',
    ctaText: 'Your Current Plan',
    features: [
      { label: '3-Letter RIASEC Interest Code (e.g. "IAR")', included: true },
      { label: 'Interactive RIASEC 6-axis Radar Chart with accessible table view', included: true },
      { label: 'Aptitude Sub-Scores: Logical, Verbal & Spatial Reasoning', included: true },
      { label: '5 Neutral Personality Spectrums', included: false, note: 'Locked' },
      { label: 'Top 6 Ranked Career Matches with Fit % and Rationale', included: false, note: 'Locked' },
      { label: 'Safe / Target / Reach College Shortlist with Cutoffs', included: false, note: 'Locked' },
      { label: '1-on-1 Video Consultation (45 minutes) with an expert mentor', included: false, note: 'Locked' },
      { label: 'Custom published Roadmap with deadlines & backup plan', included: false, note: 'Locked' },
      { label: 'Direct 30-day chat support with your mentor', included: false, note: 'Locked' },
    ],
  },
  career_plan: {
    id: 'career_plan',
    name: 'Career Plan',
    badge: 'Recommended',
    pricePaise: 149900, // ₹1,499.00
    priceFormatted: '₹1,499',
    currency: 'INR',
    headline: 'Complete Clarity & Expert Mentorship',
    description: 'Unlock your full psychological profile, matched careers & colleges, plus a 45-min dedicated strategy session with a mentor.',
    ctaText: 'Unlock Career Plan for ₹1,499',
    features: [
      { label: '3-Letter RIASEC Interest Code (e.g. "IAR")', included: true },
      { label: 'Interactive RIASEC 6-axis Radar Chart with accessible table view', included: true },
      { label: 'Aptitude Sub-Scores: Logical, Verbal & Spatial Reasoning', included: true },
      { label: '5 Neutral Personality Spectrums (No good/bad grading)', included: true },
      { label: 'Top 6 Ranked Career Matches with Fit % and Rationale', included: true },
      { label: 'Safe / Target / Reach College Shortlist with Cutoffs & fees', included: true },
      { label: '1-on-1 Video Consultation (45 minutes) with an assigned mentor', included: true, note: 'Includes tailored advice' },
      { label: 'Custom published Roadmap (Primary & Backup tracks)', included: true },
      { label: 'Direct 30-day chat support with your mentor post-session', included: true },
    ],
  },
};

export const REFUND_POLICY = {
  windowDays: 14,
  title: '14-Day Session Guarantee',
  summary:
    'Full refund guaranteed if no consultation session is held within 14 days of payment due to consultant or platform unavailability. No questions asked.',
  faqs: [
    {
      q: 'When does the 14-day refund window begin?',
      a: 'The 14-day window begins the moment your payment is confirmed. If an assigned consultant fails to take the call or no slots are available within 14 days, you receive a full refund.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'All standard Indian payment methods through Razorpay: UPI (GPay, PhonePe, Paytm), Credit/Debit cards (Visa, MasterCard, RuPay), and Netbanking across all major banks.',
    },
    {
      q: 'Is GST included in the ₹1,499 price?',
      a: 'Yes, ₹1,499 is inclusive of all taxes. There are no hidden fees or recurring subscriptions.',
    },
    {
      q: 'Can my parents view my report after I unlock it?',
      a: 'Yes! You can generate a private, read-only link valid for 7 days to share your complete results with your parents or guardians.',
    },
  ],
};
