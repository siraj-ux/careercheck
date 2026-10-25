import { RiasecLetter, SpectrumKey } from './scoring';

export interface CareerArchetype {
  id: string;
  cluster: string;
  title: string;
  description: string;
  riasecWeights: Record<RiasecLetter, number>;
  aptitudeReq: {
    logical: number;
    verbal: number;
    spatial: number;
  };
  personalityProfile: Partial<Record<SpectrumKey, { ideal: number }>>;
  valueTags: string[];
  levels: ('UG' | 'PG')[];
}

export const CAREER_CATALOG: CareerArchetype[] = [
  {
    id: 'car-ux-designer',
    cluster: 'Design & Creative',
    title: 'UI/UX Designer',
    description: 'Crafts intuitive, research-backed digital interactions, mobile applications, and visual design systems.',
    riasecWeights: { R: 25, I: 65, A: 95, S: 70, E: 45, C: 40 },
    aptitudeReq: { logical: 65, verbal: 70, spatial: 85 },
    personalityProfile: {
      practical_imaginative: { ideal: 85 },
      competitive_collaborative: { ideal: 75 },
    },
    valueTags: ['Creativity', 'Impact', 'Continuous Learning'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-data-scientist',
    cluster: 'Data & Analytics',
    title: 'Data Scientist & AI Specialist',
    description: 'Builds machine learning models, statistical forecasting algorithms, and extracts predictive insights from complex datasets.',
    riasecWeights: { R: 30, I: 98, A: 40, S: 30, E: 55, C: 80 },
    aptitudeReq: { logical: 90, verbal: 65, spatial: 70 },
    personalityProfile: {
      spontaneous_organised: { ideal: 80 },
      practical_imaginative: { ideal: 70 },
    },
    valueTags: ['Continuous Learning', 'Income', 'Independence'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-product-manager',
    cluster: 'Business & Leadership',
    title: 'Product Manager',
    description: 'Orchestrates the lifecycle of tech products from user discovery through engineering delivery and market launch.',
    riasecWeights: { R: 20, I: 75, A: 60, S: 80, E: 90, C: 65 },
    aptitudeReq: { logical: 80, verbal: 85, spatial: 60 },
    personalityProfile: {
      reserved_outgoing: { ideal: 75 },
      competitive_collaborative: { ideal: 80 },
    },
    valueTags: ['Leadership', 'Impact', 'Income'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-software-architect',
    cluster: 'Technology & AI',
    title: 'Cloud & Software Architect',
    description: 'Designs large-scale distributed cloud systems, resilient backend microservices, and secure technical architectures.',
    riasecWeights: { R: 55, I: 95, A: 45, S: 25, E: 50, C: 85 },
    aptitudeReq: { logical: 90, verbal: 65, spatial: 80 },
    personalityProfile: {
      spontaneous_organised: { ideal: 85 },
      calm_sensitive: { ideal: 30 },
    },
    valueTags: ['Independence', 'Income', 'Continuous Learning'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-animator',
    cluster: 'Design & Creative',
    title: '3D Animator & Visual Effects Artist',
    description: 'Creates expressive 3D character animations, cinematic VFX, and dynamic virtual environments for films and gaming.',
    riasecWeights: { R: 60, I: 40, A: 95, S: 30, E: 35, C: 45 },
    aptitudeReq: { logical: 55, verbal: 50, spatial: 92 },
    personalityProfile: {
      practical_imaginative: { ideal: 90 },
      reserved_outgoing: { ideal: 40 },
    },
    valueTags: ['Creativity', 'Independence'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-clinical-psychologist',
    cluster: 'Healthcare & Psychology',
    title: 'Clinical Psychologist & Counselor',
    description: 'Assesses emotional wellbeing, facilitates psychotherapy, and designs personalized cognitive behavioral recovery plans.',
    riasecWeights: { R: 15, I: 85, A: 50, S: 95, E: 35, C: 45 },
    aptitudeReq: { logical: 70, verbal: 90, spatial: 45 },
    personalityProfile: {
      calm_sensitive: { ideal: 80 },
      competitive_collaborative: { ideal: 85 },
    },
    valueTags: ['Impact', 'Stability', 'Continuous Learning'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-investment-analyst',
    cluster: 'Finance & Economics',
    title: 'Investment Banker & Financial Analyst',
    description: 'Evaluates public and private market investments, models valuation scenarios, and guides capital allocation decisions.',
    riasecWeights: { R: 20, I: 85, A: 25, S: 35, E: 90, C: 92 },
    aptitudeReq: { logical: 88, verbal: 75, spatial: 55 },
    personalityProfile: {
      competitive_collaborative: { ideal: 30 },
      spontaneous_organised: { ideal: 90 },
    },
    valueTags: ['Income', 'Leadership', 'Stability'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-robotics-engineer',
    cluster: 'Engineering & Robotics',
    title: 'Robotics & Embedded Systems Engineer',
    description: 'Integrates microcontrollers, sensors, and mechanical actuators to build autonomous robots and IoT devices.',
    riasecWeights: { R: 92, I: 90, A: 40, S: 25, E: 45, C: 70 },
    aptitudeReq: { logical: 85, verbal: 60, spatial: 90 },
    personalityProfile: {
      practical_imaginative: { ideal: 40 },
      spontaneous_organised: { ideal: 80 },
    },
    valueTags: ['Continuous Learning', 'Independence', 'Creativity'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-content-strategist',
    cluster: 'Media & Content',
    title: 'Brand Storyteller & Content Strategist',
    description: 'Directs narrative voice, editorial guidelines, and multimedia storytelling to cultivate deeply engaged brand communities.',
    riasecWeights: { R: 15, I: 55, A: 92, S: 75, E: 75, C: 40 },
    aptitudeReq: { logical: 60, verbal: 92, spatial: 60 },
    personalityProfile: {
      reserved_outgoing: { ideal: 70 },
      practical_imaginative: { ideal: 85 },
    },
    valueTags: ['Creativity', 'Impact', 'Independence'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-environmental-scientist',
    cluster: 'Healthcare & Sciences',
    title: 'Environmental Scientist & Sustainability Lead',
    description: 'Researches climate risk models, ecological conservation solutions, and implements carbon-reduction corporate policies.',
    riasecWeights: { R: 75, I: 92, A: 35, S: 65, E: 45, C: 60 },
    aptitudeReq: { logical: 82, verbal: 78, spatial: 65 },
    personalityProfile: {
      calm_sensitive: { ideal: 70 },
      practical_imaginative: { ideal: 60 },
    },
    valueTags: ['Impact', 'Continuous Learning', 'Stability'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-management-consultant',
    cluster: 'Business & Leadership',
    title: 'Management Consultant',
    description: 'Advises enterprise executives on organizational restructuring, digital transformation, and operational growth strategies.',
    riasecWeights: { R: 20, I: 80, A: 45, S: 70, E: 92, C: 75 },
    aptitudeReq: { logical: 88, verbal: 88, spatial: 60 },
    personalityProfile: {
      reserved_outgoing: { ideal: 80 },
      competitive_collaborative: { ideal: 50 },
    },
    valueTags: ['Leadership', 'Income', 'Continuous Learning'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-biomedical-engineer',
    cluster: 'Engineering & Robotics',
    title: 'Biomedical Device Engineer',
    description: 'Designs assistive medical hardware, prosthetic devices, and smart diagnostic imaging technology.',
    riasecWeights: { R: 85, I: 90, A: 45, S: 60, E: 40, C: 70 },
    aptitudeReq: { logical: 85, verbal: 65, spatial: 85 },
    personalityProfile: {
      calm_sensitive: { ideal: 40 },
      spontaneous_organised: { ideal: 85 },
    },
    valueTags: ['Impact', 'Continuous Learning', 'Stability'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-corporate-lawyer',
    cluster: 'Business & Leadership',
    title: 'Corporate & Regulatory Attorney',
    description: 'Navigates commercial contracts, intellectual property rights, mergers and acquisitions, and regulatory compliance.',
    riasecWeights: { R: 15, I: 85, A: 40, S: 60, E: 88, C: 88 },
    aptitudeReq: { logical: 88, verbal: 95, spatial: 40 },
    personalityProfile: {
      competitive_collaborative: { ideal: 35 },
      spontaneous_organised: { ideal: 90 },
    },
    valueTags: ['Income', 'Stability', 'Leadership'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-cybersecurity-specialist',
    cluster: 'Technology & AI',
    title: 'Cybersecurity & Ethical Hacker',
    description: 'Proactively identifies zero-day vulnerabilities, audits network firewalls, and defends critical digital infrastructure.',
    riasecWeights: { R: 60, I: 95, A: 35, S: 25, E: 55, C: 85 },
    aptitudeReq: { logical: 92, verbal: 65, spatial: 75 },
    personalityProfile: {
      spontaneous_organised: { ideal: 80 },
      reserved_outgoing: { ideal: 30 },
    },
    valueTags: ['Independence', 'Income', 'Continuous Learning'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-game-developer',
    cluster: 'Technology & AI',
    title: 'Gameplay Engineer & World Builder',
    description: 'Programs gameplay physics mechanics, multiplayer networking protocols, and interactive game loops in game engines.',
    riasecWeights: { R: 50, I: 85, A: 88, S: 30, E: 45, C: 65 },
    aptitudeReq: { logical: 85, verbal: 60, spatial: 88 },
    personalityProfile: {
      practical_imaginative: { ideal: 85 },
      spontaneous_organised: { ideal: 65 },
    },
    valueTags: ['Creativity', 'Continuous Learning', 'Independence'],
    levels: ['UG', 'PG'],
  },
  {
    id: 'car-social-entrepreneur',
    cluster: 'Business & Leadership',
    title: 'Social Entrepreneur',
    description: 'Builds scalable mission-driven enterprises addressing education access, clean water, or rural livelihood enablement.',
    riasecWeights: { R: 30, I: 65, A: 65, S: 90, E: 95, C: 50 },
    aptitudeReq: { logical: 75, verbal: 82, spatial: 55 },
    personalityProfile: {
      reserved_outgoing: { ideal: 85 },
      competitive_collaborative: { ideal: 80 },
    },
    valueTags: ['Impact', 'Leadership', 'Creativity'],
    levels: ['UG', 'PG'],
  },
];
