# Deployment Guide: Vercel Serverless

## What We Built

Converted the Express backend to Vercel serverless functions. Everything now deploys to Vercel!

## Architecture

```
packages/frontend/
├── api/                          ← Serverless API (Vercel auto-detects this)
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client
│   │   ├── yahooFinance.ts      ← Yahoo Finance fetching logic
│   │   └── priceCache.ts        ← Smart caching (auto-refresh stale data)
│   └── stocks/
│       ├── index.ts             ← GET /api/stocks (list all)
│       ├── [symbol].ts          ← GET /api/stocks/:symbol (with auto-refresh)
│       └── [symbol]/
│           ├── history.ts       ← GET /api/stocks/:symbol/history
│           └── predictions.ts   ← GET /api/stocks/:symbol/predictions
├── src/                         ← React frontend
└── dist/                        ← Built frontend