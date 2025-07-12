// src/utils/testPersonas.ts

/**
 * Test personas for user journey testing
 * These represent different types of users with different needs and goals
 */
export interface TestPersona {
  name: string;
  age: number;
  description: string;
  readingGoal: string;
  technicalSkill: 'Basic' | 'Intermediate' | 'Advanced';
  email?: string;
  password?: string;
}

export const testPersonas: TestPersona[] = [
  {
    name: 'Leo',
    age: 10,
    description: 'Young reader who needs help with vocabulary',
    readingGoal: 'Understand the story better',
    technicalSkill: 'Basic',
    email: 'leo@example.com',
    password: 'Password123!'
  },
  {
    name: 'Sarah',
    age: 21,
    description: 'University student studying literature',
    readingGoal: 'Analyze themes and motifs',
    technicalSkill: 'Advanced',
    email: 'sarah@example.com',
    password: 'Password123!'
  },
  {
    name: 'Michael',
    age: 35,
    description: 'Busy professional reading in short bursts',
    readingGoal: 'Enjoy the story in limited time',
    technicalSkill: 'Intermediate',
    email: 'michael@example.com',
    password: 'Password123!'
  },
  {
    name: 'Emma',
    age: 14,
    description: 'Middle school student with reading difficulties',
    readingGoal: 'Improve reading comprehension',
    technicalSkill: 'Basic',
    email: 'emma@example.com',
    password: 'Password123!'
  },
  {
    name: 'Robert',
    age: 67,
    description: 'Retired teacher with vision impairment',
    readingGoal: 'Read comfortably with accessibility features',
    technicalSkill: 'Intermediate',
    email: 'robert@example.com',
    password: 'Password123!'
  }
];

/**
 * Consultant personas for testing
 */
export interface ConsultantPersona {
  name: string;
  role: string;
  description: string;
  focus: string;
  email?: string;
  password?: string;
}

export const consultantPersonas: ConsultantPersona[] = [
  {
    name: 'Jennifer',
    role: 'Publisher Staff',
    description: 'Experienced editor who monitors reader engagement',
    focus: 'Identifying common points of confusion',
    email: 'jennifer@publisher.com',
    password: 'Password123!'
  },
  {
    name: 'David',
    role: 'Educational Consultant',
    description: 'Former teacher who helps with reading comprehension',
    focus: 'Supporting struggling readers',
    email: 'david@publisher.com',
    password: 'Password123!'
  }
];

export default { testPersonas, consultantPersonas };
