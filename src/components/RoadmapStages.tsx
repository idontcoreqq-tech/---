import React from 'react';
import { Check, Lock } from 'lucide-react';
import { LEARNING_STAGES } from '../data/landingData';
import { useTutor } from '../context/TutorContext';

export const RoadmapStages: React.FC = () => {
  const { tier, level, setTier } = useTutor();

  return (
    <section id="stages" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[var(--heading)] sm:text-[24px]">
            Этапы обучения и роста
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Поэтапное повышение уровня знаний: Free (10 мин/день) и Pro (30 мин/урок, все этапы).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LEARNING_STAGES.map((stage) => {
            const isLocked = stage.requiredTier === 'pro' && tier === 'free';
            const isCurrentLevel = stage.level === level;

            return (
              <div
                key={stage.stage}
                className={`fckit-card flex flex-col justify-between p-4 ${
                  isCurrentLevel ? 'border-[var(--heading)]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                      STAGE 0{stage.stage}
                    </span>
                    <span className="fckit-badge inline-flex items-center gap-1">
                      {isLocked ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      {isLocked ? 'PRO' : stage.level}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[15px] font-semibold text-[var(--heading)]">
                    {stage.title}
                  </h3>
                  <div className="mt-1 font-mono text-[11px] text-[var(--accent)]">
                    {stage.durationHint}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[var(--muted)]">
                    {stage.description}
                  </p>

                  <ul className="mt-3 space-y-1 border-t border-[var(--line)] pt-2.5">
                    {stage.topics.map((topic) => (
                      <li key={topic} className="font-mono text-[11px] text-[var(--text)]">
                        · {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {isLocked && (
                  <button
                    type="button"
                    onClick={() => setTier('pro')}
                    className="fckit-btn-primary mt-4 w-full"
                  >
                    Открыть в Pro
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
