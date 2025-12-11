# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIcoes is an AI-powered stock prediction platform built as a monorepo with separate frontend and backend packages. The project uses npm workspaces for package management.

**Repository:** https://github.com/CFC-FPF/AIcoes

## Monorepo Structure

This is the **frontend** package within a monorepo. The repository root is at `../../` and contains:
- `packages/frontend/` - React + TypeScript + Vite application (current location)
- `packages/backend/` - Express + TypeScript API server with Supabase integration

## Development Commands

### Frontend (from this directory)
- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - Type-check with `tsc -b` and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript compiler without emitting files

### Backend (from ../backend)
- `npm run dev` - Start backend with nodemon + tsx (hot reload on file changes)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled backend from dist/
- `npm run type-check` - Type-check without emitting files

### Root Commands (from ../../)
- `npm run dev` - Run both frontend and backend concurrently
- `npm run dev:backend` - Run only backend
- `npm run dev:frontend` - Run only frontend
- `npm run build` - Build all workspaces
- `npm run type-check` - Type-check all workspaces

## Architecture

### Frontend Stack
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4 with @vitejs/plugin-react
- **Styling:** Tailwind CSS 4.1.17 with PostCSS and Autoprefixer
- **Language:** TypeScript 5.9.3
- **Linting:** ESLint with react-hooks and react-refresh plugins

### Backend Stack
- **Runtime:** Node.js with Express 4.18.2
- **Database:** Supabase (@supabase/supabase-js 2.86.0)
- **Language:** TypeScript 5.3.3
- **Dev Tooling:** tsx for development, nodemon for auto-restart

### Backend Architecture

The backend uses a specific initialization pattern to ensure environment variables load correctly:

1. **Environment Loading:** `dotenv` is imported and configured FIRST in `src/index.ts` before any other imports that depend on env vars
2. **Path Resolution:** `.env` file is located at `packages/backend/.env` (sibling to src/, not in src/)
3. **Dynamic Imports:** Routes and Supabase client are imported asynchronously in `startServer()` to ensure env vars are available

#### Environment Variables (Backend)
Required in `packages/backend/.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `PORT` - Optional, defaults to 3001
- `NODE_ENV` - Optional, environment name

#### API Routes
All routes are prefixed with `/api/stocks`:
- `GET /api/stocks` - List all stocks (ordered by symbol)
- `GET /api/stocks/:symbol` - Get stock with latest price (uses `v_latest_prices` view)
- `GET /api/stocks/:symbol/history?limit=30` - Get price history (from `prices` table)
- `GET /api/stocks/:symbol/predictions` - Get predictions (uses `v_active_predictions` view)
- `GET /health` - Health check endpoint (returns status, timestamp, environment)

#### Supabase Integration
- Client configured with `autoRefreshToken: false` and `persistSession: false` (service-side usage)
- Connection tested on startup via `testConnection()` function
- Database tables: `stocks`, `prices`
- Database views: `v_latest_prices`, `v_active_predictions`

### Frontend Architecture

- **API Integration:** Frontend expects backend at `http://localhost:3001`
- **Main Component:** `App.tsx` demonstrates health check integration with backend
- **Styling:** Uses Tailwind utility classes (dark theme: `bg-gray-900`, `text-white`)

## Important Notes

### TypeScript Configuration
- Frontend uses `"type": "module"` in package.json (ES modules)
- Backend also uses ES modules (note `.js` extensions in dynamic imports despite `.ts` source files)
- Type-checking runs independently of builds via `type-check` script

### Development Workflow
1. Start both services from root: `npm run dev`
2. Frontend runs on Vite's default port (typically 5173)
3. Backend runs on port 3001
4. Frontend makes CORS requests to backend

### Known Issues from Recent Commits
- Recent work focused on fixing dotenv configuration and path resolution
- tsconfig issues were addressed in commit history
- gitignore was updated recently
