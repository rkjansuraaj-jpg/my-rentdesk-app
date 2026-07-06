# RentDesk

All 8 screens combined into one running app, sharing one set of data
(customers, products, machines, orders, payments, maintenance) through
`src/context/AppContext.jsx`.

## Run it

You need [Node.js](https://nodejs.org) installed (any recent version), then:

```
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## How it's organized

- `src/context/AppContext.jsx` — the single source of truth. Every page reads
  and writes through this, so renting a machine on "New Rental" instantly
  shows up on the Dashboard and in Machine List.
- `src/pages/` — one file per screen.
- `src/components/ui.jsx` — shared buttons, cards, and the step tracker so
  every screen looks consistent.
- `src/theme.js` — the color palette, in one place.

Right now all data lives in memory and resets on refresh — that's the seed
data in `AppContext.jsx`.

## Wiring up Google Sheets

Browser code can't call the Google Sheets API directly without exposing
credentials, so the usual approach is:

1. Build a Google Apps Script "Web App" that reads/writes your Sheet and
   exposes it as a plain URL (`doGet`/`doPost`).
2. Replace the seed data and the state-setting functions inside
   `AppContext.jsx` (e.g. `addProduct`, `createRental`) with `fetch()` calls
   to that Apps Script URL.

Because every page already goes through `AppContext.jsx` instead of touching
data directly, that swap happens in one file — the pages don't need to change.

## Deploying so it's usable from your shop counter

`npm run build` produces a `dist/` folder you can host anywhere static files
are served (Netlify, Vercel, GitHub Pages, or even a folder on your own PC
with a simple server). For daily counter use on a tablet, a free host like
Netlify with the page saved to the home screen works well.
