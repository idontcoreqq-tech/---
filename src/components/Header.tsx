import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTutor } from '../context/TutorContext';

export const Header: React.FC = () => {
  const { tier, level } = useTutor();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 py-3.5">
      <div className="fckit-wrap flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--card-bg)] font-mono text-sm font-bold text-[var(--accent)] transition-all duration-200 group-hover:border-[var(--accent)]">
            &gt;_
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-tight text-[var(--heading)]">
                core.tutor
              </span>
              <span className="fckit-badge hidden sm:inline-flex">Gemini 3.5</span>
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              Backend AI Tutor &amp; Engineering
            </div>
          </div>
        </a>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#services" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--heading)]">
            Услуги
          </a>
          <a href="#cases" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--heading)]">
            Кейсы
          </a>
          <a href="#stack" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--heading)]">
            Стек
          </a>
          <a href="#tutor" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--heading)]">
            ИИ-Тренажер
          </a>
          <a href="#pricing" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--heading)]">
            Тарифы
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <span className={tier === 'pro' ? 'fckit-badge-success' : 'fckit-badge'}>
            {level} · {tier.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="fckit-btn !min-h-[38px] !px-3"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--accent)]" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>
          </button>
          <a href="#contact" className="fckit-btn-primary !min-h-[38px] !px-4">
            Связаться
          </a>
        </div>
      </div>
    </header>
  );
};
