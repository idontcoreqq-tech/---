import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useTutor } from '../context/TutorContext';

export const PricingSection: React.FC = () => {
  const { tier, setTier } = useTutor();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);

  const handleActivatePro = async () => {
    if (tier === 'pro') {
      document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setCheckoutLoading(true);
    setCheckoutNote(null);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      const errData = await res.json().catch(() => null);
      setTier('pro');
      setCheckoutNote(
        errData?.error
          ? `Stripe: ${errData.error}. Активирован локальный Pro-режим.`
          : 'Активирован локальный Pro-режим.'
      );
      document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setTier('pro');
      setCheckoutNote('Активирован локальный Pro-режим.');
      document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section id="pricing" className="pt-12 sm:pt-16">
      <div className="fckit-wrap">
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[var(--heading)] sm:text-[24px]">Тарифы</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Начните бесплатно на Free или откройте все 4 этапа и 30-минутные уроки в Pro.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free */}
          <div
            className={`fckit-card flex flex-col justify-between p-6 ${
              tier === 'free' ? 'border-[var(--heading)]' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--heading)]">Free</h3>
                <span className="fckit-badge">БАЗОВЫЙ</span>
              </div>
              <div className="mt-3 font-mono text-3xl font-bold text-[var(--heading)]">0 ₽</div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Быстрый старт и проверка знаний по backend.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-[var(--line)] pt-4 text-sm text-[var(--text)]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>10 минут урока в день</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>5 бесплатных уроков (базовые темы)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Базовые квизы и задачи</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>ИИ-консультант на базе Gemini 3.5</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setTier('free');
                document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={tier === 'free' ? 'fckit-btn mt-6 w-full' : 'fckit-btn-primary mt-6 w-full'}
            >
              {tier === 'free' ? 'Текущий тариф (Free)' : 'Выбрать Free'}
            </button>
          </div>

          {/* Pro */}
          <div
            className={`fckit-card flex flex-col justify-between border-t-2 border-t-[var(--accent)] p-6 ${
              tier === 'pro' ? '!border-[var(--success)]' : '!border-[var(--accent)]/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--heading)]">Pro</h3>
                <span className="fckit-badge-success">РЕКОМЕНДУЕМ</span>
              </div>
              <div className="mt-3 font-mono text-3xl font-bold text-[var(--heading)]">
                $5 <span className="text-xs font-normal text-[var(--muted)]">/ мес</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Глубокие уроки, этапы изучения и рост уровня знаний.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-[var(--line)] pt-4 text-sm text-[var(--text)]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Продвинутые уроки по 30 минут</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Разделение на 4 этапа изучения</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Повышение уровня знаний (Junior → Staff)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Highload, Kafka Outbox, Rate Limiter, Sharding</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleActivatePro}
                className={tier === 'pro' ? 'fckit-btn w-full' : 'fckit-btn-primary w-full'}
              >
                {checkoutLoading
                  ? 'Переход к оплате Stripe...'
                  : tier === 'pro'
                  ? 'Pro-версия активна'
                  : 'Оплатить и активировать Pro'}
              </button>
              {checkoutNote && (
                <p className="mt-2 text-center font-mono text-[11px] text-[var(--muted)]">
                  {checkoutNote}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
