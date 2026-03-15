# Sheena Ang Gastos Mo! — Claude Code Instructions

> **Owner:** Sheena · Donsol, Sorsogon, Philippines
> **Purpose:** Mobile PWA for daily expense tracking with 2-hour quick-log popup reminders

---

## Project Overview

**App name:** Sheena Ang Gastos Mo!
**User:** Sheena, mobile-first, Philippines (Asia/Manila, UTC+8)
**Currency:** PHP (₱) Philippine Peso

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Database | Supabase (free tier) |
| Auth | None (single-user personal app) |
| PWA | manifest.json + service worker |
| Push notifications | Web Push API + service worker |
| Hosting | Vercel (free tier) |
| Timezone | Asia/Manila (UTC+8) |
| Icons | Lucide React |

---

## Design System

**Fonts** (Google Fonts):
- Display/numbers: `Outfit`
- UI/body: `Plus Jakarta Sans`
- Mono/amounts: `JetBrains Mono`

**Primary Color:** Blue
- Primary: `#2563EB` (blue-600)
- Accent: `#3B82F6` (blue-500)
- Light: `#EFF6FF` (blue-50)

**Components:**
- Cards: white bg, shadow-card, 16px radius
- Buttons: blue-600 primary, surface secondary
- Bottom sheet overlay for quick-log (slides up, rounded top)
- Mobile max-width: 430px centered

---

## App Structure — 4 Tabs

| Tab | Component | What it does |
|---|---|---|
| Log | ExpenseLog.jsx | Quick entry + today's expenses list |
| Summary | Summary.jsx | Daily/weekly/monthly totals, category breakdown |
| Categories | Categories.jsx | Manage expense categories |
| Settings | Settings.jsx | Notifications, budget goals, CSV export |

**Quick-Log Overlay** (QuickLogOverlay.jsx): Slide-up panel with amount input + category picker + save. Opens from:
- Header + button
- Notification tap (every 2 hours, 8AM–8PM)

---

## Expense Categories (Preset)

Food & Drinks 🍜, Transport 🛵, Groceries 🛒, Bills & Utilities 💡, Load & Data 📱, Shopping 🛍️, Health 💊, Home 🏠, Entertainment 🎬, Others 📌

---

## Push Notification Schedule

Every 2 hours from 8 AM to 8 PM (Asia/Manila):
8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, 8:00 PM

**Interactive** — tapping opens the quick-log overlay directly, not just the app.

---

## Folder Structure

```
src/
  components/
    ExpenseLog.jsx
    Summary.jsx
    Categories.jsx
    Settings.jsx
    QuickLogOverlay.jsx
  lib/
    supabase.js
    storage.js
    dateUtils.js
    formatCurrency.js
    categories.js
    notifications.js
  App.jsx
  main.jsx
  index.css
public/
  manifest.json
  sw.js
  favicon.svg
  icons/
supabase/
  schema.sql
  seed.sql
```

---

## Rules

- **Never hardcode API keys** — use `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- **Free tier only** — Supabase free, Vercel free
- **Mobile-first** — max-width 430px, test on mobile viewport
- **Single files** — keep components in one file unless told otherwise
- **Timezone always** — every date/time operation must use Asia/Manila
- **Currency** — always PHP (₱), use formatPeso() from lib/formatCurrency.js
- **localStorage fallback** — app works without Supabase connection
