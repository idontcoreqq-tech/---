import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CASE_STUDIES } from '../data/landingData';

const BAR_WIDTHS: Record<string, string> = {
  'case-fintech-db': '6%',
  'case-marketplace-rps': '92%',
  'case-events-sla': '99%',
};

export const CasesSection: React.FC = React.memo(() => {
  return (
    <section id="cases" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            // Benchmarks
          </div>
          <h2 className="mt-1.5 text-[22px] font-bold text-[var(--heading)] sm:text-[26px]">
            Кейсы и результаты
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Измеримое ускорение систем и отказоустойчивость на реальных нагрузках.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {CASE_STUDIES.map((item) => (
            <div key={item.id} className="fckit-card flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--muted)]">
                    {item.client}
                  </span>
                  <span className="fckit-badge-success">{item.deltaLabel}</span>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-[var(--muted)] line-through">{item.before}</span>
                    <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
                    <span className="text-xl font-bold text-[var(--success)]">{item.after}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                    <div
                      className="h-full rounded-full bg-[var(--success)]"
                      style={{ width: BAR_WIDTHS[item.id] ?? '80%' }}
                    />
                  </div>
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--heading)]">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{item.summary}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-3.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="fckit-badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
