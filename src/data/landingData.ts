import {
  CaseStudy,
  LearningStage,
  ServiceItem,
  TechCategory,
  TerminalPreset,
} from '../types/tutor';

export const TERMINAL_PRESETS: TerminalPreset[] = [
  {
    id: 'health',
    label: 'API Health',
    method: 'GET',
    endpoint: '/v1/api/health',
    status: '200 OK',
    latencyMs: 12,
    command: 'curl -i https://api.coretutor.dev/v1/api/health',
    responseJson: {
      status: '200 OK',
      uptime: '99.994%',
      region: 'eu-central-1',
      db_pool: { active: 14, idle: 36, wait_ms: 0.4 },
      cache: 'redis-cluster:HIT',
      latency_ms: 12,
    },
  },
  {
    id: 'optimize',
    label: 'DB Explain',
    method: 'POST',
    endpoint: '/v1/db/optimize',
    status: '200 OK',
    latencyMs: 45,
    command:
      'curl -X POST https://api.coretutor.dev/v1/db/optimize -d \'{"query":"orders_by_user"}\'',
    responseJson: {
      status: '200 OK',
      plan: 'Index Only Scan using idx_orders_user_created',
      before_ms: 800,
      after_ms: 45,
      speedup: '17.7x',
      buffers_hit: 128,
    },
  },
  {
    id: 'tutor',
    label: 'AI Tutor Check',
    method: 'POST',
    endpoint: '/v1/tutor/verify',
    status: '200 OK',
    latencyMs: 28,
    command:
      'curl -X POST https://api.coretutor.dev/v1/tutor/verify -d \'{"lesson":"pg-indexes","tier":"pro"}\'',
    responseJson: {
      status: '200 OK',
      verdict: 'PASSED',
      xp_awarded: 120,
      current_level: 'Middle -> Senior',
      next_stage: 'Distributed Systems & Kafka',
      latency_ms: 28,
    },
  },
];

export const TECH_STACK: TechCategory[] = [
  {
    title: 'Языки и рантаймы',
    subtitle: 'Высокая пропускная способность и строгая типизация',
    items: [
      { name: 'Go (Golang)', tag: 'Concurrency', detail: 'Goroutines, gRPC, low-latency сервисы' },
      { name: 'Node.js / TS', tag: 'Event Loop', detail: 'Fastify, NestJS, BFF и API-шлюзы' },
      { name: 'Python', tag: 'AsyncIO', detail: 'FastAPI, ML-пайплайны, Celery' },
      { name: 'Rust', tag: 'Zero-Cost', detail: 'Критичные к памяти и CPU узлы' },
    ],
  },
  {
    title: 'Базы данных и кэш',
    subtitle: 'Транзакционность, шардирование и субмиллисекундное чтение',
    items: [
      { name: 'PostgreSQL', tag: 'RDBMS', detail: 'B-Tree / GIN индексы, партиционирование' },
      { name: 'Redis', tag: 'In-Memory', detail: 'Кэширование, Rate Limiting, Distributed Locks' },
      { name: 'ClickHouse', tag: 'OLAP', detail: 'Аналитика миллиардов событий в реальном времени' },
      { name: 'PgBouncer', tag: 'Pooling', detail: 'Мультиплексирование соединений под нагрузкой' },
    ],
  },
  {
    title: 'Брокеры сообщений',
    subtitle: 'Асинхронная архитектура и гарантии доставки',
    items: [
      { name: 'Apache Kafka', tag: 'Streaming', detail: 'Партиции, Consumer Groups, Exactly-Once' },
      { name: 'RabbitMQ', tag: 'AMQP', detail: 'Dead Letter Queues, гибкий роутинг задач' },
      { name: 'NATS JetStream', tag: 'Low-Latency', detail: 'Легковесный pub/sub для микросервисов' },
      { name: 'Outbox Pattern', tag: 'Reliability', detail: 'Консистентность между БД и брокером' },
    ],
  },
  {
    title: 'DevOps и Observability',
    subtitle: 'Предсказуемые релизы и прозрачная телеметрия',
    items: [
      { name: 'Docker & K8s', tag: 'Orchestration', detail: 'Multi-stage сборки, HPA, Zero-downtime' },
      { name: 'Prometheus + Grafana', tag: 'Metrics', detail: 'RED/USE метрики, p95/p99 алерты' },
      { name: 'OpenTelemetry', tag: 'Tracing', detail: 'Распределенный трейсинг запросов' },
      { name: 'GitHub Actions', tag: 'CI/CD', detail: 'Автотесты, миграции БД, канареечный деплой' },
    ],
  },
];

