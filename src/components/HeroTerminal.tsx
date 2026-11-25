import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Play, Sparkles, Terminal } from 'lucide-react';
import { TERMINAL_PRESETS } from '../data/landingData';
import { useTutor } from '../context/TutorContext';

export const HeroTerminal: React.FC = () => {
  const { setQuizOpen } = useTutor();
  const [selectedId, setSelectedId] = useState<string>(TERMINAL_PRESETS[0].id);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runCount, setRunCount] = useState<number>(1);

  const preset = TERMINAL_PRESETS.find((p) => p.id === selectedId) ?? TERMINAL_PRESETS[0];

  const handleRun = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setIsRunning(false);
      setRunCount((c) => c + 1);
    }, 180);
  };

  return (
    <section className="hero-atmosphere pt-12 pb-6 sm:pt-16">
      <div className="fckit-wrap">
        {/* Clean Hero Intro */}
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="fckit-badge-success">HTTP 200 OK · Gemini 3.5</span>
              <span className="fckit-badge">Free 10 мин · Pro 30 мин</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-5xl sm:leading-[1.12]">
              Персональный ИИ-репетитор по{' '}
              <span className="bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#34d399] bg-clip-text text-transparent">
                Backend-разработке
              </span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
              Освойте проектирование API, оптимизацию PostgreSQL и распределенные очереди на практике
              — или закажите аудит и ускорение вашего бэкенда с гарантией SLA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#tutor" className="fckit-btn-primary">
              Начать бесплатно (5 уроков)
              <ArrowRight className="h-4 w-4" />
            </a>
            <button type="button" onClick={() => setQuizOpen(true)} className="fckit-btn">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Проверить знания
            </button>
          </div>
        </div>

        {/* Flagship Terminal Card */}
        <div className="fckit-feature-hit grid overflow-hidden lg:grid-cols-[minmax(320px,520px)_1fr]">
          {/* Left Studio Frame */}
          <div className="bg-[var(--visual-frame)] p-3.5">
            <div className="flex h-full flex-col justify-between rounded-xl bg-[var(--terminal-bg)] p-4 text-[#e2e8f0]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-white">
                  <Terminal className="h-3.5 w-3.5 text-[#38bdf8]" />
                  api-gateway-cli
                </span>
                <div className="flex items-center gap-1">
                  {TERMINAL_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        handleRun();
                      }}
                      className={`rounded-lg px-2.5 py-1 font-mono text-[10.5px] transition-all duration-200 ${
                        selectedId === item.id
                          ? 'bg-[#3b82f6] text-white font-semibold'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 font-mono text-[11.5px]">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#141d2f] px-3 py-2.5">
                  <span className="truncate text-[#e2e8f0]">$ {preset.command}</span>
                  <button
                    type="button"
                    onClick={handleRun}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#3b82f6] px-2.5 py-1 text-[10.5px] font-semibold text-white transition-all duration-200 hover:bg-[#2563eb]"
                  >
                    <Play className="h-2.5 w-2.5" />
                    Run
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11.5px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#34d399]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    HTTP/2 {preset.status}
                  </span>
                  <span className="text-[#94a3b8]">
                    req #{runCount} · <strong className="text-[#34d399]">{preset.latencyMs}ms</strong>
                  </span>
                </div>

                <pre
                  className={`mt-2.5 max-h-[165px] overflow-auto rounded-xl border border-white/10 bg-[#141d2f] p-3.5 text-[11.5px] leading-relaxed text-[#e2e8f0] transition-opacity duration-200 ${
                    isRunning ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <code>{JSON.stringify(preset.responseJson, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Right Info Pane */}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
              PRO ТРЕК · HIGHLOAD &amp; POSTGRESQL
            </div>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[var(--heading)] sm:text-[28px]">
              Ускорение систем: <span className="text-[var(--success)]">800ms → 45ms</span>
            </h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[var(--muted)]">
              Разбираем реальные боевые кейсы: составные индексы PostgreSQL, устранение N+1,
              Redis Cache-Aside и Transactional Outbox в Kafka.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-5">
              <div>
                <div className="font-mono text-lg font-bold text-[var(--heading)]">5 уроков</div>
                <div className="text-xs text-[var(--muted)]">Бесплатно (10 мин)</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-[var(--accent)]">30 мин</div>
                <div className="text-xs text-[var(--muted)]">Pro-уроки и этапы</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-[var(--success)]">99.99%</div>
                <div className="text-xs text-[var(--muted)]">SLA архитектуры</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
