import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  HardDriveUpload,
  Lock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LESSONS } from '../data/curriculum';
import { useTutor } from '../context/TutorContext';

function formatClock(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TutorWorkspace: React.FC = () => {
  const {
    tier,
    xp,
    level,
    nextLevelXp,
    activeLesson,
    completedLessons,
    freeLessonsCompletedCount,
    secondsRemaining,
    timerRunning,
    selectLesson,
    completeLessonTask,
    toggleTimer,
    resetTimer,
    setTier,
    setQuizOpen,
    setAiDrawerOpen,
  } = useTutor();

  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});
  const [checkedLessons, setCheckedLessons] = useState<Record<string, boolean>>({});
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedToStorage, setSavedToStorage] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeLesson.codeExample).catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1600);
  };

  const handleSaveToStorage = async () => {
    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `${activeLesson.id}.${activeLesson.codeLanguage}`,
          content: activeLesson.codeExample,
        }),
      });
      if (res.ok) {
        setSavedToStorage(true);
        window.setTimeout(() => setSavedToStorage(false), 2000);
      }
    } catch {
      // ignore if offline
    }
  };

  const chosenOptionId = selectedOption[activeLesson.id] ?? '';
  const isChecked = checkedLessons[activeLesson.id] ?? false;
  const isTaskCorrect = chosenOptionId === activeLesson.task.correctOptionId;
  const isLessonCompleted = completedLessons.includes(activeLesson.id);
  const xpProgressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  const handleSelectLesson = (lessonId: string) => {
    const allowed = selectLesson(lessonId);
    if (!allowed) {
      setUpgradeNotice(
        'Продвинутые 30-минутные уроки (Этапы 2–4) доступны в тарифе Pro. Активируйте Pro для доступа.'
      );
    } else {
      setUpgradeNotice(null);
    }
  };

  const handleCheckTask = () => {
    if (!chosenOptionId) return;
    setCheckedLessons((prev) => ({ ...prev, [activeLesson.id]: true }));
    if (chosenOptionId === activeLesson.task.correctOptionId) {
      completeLessonTask(activeLesson.id, activeLesson.xpReward);
    }
  };

  return (
    <section id="tutor" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-[22px] font-bold text-[var(--heading)] sm:text-[24px]">
              Персональный ИИ-тренажер
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              Практические уроки, дневной таймер и проверка знаний.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => setQuizOpen(true)} className="fckit-btn-primary">
              Квиз: Проверка знаний
            </button>
            <button type="button" onClick={() => setAiDrawerOpen(true)} className="fckit-btn">
              ИИ-консультант (Gemini 3.5)
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="fckit-card flex items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Clock className="h-3.5 w-3.5" />
                Дневной лимит ({tier === 'pro' ? '30 мин' : '10 мин'})
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-[var(--heading)]">
                {formatClock(secondsRemaining)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTimer}
                className="fckit-btn !min-h-[34px] !px-2.5"
                title={timerRunning ? 'Пауза' : 'Старт'}
              >
                {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="fckit-btn !min-h-[34px] !px-2.5"
                title="Сброс"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="fckit-card p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Уровень знаний</span>
              <span className="font-mono font-bold text-[var(--heading)]">
                {level} · {xp}/{nextLevelXp} XP
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)] border border-[var(--line)]">
              <div
                className="h-full bg-[var(--heading)] transition-all duration-300"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="fckit-card flex items-center justify-between gap-3 p-4">
            <div>
              <div className="text-xs text-[var(--muted)]">Пройдено уроков</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--heading)]">
                {tier === 'free'
                  ? `${freeLessonsCompletedCount} / 5 (Free)`
                  : `${completedLessons.length} / ${LESSONS.length} (Pro)`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTier(tier === 'free' ? 'pro' : 'free')}
              className={tier === 'pro' ? 'fckit-btn' : 'fckit-btn-primary'}
            >
              {tier === 'pro' ? 'PRO Активен' : 'Включить PRO'}
            </button>
          </div>
        </div>

        {upgradeNotice && (
          <div className="fckit-card mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm text-[var(--heading)]">{upgradeNotice}</span>
            <button
              type="button"
              onClick={() => {
                setTier('pro');
                setUpgradeNotice(null);
              }}
              className="fckit-btn-primary"
            >
              Активировать Pro (30 мин/урок)
            </button>
          </div>
        )}

        {/* Lesson List + Active Lesson */}
        <div className="grid gap-[10px] lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            {LESSONS.map((lesson) => {
              const isLocked = lesson.tier === 'pro' && tier === 'free';
              const isActive = lesson.id === activeLesson.id;
              const isDone = completedLessons.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => handleSelectLesson(lesson.id)}
                  className={`fckit-card w-full p-3.5 text-left ${
                    isActive ? '!border-[var(--heading)]' : isLocked ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[var(--muted)]">
                      Этап {lesson.stage} · {lesson.durationMinutes} мин
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--heading)]" />
                    ) : isLocked ? (
                      <span className="fckit-badge inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        PRO
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-bold text-[var(--accent)]">
                        +{lesson.xpReward} XP
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--heading)]">
                    {lesson.title}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fckit-card p-5 sm:p-6 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="fckit-badge">Этап {activeLesson.stage}</span>
                  <span className="fckit-badge">{activeLesson.durationMinutes} мин</span>
                  <span className="font-mono text-xs font-bold text-[var(--accent)]">
                    +{activeLesson.xpReward} XP
                  </span>
                </div>
                <h3 className="mt-2.5 text-xl font-bold text-[var(--heading)]">
                  {activeLesson.title}
                </h3>
              </div>

              {isLessonCompleted && (
                <span className="fckit-badge inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Выполнено
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-[var(--text)]">{activeLesson.summary}</p>

            <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
              {activeLesson.theory.map((point, idx) => (
                <li key={idx}>· {point}</li>
              ))}
            </ul>

            {/* Studio-framed code block */}
            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--line)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--muted)]">
                <span>{activeLesson.codeLanguage} · production example</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToStorage}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium text-[var(--text)] transition hover:bg-[var(--card-bg)]"
                  >
                    {savedToStorage ? (
                      <>
                        <Check className="h-3 w-3 text-[var(--success)]" />
                        В Neon Storage
                      </>
                    ) : (
                      <>
                        <HardDriveUpload className="h-3 w-3 text-[var(--accent)]" />
                        Сохранить в Neon
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium text-[var(--text)] transition hover:bg-[var(--card-bg)]"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-[var(--success)]" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="overflow-x-auto bg-[var(--terminal-bg)] p-4 font-mono text-xs leading-relaxed text-[#e2e8f0]">
                <code>{activeLesson.codeExample}</code>
              </pre>
            </div>

            {/* Practical Task */}
            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                Практическая задача
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[var(--heading)]">
                {activeLesson.task.prompt}
              </p>
              <div className="mt-2 rounded border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 font-mono text-xs text-[var(--muted)]">
                {activeLesson.task.codeContext}
              </div>

              <div className="mt-3 space-y-2">
                {activeLesson.task.options.map((opt) => {
                  const selected = chosenOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedOption((prev) => ({ ...prev, [activeLesson.id]: opt.id }));
                        setCheckedLessons((prev) => ({ ...prev, [activeLesson.id]: false }));
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--bg)]'
                          : 'border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--heading)]">{opt.label}</div>
                      <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                        {opt.codeSnippet}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!chosenOptionId}
                  onClick={handleCheckTask}
                  className="fckit-btn-primary"
                >
                  Проверить решение
                </button>
                <button
                  type="button"
                  onClick={() => setAiDrawerOpen(true)}
                  className="fckit-btn"
                >
                  Подсказка ИИ
                </button>
              </div>

              {isChecked && (
                <div className="mt-3 rounded border border-[var(--line)] bg-[var(--bg)] p-3 text-xs">
                  <div className="font-bold text-[var(--heading)]">
                    {isTaskCorrect
                      ? `Верно! Начислено +${activeLesson.xpReward} XP.`
                      : 'Не совсем точно. Попробуйте другой вариант или спросите ИИ-помощника.'}
                  </div>
                  {isTaskCorrect && (
                    <p className="mt-1 text-[var(--muted)]">{activeLesson.task.explanation}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
