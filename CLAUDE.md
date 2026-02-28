# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Signal & Stories Dashboard — a multi-view market data dashboard built with Next.js. Two views: Housing (6 FRED indicators, 8 stocks, AI summary/commentary) and Labor (6 FRED indicators, AI summary). Firebase Auth protects all routes.

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
- `app/(auth)/` — Login, signup, reset-password pages

**API routes** (all require Bearer token):
- `app/api/fred/route.ts` — Proxy to FRED API. Params: `series_id`, `observation_start`. Cache: 1h.
- `app/api/stocks/route.ts` — Proxy to Alpha Vantage. Params: `symbol`. Cache: 15m.
- `app/api/summary/route.ts` — Housing AI summary (FRED + NewsAPI + Claude). Cache: 30m.
- `app/api/stock-commentary/route.ts` — Housing stock commentary (FRED + Alpha Vantage + Claude). Cache: 30m.
- `app/api/labor-summary/route.ts` — Labor AI summary (FRED + NewsAPI + Claude). Cache: 30m.

**Shared libraries:**
- `lib/indicators.ts` — Housing + labor indicator definitions
- `lib/stocks.ts` — Stock group definitions
- `lib/formatters.ts` — `formatValue`, `calculateTrend`, `getTrendArrow`
- `lib/fred-client.ts` — FRED fetch logic shared across summary routes
- `lib/claude-client.ts` — Claude API call utility
- `lib/firebase.ts` — Client SDK (lazy init)
- `lib/firebase-admin.ts` — Admin SDK (lazy init)
- `lib/auth-context.tsx` — `AuthProvider` + `useAuth` hook
- `lib/verify-auth.ts` — Server-side token verification
- `lib/use-auth-fetch.ts` — Client-side fetch wrapper that adds Bearer token

**Key patterns:**
- Each indicator card fetches independently with its own loading/error state
- Stock data cached in localStorage (15m TTL)
- Staggered stock API requests (1.5s delay) to respect Alpha Vantage rate limits
- Dark/light mode via CSS custom properties + `prefers-color-scheme`
- Chart.js sparklines on canvas refs via `useEffect`

## Housing Indicators (FRED Series IDs)

MSPUS (Median Home Price), EXHOSLUSM495S (Existing Home Sales), MORTGAGE30US (30-Year Mortgage Rate), MSACSR (Housing Inventory), HSN1F (New Home Sales), HOUST (Housing Starts)

## Labor Indicators (FRED Series IDs)

UNRATE (Unemployment Rate), PAYEMS (Nonfarm Payrolls), ICSA (Initial Jobless Claims), JTSJOL (Job Openings JOLTS), CES0500000003 (Avg. Hourly Earnings), CIVPART (Labor Force Participation)

## Environment Variables

Set via Vercel dashboard (Settings > Environment Variables) and `.env.local` for dev:

**API keys:**
- `FRED_API_KEY` — from https://fred.stlouisfed.org/docs/api/
- `ALPHA_VANTAGE_API_KEY` — from https://www.alphavantage.co/
- `NEWS_API_KEY` — from https://newsapi.org/
- `ANTHROPIC_API_KEY` — for Claude API (model: `claude-3-haiku-20240307`)

**Firebase client (public):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase admin (server-only):**
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
