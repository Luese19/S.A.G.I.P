// Sample DRRM Quiz Data aligned with NDRRMP (National Disaster Risk Reduction and Management Plan)
// Includes Pasig-specific localization with hotlines and hazard links

export interface SampleQuestion {
  id: string;
  type: 'MC' | 'TF' | 'DND' | 'SEQ';
  text: string;
  choices?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  timeLimitMs: number;
  pointsBase: number;
  theme: 'Prevention' | 'Preparedness' | 'Response' | 'Recovery';
  localizedData?: {
    pasig?: {
      hotlines?: string[];
      hazardLinks?: string[];
    };
  };
}

export interface SampleQuiz {
  id: string;
  title: string;
  description: string;
  theme: 'Prevention' | 'Preparedness' | 'Response' | 'Recovery';
  questions: string[]; // Question IDs
  localizationTags: string[];
  isActive: boolean;
}

// Sample Questions covering all 4 thematic areas
export const sampleQuestions: SampleQuestion[] = [
  // PREVENTION THEME
  {
    id: 'prev_001',
    type: 'MC',
    text: 'What is the primary goal of disaster prevention in the context of DRRM?',
    choices: [
      { id: 'a', text: 'To eliminate all risks completely', isCorrect: false },
      { id: 'b', text: 'To minimize disaster risks and impacts', isCorrect: true },
      { id: 'c', text: 'To respond quickly after disasters occur', isCorrect: false },
      { id: 'd', text: 'To recover lost resources', isCorrect: false },
    ],
    explanation: 'Disaster prevention aims to minimize disaster risks and their potential impacts through proactive measures, not eliminate all risks completely.',
    timeLimitMs: 30000,
    pointsBase: 100,
    theme: 'Prevention',
    localizedData: {
      pasig: {
        hotlines: ['Pasig City DRRMO: (02) 8643-0000'],
        hazardLinks: ['https://pasigcity.gov.ph/disaster-preparedness/'],
      },
    },
  },
  {
    id: 'prev_002',
    type: 'TF',
    text: 'Pasig City is considered a high-risk area for flooding due to its proximity to the Pasig River and low-lying areas.',
    choices: [
      { id: 'true', text: 'True', isCorrect: true },
      { id: 'false', text: 'False', isCorrect: false },
    ],
    explanation: 'Pasig City faces significant flood risks due to its location along the Pasig River, with many areas below sea level and prone to flooding during heavy rains and typhoons.',
    timeLimitMs: 20000,
    pointsBase: 80,
    theme: 'Prevention',
    localizedData: {
      pasig: {
        hotlines: ['Pasig Emergency Hotline: 1623', 'MMDA Flood Control: (02) 882-4151'],
        hazardLinks: ['https://pasigcity.gov.ph/flood-control/'],
      },
    },
  },

  // PREPAREDNESS THEME
  {
    id: 'prep_001',
    type: 'MC',
    text: 'What should be included in a basic emergency preparedness kit for Pasig residents?',
    choices: [
      { id: 'a', text: 'Cash, important documents, and emergency contacts', isCorrect: false },
      { id: 'b', text: 'Water, non-perishable food, and first aid supplies', isCorrect: false },
      { id: 'c', text: 'Flashlight, battery-powered radio, and extra batteries', isCorrect: false },
      { id: 'd', text: 'All of the above', isCorrect: true },
    ],
    explanation: 'A comprehensive emergency kit should include water, food, first aid, important documents, flashlight, radio, and other essential items for at least 72 hours.',
    timeLimitMs: 45000,
    pointsBase: 120,
    theme: 'Preparedness',
    localizedData: {
      pasig: {
        hotlines: ['Pasig CDRRMO: (02) 8643-1111', 'Red Cross Pasig: (02) 8642-2222'],
        hazardLinks: ['https://pasigcity.gov.ph/emergency-kit/'],
      },
    },
  },
  {
    id: 'prep_002',
    type: 'MC',
    text: 'How far in advance should Pasig residents prepare for typhoon season?',
    choices: [
      { id: 'a', text: '1 week before', isCorrect: false },
      { id: 'b', text: '1 month before', isCorrect: false },
      { id: 'c', text: 'Before the season starts (June-November)', isCorrect: true },
      { id: 'd', text: 'Only when a typhoon is approaching', isCorrect: false },
    ],
    explanation: 'Typhoon preparedness should begin before the season starts in June, including checking emergency kits, securing property, and developing family emergency plans.',
    timeLimitMs: 30000,
    pointsBase: 100,
    theme: 'Preparedness',
  },

  // RESPONSE THEME
  {
    id: 'resp_001',
    type: 'MC',
    text: 'During a flood emergency in Pasig, what is the first thing residents should do?',
    choices: [
      { id: 'a', text: 'Call emergency services immediately', isCorrect: false },
      { id: 'b', text: 'Move to higher ground or upper floors', isCorrect: true },
      { id: 'c', text: 'Start sandbagging doors and windows', isCorrect: false },
      { id: 'd', text: 'Wait for official evacuation orders', isCorrect: false },
    ],
    explanation: 'During flooding, the immediate priority is personal safety. Move to higher ground first, then call emergency services if needed.',
    timeLimitMs: 25000,
    pointsBase: 90,
    theme: 'Response',
    localizedData: {
      pasig: {
        hotlines: ['Pasig Emergency: 911', 'Flood Control: (02) 8426-1461'],
        hazardLinks: ['https://pasigcity.gov.ph/flood-response/'],
      },
    },
  },
  {
    id: 'resp_002',
    type: 'TF',
    text: 'During an earthquake, you should run outside immediately to avoid building collapse.',
    choices: [
      { id: 'true', text: 'True', isCorrect: false },
      { id: 'false', text: 'False', isCorrect: true },
    ],
    explanation: 'During earthquakes, DROP, COVER, and HOLD ON under a sturdy table or desk. Running outside can be dangerous due to falling debris and power lines.',
    timeLimitMs: 20000,
    pointsBase: 80,
    theme: 'Response',
  },

  // RECOVERY THEME
  {
    id: 'rec_001',
    type: 'MC',
    text: 'What is the most important factor for successful disaster recovery in communities?',
    choices: [
      { id: 'a', text: 'Immediate financial assistance', isCorrect: false },
      { id: 'b', text: 'Community participation and resilience', isCorrect: true },
      { id: 'c', text: 'Government intervention only', isCorrect: false },
      { id: 'd', text: 'International aid organizations', isCorrect: false },
    ],
    explanation: 'Community participation and building local resilience are crucial for sustainable disaster recovery and long-term risk reduction.',
    timeLimitMs: 35000,
    pointsBase: 110,
    theme: 'Recovery',
  },
  {
    id: 'rec_002',
    type: 'MC',
    text: 'After a disaster in Pasig, what should residents do first regarding their damaged property?',
    choices: [
      { id: 'a', text: 'Start rebuilding immediately', isCorrect: false },
      { id: 'b', text: 'Document all damage with photos and reports', isCorrect: true },
      { id: 'c', text: 'Contact insurance companies only', isCorrect: false },
      { id: 'd', text: 'Wait for government assistance', isCorrect: false },
    ],
    explanation: 'Proper documentation of damage through photos, videos, and official reports is essential for insurance claims, government assistance, and recovery planning.',
    timeLimitMs: 30000,
    pointsBase: 100,
    theme: 'Recovery',
    localizedData: {
      pasig: {
        hotlines: ['Pasig Housing Office: (02) 8643-3333'],
        hazardLinks: ['https://pasigcity.gov.ph/disaster-recovery/'],
      },
    },
  },
];

