# Farmer Market Connect

A real, running full-stack marketplace: **React 19 + TypeScript + MUI** frontend talking to an
**Express + Socket.IO + PostgreSQL (Neon)** backend, with realtime updates and role-based access
control for Farmers, Buyers, Traders and Admins.

## What changed in this pass

- **Real backend** (`/server`) — Express API + Socket.IO, backed by your Neon Postgres database.
  The old in-memory mock (`src/api/client.ts` returning fake delayed data) is gone; the frontend
  now calls real HTTP endpoints.
- **Realtime everywhere**, over Socket.IO:
  - New crop listings and status changes push instantly to everyone browsing the marketplace.
  - A farmer gets a live toast the moment a buyer expresses interest in their crop.
  - **Realtime pesticide price checker** — prices tick up/down every few seconds like a live
    market feed, broadcast to every connected client.
  - If an admin changes someone's role, that person's app updates immediately, no refresh.
- **Role-based access control**, enforced on the server (not just hidden in the UI):
  - **Farmer** — post crops, manage their own listings' status, cannot see other farmers'
    dashboards, cannot express buyer interest.
  - **Buyer / Trader** — browse the marketplace, express interest in listings. Cannot post crops
    or access the farmer dashboard.
  - **Admin** — sees everything, plus a `/admin` page to change anyone's role. Admin is the only
    role that can grant admin.
  - `admin` can **never** be self-selected at signup — the login form only offers Farmer / Buyer /
    Trader. The one seeded admin account (or any admin they later promote) is the only way in.
- **One admin account, seeded on purpose**: phone `6302350963`. See "OTP & the seeded admin" below.
- **Images fixed**: the old mock cycled through 6 unrelated stock photos by array index (`idx %
  images.length`), so "Basmati Rice" could show a photo of chillies. Listings and the crop-photo
  picker now use crop/category-matched images instead.
- **Fonts**: the theme (`src/app/theme.ts`) already applies Fraunces for headings, Inter for body
  text, and JetBrains Mono for prices consistently everywhere via MUI's theme — that part was
  correct. What *was* broken: a leftover, unused Vite-starter `src/index.css` with a totally
  different font stack and a hard-coded `1126px` layout width sitting in the repo. It wasn't
  imported anywhere so it had no visible effect, but it's exactly the kind of stale file that
  causes "why does this look different sometimes" confusion — it's been deleted, along with an
  unused `hero.png` asset.

## ⚠️ About the database credentials you pasted

You shared your Neon connection string (with the real password) directly in chat. Treat it as
compromised: **rotate the password in the Neon console** (Settings → Reset password) and update
`server/.env` once you're done testing. It's already placed in `server/.env`, which is
git-ignored, so it won't get committed if you push this to GitHub — just don't paste it in chat
again.

## Stack

**Frontend:** React 19 + TypeScript + Vite, MUI v7, React Hook Form + Zod, Zustand, TanStack
Query, Framer Motion, Sonner, Socket.IO client.

**Backend:** Node + Express, Socket.IO, `pg` (node-postgres) against Neon Postgres, JWT auth.

## Run it locally

### 1. Backend

```bash
cd server
npm install
npm run migrate   # creates tables in your Neon database
npm run seed       # creates the one admin account + demo farmers/listings/pesticide prices
npm run dev         # starts the API + realtime server on http://localhost:4000
```

### 2. Frontend (separate terminal)

```bash
npm install
npm run dev          # http://localhost:5173, already pointed at the backend via .env
```

## OTP & the seeded admin

There's no SMS gateway wired up yet (that needs a paid provider like Twilio or MSG91 — happy to
wire one in once you have an account). Right now, requesting an OTP:

1. Generates a real random 4-digit code server-side (not the old hardcoded `1234`).
2. Logs it to the **server terminal**: `📲 OTP for +91 6302350963: 4821 (valid 5 min)`.
3. Also returns it in the API response outside production (`devOtp`), which the login screen
   shows in an on-screen banner — so you can test end-to-end without watching the terminal.

**To sign in as the admin:** open the login page, enter `6302350963`, request the OTP, and use
whichever code appears (terminal or on-screen banner — they're the same code). This number is the
only one seeded as `admin`; every other number that signs in becomes whatever role they picked
(Farmer / Buyer / Trader), and only an admin can promote someone from there via the **Admin →
Change role** page.

When you're ready to send real SMS, swap the `console.log` in `server/src/routes/auth.js` for a
real provider call and stop returning `devOtp` in production (`NODE_ENV=production` already
suppresses it automatically).

## Role-based access, concretely

| Action | Farmer | Buyer / Trader | Admin |
|---|---|---|---|
| Browse marketplace | ✅ | ✅ | ✅ |
| Post a crop listing | ✅ (own only) | ❌ | ✅ |
| See "My dashboard" | ✅ (own listings only) | ❌ | ✅ |
| Change a listing's status | ✅ (own only) | ❌ | ✅ (any) |
| Express interest in a listing | ❌ | ✅ | ❌ |
| View pesticide prices | ✅ | ✅ | ✅ |
| View `/admin` — all users | ❌ | ❌ | ✅ |
| Change anyone's role | ❌ | ❌ | ✅ |

All of this is enforced **server-side** in `server/src/middleware/auth.js` and each route file —
the frontend hiding a button is just a UX nicety, not the actual security boundary.

## Project structure

```
/                     — frontend (Vite root)
  src/api/            — REST client (client.ts) + TanStack Query hooks (hooks.ts)
  src/lib/socket.ts   — Socket.IO client singleton
  src/features/       — pages, incl. new admin/ and pesticides/
  src/store/          — Zustand auth + UI state
/server               — backend
  src/index.js        — Express + Socket.IO entry point
  src/schema.sql       — Postgres schema (users, crop_listings, buyer_interests, pesticide_prices)
  src/migrate.js       — applies schema.sql to DATABASE_URL
  src/seed.js          — creates the admin, demo farmers, listings, pesticide catalog
  src/routes/          — auth, listings, users (admin), pesticides
  src/otpStore.js       — in-memory OTP issuing/verification (swap for Redis at scale)
  src/pesticideSimulator.js — the realtime price-tick loop
```

## Free hosting, $0 to run

| Piece | Free option |
|---|---|
| Database | Neon (neon.tech) — free Postgres, no card, scale-to-zero (already set up) |
| Backend hosting | Render (render.com) free web service |
| Image uploads | Cloudinary (cloudinary.com) free tier — for real farmer-uploaded photos |
| Web hosting | Vercel or Netlify free tier |
| SMS/OTP | Twilio or MSG91 free trial credits |

## Next phases (not yet built)

- Real SMS OTP delivery (Twilio/MSG91)
- Real photo uploads (Cloudinary) instead of picker/demo images
- Socket.IO chat between farmer and interested buyers
- React Native mobile app
- Price intelligence, expense tracker
- Docker Compose for local full-stack dev
