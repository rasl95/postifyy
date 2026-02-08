# Postify AI - Product Requirements Document

## Original Problem Statement
Import from GitHub https://github.com/rasl95/Postify-ai.git — AI content generation SaaS for social media (posts, images, marketing campaigns).

## Architecture
- **Backend:** FastAPI (server.py + email_service.py), MongoDB (motor), JWT auth
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, lucide-react, craco build
- **Theme:** Dark (#0B0B0D), brand red (#FF3B30)
- **Languages:** Russian (primary), English
- **AI Text:** Emergent LLM key → OpenAI GPT-4o-mini
- **AI Images:** Direct OpenAI API → gpt-image-1
- **Payments:** Stripe (live keys) — Pro: price_1Sx2kHIwguN5vJftHSX5lzVm, Business: price_1Sx2l5IwguN5vJftaqwXCzed

## What's Been Implemented
- **Feb 8, 2026:** Imported from GitHub, configured real API keys, fixed bugs
- Full SaaS: auth, content gen, image gen, campaigns, scheduler, analytics, referrals, Stripe billing
- 14+ pages/routes, onboarding flow, brand profiles, favorites, history, templates

## Bugs Fixed
1. `NameError: 'size'` in `/api/generate-image` mock mode → changed to `final_size`
2. OpenAI client not initialized when Emergent LLM key present → separated text (Emergent) and image (OpenAI) client initialization

## Test Results (iteration_2)
- Backend: 91% — all endpoints working (image gen takes ~21s, not a bug)
- Frontend: 100% — landing, auth, dashboard, navigation all working
- Overall: **97% functional**

## Backlog
### P1
- Weekly AI Reports, Dynamic AI Recommendations
- Google OAuth keys (optional, can be added later)

### P2
- Backend refactoring (modular routers)
- Platform publishing integration (scheduler currently mocked)

---
*Last updated: February 8, 2026*
