# Signal & Stories — Housing Dashboard

A serverless housing market dashboard that combines real-time economic data, stock prices, news headlines, and AI-generated analysis in one view.

## Features

- **6 Housing Indicators** — Median home price, existing/new home sales, mortgage rates, inventory, and housing starts with 2-year sparkline charts and trend arrows
- **8 Housing-Related Stocks** — Homebuilders (DHI, LEN, PHM), mortgage lenders (RKT, UWMC), REITs & ETFs (INVH, VNQ, ITB) with 30-day price charts
- **AI Market Summary** — Claude analyzes housing data + news headlines to generate a concise market overview
- **AI Stock Commentary** — Claude connects housing fundamentals to stock performance
- **Dark/light mode** — Auto-detects system preference
- **Responsive** — Works on mobile and desktop

## Tech Stack

- Static HTML + vanilla JS + Chart.js (no build step)
- Vercel Serverless Functions (Node.js)
- APIs: FRED, Alpha Vantage, NewsAPI, Anthropic Claude

## Setup

Requires API keys configured as Vercel environment variables:

- `FRED_API_KEY` — [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/)
- `ALPHA_VANTAGE_API_KEY` — [alphavantage.co](https://www.alphavantage.co/)
- `NEWS_API_KEY` — [newsapi.org](https://newsapi.org/)
- `ANTHROPIC_API_KEY` — [anthropic.com](https://www.anthropic.com/)

## Running Locally

```bash
npm install -g vercel
vercel dev
```

Open http://localhost:3000

## Deploy

```bash
vercel deploy --prod
```
