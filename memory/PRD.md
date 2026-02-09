# Postify AI - Product Requirements Document

## Original Problem Statement
Import from GitHub https://github.com/rasl95/Postify-ai.git — AI content generation SaaS for social media.

## Architecture
- **Backend:** FastAPI, MongoDB (motor), JWT auth
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, craco
- **AI Text:** Emergent LLM key → GPT-4o-mini | **AI Images:** OpenAI → gpt-image-1
- **Payments:** Stripe (live keys) — Pro: price_1Sx2kHIwguN5vJftHSX5lzVm, Business: price_1Sx2l5IwguN5vJftaqwXCzed

## What's Been Implemented

### Phase 0: Import (Feb 8, 2026)
- Imported full SaaS from GitHub, configured API keys, fixed image gen bug

### Phase 6A: Revenue Readiness & Conversion Optimization (Feb 9, 2026)

**Feature 1 — High-Converting Landing Page**
- Outcome-focused hero: "30 days of content in 10 minutes"
- Primary CTA: "Create content now" + Secondary: "See example"
- 6 sections: Hero, How it works (3 steps), AI example, Free vs Pro, Why Pro pays for itself, Final CTA
- Trust signals: No card, 3 free gens, 2-second results

**Feature 2 — Onboarding Wow Moment**
- 5-step flow: Goal → Platform → Niche → AI generation → Result preview
- Step 5 shows "This is how your content will look" with personalized preview
- Finish button: "Start creating" (not Pro upsell)

**Feature 3 — Free Plan Friction**
- All "Upgrade to Pro" replaced with "Unlock full access"
- Watermark, no template saving, no scheduler, no analytics for free

**Feature 4 — Contextual Upsell Modals**
- Triggers: low credits (<2), watermark removal, template save, scheduler, favorites, analytics, brand AI
- Modal title: contextual (e.g. "Remove watermark", "Save templates for reuse")
- Single CTA: "Unlock Pro — €15/mo"

**Feature 5 — Simplified Pricing Focus**
- Pro plan visually emphasized (Most Popular badge, border, scale)
- Business plan de-emphasized (faded border, lower opacity)
- Pricing page title: "One plan — full control"

### Bugs Fixed
1. Image gen `size` → `final_size` variable fix
2. OpenAI client initialization (text via Emergent, images via OpenAI)
3. CORS `withCredentials` removed (JWT Bearer tokens don't need it)

## Test Results
- Iteration 1-2: Backend 100%, Frontend 100%
- Iteration 3-4: Phase 6A landing page, registration, onboarding all verified
- Step 5 onboarding preview confirmed via screenshot

## Backlog
### P1
- Google OAuth keys (optional)
- Email notifications (SendGrid)

### P2
- Backend modularization
- A/B testing for landing page variants
- Platform publishing integration

---
*Last updated: February 9, 2026*
