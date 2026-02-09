# Postify AI - Product Requirements Document

## Original Problem Statement
Import from GitHub https://github.com/rasl95/Postify-ai.git — AI content generation SaaS for social media.

## Architecture
- **Backend:** FastAPI, MongoDB (motor), JWT auth
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, craco
- **AI:** Emergent LLM → GPT-4o-mini (text) + OpenAI gpt-image-1 (images)
- **Payments:** Stripe live keys

## What's Been Implemented

### Phase 0: Import (Feb 8)
- Imported full SaaS, configured API keys, fixed image gen bug

### Phase 6A: Revenue Readiness (Feb 9)
- High-converting landing page, onboarding wow moment, free plan friction, contextual upsells, pricing focus

### Share First Post + Credits (Feb 9)
- ShareFirstPostModal with +3 credit incentive, referral tracking, mobile bottom sheet

### UI/UX Fixes (Feb 9)
- Logout button moved to Settings under Account Info
- History cards redesigned (Notion/Linear style)
- Generation progress animation fixed (stage transitions + fast-forward)

### Global UI/UX Audit & Fix (Feb 9)
**Contrast:**
- Added `--postify-text-secondary` (0.7 opacity) CSS variable for labels
- Upgraded all gray-600/700 text to gray-500 (WCAG AA compliant on dark bg)
- Global CSS overrides for `.dark .text-gray-600/700` as safety net
- Placeholder contrast increased to 0.4 opacity

**Mobile Safe Area:**
- `viewport-fit=cover` already set
- Added `pb-safe` utility class for bottom safe area padding
- DashboardLayout content area uses `pb-safe`
- Mobile header uses `env(safe-area-inset-top)` padding
- Sidebar user section uses `pb-safe`

**Modals:**
- Dialog component: `max-h-[90dvh] overflow-y-auto`, rounded-2xl on mobile
- Added `mx-4` for mobile margin (no text touching edges)
- ShareFirstPostModal: native bottom sheet on mobile

**Consistency:**
- Card borders standardized to `border-white/[0.06]`
- Card backgrounds: #111113
- Same text scale across all pages

### Image History Display Fix (Feb 9)
- Fixed bug: generated images not appearing in History page
- Root cause: Frontend fetched `response.data.images` but backend returns `response.data.items`
- Fix: Changed `History.js` line 282 to use `.items` key

### iOS White Strips Fix (Feb 9)
- Added `color-scheme: dark` to CSS + HTML meta tag to force dark overscroll areas
- Added `overscroll-behavior-y: none` to prevent iOS bounce showing white background
- Fixed mobile header: `box-sizing: content-box` so safe-area padding expands header height
- Added CSS utility classes for mobile header offset (sidebar, overlay, main content)
- Added `!important` to background-color on html/body/#root to prevent overrides

### Global Text Contrast Pass #2 (Feb 9)
- Upgraded all `text-gray-600` → `text-gray-500` across 16 occurrences in 8 files
- Upgraded `text-gray-700` → `text-gray-500` (icons in empty states)
- Upgraded `opacity-30` → `opacity-50` for placeholder icons in ImageGenerator
- Upgraded `text-white/10` → `text-white/20` for usage limit display ring
- Boosted global CSS safety-net: `.dark .text-gray-600` from 0.45 → 0.5, `.dark .text-gray-700` from 0.35 → 0.4
- Files: History.js, Landing.js, SharedCampaign.js, MarketingCampaigns.js, ImageGenerator.js, UpgradeModal.js, CreditBundleModal.js, ExitIntentPopup.js, ShareFirstPostModal.js, UsageLimitDisplay.js, index.css

## Backlog
### P1: Google OAuth, Email drip, A/B testing
### P2: Backend modularization (LLM fallback dedup), Platform publishing

---
*Last updated: February 9, 2026*
