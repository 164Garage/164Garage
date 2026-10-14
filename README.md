# 1:64 Garage

Collector site for Hot Wheels, Matchbox, Mini GT and Majorette diecast cars: every drop, real-world prices, and a garage to show off your collection.

## How the site is put together

| File | What it is |
|---|---|
| `index.html` | The whole app (same app as the Claude-hosted version). |
| `runtime.js` | Connects the app to its data. Right now it's the **preview runtime**: it reads the release database, prices and collector-added cars from `/data` and keeps accounts closed. The next step swaps in a Supabase runtime for sign-ups, garages, scanning and trading. |
| `data/releases.json` | 290 sets / ~2,900 cars. |
| `data/values.json` | Checked real-world prices. |
| `data/catalog.json` | Cars collectors added from their own garages. |
| `vercel.json` | Hosting settings for Vercel. |

There is no build step: Vercel serves the files as they are.

## Deploying on Vercel

1. On vercel.com click **Add New → Project**, pick **164garage**, and click **Import**.
2. Leave **Framework Preset** on *Other* and leave the build settings empty.
3. Click **Deploy**. The site goes live at `164garage.vercel.app` (or a similar address). Every change pushed to `main` goes live automatically.
