import React, { useState } from 'react';
import { CheckCircle2, Github, Mail, Send } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, message }),
      });
    } catch {
      // Allow graceful confirmation if backend is offline
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setName('');
      setContact('');
      setMessage('');
    }
  };

  return (
    <footer id="contact" className="mt-16 border-t border-[var(--line)] py-10 pb-14">
      <div className="fckit-wrap">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Left Column: Contacts & Socials (FCKIT .site-footer style) */}
          <div>
            <h3 className="text-[20px] font-bold text-[var(--heading)]">Контакты и заявка</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Обучение с ИИ-репетитором или заказ backend-разработки.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://t.me/coretutor_dev"
                target="_blank"
                rel="noreferrer"
                className="fckit-btn"
              >
                <Send className="h-3.5 w-3.5" />
                Telegram
              </a>
              <a
                href="https://github.com/coretutor-dev"
                target="_blank"
                rel="noreferrer"
                className="fckit-btn"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              <a href="mailto:hello@coretutor.dev" className="fckit-btn">
                <Mail className="h-3.5 w-3.5" />
                hello@coretutor.dev
              </a>
            </div>

            <div className="mt-8 text-xs text-[var(--muted)]">© 2026 &gt;_ core.tutor</div>
          </div>

          {/* Right Column: Simple Request Form */}
          <div className="fckit-card p-5">
            {submitted ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--heading)]" />
                <div className="mt-2 text-base font-semibold text-[var(--heading)]">
                  Заявка отправлена
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Мы свяжемся с вами в ближайшее время.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="fckit-btn mt-4"
                >
                  Отправить еще
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--heading)] placeholder-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Telegram или Email"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--heading)] placeholder-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Задача: обучение Pro, аудит БД, разработка API..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--heading)] placeholder-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                />
                <button type="submit" className="fckit-btn-primary w-full">
                  Отправить заявку
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
