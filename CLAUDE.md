# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Signal & Stories — Housing is a serverless housing market dashboard. Static HTML frontend + Vercel Serverless Functions backend. No build step, no framework, no bundler.

## Development Commands

```bash
# Local development (requires Vercel CLI: npm i -g vercel)
vercel dev

# Deploy preview
vercel deploy

# Deploy to production
vercel deploy --prod

# Test API endpoints locally
curl "http://localhost:3000/api/fred?series_id=MSPUS"
curl "http://localhost:3000/api/summary"
```

There is no build, lint, or test command — the project has no build step and no test suite.

## Architecture

**Frontend:** Single `index.html` file containing all HTML, CSS (with CSS custom properties for dark/light theming), and vanilla JavaScript. Uses Chart.js from CDN for mini sparkline charts.

**Backend:** Two Vercel Serverless Functions in `api/`:
- `api/fred.js` — Proxy to FRED (Federal Reserve) API. Accepts `series_id` and optional `observation_start` query params. Cached 1 hour.
- `api/summary.js` — Aggregates data from three external APIs (FRED, NewsAPI, Claude API) to produce an AI-generated market summary with news headlines. Cached 30 minutes.

**Data flow:** `index.html` makes parallel fetch calls — one per housing indicator to `/api/fred` and one to `/api/summary`. Each indicator card loads independently with its own loading/error state.

## Housing Indicators (FRED Series IDs)

MSPUS (Median Home Price), EXHOSLUSM495S (Existing Home Sales), MORTGAGE30US (30-Year Mortgage Rate), MSACSR (Housing Inventory), HSN1F (New Home Sales), HOUST (Housing Starts)

## Environment Variables

All set via Vercel dashboard (Settings → Environment Variables):
- `FRED_API_KEY` — from https://fred.stlouisfed.org/docs/api/
- `NEWS_API_KEY` — from https://newsapi.org/
- `ANTHROPIC_API_KEY` — for Claude API (model: `claude-3-haiku-20240307`)

## Key Patterns

- Serverless handlers export `async function handler(req, res)` with standard Vercel signature
- Frontend uses vanilla DOM manipulation (`querySelector`, `innerHTML`, `textContent`)
- External API errors in `summary.js` are handled gracefully — individual FRED indicator failures are skipped
- CSS theming via custom properties with `@media (prefers-color-scheme: dark)` override
- Responsive grid layout with `auto-fit` and `minmax(340px, 1fr)`
