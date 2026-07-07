# RentDesk

All 10 screens combined into one running app, sharing one set of data
(customers, products, machines, orders, payments, discounts, maintenance)
through `src/context/AppContext.jsx`.

## What's new in this version

- **Item-level rental history.** Each machine inside an order now has its own
  `segments` array — start date, end date, machine, and rate. Swapping a
  machine mid-rental (damaged, or wrong pickup) closes one segment and opens
  another, so billing splits automatically at the swap date instead of
  re-rating the whole order.
- **Manage Active Rental** — search any customer with an open rental, then
  swap a machine, add another machine to the same order, edit its return
  date, or return it individually.
- **Customers** — full profile per customer: personal details (editable),
  rental history, payment history, discount history, and a financial summary
  including any store credit on file.
- **Discounts** — Return Rental can apply a customizable discount, auto-filled
  from the gap between balance due and what the customer is actually paying.
- **Extra expense** — New Rental has an optional field for delivery/fuel/
  service charges, added into the final settlement.
- **Store credit** — if a damaged return would owe the customer a refund and
  there's no replacement machine, the shopkeeper is asked explicitly whether
  to refund cash or hold it as credit toward the customer's next rental.

## Run it

You need [Node.js](https://nodejs.org) installed (any recent version), then:

```
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## How it's organized

- `src/context/AppContext.jsx` — the single source of truth, plus shared
  helpers (`daysOf`, `itemRunningTotal`, `itemDaysLate`) used by every page
  that needs to compute rental duration or lateness.
- `src/pages/` — one file per screen.
- `src/components/ui.jsx` — shared buttons, cards, and the step tracker.
- `src/theme.js` — the color palette, in one place.

Right now all data lives in a Supabase (Postgres) database — see "Database
setup" below. It's shared across every device that signs in, and nothing
resets on refresh.

## Database setup (Supabase)

1. Go to your Supabase project → **SQL Editor** → paste in the contents of
   `supabase/schema.sql` from this repo → **Run**. This creates all the
   tables and locks them down so only signed-in users can read/write.
2. Go to **Authentication → Users → Add user** and create a login (email +
   password) for yourself and anyone else who'll use the app. There's no
   public sign-up screen on purpose — accounts are created here only.
3. Copy your **Project URL** and **anon public key** from
   **Project Settings → API**, and put them in a `.env` file at the root of
   this project (see `.env.example`):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. `npm install && npm run dev`, then sign in with the account from step 2.

The app starts empty — add your real products, machines, and customers
through the screens themselves.

## Wiring up Google Sheets

The app now uses Supabase instead, which is a real database with login
security — the section below is kept only in case you ever want a
lighter-weight (but less secure) alternative.

Browser code can't call the Google Sheets API directly without exposing
credentials, so the usual approach is:

1. Build a Google Apps Script "Web App" that reads/writes your Sheet and
   exposes it as a plain URL (`doGet`/`doPost`).
2. Replace the seed data and the state-setting functions inside
   `AppContext.jsx` with `fetch()` calls to that Apps Script URL.

Because every page already goes through `AppContext.jsx` instead of touching
data directly, that swap happens in one file — the pages don't need to change.

## Deploying so it's usable from your shop counter

The easiest path needs no local Node.js install at all:

1. Push this project to a GitHub repo (the `.env` file is git-ignored on
   purpose — it holds your Supabase keys).
2. On [Vercel](https://vercel.com) or [Netlify](https://netlify.com), import
   that repo. It auto-detects the Vite build.
3. In the site's **Environment Variables** settings, add `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` with the same values from your `.env`.
4. Deploy — you'll get a live URL. Open it on your shop's tablet/phone and
   "Add to Home Screen" so it opens like an app. Every device that signs in
   sees the same live data.

If you'd rather build locally: `npm install`, then `npm run build` produces
a `dist/` folder you can drag onto [Netlify Drop](https://app.netlify.com/drop)
— just remember to set the same two environment variables in the site
settings afterward, since Netlify Drop skips the build step and env vars are
picked up at build time.
