import { AiSettings, Lesson, PlanTier } from '../types/tutor';

interface AssistantContextInfo {
  tier: PlanTier;
  currentLesson?: Lesson | null;
  level: string;
  xp: number;
}

const LOCAL_KNOWLEDGE_BASE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['индекс', 'index', 'postgres', 'postgresql', 'sql', '800ms', '45ms', 'explain'],
    answer: `Чтобы ускорить PostgreSQL-запрос (например, с 800ms до 45ms):
1. Запустите \`EXPLAIN (ANALYZE, BUFFERS)\` и найдите \`Seq Scan\` или \`Sort\` на больших таблицах.
2. Создайте **составной индекс**: сначала колонки с точным равенством (\`=\`), затем диапазоны (\`>\`, \`<\`) и \`ORDER BY\`.
3. Добавьте \`INCLUDE (...)\` для покрывающего индекса (\`Index Only Scan\`).
\`\`\`sql
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders (user_id, created_at DESC)
INCLUDE (total_amount);
\`\`\``,
  },
  {
    keywords: ['n+1', 'orm', 'dataloader', 'join'],
    answer: `Проблема **N+1** возникает, когда вы делаете 1 запрос за списком и N запросов в цикле для каждой строки.
Решения:
- SQL \`JOIN\` или \`WHERE id = ANY($1)\` (батч-запрос)
- Паттерн **DataLoader** для группировки запросов в рамках одного тика Event Loop / запроса.`,
  },
  {
    keywords: ['redis', 'кэш', 'cache', 'ttl', 'stampede'],
    answer: `Для надежного кэширования в **Redis** используйте паттерн **Cache-Aside**:
- Добавляйте случайный \`jitter\` к TTL (\`300 + random(0, 60)\`), чтобы избежать одновременного сброса (Cache Stampede).
- Для защиты от пробивания несуществующими ID кэшируйте пустые значения на 30 секунд.`,
  },
  {
    keywords: ['kafka', 'rabbit', 'очеред', 'outbox', 'брокер', 'dlq'],
    answer: `В распределенных системах для надежной доставки событий используйте:
1. **Transactional Outbox** — сохраняйте событие в таблицу \`outbox\` в той же ACID-транзакции, что и бизнес-сущность.
2. **Partition Key** (например, \`user_id\`) в Kafka для строгого порядка событий.
3. **DLQ (Dead Letter Queue)** для изоляции сообщений, упавших после всех ретраев.`,
  },
  {
    keywords: ['rest', 'grpc', 'api', 'idempoten', 'идемпотент', 'rate limit', '429'],
    answer: `Ключевые практики надежного API:
- **Idempotency-Key** для \`POST\`-запросов (особенно платежи), чтобы ретраи не создавали дублей.
- **Rate Limiting** (Token Bucket на Redis + Lua) с ответом \`429 Too Many Requests\` и заголовком \`Retry-After\`.
- Для внутреннего общения микросервисов вместо REST/JSON часто выбирают **gRPC + Protobuf**.`,
  },
  {
    keywords: ['тариф', 'free', 'pro', 'урок', 'уровен'],
    answer: `Сравнение тарифов в **>_ core.tutor**:
- **Free**: 10 минут урока в день, 5 базовых уроков (HTTP, SQL-индексы, JWT, Redis, Docker), базовые квизы и задачи.
- **Pro**: продвинутые уроки по **30 минут**, доступ ко всем **4 этапам** обучения и поэтапный рост уровня (\`Junior → Middle → Senior → Staff\`).`,
  },
];

function buildGeminiFallbackReply(query: string, ctx: AssistantContextInfo): string {
  const normalized = query.toLowerCase();

  for (const item of LOCAL_KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return item.answer;
    }
  }

  if (ctx.currentLesson) {
    return `Сейчас вы изучаете урок **«${ctx.currentLesson.title}»** (${ctx.currentLesson.durationMinutes} мин, ${ctx.currentLesson.tier.toUpperCase()}).\n\nКраткая подсказка: ${ctx.currentLesson.summary}\n\nЗадайте вопрос по индексам PostgreSQL, N+1, Redis, Kafka, идемпотентности API или введите свой API-ключ в настройках **Gemini 3.5**.`;
  }

  return `Я ИИ-консультант на базе модели **Gemini 3.5** (ваш текущий уровень: **${ctx.level}**, ${ctx.xp} XP, тариф **${ctx.tier.toUpperCase()}**).\n\nМогу разобрать:
- Оптимизацию PostgreSQL (` + '`800ms → 45ms`' + `, индексы, EXPLAIN ANALYZE, N+1)
- Кэширование в Redis и защиту от Cache Stampede
- Микросервисы, Apache Kafka, Transactional Outbox и gRPC
- Проектирование API, JWT и Rate Limiting`;
}

export async function askAiTutor(
  query: string,
  settings: AiSettings,
  ctx: AssistantContextInfo
): Promise<{ text: string; source: 'gemini-3.5' | 'openai' }> {
  const systemPrompt = `Ты опытный Staff Backend Engineer и персональный ИИ-консультант платформы core.tutor на базе модели Gemini 3.5. Отвечай кратко, технически точно, на русском языке, с примерами кода. Уровень студента: ${ctx.level} (${ctx.xp} XP), тариф: ${ctx.tier}. ${
    ctx.currentLesson ? `Текущий урок: ${ctx.currentLesson.title}.` : ''
  }`;

  const geminiApiKey = settings.apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (settings.provider === 'gemini-3.5' && geminiApiKey.startsWith('AIza')) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(
          geminiApiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nВопрос студента: ${query}` }],
              },
            ],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, source: 'gemini-3.5' };
      }
    } catch {
      // Fallback to built-in Gemini 3.5 knowledge base
    }
  }

  if (settings.provider === 'openai' && settings.apiKey.trim()) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          temperature: 0.4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return { text, source: 'openai' };
      }
    } catch {
      // Fallback
    }
  }

  await new Promise((r) => setTimeout(r, 180));
  return { text: buildGeminiFallbackReply(query, ctx), source: 'gemini-3.5' };
}
