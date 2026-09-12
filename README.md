# Wanderplan Bot

Telegram bot version of Wanderplan — plans a trip through a short chat conversation
using the Claude API, and saves it to Supabase. Built to share the core `planTrip`
logic with the [Wanderplan web app](../wanderplan-ai).

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) on Telegram, copy the token.
2. Copy `.env.example` to `.env` and fill in:
   - `BOT_TOKEN` — from BotFather
   - `ANTHROPIC_API_KEY` — same key used in the web app
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — same project as the web app, or a new one
3. In Supabase, create a `trips` table:
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
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Demo mode

If `ANTHROPIC_API_KEY` is missing, or the Anthropic account has no credit balance,
`planTrip` automatically falls back to a hardcoded sample itinerary instead of
throwing an error. This means the bot stays fully clickable/demoable (e.g. for
a portfolio walkthrough) even without a funded API key — the returned itinerary
is clearly marked as demo data in its summary. Once real credits are added, it
switches back to live Claude-generated plans automatically, no code changes needed.

## Commands

- `/start` — welcome message
- `/plan` — starts the trip-planning conversation (city → dates → budget → interests)
- `/mytrips` — lists previously saved trips for this Telegram user

## Architecture

```
src/
├── shared/
│   ├── planTrip.ts   ← calls Claude API, returns a structured Itinerary
│   └── db.ts         ← Supabase read/write (shared shape with the web app)
├── conversations/
│   └── planTripConversation.ts  ← step-by-step dialog using @grammyjs/conversations
├── formatters/
│   └── toTelegramMD.ts  ← renders Itinerary as Telegram MarkdownV2
└── bot.ts            ← entry point, commands, wiring
```

The `shared/` folder is the same shape of logic used by the Wanderplan web app —
only the presentation layer (React components vs. Telegram messages) differs.

## Next steps / ideas

- Inline calendar keyboard instead of typed dates
- `/deletetrip` command
- Deploy to Railway/Render with a webhook instead of long polling
