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

Right now all data lives in memory and resets on refresh — that's the seed
data in `AppContext.jsx`.

## Wiring up Google Sheets

Browser code can't call the Google Sheets API directly without exposing
credentials, so the usual approach is:

1. Build a Google Apps Script "Web App" that reads/writes your Sheet and
   exposes it as a plain URL (`doGet`/`doPost`).
2. Replace the seed data and the state-setting functions inside
   `AppContext.jsx` with `fetch()` calls to that Apps Script URL.

Because every page already goes through `AppContext.jsx` instead of touching
data directly, that swap happens in one file — the pages don't need to change.

## Deploying so it's usable from your shop counter

`npm run build` produces a `dist/` folder you can host anywhere static files
are served (Netlify Drop is the fastest zero-signup option). For daily
counter use on a tablet, save the hosted page to the home screen.
