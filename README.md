# 🧳 Wanderplan Bot

Telegram bot that plans a trip through a short chat conversation, powered by the Claude API and backed by Supabase.

Built as the third project in a portfolio series — it shares its core trip-planning logic with the [Wanderplan web app](https://github.com/YevheniiLi/turi-bot-tg/tree/wanderplan-ai). Same business logic, two different interfaces: a web app and a chat bot.

<!-- 🎥 Add a demo GIF/screenshot here — a screen recording of /plan in action goes a long way -->

**Stack:** TypeScript · [grammY](https://grammy.dev/) · Anthropic Claude API · Supabase

---

## ✨ What it does

- `/plan` — walks you through a short conversation (city → dates → budget → interests) and generates a day-by-day itinerary using Claude
- `/mytrips` — lists your previously saved trips
- Automatically falls back to a demo itinerary if the Claude API is unavailable, so the bot is always demoable — see [Demo mode](#-demo-mode)

## 🏗 Architecture

```
src/
├── shared/
│   ├── planTrip.ts    ← calls Claude API, returns a structured Itinerary
│   └── db.ts          ← Supabase read/write (shared shape with the web app)
├── conversations/
│   └── planTripConversation.ts  ← step-by-step dialog (@grammyjs/conversations)
├── formatters/
│   └── toTelegramMD.ts  ← renders an Itinerary as Telegram MarkdownV2
└── bot.ts             ← entry point, commands, wiring
```

The `shared/` folder holds the same logic used by the Wanderplan web app — only the presentation layer changes (React components vs. Telegram messages).

## 🎭 Demo mode

If `ANTHROPIC_API_KEY` is missing, or the Anthropic account has no credit balance, `planTrip` automatically falls back to a hardcoded sample itinerary instead of throwing an error. The bot stays fully clickable for a portfolio walkthrough even without a funded API key — the demo itinerary is clearly marked as such in its summary. Once real credits are added, it switches back to live Claude-generated plans automatically, no code changes needed.

## 🚀 Setup

1. **Create a bot** with [@BotFather](https://t.me/BotFather) on Telegram and copy the token it gives you.
2. **Copy the env file** and fill it in:
   ```bash
   cp .env.example .env
   ```
   | Variable | Where to get it |
   |---|---|
   | `BOT_TOKEN` | From BotFather |
   | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
   | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → Data API |
3. **Create the `trips` table** in Supabase's SQL Editor:
   ```sql
   create table trips (
     id uuid primary key default gen_random_uuid(),
     telegram_id bigint not null,
     city text not null,
     start_date date,
     end_date date,
     itinerary jsonb not null,
     created_at timestamptz default now()
   );
   ```
4. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

## 💬 Commands

| Command | Description |
|---|---|
| `/start` | Welcome message |
| `/plan` | Starts the trip-planning conversation |
| `/mytrips` | Lists previously saved trips |

## 🔭 Next steps

- Inline calendar keyboard instead of typed dates
- `/deletetrip` command
- Deploy to Railway/Render with a webhook instead of long polling
