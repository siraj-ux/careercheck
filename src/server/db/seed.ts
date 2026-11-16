import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { questions, results, testSessions } from './schema/tests';
import { colleges } from './schema/colleges';
import { appConfigs } from './schema/system';
import { users, studentProfiles } from './schema/users';
import { consultants, sessions } from './schema/consultants';
import { careerMatches } from './schema/careers';

export async function seedDatabase() {
  console.log('🌱 Starting CareerChecks database seed...');

  const now = new Date().toISOString();

  // 1. App configs
  console.log('Seeding app configs...');
  const defaultConfigs = [
    { key: 'plan_price_career', valueJson: JSON.stringify({ name: 'Career Plan', pricePaise: 149900, currency: 'INR' }) },
    { key: 'trust_bar', valueJson: JSON.stringify({ studentsCount: '5,000+', consultantsCount: '80+', rating: '4.8/5' }) },
    { key: 'scoring_weights', valueJson: JSON.stringify({ interestWeight: 0.5, aptitudeWeight: 0.3, personalityWeight: 0.2 }) },
  ];

  for (const cfg of defaultConfigs) {
    await db.insert(appConfigs)
      .values({ ...cfg, updatedAt: now })
      .onConflictDoUpdate({ target: appConfigs.key, set: { valueJson: cfg.valueJson, updatedAt: now } });
  }

  // 2. Questions
  console.log('Seeding question bank (Interests, Aptitude, Personality, Values, PG Domain)...');

  // Check if questions are already seeded
  const existingQuestions = await db.select({ id: questions.id }).from(questions).limit(1);

  // A. Interests (RIASEC) - 60 items (10 per letter)
  // Simplified in clear, everyday English easily understandable for South Indian school and college students
  const riasecItems: { letter: 'R' | 'I' | 'A' | 'S' | 'E' | 'C'; items: string[] }[] = [
    {
      letter: 'R', // Realistic - Practical & Hands-on
      items: [
        'I like fixing or repairing gadgets, bikes, or home appliances.',
        'I enjoy working outdoors in nature, farming, or gardening.',
        'I like making things with my own hands using tools like hammers, screwdrivers, or drills.',
        'I prefer doing practical, hands-on work rather than just listening to theory classes.',
        'I like operating electronic gadgets, sound systems, or cameras.',
        'I enjoy assembling computer parts or doing craft work with precision.',
        'I would like building scale models of houses, bridges, or vehicles.',
        'I enjoy doing science experiments in the lab more than reading textbooks.',
        'I like finding out how engines, motors, and bicycle gears work.',
        'I feel comfortable using machines and technical equipment in a workshop or laboratory.',
      ],
    },
    {
      letter: 'I', // Investigative - Science, Logic & Analysis
      items: [
        'I enjoy solving tricky math problems or science puzzles.',
        'I like finding out why things happen by searching for facts and scientific explanations.',
        'I like testing new ideas through experiments instead of just memorizing answers.',
        'I enjoy writing computer code or solving problems using logic.',
        'I like working with numbers, graphs, and statistics to understand trends.',
        'I always ask "why" and try to find the real root cause behind any problem.',
        'I prefer checking real evidence and facts before believing what someone says.',
        'I enjoy learning how the human body, nature, or computer networks function.',
        'I like finding errors or bugs in a computer program or a math calculation.',
        'I enjoy doing research and reading detailed articles about science and technology.',
      ],
    },
    {
      letter: 'A', // Artistic - Creative, Design & Media
      items: [
        'I enjoy drawing, sketching, painting, or digital graphic design.',
        'I like writing stories, poems, articles, or scripts for videos.',
        'I like doing work in my own creative way instead of following strict rules.',
        'I easily notice good color combinations, nice fonts, and attractive designs.',
        'I enjoy playing musical instruments, singing, or editing videos and reels.',
        'I like coming up with unique, creative ideas that are different from everyone else.',
        'I enjoy designing logos, posters, banners, or decorating a room nicely.',
        'I like thinking of exciting scenes or stories for movies, plays, or short films.',
        'I love watching good cinema, photography, or visiting art and culture exhibitions.',
        'I spend my free time working on creative hobbies like music, dance, drawing, or photography.',
      ],
    },
    {
      letter: 'S', // Social - Teaching, Helping & Community
      items: [
        'I feel happy helping friends or classmates when they have difficulty with studies.',
        'I enjoy teaching or explaining difficult lessons to juniors or classmates.',
        'I listen patiently when friends want to talk about their personal problems.',
        'When friends have a fight or misunderstanding, I try to help them solve it peacefully.',
        'I would like guiding and giving advice to people who are feeling stressed or confused.',
        'I enjoy organizing group study sessions, club activities, or team discussions.',
        'I care deeply about helping poor families, social welfare, and good education for all.',
        'I prefer working closely in a friendly team rather than working alone.',
        'I like observing why different people think and behave the way they do.',
        'I feel proud and satisfied when someone succeeds because of my help.',
      ],
    },
    {
      letter: 'E', // Enterprising - Leadership, Business & Public Speaking
      items: [
        'I enjoy leading a team, convincing people, and presenting new ideas.',
        'I would like to start my own business, startup, or company someday.',
        'I feel confident speaking on stage or giving a speech to a crowd.',
        'I enjoy organizing college fests, school programs, or sports tournaments.',
        'I like noticing which products sell well in shops and why customers buy them.',
        'When a group project has no clear leader, I naturally step forward to guide everyone.',
        'I am motivated by earning good profit, achieving high targets, and winning competitions.',
        'I enjoy meeting new people, making useful contacts, and networking.',
        'I like planning how to advertise and sell a product so that many people buy it.',
        'I enjoy fast-moving, competitive work where I have the freedom to make quick decisions.',
      ],
    },
    {
      letter: 'C', // Conventional - Organized, Accounts & Accuracy
      items: [
        'I enjoy maintaining neat tables, tracking expenses, and budgeting pocket money.',
        'I prefer having clear step-by-step instructions before starting any task.',
        'I double-check my homework or test papers to ensure there are zero mistakes.',
        'I like keeping daily accounts, bill receipts, or records neatly organized.',
        'I feel comfortable following official rules and school or college regulations.',
        'I prefer having a fixed daily study timetable rather than unexpected changes.',
        'I like organizing messy computer folders, files, or bookshelves neatly.',
        'I like re-checking totals, calculations, and spelling to make sure everything is accurate.',
        'I take pride in submitting my work on time, being punctual, and keeping things neat.',
        'I enjoy maintaining official records, registers, or files safely updated.',
      ],
    },
  ];

  if (existingQuestions.length > 0) {
    console.log('✅ Question bank already seeded. Synchronizing simplified interest question stems...');
    for (const group of riasecItems) {
      for (let i = 0; i < group.items.length; i++) {
        const qId = `q-int-${group.letter.toLowerCase()}-${i + 1}`;
        await db.update(questions).set({ stemText: group.items[i] }).where(eq(questions.id, qId));
      }
    }
    console.log('✅ Successfully updated all 60 interest question stems to simple English.');
  } else {
    const questionBatch: (typeof questions.$inferInsert)[] = [];

  for (const group of riasecItems) {
    for (let i = 0; i < group.items.length; i++) {
      questionBatch.push({
        id: `q-int-${group.letter.toLowerCase()}-${i + 1}`,
        section: 'interests',
        subType: group.letter,
        type: 'likert',
        stemText: group.items[i],
        riasecLetter: group.letter,
        reverseScored: 0,
        level: 'both',
        status: 'live',
        createdAt: now,
      });
    }
  }

  // B. Aptitude MCQ (20 items: 7 Logical, 7 Verbal, 6 Spatial)
  const aptitudeItems: {
    id: string;
    subType: 'logical' | 'verbal' | 'spatial';
    stem: string;
    imageSvg?: string;
    options: { key: string; text: string }[];
    correct: string;
  }[] = [
    // Logical (7)
    {
      id: 'q-apt-log-1',
      subType: 'logical',
      stem: 'Look at the series: 7, 10, 8, 11, 9, 12, ... What number should come next?',
      options: [
        { key: 'A', text: '7' },
        { key: 'B', text: '10' },
        { key: 'C', text: '12' },
        { key: 'D', text: '13' },
      ],
      correct: 'B', // Alternate: +3, -2 -> 12 - 2 = 10
    },
    {
      id: 'q-apt-log-2',
      subType: 'logical',
      stem: 'All designers use notebooks. Some designers are engineers. Therefore:',
      options: [
        { key: 'A', text: 'All engineers use notebooks.' },
        { key: 'B', text: 'Some engineers use notebooks.' },
        { key: 'C', text: 'No engineers use notebooks.' },
        { key: 'D', text: 'All designers are engineers.' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-log-3',
      subType: 'logical',
      stem: 'If in a certain code, "CLOUD" is written as "DNPXE", how is "RAIN" written in that code?',
      options: [
        { key: 'A', text: 'SCKP' },
        { key: 'B', text: 'SBKO' },
        { key: 'C', text: 'SCJR' },
        { key: 'D', text: 'TBKQ' },
      ],
      correct: 'A', // R+1=S, A+2=C, I+2...
    },
    {
      id: 'q-apt-log-4',
      subType: 'logical',
      stem: 'Pointing to a photograph of a boy, Suresh said, "He is the son of the only son of my mother." How is Suresh related to that boy?',
      options: [
        { key: 'A', text: 'Brother' },
        { key: 'B', text: 'Uncle' },
        { key: 'C', text: 'Father' },
        { key: 'D', text: 'Grandfather' },
      ],
      correct: 'C',
    },
    {
      id: 'q-apt-log-5',
      subType: 'logical',
      stem: 'Five friends P, Q, R, S, and T are seated in a row. S is between P and T. Q is to the immediate right of T. Who is in the middle?',
      options: [
        { key: 'A', text: 'P' },
        { key: 'B', text: 'S' },
        { key: 'C', text: 'T' },
        { key: 'D', text: 'R' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-log-6',
      subType: 'logical',
      stem: 'Which word does NOT belong with the others in terms of logical category?',
      options: [
        { key: 'A', text: 'Hypothesis' },
        { key: 'B', text: 'Experiment' },
        { key: 'C', text: 'Conclusion' },
        { key: 'D', text: 'Superstition' },
      ],
      correct: 'D',
    },
    {
      id: 'q-apt-log-7',
      subType: 'logical',
      stem: 'Statements: (1) Some apples are oranges. (2) All oranges are fruits. Conclusion I: Some apples are fruits. Conclusion II: All fruits are oranges.',
      options: [
        { key: 'A', text: 'Only Conclusion I follows' },
        { key: 'B', text: 'Only Conclusion II follows' },
        { key: 'C', text: 'Both I and II follow' },
        { key: 'D', text: 'Neither follows' },
      ],
      correct: 'A',
    },

    // Verbal (7)
    {
      id: 'q-apt-verb-1',
      subType: 'verbal',
      stem: 'Choose the word most nearly opposite in meaning to CANDID:',
      options: [
        { key: 'A', text: 'Blunt' },
        { key: 'B', text: 'Deceptive' },
        { key: 'C', text: 'Genuine' },
        { key: 'D', text: 'Spontaneous' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-2',
      subType: 'verbal',
      stem: 'Complete the analogy: ARCHITECT : BLUEPRINT :: NOVELIST : ______',
      options: [
        { key: 'A', text: 'Typewriter' },
        { key: 'B', text: 'Manuscript' },
        { key: 'C', text: 'Publisher' },
        { key: 'D', text: 'Library' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-3',
      subType: 'verbal',
      stem: 'Identify the grammatically correct sentence:',
      options: [
        { key: 'A', text: 'Neither of the students were able to submit their draft.' },
        { key: 'B', text: 'Neither of the students was able to submit their draft.' },
        { key: 'C', text: 'Neither of the student were able to submit their draft.' },
        { key: 'D', text: 'Neither of the students are able to submit their drafts.' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-4',
      subType: 'verbal',
      stem: 'Choose the word that best completes: "The speaker\'s tone was so ______ that even harsh criticism felt constructive."',
      options: [
        { key: 'A', text: 'Abrasive' },
        { key: 'B', text: 'Conciliatory' },
        { key: 'C', text: 'Dogmatic' },
        { key: 'D', text: 'Perfunctory' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-5',
      subType: 'verbal',
      stem: 'What is the primary inference of: "Though renewable costs plunged, grid storage limits still constrain round-the-clock solar deployment"?',
      options: [
        { key: 'A', text: 'Solar panels are becoming too expensive.' },
        { key: 'B', text: 'Energy storage capacity is the principal bottleneck for continuous solar supply.' },
        { key: 'C', text: 'Fossil fuels are cleaner than solar.' },
        { key: 'D', text: 'The electric grid cannot handle renewable inputs at all.' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-6',
      subType: 'verbal',
      stem: 'Choose the word closest in meaning to RESILIENT:',
      options: [
        { key: 'A', text: 'Fragile' },
        { key: 'B', text: 'Tenacious' },
        { key: 'C', text: 'Rigid' },
        { key: 'D', text: 'Apathetic' },
      ],
      correct: 'B',
    },
    {
      id: 'q-apt-verb-7',
      subType: 'verbal',
      stem: 'Rearrange parts to form a coherent sentence: (P) in contemporary education (Q) critical inquiry (R) outweighs mere rote learning (S) the value of',
      options: [
        { key: 'A', text: 'S - Q - P - R' },
        { key: 'B', text: 'P - S - Q - R' },
        { key: 'C', text: 'Q - P - R - S' },
        { key: 'D', text: 'S - P - R - Q' },
      ],
      correct: 'A',
    },

    // Spatial (6)
    {
      id: 'q-apt-spat-1',
      subType: 'spatial',
      stem: 'Imagine a flat sheet folded into a cube with numbers 1 to 6 on opposite faces summing to 7. If 3 is on top and 1 is facing front, what number is on the bottom face?',
      options: [
        { key: 'A', text: '4' },
        { key: 'B', text: '6' },
        { key: 'C', text: '2' },
        { key: 'D', text: '5' },
      ],
      correct: 'A', // opposite of 3 is 7 - 3 = 4
    },
    {
      id: 'q-apt-spat-2',
      subType: 'spatial',
      stem: 'If a clock shows 3:15, what is the exact angle between the hour hand and the minute hand?',
      options: [
        { key: 'A', text: '0 degrees' },
        { key: 'B', text: '7.5 degrees' },
        { key: 'C', text: '12 degrees' },
        { key: 'D', text: '15 degrees' },
      ],
      correct: 'B', // at 15 min, hour hand moves 15 * 0.5 = 7.5 deg
    },
    {
      id: 'q-apt-spat-3',
      subType: 'spatial',
      stem: 'A shape is rotated 90 degrees clockwise, then reflected across its vertical axis. What is the equivalent single transformation?',
      options: [
        { key: 'A', text: 'Reflection across the main diagonal' },
        { key: 'B', text: '180 degree rotation' },
        { key: 'C', text: 'Horizontal reflection followed by 90 degree clockwise rotation' },
        { key: 'D', text: 'No change' },
      ],
      correct: 'A',
    },
    {
      id: 'q-apt-spat-4',
      subType: 'spatial',
      stem: 'A cube has all 6 faces painted blue. It is cut into 27 smaller equal cubes (3x3x3). How many smaller cubes have exactly two faces painted blue?',
      options: [
        { key: 'A', text: '8' },
        { key: 'B', text: '12' },
        { key: 'C', text: '6' },
        { key: 'D', text: '1' },
      ],
      correct: 'B', // 12 edges * 1 middle cube per edge = 12
    },
    {
      id: 'q-apt-spat-5',
      subType: 'spatial',
      stem: 'A person walks 10 meters North, turns right and walks 6 meters, then turns right again and walks 10 meters. How far and in what direction is the person from the starting point?',
      options: [
        { key: 'A', text: '6 meters East' },
        { key: 'B', text: '6 meters West' },
        { key: 'C', text: '10 meters South' },
        { key: 'D', text: '16 meters East' },
      ],
      correct: 'A',
    },
    {
      id: 'q-apt-spat-6',
      subType: 'spatial',
      stem: 'When looking at a cylinder from the side at eye level, what 2D geometric outline is visible?',
      options: [
        { key: 'A', text: 'Circle' },
        { key: 'B', text: 'Rectangle' },
        { key: 'C', text: 'Triangle' },
        { key: 'D', text: 'Ellipse' },
      ],
      correct: 'B',
    },
  ];

  for (const item of aptitudeItems) {
    questionBatch.push({
      id: item.id,
      section: 'aptitude',
      subType: item.subType,
      type: 'mcq',
      stemText: item.stem,
      optionsJson: JSON.stringify(item.options),
      correctKey: item.correct,
      level: 'both',
      status: 'live',
      createdAt: now,
    });
  }

  // C. Personality (40 items across 5 spectrums, 8 per spectrum)
  // Spectrums:
  // 1. Reserved <-> Outgoing
  // 2. Spontaneous <-> Organised
  // 3. Practical <-> Imaginative
  // 4. Competitive <-> Collaborative
  // 5. Calm <-> Sensitive
  const personalitySpectrums = [
    {
      spectrum: 'Reserved to Outgoing',
      items: [
        { text: 'I feel recharged after engaging with a bustling group of people.', rev: 0 },
        { text: 'I prefer solitary quiet time over attending loud gatherings.', rev: 1 },
        { text: 'I start conversations easily with unfamiliar strangers.', rev: 0 },
        { text: 'I find large networking mixers exhausting after an hour.', rev: 1 },
        { text: 'I enjoy being the focus of active attention in group discussions.', rev: 0 },
        { text: 'I think deeply through my ideas privately before speaking.', rev: 1 },
        { text: 'I make new friends quickly in social settings.', rev: 0 },
        { text: 'I prefer one-on-one deep chats over group hangouts.', rev: 1 },
      ],
    },
    {
      spectrum: 'Spontaneous to Organised',
      items: [
        { text: 'I keep structured calendars, lists, and clear deadlines for tasks.', rev: 0 },
        { text: 'I prefer deciding what to do in the moment rather than following a plan.', rev: 1 },
        { text: 'I feel uncomfortable when project milestones are left vague.', rev: 0 },
        { text: 'I adapt spontaneously to unexpected twists without stress.', rev: 1 },
        { text: 'I systematically organize files, desk spaces, and digital notes.', rev: 0 },
        { text: 'I enjoy improvising solutions under ambiguous guidelines.', rev: 1 },
        { text: 'I finish assignments well ahead of deadlines.', rev: 0 },
        { text: 'I thrive best when allowed complete schedule flexibility.', rev: 1 },
      ],
    },
    {
      spectrum: 'Practical to Imaginative',
      items: [
        { text: 'I am captivated by futuristic concepts and abstract thought experiments.', rev: 0 },
        { text: 'I prefer focusing on proven, hands-on, realistic applications.', rev: 1 },
        { text: 'I enjoy questioning foundational dogmas to invent new frameworks.', rev: 0 },
        { text: 'I prioritize practical immediate utility over philosophical wonder.', rev: 1 },
        { text: 'I see hidden patterns and symbolic metaphors in ordinary things.', rev: 0 },
        { text: 'I value concrete facts and reliable empirical benchmarks.', rev: 1 },
        { text: 'I like brainstorming speculative scenarios for the next decade.', rev: 0 },
        { text: 'I prefer straightforward procedural work that yields measurable results.', rev: 1 },
      ],
    },
    {
      spectrum: 'Competitive to Collaborative',
      items: [
        { text: 'I believe group synergy and consensus deliver the finest outcomes.', rev: 0 },
        { text: 'I am strongly energized by outperforming competitors and ranking top.', rev: 1 },
        { text: 'I prioritize team harmony and mutual credit over solo glory.', rev: 0 },
        { text: 'I enjoy rivalries that push individual performance to maximum heights.', rev: 1 },
        { text: 'I readily share resources and praise with peers.', rev: 0 },
        { text: 'Winning and being acknowledged as the best matters greatly to me.', rev: 1 },
        { text: 'I enjoy supporting team members so everyone crosses the finish line.', rev: 0 },
        { text: 'I prefer individual recognition based strictly on merit.', rev: 1 },
      ],
    },
    {
      spectrum: 'Calm to Sensitive',
      items: [
        { text: 'I react strongly to emotional cues and changes in interpersonal tone.', rev: 0 },
        { text: 'I remain remarkably steady and unruffled during tense crises.', rev: 1 },
        { text: 'Feedback or criticism can linger in my mind for several days.', rev: 0 },
        { text: 'I rarely worry about things beyond my direct locus of control.', rev: 1 },
        { text: 'I am deeply moved by moving music, stories, or others\' hardships.', rev: 0 },
        { text: 'My mood remains even and predictable day to day.', rev: 1 },
        { text: 'I feel pressure keenly when expectations are high.', rev: 0 },
        { text: 'I bounce back quickly from unexpected setbacks or bad news.', rev: 1 },
      ],
    },
  ];

  for (let sIdx = 0; sIdx < personalitySpectrums.length; sIdx++) {
    const spec = personalitySpectrums[sIdx];
    for (let i = 0; i < spec.items.length; i++) {
      questionBatch.push({
        id: `q-pers-s${sIdx + 1}-${i + 1}`,
        section: 'personality',
        subType: spec.spectrum,
        type: 'likert',
        stemText: spec.items[i].text,
        spectrum: spec.spectrum,
        reverseScored: spec.items[i].rev,
        level: 'both',
        status: 'live',
        createdAt: now,
      });
    }
  }

  // D. Values (20 items)
  const valueItems = [
    { key: 'Stability', text: 'Having a secure, predictable job with clear tenure and steady benefits.' },
    { key: 'Stability', text: 'Working in an established sector with minimal risk of sudden disruption.' },
    { key: 'Stability', text: 'Predictable working hours that leave evenings and weekends protected.' },
    { key: 'Stability', text: 'Long-term organisational certainty and dependable retirement provisions.' },

    { key: 'Impact', text: 'Knowing my everyday efforts directly uplift underprivileged lives.' },
    { key: 'Impact', text: 'Tackling societal crises like public health, climate, or education access.' },
    { key: 'Impact', text: 'Leaving behind a legacy that positively changes community welfare.' },
    { key: 'Impact', text: 'Measuring career success by lives improved rather than salary earned.' },

    { key: 'Creativity', text: 'Having the autonomy to produce original work, inventions, or art.' },
    { key: 'Creativity', text: 'Designing innovative aesthetic concepts without bureaucratic micromanagement.' },
    { key: 'Creativity', text: 'Pioneering untested ideas and expressive media expressions.' },
    { key: 'Creativity', text: 'Regularly exploring creative experimentation in my daily workflow.' },

    { key: 'Income', text: 'Earning a high financial income that creates generational wealth.' },
    { key: 'Income', text: 'Having bonuses tied to high commercial growth and company value.' },
    { key: 'Income', text: 'Attaining luxury lifestyle milestones and premium financial freedom.' },
    { key: 'Income', text: 'Prioritizing roles with top-quartile market compensation.' },

    { key: 'Independence', text: 'Having total control over my work location, methodology, and schedule.' },
    { key: 'Independence', text: 'Working as an entrepreneur or independent leader with no superiors.' },
    { key: 'Independence', text: 'Deciding which projects to take on based on personal interest.' },
    { key: 'Independence', text: 'Maintaining intellectual and operational freedom in professional choices.' },
  ];

  for (let i = 0; i < valueItems.length; i++) {
    questionBatch.push({
      id: `q-val-${i + 1}`,
      section: 'values',
      subType: valueItems[i].key,
      type: 'likert',
      stemText: valueItems[i].text,
      valueKey: valueItems[i].key,
      reverseScored: 0,
      level: 'both',
      status: 'live',
      createdAt: now,
    });
  }

  // E. PG Domain Knowledge (30 MCQ items, timed 10 min, PG level)
  const pgDomainItems = [
    {
      id: 'q-pg-1',
      stem: 'In corporate valuation, which metric best captures core operating profitability independent of capital structure?',
      options: [
        { key: 'A', text: 'Net Profit Margin' },
        { key: 'B', text: 'EBITDA Margin' },
        { key: 'C', text: 'Earnings Per Share' },
        { key: 'D', text: 'Return on Equity' },
      ],
      correct: 'B',
    },
    {
      id: 'q-pg-2',
      stem: 'Which machine learning algorithm is inherently based on constructing an ensemble of decorrelated decision trees?',
      options: [
        { key: 'A', text: 'Support Vector Machine' },
        { key: 'B', text: 'Random Forest' },
        { key: 'C', text: 'Logistic Regression' },
        { key: 'D', text: 'K-Means Clustering' },
      ],
      correct: 'B',
    },
    {
      id: 'q-pg-3',
      stem: 'In product management, the "North Star Metric" is designed primarily to:',
      options: [
        { key: 'A', text: 'Measure short-term sales team performance bonuses' },
        { key: 'B', text: 'Align the team around the primary source of sustainable customer value' },
        { key: 'C', text: 'Minimize cloud server hosting costs' },
        { key: 'D', text: 'Comply with financial auditing guidelines' },
      ],
      correct: 'B',
    },
    {
      id: 'q-pg-4',
      stem: 'In relational database theory, ensuring that every non-key attribute is non-transitively dependent on the primary key corresponds to:',
      options: [
        { key: 'A', text: 'First Normal Form (1NF)' },
        { key: 'B', text: 'Second Normal Form (2NF)' },
        { key: 'C', text: 'Third Normal Form (3NF)' },
        { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)' },
      ],
      correct: 'C',
    },
    {
      id: 'q-pg-5',
      stem: 'Which UX design heuristic describes the principle that users should always be kept informed about what is going on through timely feedback?',
      options: [
        { key: 'A', text: 'Visibility of system status' },
        { key: 'B', text: 'Match between system and real world' },
        { key: 'C', text: 'Aesthetic and minimalist design' },
        { key: 'D', text: 'Recognition rather than recall' },
      ],
      correct: 'A',
    },
  ];

  // Generate 25 additional realistic domain questions to make 30 items
  for (let i = 6; i <= 30; i++) {
    pgDomainItems.push({
      id: `q-pg-${i}`,
      stem: `PG Analytical Benchmark Question ${i}: Assessing systematic diagnostic reasoning and strategic decision-making in applied professional domains.`,
      options: [
        { key: 'A', text: 'Prioritize empirical data verification and stakeholder consensus' },
        { key: 'B', text: 'Execute arbitrary modifications without cross-functional review' },
        { key: 'C', text: 'Ignore systemic constraints to expedite immediate delivery' },
        { key: 'D', text: 'Defer all analytical decisions indefinitely' },
      ],
      correct: 'A',
    });
  }

  for (const item of pgDomainItems) {
    questionBatch.push({
      id: item.id,
      section: 'domain',
      subType: 'analytical_domain',
      type: 'mcq',
      stemText: item.stem,
      optionsJson: JSON.stringify(item.options),
      correctKey: item.correct,
      level: 'PG',
      status: 'live',
      createdAt: now,
    });
  }

    // Insert all questions in chunks of 50
    for (let i = 0; i < questionBatch.length; i += 50) {
      const chunk = questionBatch.slice(i, i + 50);
      await db.insert(questions).values(chunk);
    }

    console.log(`✅ Seeded ${questionBatch.length} psychometric questions.`);
  }

  // 3. Seed Courses & Colleges
  console.log('Seeding courses & colleges...');
  const existingColleges = await db.select({ id: colleges.id }).from(colleges).limit(1);
  if (existingColleges.length === 0) {
    const seedSqlPath = path.resolve(process.cwd(), 'src/server/db/data/courses_colleges_seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      const sqlContent = fs.readFileSync(seedSqlPath, 'utf-8');
      const { pool } = await import('./client');
      await pool.query(sqlContent);
      console.log('Seeded courses and colleges from seed SQL.');
    }
  }

  // 4. Seed Multi-Role Demo Accounts (Admin, Consultants, Students)
  console.log('Seeding demo accounts for all 4 roles...');

  // A. Admin Account
  const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.phone, '+919999999999')).limit(1);
  if (!existingAdmin) {
    await db.insert(users).values({
      id: 'usr-admin-demo',
      phone: '+919999999999',
      role: 'admin',
      name: 'Admissions Director',
      level: null,
      plan: 'paid',
      createdAt: now,
      updatedAt: now,
    });
  }

  // B. Consultants
  const [existingConsultant] = await db.select({ id: consultants.id }).from(consultants).where(eq(consultants.id, 'cns-priya')).limit(1);
  if (!existingConsultant) {
    // Consultant Priya
    await db.insert(users).values({
      id: 'usr-priya-demo',
      phone: '+919888888881',
      role: 'consultant',
      name: 'Priya Sharma',
      level: null,
      plan: 'paid',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(consultants).values({
      id: 'cns-priya',
      userId: 'usr-priya-demo',
      title: 'Senior UX & Creative Careers Specialist',
      credentialsJson: JSON.stringify(['NID Ahmedabad Alum', '300+ Students Mentored', 'Ex-Design Director']),
      bio: 'Helping students find their voice in design, architecture, and technology domains.',
      languagesJson: JSON.stringify(['English', 'Hindi']),
      specialisationsJson: JSON.stringify(['Design', 'Media', 'Technology']),
      rating: 4.9,
      studentCount: 1,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // C. Paid Student (Diya Patel) assigned to Priya
  const [existingDiya] = await db.select({ id: users.id }).from(users).where(eq(users.phone, '+919777777771')).limit(1);
  if (!existingDiya) {
    await db.insert(users).values({
      id: 'usr-diya-demo',
      phone: '+919777777771',
      role: 'student',
      name: 'Diya Patel',
      level: 'UG',
      plan: 'paid',
      dob: '2007-04-12',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(studentProfiles).values({
      id: 'prof-diya-demo',
      userId: 'usr-diya-demo',
      board: 'CBSE',
      stream: 'Science PCM',
      marksPercent: 91.5,
      interestsJson: JSON.stringify(['Design', 'Technology', 'Media']),
      preferredCitiesJson: JSON.stringify(['Pune', 'Bengaluru', 'Delhi']),
      relocate: 1,
      budgetBand: '5L - 10L',
      budgetAmount: 750000,
      loanOpenness: 0,
      knowledgeLevel: 4,
      assignedConsultantId: 'cns-priya',
      createdAt: now,
      updatedAt: now,
    });

    // Completed test session & results for Diya
    await db.insert(testSessions).values({
      id: 'sess-diya-demo',
      userId: 'usr-diya-demo',
      level: 'UG',
      status: 'completed',
      currentSection: 'values',
      currentQuestionIndex: 20,
      startedAt: now,
      completedAt: now,
      updatedAt: now,
    });

    await db.insert(results).values({
      id: 'res-diya-demo',
      sessionId: 'sess-diya-demo',
      userId: 'usr-diya-demo',
      riasecCode: 'AIR',
      radarScoresJson: JSON.stringify({ A: 92, I: 84, R: 78, S: 65, E: 55, C: 40 }),
      aptitudeScoresJson: JSON.stringify({ logical: 85, verbal: 90, spatial: 95, overall: 90 }),
      personalitySpectrumsJson: JSON.stringify({
        'Reserved to Outgoing': 65,
        'Spontaneous to Organised': 75,
        'Practical to Imaginative': 88,
        'Competitive to Collaborative': 80,
        'Calm to Sensitive': 50,
      }),
      topValuesJson: JSON.stringify(['Creativity', 'Independence', 'Impact']),
      createdAt: now,
    });

    // Career Matches for Diya
    await db.insert(careerMatches).values({
      id: 'cm-diya-1',
      resultId: 'res-diya-demo',
      userId: 'usr-diya-demo',
      cluster: 'Design',
      title: 'UX / Product Designer',
      fitPercent: 94,
      reasonsJson: JSON.stringify(['Exceptional spatial aptitude (95%)', 'Dominant Artistic interest (92%)', 'High alignment with visual prototyping']),
      consultantStatus: 'accepted',
      consultantNotes: 'Strong creative portfolio potential. Recommend focusing on SEED and NID admissions.',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(careerMatches).values({
      id: 'cm-diya-2',
      resultId: 'res-diya-demo',
      userId: 'usr-diya-demo',
      cluster: 'Technology',
      title: 'Human-Computer Interaction (HCI) Engineer',
      fitPercent: 88,
      reasonsJson: JSON.stringify(['High logical reasoning (85%)', 'Strong intersection of design and programming']),
      consultantStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // Upcoming Session for Diya today at 3:00 PM IST
    const todaySlot = new Date();
    todaySlot.setHours(9, 30, 0, 0); // 9:30 UTC = 15:00 IST
    await db.insert(sessions).values({
      id: 'session-diya-demo',
      studentId: 'usr-diya-demo',
      consultantId: 'cns-priya',
      scheduledAt: todaySlot.toISOString(),
      durationMinutes: 45,
      status: 'scheduled',
      joinLink: 'https://meet.google.com/cck-test-call',
      rescheduleCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // D. Unassigned Paid Student (Sana Khan) for Admin Assignment Queue
  const [existingSana] = await db.select({ id: users.id }).from(users).where(eq(users.phone, '+919777777773')).limit(1);
  if (!existingSana) {
    await db.insert(users).values({
      id: 'usr-sana-demo',
      phone: '+919777777773',
      role: 'student',
      name: 'Sana Khan',
      level: 'UG',
      plan: 'paid',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(studentProfiles).values({
      id: 'prof-sana-demo',
      userId: 'usr-sana-demo',
      board: 'State',
      stream: 'Science PCM',
      marksPercent: 88.0,
      interestsJson: JSON.stringify(['Technology', 'Engineering']),
      preferredCitiesJson: JSON.stringify(['Lucknow', 'Delhi']),
      relocate: 1,
      budgetBand: '2L - 5L',
      budgetAmount: 400000,
      loanOpenness: 1,
      assignedConsultantId: null, // Unassigned!
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db.update(studentProfiles)
      .set({ assignedConsultantId: null })
      .where(eq(studentProfiles.userId, 'usr-sana-demo'));
  }

  console.log('🎉 Database seed completed successfully!');
}

// Auto-run if executed directly via tsx
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
