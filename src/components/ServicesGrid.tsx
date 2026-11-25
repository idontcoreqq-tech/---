import React from 'react';
import { ArrowUpRight, Cpu, Database, Server, Workflow } from 'lucide-react';
import { SERVICES } from '../data/landingData';
import { useTutor } from '../context/TutorContext';
import { ServiceCategory } from '../types/tutor';

const ICON_MAP: Record<ServiceCategory, React.ReactNode> = {
  api: <Server className="h-6 w-6 text-[var(--accent)]" />,
  microservices: <Cpu className="h-6 w-6 text-[var(--success)]" />,
  database: <Database className="h-6 w-6 text-[var(--accent)]" />,
  integrations: <Workflow className="h-6 w-6 text-[var(--success)]" />,
};

export const ServicesGrid: React.FC = React.memo(() => {
  const { selectLesson, setTier, setQuizOpen } = useTutor();

  const handleOpenLesson = (lessonId: string) => {
    const ok = selectLesson(lessonId);
    if (!ok) {
      setTier('pro');
      selectLesson(lessonId);
    }
    document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[var(--heading)] sm:text-[26px]">
            Направления и услуги
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Ключевые модули backend-разработки — выберите направление для изучения или заказа.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <div key={service.id} className="fckit-card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                    {ICON_MAP[service.id]}
                  </div>
                  <span className="fckit-badge-success">{service.metrics}</span>
                </div>

                <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
                  {service.subtitle}
                </div>
                <h3 className="mt-1 text-base font-bold text-[var(--heading)]">
                  {service.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  {service.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {service.stack.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--text)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenLesson(service.lessonId)}
                className="fckit-btn mt-5 w-full justify-between"
              >
                <span>Открыть урок</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--accent)]" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setQuizOpen(true)}
          className="fckit-btn-primary mt-6 h-[52px] w-full text-[15px]"
        >
          Пройти проверку знаний (Backend Квиз)
        </button>
      </div>
    </section>
  );
});
