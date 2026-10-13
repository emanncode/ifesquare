---
name: ifesquare-log-2026-07-22
description: Linear daily engineering log for 2026-07-22 on Ifesquare
---

# 2026-07-22

# Day Work — 2026-07-22

## Landing page redesign & component extraction

### Auth — 24h auto-logout

* `frontend/src/components/AuthProvider.tsx` — store login timestamp in localStorage on login, check expiry on mount, auto-logout after 24 hours

### Landing page — detailed sections added

* Stats bar: "2 min", "Zero", "₦1M+" with descriptive body text, wider layout
* Problem section: manual arithmetic, end-of-day rush, lost records
* Solution section: works on any phone, no math required, data stays yours, see what matters
* Paper vs Ifesquare comparison table (6 rows, animated)
* Features: expanded from 4 to 8 (added auto-calculations, day close & history, revenue breakdown, export & print)
* How it works: 3 steps
* Who it's for: small shops, family-run businesses, distributors
* Closing CTA: wider, with gradient background

### Animations

* `hover:scale-[1.02]` + `hover:shadow-md` on all cards with spring physics
* `FadeUp` scroll-triggered animation wrapper (framer-motion)
* Comparison rows animate in from left with staggered delay
* Feature cards stagger in by index

### Wider sections

* Stats bar: removed `sm:px-[15%]` constraint
* Comparison table: `max-w-2xl` → `max-w-7xl`, removed `sm:px-[15%]`
* Closing CTA: removed `sm:px-[15%]`

### Component extraction (10 new files)

| File | Purpose |
| -- | -- |
| `frontend/src/components/landing/FadeUp.tsx` | Reusable scroll animation wrapper |
| `frontend/src/components/landing/HeroSection.tsx` | Hero with tagline, description, CTA |
| `frontend/src/components/landing/StatsSection.tsx` | Key metrics bar |
| `frontend/src/components/landing/ProblemSection.tsx` | Paper ledger pain points |
| `frontend/src/components/landing/SolutionSection.tsx` | How Ifesquare helps |
| `frontend/src/components/landing/ComparisonSection.tsx` | Paper vs Ifesquare table |
| `frontend/src/components/landing/FeaturesSection.tsx` | 8 feature cards |
| `frontend/src/components/landing/HowItWorksSection.tsx` | 3-step workflow |
| `frontend/src/components/landing/AudienceSection.tsx` | Target audience cards |
| `frontend/src/components/landing/CtaSection.tsx` | Closing call-to-action |

### Footer

* Added social links: GitHub (emanncode), X (emanncode), WhatsApp (09048801668)

### Commits

* `34be9b9` — Add 24h auto-logout to AuthProvider
* `15cfce6` — Extract landing page into section components
* `51068bd` — Refactor ComingSoonPage to use extracted section components
* `b5e498a` — Add social links to footer (GitHub, X, WhatsApp)