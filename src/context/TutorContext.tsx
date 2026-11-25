import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LESSONS } from '../data/curriculum';
import { AiSettings, KnowledgeLevel, Lesson, PlanTier } from '../types/tutor';

interface TutorState {
  tier: PlanTier;
  xp: number;
  completedLessons: string[];
  completedQuizzes: string[];
  activeLessonId: string;
  secondsRemaining: number;
  timerRunning: boolean;
  aiSettings: AiSettings;
  isQuizOpen: boolean;
  isAiDrawerOpen: boolean;
}

interface TutorContextValue extends TutorState {
  level: KnowledgeLevel;
  nextLevelXp: number;
  dailyLimitSeconds: number;
  activeLesson: Lesson;
  freeLessonsCompletedCount: number;
  setTier: (tier: PlanTier) => void;
  selectLesson: (lessonId: string) => boolean;
  completeLessonTask: (lessonId: string, xpGain: number) => void;
  completeQuizQuestion: (questionId: string, xpGain: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setAiSettings: (settings: AiSettings) => void;
  setQuizOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'core_tutor_state_v1';

const getDailyLimitSeconds = (tier: PlanTier) => (tier === 'pro' ? 30 * 60 : 10 * 60);

const computeLevel = (xp: number): { level: KnowledgeLevel; nextLevelXp: number } => {
  if (xp >= 600) return { level: 'Staff', nextLevelXp: 1000 };
  if (xp >= 320) return { level: 'Senior', nextLevelXp: 600 };
  if (xp >= 140) return { level: 'Middle', nextLevelXp: 320 };
  return { level: 'Junior', nextLevelXp: 140 };
};

const loadInitialState = (): Omit<TutorState, 'isQuizOpen' | 'isAiDrawerOpen' | 'timerRunning'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const tier: PlanTier = parsed.tier === 'pro' ? 'pro' : 'free';
      return {
        tier,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        completedQuizzes: Array.isArray(parsed.completedQuizzes) ? parsed.completedQuizzes : [],
        activeLessonId:
          typeof parsed.activeLessonId === 'string' ? parsed.activeLessonId : LESSONS[0].id,
        secondsRemaining:
          typeof parsed.secondsRemaining === 'number'
            ? parsed.secondsRemaining
            : getDailyLimitSeconds(tier),
        aiSettings:
          parsed.aiSettings && (parsed.aiSettings.provider === 'openai' || parsed.aiSettings.provider === 'gemini-3.5')
            ? parsed.aiSettings
            : { provider: 'gemini-3.5', apiKey: parsed.aiSettings?.apiKey ?? '' },
      };
    }
  } catch {
    // ignore storage errors
  }

  return {
    tier: 'free',
    xp: 0,
    completedLessons: [],
    completedQuizzes: [],
    activeLessonId: LESSONS[0].id,
    secondsRemaining: getDailyLimitSeconds('free'),
    aiSettings: { provider: 'gemini-3.5', apiKey: '' },
  };
};

const TutorContext = createContext<TutorContextValue | null>(null);

export const TutorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(loadInitialState, []);
  const [tier, setTierState] = useState<PlanTier>(initial.tier);
  const [xp, setXp] = useState<number>(initial.xp);
  const [completedLessons, setCompletedLessons] = useState<string[]>(initial.completedLessons);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>(initial.completedQuizzes);
  const [activeLessonId, setActiveLessonId] = useState<string>(initial.activeLessonId);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initial.secondsRemaining);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(initial.aiSettings);
  const [isQuizOpen, setQuizOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setTierState('pro');
      setSecondsRemaining(getDailyLimitSeconds('pro'));
      params.delete('checkout');
      const cleanUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tier,
          xp,
          completedLessons,
          completedQuizzes,
          activeLessonId,
          secondsRemaining,
          aiSettings,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [tier, xp, completedLessons, completedQuizzes, activeLessonId, secondsRemaining, aiSettings]);

  useEffect(() => {
    if (!timerRunning || secondsRemaining <= 0) return;
    const id = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, secondsRemaining]);

  const setTier = (nextTier: PlanTier) => {
    setTierState(nextTier);
    setTimerRunning(false);
    setSecondsRemaining(getDailyLimitSeconds(nextTier));
    if (nextTier === 'free') {
      const current = LESSONS.find((l) => l.id === activeLessonId);
      if (current && current.tier === 'pro') {
        setActiveLessonId(LESSONS[0].id);
      }
    }
  };

  const selectLesson = (lessonId: string): boolean => {
    const target = LESSONS.find((l) => l.id === lessonId);
    if (!target) return false;
    if (target.tier === 'pro' && tier === 'free') {
      return false;
    }
    setActiveLessonId(lessonId);
    return true;
  };

  const completeLessonTask = (lessonId: string, xpGain: number) => {
    setCompletedLessons((prev) => {
      if (prev.includes(lessonId)) return prev;
      setXp((current) => current + xpGain);
      return [...prev, lessonId];
    });
  };

  const completeQuizQuestion = (questionId: string, xpGain: number) => {
    setCompletedQuizzes((prev) => {
      if (prev.includes(questionId)) return prev;
      setXp((current) => current + xpGain);
      return [...prev, questionId];
    });
  };

  const toggleTimer = () => {
    if (secondsRemaining <= 0) return;
    setTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsRemaining(getDailyLimitSeconds(tier));
  };

  const { level, nextLevelXp } = computeLevel(xp);
  const dailyLimitSeconds = getDailyLimitSeconds(tier);
  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) ?? LESSONS[0];
  const freeLessonsCompletedCount = completedLessons.filter((id) =>
    id.startsWith('free-')
  ).length;

  return (
    <TutorContext.Provider
      value={{
        tier,
        xp,
        completedLessons,
        completedQuizzes,
        activeLessonId,
        secondsRemaining,
        timerRunning,
        aiSettings,
        isQuizOpen,
        isAiDrawerOpen,
        level,
        nextLevelXp,
        dailyLimitSeconds,
        activeLesson,
        freeLessonsCompletedCount,
        setTier,
        selectLesson,
        completeLessonTask,
        completeQuizQuestion,
        toggleTimer,
        resetTimer,
        setAiSettings,
        setQuizOpen,
        setAiDrawerOpen,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const ctx = useContext(TutorContext);
  if (!ctx) throw new Error('useTutor must be used inside TutorProvider');
  return ctx;
};
