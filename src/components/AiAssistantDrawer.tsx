import React, { useState } from 'react';
import { Bot, Send, Settings, Terminal, X } from 'lucide-react';
import { useTutor } from '../context/TutorContext';
import { askAiTutor } from '../services/aiAssistant';
import { ChatMessage } from '../types/tutor';

const QUICK_PROMPTS = [
  'Как ускорить SQL с 800ms до 45ms?',
  'Transactional Outbox',
  'Cache Stampede в Redis',
  'Free vs Pro',
];

export const AiAssistantDrawer: React.FC = () => {
  const {
    isAiDrawerOpen,
    setAiDrawerOpen,
    tier,
    level,
    xp,
    activeLesson,
    aiSettings,
    setAiSettings,
  } = useTutor();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Привет! Я ИИ-консультант на базе модели Gemini 3.5. Спросите меня про индексы PostgreSQL, Redis, Kafka, N+1 или текущий урок.',
      timestamp: 'сейчас',
      source: 'gemini-3.5',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!isAiDrawerOpen) {
    return (
      <button
        type="button"
        onClick={() => setAiDrawerOpen(true)}
        className="fckit-fab"
        title="ИИ-консультант (Gemini 3.5)"
        aria-label="Открыть ИИ-консультанта Gemini 3.5"
      >
        <Terminal className="h-5 w-5" />
      </button>
    );
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const reply = await askAiTutor(trimmed, aiSettings, {
      tier,
      level,
      xp,
      currentLesson: activeLesson,
    });

    const botMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: reply.text,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      source: reply.source,
    };

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="fckit-card fixed bottom-5 right-5 z-50 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-md flex-col shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--bg)]">
            <Bot className="h-4 w-4 text-[var(--heading)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--heading)]">ИИ-консультант</span>
              <span className="fckit-badge !py-0.5 !text-[10px]">Gemini 3.5</span>
            </div>
            <div className="font-mono text-[10px] text-[var(--muted)]">
              База: Gemini 3.5 · {level}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="fckit-btn !min-h-[30px] !px-2"
            title="Настройки модели Gemini 3.5"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAiDrawerOpen(false)}
            className="fckit-btn !min-h-[30px] !px-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="border-b border-[var(--line)] bg-[var(--bg)] p-3.5 text-xs">
          <div className="mb-2 font-mono text-[11px] text-[var(--muted)]">
            Системная модель: Gemini 3.5
          </div>
          <div className="flex gap-1.5">
            {([
              { id: 'gemini-3.5', label: 'Gemini 3.5' },
              { id: 'openai', label: 'OpenAI' },
            ] as const).map((prov) => (
              <button
                key={prov.id}
                type="button"
                onClick={() => setAiSettings({ ...aiSettings, provider: prov.id })}
                className={`flex-1 rounded border px-2 py-1.5 font-mono text-[11px] ${
                  aiSettings.provider === prov.id
                    ? 'border-[var(--heading)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold'
                    : 'border-[var(--line)] bg-[var(--card-bg)] text-[var(--muted)]'
                }`}
              >
                {prov.label}
              </button>
            ))}
          </div>
          <input
            type="password"
            value={aiSettings.apiKey}
            onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
            placeholder={
              aiSettings.provider === 'gemini-3.5'
                ? import.meta.env.VITE_GEMINI_API_KEY
                  ? 'Ключ подключен из .env (можно переопределить)'
                  : 'API-ключ Gemini 3.5 (опционально)'
                : 'API-ключ OpenAI (опционально)'
            }
            className="mt-2 w-full rounded border border-[var(--line)] bg-[var(--card-bg)] px-2.5 py-1.5 font-mono text-xs text-[var(--heading)] focus:border-[var(--heading)] focus:outline-none"
          />
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-[8px] px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium'
                  : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
              }`}
            >
              {msg.content}
            </div>
            <span className="mt-1 font-mono text-[10px] text-[var(--muted)]">
              {msg.timestamp}
              {msg.source ? ` · ${msg.source === 'gemini-3.5' ? 'Gemini 3.5' : 'OpenAI'}` : ''}
            </span>
          </div>
        ))}
        {loading && (
          <div className="font-mono text-xs text-[var(--muted)]">
            Gemini 3.5 формирует ответ...
          </div>
        )}
      </div>

      <div className="border-t border-[var(--line)] p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="fckit-badge shrink-0 cursor-pointer hover:border-[var(--heading)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите Gemini 3.5 по backend..."
            className="flex-1 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2 text-xs text-[var(--heading)] placeholder-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="fckit-btn-primary !min-h-[34px] !px-3"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