export const SERVICES: ServiceItem[] = [
  {
    id: 'api',
    title: 'Проектирование API',
    subtitle: 'REST, gRPC, GraphQL & Gateways',
    description:
      'Проектируем отказоустойчивые API-шлюзы с валидацией схем, rate limiting, версионированием и предсказуемым контрактом.',
    metrics: 'p99 < 35ms',
    stack: ['OpenAPI 3.1', 'gRPC', 'JWT / OAuth2', 'Rate Limiter'],
    lessonId: 'free-1-rest-http',
  },
  {
    id: 'microservices',
    title: 'Микросервисы и Highload',
    subtitle: 'Event-Driven & Distributed Systems',
    description:
      'Разделение монолита без боли: Saga-паттерн, идемпотентность, Circuit Breaker и горизонтальное масштабирование.',
    metrics: '99.99% SLA',
    stack: ['Go', 'Kafka', 'gRPC', 'Circuit Breaker'],
    lessonId: 'pro-1-kafka-outbox',
  },
  {
    id: 'database',
    title: 'Оптимизация БД',
    subtitle: 'PostgreSQL Tuning & Caching',
    description:
      'Устранение N+1 запросов, настройка составных и покрывающих индексов, партиционирование и многоуровневое кэширование.',
    metrics: '800ms → 45ms',
    stack: ['EXPLAIN ANALYZE', 'B-Tree / GIN', 'Redis', 'PgBouncer'],
    lessonId: 'free-2-sql-indexes',
  },
  {
    id: 'integrations',
    title: 'Интеграции и Очереди',
    subtitle: 'Webhooks, Payments & Async Workers',
    description:
      'Надежные платежные и внешние интеграции с экспоненциальными повторами, очередями отложенных задач и дедупликацией.',
    metrics: '0% lost events',
    stack: ['RabbitMQ', 'Idempotency Key', 'DLQ', 'Webhooks'],
    lessonId: 'free-4-redis-cache',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-fintech-db',
    title: 'Ускорение биллинг-API и PostgreSQL',
    client: 'FinTech SaaS · 4.2M записей',
    before: '800ms',
    after: '45ms',
    deltaLabel: '-94.3% latency',
    summary:
      'Заменили тяжелые ORM-джойны на покрывающие составные индексы (Index Only Scan), устранили N+1 и вынесли горячие агрегации в Redis.',
    tags: ['PostgreSQL', 'Redis', 'EXPLAIN ANALYZE'],
  },
  {
    id: 'case-marketplace-rps',
    title: 'Масштабирование каталога под распродажу',
    client: 'E-Commerce Core · Peak Load',
    before: '1,200 RPS',
    after: '14,500 RPS',
    deltaLabel: '×12 throughput',
    summary:
      'Переписали критический сервис выдачи на Go, внедрили connection pooling через PgBouncer и локальный L1-кэш с TTL 5 секунд.',
    tags: ['Go', 'PgBouncer', 'L1/L2 Cache'],
  },
  {
    id: 'case-events-sla',
    title: 'Надежная обработка платежных вебхуков',
    client: 'Payment Gateway · Event Bus',
    before: '97.4% SLA',
    after: '99.99% SLA',
    deltaLabel: '0 потерянных событий',
    summary:
      'Внедрили Transactional Outbox + Apache Kafka с Dead Letter Queue и ключами идемпотентности для безопасных ретраев.',
    tags: ['Kafka', 'Outbox Pattern', 'Idempotency'],
  },
];

export const LEARNING_STAGES: LearningStage[] = [
  {
    stage: 1,
    title: 'Этап 1 · Фундамент API и БД',
    level: 'Junior',
    durationHint: 'Free (10 мин/день) · 5 уроков',
    requiredTier: 'free',
    description:
      'Базовые протоколы и хранение данных: жизненный цикл HTTP, статусы, REST-контракты, индексы SQL, JWT и кэширование.',
    topics: ['HTTP/REST & Status Codes', 'PostgreSQL Индексы', 'JWT & Sessions', 'Redis TTL', 'Docker-основы'],
  },
  {
    stage: 2,
    title: 'Этап 2 · Оптимизация и Highload',
    level: 'Middle',
    durationHint: 'Pro (30 мин/урок)',
    requiredTier: 'pro',
    description:
      'Глубокая работа с производительностью: чтение EXPLAIN ANALYZE, устранение N+1, изоляция транзакций и Rate Limiting.',
    topics: ['EXPLAIN ANALYZE', 'Isolation Levels & Locks', 'Token Bucket Limiter', 'Connection Pooling'],
  },
  {
    stage: 3,
    title: 'Этап 3 · Распределенные системы',
    level: 'Senior',
    durationHint: 'Pro (30 мин/урок)',
    requiredTier: 'pro',
    description:
      'Архитектура микросервисов: Apache Kafka, паттерн Transactional Outbox, Saga-транзакции и идемпотентность.',
    topics: ['Kafka & Partitions', 'Transactional Outbox', 'gRPC & Protobuf', 'Circuit Breaker'],
  },
  {
    stage: 4,
    title: 'Этап 4 · Production & Observability',
    level: 'Staff',
    durationHint: 'Pro (30 мин/урок)',
    requiredTier: 'pro',
    description:
      'Эксплуатация под нагрузкой: шардирование БД, OpenTelemetry-трейсинг, Kubernetes HPA и проектирование систем.',
    topics: ['DB Sharding', 'OpenTelemetry & Prometheus', 'Zero-Downtime Migrations', 'System Design'],
  },
];
