export type PlanTier = 'free' | 'pro';

export type KnowledgeLevel = 'Junior' | 'Middle' | 'Senior' | 'Staff';

export type ServiceCategory = 'api' | 'microservices' | 'database' | 'integrations';

export interface TerminalPreset {
  id: string;
  label: string;
  method: 'GET' | 'POST';
  endpoint: string;
  status: string;
  latencyMs: number;
  command: string;
  responseJson: Record<string, unknown>;
}

export interface TechCategory {
  title: string;
  subtitle: string;
  items: {
    name: string;
    tag: string;
    detail: string;
  }[];
}

export interface ServiceItem {
  id: ServiceCategory;
  title: string;
  subtitle: string;
  description: string;
  metrics: string;
  stack: string[];
  lessonId: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  before: string;
  after: string;
  deltaLabel: string;
  summary: string;
  tags: string[];
}

export interface LearningStage {
  stage: number;
  title: string;
  level: KnowledgeLevel;
  durationHint: string;
  requiredTier: PlanTier;
  description: string;
  topics: string[];
}

export interface LessonTask {
  prompt: string;
  codeContext: string;
  options: {
    id: string;
    label: string;
    codeSnippet: string;
  }[];
  correctOptionId: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  stage: number;
  title: string;
  category: ServiceCategory;
  tier: PlanTier;
  durationMinutes: number;
  xpReward: number;
  summary: string;
  theory: string[];
  codeExample: string;
  codeLanguage: string;
  task: LessonTask;
}

export interface QuizQuestion {
  id: string;
  category: ServiceCategory;
  difficulty: 'Базовый' | 'Продвинутый';
  tier: PlanTier;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini-3.5' | 'openai';
}

export interface AiSettings {
  provider: 'gemini-3.5' | 'openai';
  apiKey: string;
}
