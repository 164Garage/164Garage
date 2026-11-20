# 1:64 Garage

Collector site for Hot Wheels, Matchbox, Mini GT and Majorette diecast cars: every drop, real-world prices, and a garage to show off your collection.

## How the site is put together

| File | What it is |
|---|---|
| `index.html` | The whole app, built from the Claude-hosted page with `python3 tools/build_index.py <page.html>`. |
| `runtime.js` | Connects the app to Supabase: accounts (email link, Google later), garages, profiles, market and trades, with live updates. Drops, prices and site settings also load from `/data`. |
| `api/scan.js` | The AI scanner (Vercel function). Needs `ANTHROPIC_API_KEY` in Vercel; capped at 150 scans per collector per day. |
| `supabase/setup.sql` | Database tables and access rules. Paste into Supabase → SQL Editor → Run. |
| `map/` | The hunting map's store data. |
| `data/` | Drops (`releases.json`), prices (`values.json`), collector-added cars, card details and site settings. |

There is no build step: Vercel serves the files as they are, plus the function in `api/`.

## Who can see and change what

- Anyone: drops, prices, public profiles, listings, posts, ratings and offers.
- Each collector: their own profile, listings, posts and so on, and their private garage (only they can read it).
- Admins (rows in `public.admins`): everything except other people's private garages.
