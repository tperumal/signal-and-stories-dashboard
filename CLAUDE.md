# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Signal & Stories Dashboard — a multi-view economic data dashboard built with Next.js. Five views: Housing, Labor, Inflation, GDP & Growth, and Consumer. Each view shows 6 FRED indicators with sparkline charts and an AI-generated summary. Firebase Auth protects all routes.

## Development Commands

```bash
npm run dev       # Local dev server (http://localhost:3000)
npm run build     # Production build
npm start         # Start production server
npm run lint      # Lint with Next.js ESLint
```

## Architecture

**Framework:** Next.js 15 App Router with TypeScript and Tailwind v4.

**Authentication:** Firebase Auth (Email/Password). Client SDK handles login/signup/reset. Middleware checks `auth-token` cookie for route protection. API routes verify Bearer tokens via Firebase Admin SDK.

**Frontend structure:**
- `app/layout.tsx` — Root layout, wraps everything in `AuthProvider`
- `app/(dashboard)/layout.tsx` — Dashboard shell with nav bar
- `app/(dashboard)/housing/page.tsx` — Housing indicators view
- `app/(dashboard)/labor/page.tsx` — Labor indicators view
- `app/(dashboard)/inflation/page.tsx` — Inflation indicators view
- `app/(dashboard)/gdp/page.tsx` — GDP & Growth indicators view
- `app/(dashboard)/consumer/page.tsx` — Consumer indicators view
- `app/(auth)/` — Login, signup, reset-password pages

**API routes** (all require Bearer token):
- `app/api/fred/route.ts` — Proxy to FRED API. Params: `series_id`, `observation_start`, `units`. Cache: 1h.
- `app/api/summary/route.ts` — Housing AI summary (FRED + NewsAPI + Claude). Cache: 30m.
- `app/api/labor-summary/route.ts` — Labor AI summary (FRED + NewsAPI + Claude). Cache: 30m.
- `app/api/inflation-summary/route.ts` — Inflation AI summary (FRED + NewsAPI + Claude). Cache: 30m.
- `app/api/gdp-summary/route.ts` — GDP AI summary (FRED + NewsAPI + Claude). Cache: 30m.
- `app/api/consumer-summary/route.ts` — Consumer AI summary (FRED + NewsAPI + Claude). Cache: 30m.

**Shared libraries:**
- `lib/indicators.ts` — All indicator definitions (housing, labor, inflation, GDP, consumer)
- `lib/formatters.ts` — `formatValue`, `calculateTrend`, `getTrendArrow`
- `lib/fred-client.ts` — FRED fetch logic shared across summary routes (supports `units` param for YoY % change)
- `lib/claude-client.ts` — Claude API call utility
- `lib/firebase.ts` — Client SDK (lazy init)
- `lib/firebase-admin.ts` — Admin SDK (lazy init)
- `lib/auth-context.tsx` — `AuthProvider` + `useAuth` hook
- `lib/verify-auth.ts` — Server-side token verification
- `lib/use-auth-fetch.ts` — Client-side fetch wrapper that adds Bearer token

**Key patterns:**
- Each indicator card fetches independently with its own loading/error state
- Indicators with `apiUnits: "pc1"` request year-over-year percent change from FRED
- Dark/light mode via CSS custom properties + `prefers-color-scheme`
- Chart.js sparklines on canvas refs via `useEffect`

## Indicators by View (FRED Series IDs)

**Housing:** MSPUS, EXHOSLUSM495S, MORTGAGE30US, MSACSR, HSN1F, HOUST

**Labor:** UNRATE, PAYEMS, ICSA, JTSJOL, CES0500000003, CIVPART

**Inflation:** CPIAUCSL (pc1), PCEPILFE (pc1), PPIFIS (pc1), T10YIE, GASREGW, CPIUFDSL (pc1)

**GDP & Growth:** A191RL1Q225SBEA, INDPRO (pc1), DGORDER, NAPM, PERMIT, T10Y2Y

**Consumer:** RSAFS, UMCSENT, DPCERAM1M225NBEA, REVOLSL, PSAVERT, TOTALSA

## Environment Variables

Set via Vercel dashboard (Settings > Environment Variables) and `.env.local` for dev:

**API keys:**
- `FRED_API_KEY` — from https://fred.stlouisfed.org/docs/api/
- `NEWS_API_KEY` — from https://newsapi.org/
- `ANTHROPIC_API_KEY` — for Claude API (model: `claude-3-haiku-20240307`)

**Firebase client (public):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase admin (server-only):**
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
