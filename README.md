# Farmer Market Connect — Web App (Phase 1)

A real, running React 19 + TypeScript + MUI marketplace UI for **Farmer Market Connect**. This is the frontend phase, built against a mock API layer that's structured to be swapped for the real Node/Express + PostgreSQL backend without touching any component code.

## Stack
- React 19 + TypeScript + Vite
- **MUI (Material UI) v7** for all components and forms
- React Hook Form + Zod for validated, multi-step forms
- Zustand for auth/UI state (persisted to localStorage)
- TanStack Query for data fetching, caching, infinite scroll, and optimistic updates
- Framer Motion for page/step/list animations
- Sonner for toast notifications

## Run it locally (free, no signup needed)
```bash
npm install
npm run dev
```
Open the printed localhost URL. Login with **any 10-digit number starting 6-9** and OTP code **`1234`** (mock auth, no real SMS yet).

## What's implemented
- OTP-style login with role selection (Farmer / Buyer / Trader / Admin), animated step transition
- Marketplace: search, category & price filters, infinite scroll, skeleton loaders, live-sync indicator
- Listing detail page with buyer-interest list and an "express interest" form
- Farmer dashboard: stat cards, listings table, status stamp badges, optimistic status updates
- Multi-step animated "Post a crop" form (Zod-validated, date picker, image picker)
- Light/dark mode toggle (persisted)
- Error boundary + toasts wired app-wide

## Swapping in the real backend
Everything data-related lives in `src/api/client.ts` and `src/api/hooks.ts`. Replace the mock functions in `client.ts` with real `axios` calls to your Express API — the TanStack Query hooks, caching, and optimistic updates in `hooks.ts` don't need to change.

## Free hosting, $0 to run
| Piece | Free option |
|---|---|
| Database | Neon (neon.tech) — free Postgres, no card, scale-to-zero |
| Backend hosting | Render (render.com) free web service |
| Image uploads | Cloudinary (cloudinary.com) free tier |
| Push notifications | Firebase Cloud Messaging (free, unlimited) |
| Web hosting | Vercel or Netlify free tier |

## Next phases (not yet built)
- Node/Express + PostgreSQL backend with the schema we planned
- Socket.IO realtime chat & notifications
- React Native mobile app
- Admin panel, price intelligence, expense tracker, pesticide checker
- Docker Compose for local full-stack dev
