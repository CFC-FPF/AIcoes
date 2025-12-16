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

#### Component Structure
- **Components:** Located in `components/` directory (NOT inside `src/`)
  - `components/ui/` - Reusable UI components (Button, SearchBar, etc.)
  - `components/layout/` - Layout components (Navbar, etc.)
  - `components/sections/` - Page sections (HeroSection, etc.)
- **Pages:** Located in `src/pages/`
- **Routing:** React Router DOM v7 for client-side routing

#### Tailwind CSS v4 Configuration (IMPORTANT)

**Critical:** This project uses **Tailwind CSS v4**, which has a different configuration approach than v3:

1. **Theme Configuration Location:**
   - Custom theme values MUST be defined in `src/index.css` using the `@theme` directive
   - `tailwind.config.js` is ONLY used for specifying which files to scan (`content` array)
   - DO NOT add theme customizations to `tailwind.config.js` - they won't work

2. **Example Theme Configuration** (`src/index.css`):
   ```css
   @import "tailwindcss";

   @theme {
     --color-brand-light: #7C3AED;
     --color-brand-dark: #4F46E5;
     --spacing-input-x: 2rem;
     --radius-component: 1rem;
   }
   ```

3. **Naming Patterns:**
   - Colors: `--color-{name}` → Use as `text-{name}`, `bg-{name}`, `from-{name}`, `to-{name}`
   - Spacing: `--spacing-{name}` → Use as `p-{name}`, `m-{name}`, `gap-{name}`, `w-{name}`, `h-{name}`
   - Border Radius: `--radius-{name}` → Use as `rounded-{name}`

4. **Required Dependencies:**
   - `@tailwindcss/postcss` - PostCSS plugin for Tailwind v4
   - `jiti` - Required by Tailwind v4 for config loading
   - `lightningcss` - Fast CSS processing for Tailwind v4

5. **Content Scanning** (`tailwind.config.js`):
   ```js
   content: ["./**/*.{js,ts,jsx,tsx}"]  // Scans ALL files in frontend directory
   ```

6. **PostCSS Configuration** (`postcss.config.js`):
   ```js
   plugins: {
     '@tailwindcss/postcss': {},  // NOT 'tailwindcss'
     autoprefixer: {},
   }
   ```

#### Debugging Tailwind Issues

If custom Tailwind classes aren't working:
1. Check if value is defined in `@theme` block in `src/index.css`
2. Verify file is being scanned (check `tailwind.config.js` content array)
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Inspect element in browser DevTools to see if CSS is generated
5. Check dev server logs for PostCSS errors

#### API Integration
- Frontend expects backend at `http://localhost:3001`
- Uses React Router DOM for routing

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

## Recent Changes & Fixes

### 2024-12-16: Vercel Serverless Deployment Fixes

**Problem:** Vercel deployment was failing with TypeScript and dependency errors:
1. TypeScript TS2835 errors: "Relative import paths need explicit file extensions"
2. Cannot find module 'shared' errors
3. PostCSS/Tailwind dependency installation failures
4. Dashboard route not matching (404 on `/dashboard`)

**Root Causes:**
1. **ESM Module Resolution:** `package.json` has `"type": "module"`, which makes Node.js treat all files as ES Modules. When using TypeScript with `moduleResolution: "node16"` or `"nodenext"`, Node.js requires **explicit `.js` extensions** in imports, even for `.ts` files (because at runtime they become `.js` files).

2. **Shared Module Resolution:** The `'shared'` package imports weren't resolving because Vercel couldn't find the package path. Required using relative paths instead.

3. **Monorepo Dependencies:** Vercel was set to build from `packages/frontend` as root directory, but couldn't access parent `node_modules` or root `package-lock.json`. The `@tailwindcss/postcss` package is managed at the monorepo root level.

4. **React Router Configuration:** Router only had `/dashboard/:symbol` route, causing 404 on `/dashboard` without a symbol parameter.

**Solutions Applied:**

1. **Fixed API Import Paths** - Added `.js` extensions to all relative imports in `api/` directory:
   ```typescript
   // Before
   import { supabase } from '../lib/supabase';

   // After
   import { supabase } from '../lib/supabase.js';
   ```
   Files updated:
   - `api/stocks/[symbol]/history.ts`
   - `api/stocks/[symbol]/predictions.ts`
   - `api/stocks/[symbol].ts`
   - `api/stocks/index.ts`
   - `api/lib/priceCache.ts`

2. **Fixed Shared Module Imports** - Replaced `'shared'` with relative paths:
   ```typescript
   // Before
   import type { Stock, ApiResponse } from 'shared';

   // After
   import type { Stock, ApiResponse } from '../../../shared/src/index.js';
   ```

3. **Created `api/tsconfig.json`** - Proper TypeScript config for API routes:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "Node16",
       "moduleResolution": "node16",
       ...
     }
   }
   ```

4. **Updated `vercel.json`** - Fixed monorepo dependency installation:
   ```json
   {
     "buildCommand": "cd ../.. && npm install && cd packages/frontend && npm run build",
     "installCommand": "cd ../.. && npm install",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   This ensures Vercel installs dependencies from the monorepo root before building.

5. **Fixed React Router** - Added catch-all `/dashboard` route in `App.tsx`:
   ```typescript
   <Route path="/dashboard" element={<Dashboard />} />
   <Route path="/dashboard/:symbol" element={<Dashboard />} />
   ```

**Key Learnings:**
- When using `"type": "module"` with Node16/NodeNext module resolution, always use `.js` extensions in imports
- TypeScript doesn't rewrite import paths during compilation - you must reference the runtime file extension
- Vercel builds from the specified root directory and can't access parent node_modules without custom install commands
- Monorepo projects need explicit install/build commands in `vercel.json`

**Vercel Configuration:**
- **Root Directory:** `packages/frontend` (set in Vercel dashboard)
- **Production Branch:** `main`
- **Install Command:** Custom command to install from monorepo root
- **Build Command:** Custom command to build from monorepo context
