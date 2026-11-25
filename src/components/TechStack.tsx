import React from 'react';
import { TECH_STACK } from '../data/landingData';

export const TechStack: React.FC = React.memo(() => {
  return (
    <section id="stack" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[var(--heading)] sm:text-[24px]">
            Стек технологий
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Языки, базы данных, брокеры сообщений и DevOps для production-систем.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TECH_STACK.map((group) => (
            <div key={group.title} className="fckit-card p-5">
              <h3 className="text-[14px] font-semibold text-[var(--heading)]">{group.title}</h3>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{group.subtitle}</p>
              <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-semibold text-[var(--heading)]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">{item.detail}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-[var(--muted)]">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
