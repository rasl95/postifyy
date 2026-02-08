# Postify AI - Product Requirements Document

## Original Problem Statement
AI content generation SaaS — posts, images, marketing campaigns for social media platforms.

## Architecture
- **Backend:** FastAPI (server.py), MongoDB (motor), JWT auth
- **Frontend:** React, TailwindCSS, Shadcn/UI, lucide-react
- **Theme:** Dark (#0B0B0D), brand red (#FF3B30)
- **Languages:** Russian (primary), English

## DB Collections
- users, generations, campaigns, analytics_events, share_events, user_templates, scheduled_posts, referrals

## Key API Endpoints
- Auth: `/api/auth/{register, login}` (register supports referral_code)
- Content: `/api/generate`, `/api/generate-image`, `/api/content/{id}/{score,duplicate,save-template}`, `/api/content/templates`
- Campaigns: `/api/campaigns/{config,strategy,generate}`, `/{id}/share`, `/{id}/share-stats`, `/public/{token}`
- Scheduler: `/api/scheduler/{posts,ai-suggest,stats}`, `/posts/{id}/{publish}`
- Analytics: `/api/analytics/{overview,performance,recommendations}`
- Referrals: `/api/referrals/{stats}`, `/api/referrals/check/{code}`, `/api/user/generation-count`
- Stripe: `/api/stripe/{create-checkout-session, webhook}`

## Completed Phases
| Phase | Status | Date |
|-------|--------|------|
| 1-4. Core Features | Done | Feb 2026 |
| 5. UI Polish | Done | Jun 2026 |
| 6. Share Campaign + Analytics | Done | Jun 2026 |
| 7A. Onboarding + History Enhancement | Done | Jun 2026 |
| 7B. Scheduler + Monetization | Done | Jun 2026 |
| 7C. Growth Loops & Virality | Done | Jun 2026 |

## Phase 5 Этап C — What Was Done
### Referral System
- Unique referral code per user (auto-generated on register)
- +5 credits to referrer, +3 to referred friend on signup
- /referrals page: stats, copyable link, share button, how-it-works, history
- Public validation: GET /api/referrals/check/{code}
- Landing ?ref=CODE auto-opens signup dialog

### Watermark
- Free users: "Created with Postify AI" appended to generated content
- Pro users: no watermark
- Backend returns `watermark: true/false` in generate response
- Watermark included in copied text

### Viral Prompts
- ViralPromptBanner triggers at 5, 10, 20 generation milestones
- Non-blocking bottom-right toast with CTA to referrals page
- Session-based dismissal (once per milestone per session)

## MOCKED Features
- Platform publishing (scheduler), AI schedule suggestions, AI Director recommendations

## 3rd Party Integrations
- OpenAI GPT-4o-mini (text + image), Stripe (subscriptions)

## Backlog
### P1
- Weekly AI Reports, Dynamic AI Recommendations

### P2
- Google OAuth, Backend refactoring (modular routers)

## Test Reports
- `/app/test_reports/iteration_22.json` — Phase 5C Growth (100%)
- `/app/test_reports/iteration_21.json` — Phase 5B Scheduler (100%)
- `/app/test_reports/iteration_20.json` — Phase 5A Onboarding+History (100%)

---
*Last updated: June 9, 2026*
*Phase 5 Complete (All 3 Этапа)*
