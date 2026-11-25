# `>_ core.tutor` — Персональный ИИ-репетитор по Backend-разработке

**Live Demo (Vercel):** https://core-tutor-backend.vercel.app

## Возможности
- **SaaS ИИ-репетитор (Gemini 3.5)**:
  - **Free**: 10 минут урока в день, 5 базовых уроков, квизы и практические задачи.
  - **Pro**: 30-минутные продвинутые уроки, 4 этапа обучения (`Junior → Middle → Senior → Staff`) и подписка через **Stripe Checkout** (`$5 / мес`).
- **Интерактивный терминал (`200 OK`)**, стек технологий, кейсы (`800ms → 45ms`) и темная/светлая темы.
- **Neon Postgres & Object Storage**: сохранение заявок, Stripe-событий и примеров кода в бакет `uploads`.

## Локальный запуск
```powershell
npm install
npm run server   # API-сервер (http://localhost:8787)
npm run dev      # Фронтенд (http://localhost:5173)
```
