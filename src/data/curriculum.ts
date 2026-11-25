import { Lesson } from '../types/tutor';

export const LESSONS: Lesson[] = [
  // === 5 FREE LESSONS (Stage 1, 10 min each) ===
  {
    id: 'free-1-rest-http',
    stage: 1,
    title: '1. HTTP-контракты, идемпотентность и статусы API',
    category: 'api',
    tier: 'free',
    durationMinutes: 10,
    xpReward: 50,
    summary: 'Проектирование предсказуемых REST-эндпоинтов, коды ответов и защита от дублей платежей.',
    theory: [
      'Идемпотентный метод (GET, PUT, DELETE) при повторном вызове оставляет состояние сервера таким же, как при первом.',
      'POST по умолчанию не идемпотентен: без заголовка Idempotency-Key сетевой ретрай создаст дубликат заказа или списания.',
      'Используйте 201 Created для создания ресурса, 422 Unprocessable Entity для ошибок бизнес-валидации и 429 Too Many Requests для rate limit.',
    ],
    codeLanguage: 'ts',
    codeExample: `app.post('/v1/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key required' });
  }

  const cached = await redis.get(\`idem:\${idempotencyKey}\`);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const payment = await paymentService.charge(req.body);
  await redis.set(\`idem:\${idempotencyKey}\`, JSON.stringify(payment), 'EX', 86400);
  return res.status(201).json(payment);
});`,
    task: {
      prompt: 'Клиент отправил POST /v1/orders, но соединение оборвалось по таймауту до получения ответа. Какой механизм защитит от создания двух одинаковых заказов при ретрае?',
      codeContext: 'POST /v1/orders -> Timeout -> Retry POST /v1/orders',
      options: [
        {
          id: 'a',
          label: 'Использовать Idempotency-Key в заголовке и сохранять результат в Redis/БД',
          codeSnippet: "headers: { 'Idempotency-Key': uuid() }",
        },
        {
          id: 'b',
          label: 'Возвращать 200 OK на любой запрос без проверки',
          codeSnippet: 'return res.status(200).send("OK")',
        },
        {
          id: 'c',
          label: 'Увеличить таймаут клиента до 120 секунд',
          codeSnippet: 'timeout: 120000',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Ключ идемпотентности позволяет серверу распознать повторный запрос и вернуть уже сохраненный результат без повторного выполнения операции.',
    },
  },
  {
    id: 'free-2-sql-indexes',
    stage: 1,
    title: '2. Индексы PostgreSQL: ускорение с 800ms до 45ms',
    category: 'database',
    tier: 'free',
    durationMinutes: 10,
    xpReward: 60,
    summary: 'Как работает B-Tree индекс, порядок колонок в составном индексе и поиск медленных запросов.',
    theory: [
      'Без индекса PostgreSQL выполняет Seq Scan (полное чтение таблицы). На миллионах строк это сотни миллисекунд.',
      'В составном индексе (col_a, col_b) правило равенства идет первым: сначала колонки с "=", затем диапазоны (>, <, BETWEEN) и сортировка.',
      'Покрывающий индекс (INCLUDE) позволяет БД отдать результат через Index Only Scan даже не обращаясь к основной таблице (heap).',
    ],
    codeLanguage: 'sql',
    codeExample: `-- Было: Seq Scan на 4.2M строк (800ms)
SELECT id, total_amount, status
FROM orders
WHERE user_id = 42 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;

-- Решение: составной покрывающий индекс (45ms)
CREATE INDEX CONCURRENTLY idx_orders_user_status_created
ON orders (user_id, status, created_at DESC)
INCLUDE (total_amount);`,
    task: {
      prompt: 'Какой индекс лучше всего ускорит запрос: WHERE tenant_id = $1 AND created_at > $2 ORDER BY created_at DESC?',
      codeContext: 'SELECT * FROM events WHERE tenant_id = 7 AND created_at > NOW() - INTERVAL \'1 day\' ORDER BY created_at DESC;',
      options: [
        {
          id: 'a',
          label: 'CREATE INDEX ON events (created_at, tenant_id)',
          codeSnippet: '(created_at, tenant_id)',
        },
        {
          id: 'b',
          label: 'CREATE INDEX ON events (tenant_id, created_at DESC)',
          codeSnippet: '(tenant_id, created_at DESC)',
        },
        {
          id: 'c',
          label: 'Два отдельных индекса на tenant_id и created_at',
          codeSnippet: 'INDEX(tenant_id) + INDEX(created_at)',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Равенство (tenant_id = $1) ставится первым в B-Tree, а диапазон и сортировка (created_at DESC) — вторым, что дает быстрый Index Scan без дополнительной сортировки.',
    },
  },
  {
    id: 'free-3-jwt-auth',
    stage: 1,
    title: '3. Аутентификация: JWT, Refresh-токены и безопасность',
    category: 'api',
    tier: 'free',
    durationMinutes: 10,
    xpReward: 50,
    summary: 'Access vs Refresh токены, хранение в HttpOnly cookie и отзыв сессий.',
    theory: [
      'Access JWT должен жить мало (5–15 минут), потому что его нельзя мгновенно отозвать без обращения к хранилищу.',
      'Refresh-токен живет дольше (7–30 дней), хранится в HttpOnly + Secure + SameSite=Strict cookie и ротируется при каждом обновлении.',
      'Никогда не кладите пароли или секреты в payload JWT — он просто закодирован в Base64, а не зашифрован.',
    ],
    codeLanguage: 'ts',
    codeExample: `const accessToken = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '15m', algorithm: 'HS256' }
);

res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});`,
    task: {
      prompt: 'Где безопаснее всего хранить Refresh-токен в веб-приложении, чтобы защититься от XSS-атак?',
      codeContext: 'Auth Flow: Client <-> API Gateway',
      options: [
        {
          id: 'a',
          label: 'В localStorage браузера',
          codeSnippet: 'localStorage.setItem("refresh", token)',
        },
        {
          id: 'b',
          label: 'В HttpOnly, Secure cookie с SameSite=Strict',
          codeSnippet: 'httpOnly: true, secure: true, sameSite: "strict"',
        },
        {
          id: 'c',
          label: 'В query-параметрах URL',
          codeSnippet: '/api/refresh?token=...',
        },
      ],
      correctOptionId: 'b',
      explanation: 'JS-код на странице не имеет доступа к HttpOnly cookie, поэтому даже при XSS злоумышленник не сможет прочитать токен.',
    },
  },
  {
    id: 'free-4-redis-cache',
    stage: 1,
    title: '4. Кэширование в Redis: Cache-Aside и защита от Cache Stampede',
    category: 'integrations',
    tier: 'free',
    durationMinutes: 10,
    xpReward: 55,
    summary: 'Паттерн Cache-Aside, правильный TTL с джиттером и сброс горячих ключей.',
    theory: [
      'В паттерне Cache-Aside приложение сначала проверяет Redis; при промахе (Cache Miss) читает из БД и записывает в Redis с TTL.',
      'Если тысячи ключей истекают одновременно (Cache Stampede), нагрузка обрушивает БД. Решение: добавлять случайный jitter к TTL.',
      'Для защиты от пробивания несуществующими ID (Cache Penetration) кэшируйте даже пустой результат (null) на короткий TTL (30-60 сек).',
    ],
    codeLanguage: 'ts',
    codeExample: `async function getProduct(id: string) {
  const key = \`product:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const product = await db.products.findUnique({ where: { id } });
  const jitter = Math.floor(Math.random() * 60);
  await redis.set(key, JSON.stringify(product), 'EX', 300 + jitter);
  return product;
}`,
    task: {
      prompt: 'Зачем добавлять случайный jitter (разброс) к времени жизни ключа TTL в Redis?',
      codeContext: 'EX = 300 + random(0, 60)',
      options: [
        {
          id: 'a',
          label: 'Чтобы ключи не истекали одновременно и не вызывали лавину запросов в БД',
          codeSnippet: 'Prevents Cache Stampede',
        },
        {
          id: 'b',
          label: 'Чтобы Redis сжимал данные сильнее',
          codeSnippet: 'Redis compression',
        },
        {
          id: 'c',
          label: 'Чтобы обойти лимит подключений к БД',
          codeSnippet: 'Connection limit',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Разброс TTL распределяет истечение ключей во времени, предотвращая одновременный Cache Miss (Cache Stampede).',
    },
  },
  {
    id: 'free-5-docker-basics',
    stage: 1,
    title: '5. Docker для Backend: Multi-stage сборки и Graceful Shutdown',
    category: 'microservices',
    tier: 'free',
    durationMinutes: 10,
    xpReward: 55,
    summary: 'Уменьшение образа с 900MB до 25MB и корректная обработка SIGTERM.',
    theory: [
      'Multi-stage build отделяет этап сборки (компилятор, devDependencies) от финального runtime-образа (distroless или alpine).',
      'При деплое Kubernetes/Docker отправляет процессу сигнал SIGTERM. Сервис должен перестать принимать новые запросы и завершить текущие.',
      'Не запускайте процесс от root внутри контейнера — создавайте непривилегированного пользователя.',
    ],
    codeLanguage: 'dockerfile',
    codeExample: `FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/api

FROM gcr.io/distroless/static-debian12
USER nonroot:nonroot
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]`,
    task: {
      prompt: 'Что должен сделать backend-сервис при получении сигнала SIGTERM от оркестратора?',
      codeContext: 'process.on("SIGTERM", ...)',
      options: [
        {
          id: 'a',
          label: 'Немедленно вызвать process.exit(1)',
          codeSnippet: 'process.exit(1)',
        },
        {
          id: 'b',
          label: 'Закрыть прием новых соединений, дождаться завершения активных запросов и закрыть пул БД',
          codeSnippet: 'server.close(() => db.end())',
        },
        {
          id: 'c',
          label: 'Игнорировать сигнал и ждать SIGKILL',
          codeSnippet: 'ignore SIGTERM',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Graceful Shutdown гарантирует, что активные запросы пользователей не оборвутся с ошибкой 502 во время деплоя.',
    },
  },

  // === PRO LESSONS (Stages 2–4, 30 min each) ===
  {
    id: 'pro-1-n-plus-one',
    stage: 2,
    title: '6. [Pro] Проблема N+1, DataLoader и EXPLAIN ANALYZE',
    category: 'database',
    tier: 'pro',
    durationMinutes: 30,
    xpReward: 120,
    summary: 'Диагностика скрытых циклов запросов в ORM и оптимизация до 1 батч-запроса.',
    theory: [
      'N+1 возникает, когда мы получаем список из N сущностей (1 запрос), а затем в цикле подгружаем связанные данные для каждой (еще N запросов).',
      'Вместо 101 запроса используйте JOIN, WHERE id = ANY($1) или паттерн DataLoader для батчинга.',
      'В EXPLAIN (ANALYZE, BUFFERS) всегда смотрите на actual time, rows removed by filter и shared hit vs read.',
    ],
    codeLanguage: 'sql',
    codeExample: `-- Вместо 100 отдельных SELECT * FROM items WHERE order_id = $1
SELECT o.id, o.total, json_agg(i.*) AS items
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
WHERE o.user_id = $1
GROUP BY o.id;`,
    task: {
      prompt: 'Эндпоинт отдает 50 заказов и делает 51 SQL-запрос (время ответа 620ms). Какое решение устранит N+1 наиболее эффективно?',
      codeContext: 'orders = db.getOrders(50); for (o of orders) o.items = db.getItems(o.id);',
      options: [
        {
          id: 'a',
          label: 'Загрузить все items одним запросом WHERE order_id = ANY($1) и сгруппировать в памяти',
          codeSnippet: 'WHERE order_id = ANY($1)',
        },
        {
          id: 'b',
          label: 'Уменьшить лимит пагинации до 25 заказов',
          codeSnippet: 'LIMIT 25',
        },
        {
          id: 'c',
          label: 'Добавить больше реплик чтения PostgreSQL',
          codeSnippet: 'Add Read Replicas',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Батчинг через ANY($1) или JOIN сокращает количество сетевых round-trip к БД с N+1 до 1-2 запросов.',
    },
  },
  {
    id: 'pro-2-rate-limiter',
    stage: 2,
    title: '7. [Pro] Распределенный Rate Limiter: Token Bucket на Redis + Lua',
    category: 'api',
    tier: 'pro',
    durationMinutes: 30,
    xpReward: 130,
    summary: 'Атомарный подсчет квот в кластере без race conditions.',
    theory: [
      'Обычные GET + INCR в Redis без атомарности приводят к race condition под высокой конкуренцией.',
      'Lua-скрипты в Redis выполняются атомарно (single-threaded), что гарантирует точность Token Bucket или Sliding Window.',
      'Возвращайте клиенту заголовки X-RateLimit-Remaining и Retry-After при статусе 429.',
    ],
    codeLanguage: 'lua',
    codeExample: `-- Атомарный Sliding Window в Redis
local current = redis.call("INCR", KEYS[1])
if tonumber(current) == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
if tonumber(current) > tonumber(ARGV[2]) then
  return 0
end
return 1`,
    task: {
      prompt: 'Почему в распределенном Rate Limiter на Redis используют Lua-скрипт вместо отдельных вызовов GET и SET?',
      codeContext: '10 инстансов API одновременно проверяют лимит одного user_id',
      options: [
        {
          id: 'a',
          label: 'Lua-скрипт выполняется в Redis атомарно, исключая состояние гонки (race condition)',
          codeSnippet: 'EVAL atomic_limiter.lua',
        },
        {
          id: 'b',
          label: 'Lua-скрипты сжимают трафик по сети',
          codeSnippet: 'Gzip compression',
        },
        {
          id: 'c',
          label: 'Redis не поддерживает команду INCR без Lua',
          codeSnippet: 'INCR requires Lua',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Redis выполняет Lua-скрипт целиком без прерывания другими командами, что делает проверку и инкремент атомарными.',
    },
  },
  {
    id: 'pro-1-kafka-outbox',
    stage: 3,
    title: '8. [Pro] Kafka и Transactional Outbox в микросервисах',
    category: 'microservices',
    tier: 'pro',
    durationMinutes: 30,
    xpReward: 150,
    summary: 'Гарантированная доставка событий без распределенных 2PC-транзакций.',
    theory: [
      'Нельзя надежно записать в PostgreSQL и сразу отправить в Kafka без риска рассинхрона (dual-write problem).',
      'Transactional Outbox: в одной локальной ACID-транзакции сохраняем бизнес-сущность и запись в таблицу outbox_events.',
      'Отдельный worker или Debezium (CDC) вычитывает outbox_events и публикует в Kafka с гарантией At-Least-Once.',
    ],
    codeLanguage: 'sql',
    codeExample: `BEGIN;
  INSERT INTO orders (id, user_id, amount) VALUES ($1, $2, $3);
  INSERT INTO outbox_events (id, topic, payload, status)
  VALUES ($4, 'orders.created', $5, 'PENDING');
COMMIT;`,
    task: {
      prompt: 'Какую проблему решает паттерн Transactional Outbox?',
      codeContext: 'DB Commit OK -> Kafka Broker Timeout!',
      options: [
        {
          id: 'a',
          label: 'Проблему двойной записи (dual-write), гарантируя, что событие не потеряется при сбое брокера',
          codeSnippet: 'ACID Commit + Outbox Table',
        },
        {
          id: 'b',
          label: 'Ускоряет сериализацию JSON в 10 раз',
          codeSnippet: 'Fast JSON',
        },
        {
          id: 'c',
          label: 'Заменяет необходимость в индексах БД',
          codeSnippet: 'No indexes needed',
        },
      ],
      correctOptionId: 'a',
      explanation: 'Сохранение события в таблицу outbox в той же транзакции, что и бизнес-данные, гарантирует 100% согласованность.',
    },
  },
  {
    id: 'pro-4-observability',
    stage: 4,
    title: '9. [Pro] Observability: p99 latency, OpenTelemetry и Sharding',
    category: 'database',
    tier: 'pro',
    durationMinutes: 30,
    xpReward: 180,
    summary: 'Почему среднее время ответа (avg) врёт, как строить трейсинг и шардировать БД.',
    theory: [
      'Среднее (average) скрывает хвосты: 95% запросов могут идти за 20ms, а 5% (p95/p99) — за 3 секунды.',
      'OpenTelemetry передает trace_id через HTTP/gRPC/Kafka заголовки, позволяя увидеть весь путь запроса в микросервисах.',
      'Горизонтальное шардирование (Consistent Hashing по tenant_id/user_id) применяют, когда одна нода БД упирается в диск и запись.',
    ],
    codeLanguage: 'go',
    codeExample: `ctx, span := tracer.Start(ctx, "OrderService.Create")
defer span.End()

span.SetAttributes(
  attribute.String("tenant.id", tenantID),
  attribute.Int("items.count", len(items)),
)`,
    task: {
      prompt: 'Какая метрика лучше всего отражает реальный опыт самых медленных 1% пользователей API?',
      codeContext: 'Prometheus Histogram: http_request_duration_seconds',
      options: [
        {
          id: 'a',
          label: 'Среднее арифметическое (AVG)',
          codeSnippet: 'avg(duration)',
        },
        {
          id: 'b',
          label: '99-й перцентиль (p99)',
          codeSnippet: 'histogram_quantile(0.99, ...)',
        },
        {
          id: 'c',
          label: 'Минимальное время ответа (MIN)',
          codeSnippet: 'min(duration)',
        },
      ],
      correctOptionId: 'b',
      explanation: 'Перцентиль p99 показывает верхнюю границу задержки для 99% запросов, выявляя деградацию хвоста распределения.',
    },
  },
];
