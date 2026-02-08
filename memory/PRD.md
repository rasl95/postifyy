# Postify AI - Product Requirements Document

## Original Problem Statement
Import from GitHub https://github.com/rasl95/Postify-ai.git — AI content generation SaaS for social media (posts, images, marketing campaigns).

## Architecture
- **Backend:** FastAPI (server.py + email_service.py), MongoDB (motor), JWT auth
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, lucide-react, craco build
- **Theme:** Dark (#0B0B0D), brand red (#FF3B30)
- **Languages:** Russian (primary), English
- **AI:** Emergent LLM key → OpenAI GPT-4o-mini (text generation)

## DB Collections
users, generations, campaigns, analytics_events, share_events, user_templates, scheduled_posts, referrals, subscriptions, brand_profiles, user_preferences, drafts, image_generations, user_sessions, favorites

## Key API Endpoints
- Auth: `/api/auth/{register, login, me, google/session, logout}`
- Content: `/api/generate`, `/api/generate-image`, `/api/templates`
- Campaigns: `/api/campaigns/{config, strategy, generate}`
- Scheduler: `/api/scheduler/{posts, ai-suggest, stats}`
- Analytics: `/api/analytics/{overview, performance, recommendations}`
- Referrals: `/api/referrals/{stats}`, `/api/referrals/check/{code}`
- Stripe: `/api/stripe/{create-checkout-session, webhook}`
- User: `/api/user/preferences`, `/api/user/complete-onboarding`, `/api/drafts`

## What's Been Implemented (Imported from GitHub)
- **Date:** Feb 8, 2026
- Full SaaS with auth (JWT + Google OAuth), content generation, image generation, marketing campaigns, scheduler, analytics, referrals, Stripe billing
- Onboarding flow, brand profiles, favorites, history, templates
- Landing page, dashboard, 14+ pages/routes

## Bug Fixed During Import
- Fixed `NameError: name 'size' is not defined` in `/api/generate-image` mock mode (line 1579: `size` → `final_size`)

## 3rd Party Integrations
- **Emergent LLM key** → OpenAI GPT-4o-mini (text generation) - WORKING
- **Stripe** (test mode: sk_test_emergent) - configured
- **Google OAuth** via Emergent Auth - configured (optional)
- **Image generation** - currently returns mock images (openai_client is None when using Emergent LLM key)

## Test Results
- Backend: 90%+ endpoints working (auth, templates, generate, preferences, drafts, image-gen)
- Frontend: Landing, auth, dashboard, navigation all functional
- Report: `/app/test_reports/iteration_1.json`

## Backlog
### P0 (Next Steps - User Requested)
- Continue development (user will specify features)

### P1
- Real image generation (needs direct OpenAI API key or GPT Image 1 via Emergent)
- Weekly AI Reports, Dynamic AI Recommendations

### P2
- Backend refactoring (modular routers)
- Platform publishing integration (scheduler currently mocked)

---
*Last updated: February 8, 2026*
*Status: Imported and Running*