// Sample Quizzes
export const sampleQuizzes: SampleQuiz[] = [
  {
    id: 'quiz_basic_drrm',
    title: 'Basic DRRM Knowledge',
    description: 'Test your fundamental knowledge of Disaster Risk Reduction and Management',
    theme: 'Prevention',
    questions: ['prev_001', 'prev_002', 'prep_001', 'prep_002'],
    localizationTags: ['pasig', 'general'],
    isActive: true,
  },
  {
    id: 'quiz_emergency_response',
    title: 'Emergency Response',
    description: 'Learn proper response procedures for various disaster scenarios',
    theme: 'Response',
    questions: ['resp_001', 'resp_002'],
    localizationTags: ['pasig', 'emergency'],
    isActive: true,
  },
  {
    id: 'quiz_recovery_planning',
    title: 'Recovery and Resilience',
    description: 'Understanding post-disaster recovery and building community resilience',
    theme: 'Recovery',
    questions: ['rec_001', 'rec_002'],
    localizationTags: ['pasig', 'recovery'],
    isActive: true,
  },
  {
    id: 'quiz_comprehensive_drrm',
    title: 'Comprehensive DRRM Challenge',
    description: 'Complete test covering all aspects of disaster risk reduction and management',
    theme: 'Prevention',
    questions: ['prev_001', 'prep_001', 'resp_001', 'rec_001'],
    localizationTags: ['pasig', 'comprehensive'],
    isActive: true,
  },
];

// Helper functions for quiz management
export const getQuestionsByIds = (questionIds: string[]): SampleQuestion[] => {
  return sampleQuestions.filter(q => questionIds.includes(q.id));
};

export const getQuestionsByTheme = (theme: SampleQuestion['theme']): SampleQuestion[] => {
  return sampleQuestions.filter(q => q.theme === theme);
};

export const getActiveQuizzes = (): SampleQuiz[] => {
  return sampleQuizzes.filter(q => q.isActive);
};

export const getQuizById = (quizId: string): SampleQuiz | undefined => {
  return sampleQuizzes.find(q => q.id === quizId);
};