---
name: ifesquare-design
description: Design system guidelines, Tailwind CSS v4 tokens, typography, shadcn/ui component usage, and responsive styling for Ifesquare.
---

# Ifesquare Design System & UI Guide

## Overview

Ifesquare's frontend uses modern, clean, utility-driven styling built on **React 19**, **Tailwind CSS v4**, and **shadcn/ui** (Radix UI primitives).

The UI is optimized for daily shop operations: fast entry on mobile devices (smartphones, tablets) and detailed analysis on desktop browsers.

---

## Typography

- **Primary Font**: `Inter Variable` (loaded via `@fontsource-variable/inter`).
- **Hierarchy**:
  - Headings: `font-semibold` or `font-bold` (H1: `text-2xl`, H2: `text-xl`, H3: `text-lg`).
  - Metric Values / Numbers: Tabular figures, bold weights (`font-bold`, `text-3xl`).
  - Body Text: `text-sm` or `text-base` for standard readability.
  - Secondary/Caption Labels: `text-xs font-medium text-muted-foreground`.

---

## Color System & Tokens

Ifesquare leverages Tailwind CSS v4 CSS variables configured in `frontend/src/index.css`:

- **Primary Brand**: Sharp dark primary `#0f172a` (`slate-900`) with high contrast text.
- **Accents**: Subtle blues/indigos for interactive states.
- **Semantic Statuses**:
  - **Success / Positive Sales**: Emerald / Green (`emerald-600` / `emerald-500`) for revenue gains, healthy stock, and completed day closes.
  - **Warning / Low Stock**: Amber / Orange (`amber-500` / `orange-500`) for low inventory warnings and pending rollover reminders.
  - **Destructive / Error**: Red (`rose-600` / `red-500`) for negative variances, stockouts, rate limiting, and deactivations.
- **Surfaces**:
  - Background: Crisp off-white (`slate-50`) in light mode; deep slate/zinc in dark mode.
  - Cards & Modals: Elevated white (`bg-white`) with subtle borders (`border-slate-200`) and soft shadows (`shadow-sm`).
  - Muted Surfaces: `bg-slate-100` for table headers and inactive tabs.

---

## Component Library (shadcn/ui)

Reusable primitives live in `frontend/src/components/ui/`:
- `Button` (`button.tsx`): Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`. Sizes: `sm`, `default`, `lg`, `icon`.
- `Input` (`input.tsx`): Focus ring, disabled styles, numeric formatting.
- `Dialog` (`dialog.tsx`): Radix UI accessible modal backdrop and panel.
- `Table` (`table.tsx`): Structured ledger table with sticky headers.
- `Card` (`card.tsx`): Header, title, description, content, and footer.
- `Badge` (`badge.tsx`): Status pills (Active, Closed, Offline, Low Stock).

---

## Responsive & PWA Layout

- **Mobile First**: Single-column layout with quick thumb access for stock counting. Large numeric inputs with `inputmode="numeric"`.
- **Desktop Grid**: Sidebar navigation on the left, top metric summary cards, and multi-column ledger table.
- **Offline Indicator**: A persistent banner or header badge indicates when the PWA is operating in offline mode with unsynced mutations queued in IndexedDB.
- **Reference Designs**: Visual mockups remain in `design/*.pen` (`ifesquare-dashboard.pen`) for design inspiration and spacing reference.
