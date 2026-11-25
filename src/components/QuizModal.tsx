import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, X, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizzes';
import { useTutor } from '../context/TutorContext';

export const QuizModal: React.FC = () => {
  const { isQuizOpen, setQuizOpen, tier, setTier, completeQuizQuestion } = useTutor();
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!isQuizOpen) return null;

  const availableQuestions = QUIZ_QUESTIONS.filter(
    (q) => tier === 'pro' || q.tier === 'free'
  );
  const current = availableQuestions[index];

  const handleAnswer = (optIdx: number) => {
    if (selectedOption !== null || !current) return;
    setSelectedOption(optIdx);
    if (optIdx === current.correctIndex) {
      setScore((s) => s + 1);
      completeQuizQuestion(current.id, current.xpReward);
    }
  };

  const handleNext = () => {
    if (index + 1 >= availableQuestions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const handleReset = () => {
    setIndex(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/70 p-4">
      <div className="fckit-card w-full max-w-xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <span className="font-mono text-xs text-[var(--muted)]">// KNOWLEDGE CHECK</span>
            <h3 className="text-lg font-bold text-[var(--heading)]">Проверка знаний по Backend</h3>
          </div>
          <button
            type="button"
            onClick={() => setQuizOpen(false)}
            className="fckit-btn !min-h-[32px] !px-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {finished ? (
          <div className="py-8 text-center">
            <Award className="mx-auto h-12 w-12 text-[var(--heading)]" />
            <h4 className="mt-4 text-xl font-bold text-[var(--heading)]">
              Результат: {score} из {availableQuestions.length}
            </h4>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {tier === 'free'
                ? 'Вы прошли базовый квиз тарифа Free. В Pro доступны сложные вопросы по Highload и Kafka.'
                : 'Отличная работа! За правильные ответы начислен XP для повышения уровня.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={handleReset} className="fckit-btn">
                Пройти заново
              </button>
              {tier === 'free' && (
                <button
                  type="button"
                  onClick={() => {
                    setTier('pro');
                    handleReset();
                  }}
                  className="fckit-btn-primary"
                >
                  Открыть Pro-вопросы
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
              <span>
                Вопрос {index + 1} / {availableQuestions.length}
              </span>
              <span className="fckit-badge">
                {current.difficulty} · +{current.xpReward} XP
              </span>
            </div>

            <p className="mt-3 text-base font-semibold text-[var(--heading)]">{current.question}</p>

            <div className="mt-4 space-y-2.5">
              {current.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === current.correctIndex;
                let borderStyle = 'border-[var(--line)] bg-[var(--bg)] text-[var(--text)]';
                if (selectedOption !== null) {
                  if (isCorrect) {
                    borderStyle = 'border-[var(--heading)] bg-[var(--surface)] text-[var(--heading)]';
                  } else if (isSelected) {
                    borderStyle = 'border-[var(--muted)] bg-[var(--bg)] text-[var(--muted)]';
                  } else {
                    borderStyle = 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleAnswer(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[10px] border p-3.5 text-left text-sm transition-all duration-200 ${borderStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--heading)]" />
                    )}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="mt-4 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-3.5 text-xs leading-relaxed text-[var(--text)]">
                {current.explanation}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              {tier === 'free' ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
                  <Lock className="h-3 w-3" />3 Pro-вопроса скрыты
                </span>
              ) : (
                <span />
              )}

              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleNext}
                className="fckit-btn-primary"
              >
                {index + 1 >= availableQuestions.length ? 'Завершить квиз' : 'Следующий вопрос'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
