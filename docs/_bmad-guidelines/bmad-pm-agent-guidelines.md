# B-MAD PM Agent - Guidelines & Common Issues

**Agent:** Product Manager (PM)
**Purpose:** Prevent over-scoped PRDs, ensure clear acceptance criteria, include non-functional requirements
**Load this at:** Start of `/prd` or `/product-brief` generation

---

## 🎯 Core Constraints for MVP

**CRITICAL: This is an MVP with strict constraints:**

- **Timeline:** 4 weeks maximum
- **Team:** Solo developer (PM + Engineer in one person)
- **Budget:** <$500/month infrastructure
- **Target Users:** 100 beta users in Month 1
- **Success Metric:** >60% of users send at least one referral request

---

## ⚠️ Issue #1: Over-Scoped PRD (Feature Creep)

### Symptom
PRD includes 15+ features when user requested MVP with 3-5 features.

### Root Cause
PM agent assumes "comprehensive" means "everything possible."

### Solution Pattern

**SCOPE RULES:**

1. Include ONLY features explicitly mentioned in discovery documents
2. If a feature wasn't in `docs/0-discovery/solution-discovery.md`, DON'T add it
3. Mark ALL features with priority:
   - **MUST-HAVE** (for MVP launch) - Maximum 5 features
   - **SHOULD-HAVE** (post-MVP, Month 2-3)
   - **WON'T-HAVE** (explicitly excluded)

**BEFORE writing PRD, ask yourself:**

> "Can we launch without this feature? If YES → deprioritize to SHOULD-HAVE or WON'T-HAVE."

### Example: LinkedIn Referral Finder

```markdown
## Feature Prioritization

### MUST-HAVE (MVP - Week 1-4)
1. **Job URL Input** - User pastes LinkedIn job URL
   - Why MUST-HAVE: Core workflow entry point
   - Success metric: >90% of users successfully paste URL
   
2. **Connection Discovery** - Find 2nd/3rd degree LinkedIn connections
   - Why MUST-HAVE: Core value proposition
   - Success metric: Find 2+ connections for 70% of jobs
   
3. **Message Generation** - AI generates 3 referral request variants
   - Why MUST-HAVE: Core differentiation vs competitors
   - Success metric: >80% of users select and copy a message

4. **Manual Tracking Dashboard** - User manually marks message status
   - Why MUST-HAVE: Minimum viable tracking for validation
   - Success metric: >50% of users update status at least once

5. **Authentication** - User sign-up, login, session management
   - Why MUST-HAVE: Required for data security and RLS
   - Success metric: <3 minutes from signup to first value

### SHOULD-HAVE (Post-MVP - Month 2-3)
- Automated response tracking (email/LinkedIn integration)
- Response rate analytics dashboard
- Follow-up message suggestions
- Resume optimization integration
- Chrome extension for auto-capture

### WON'T-HAVE (Explicitly Excluded from Roadmap)
- Job aggregation from multiple platforms (LinkedIn, Indeed, etc.)
- Multi-user team workspaces
- Advanced analytics (cohort analysis, A/B testing)
- Mobile native apps (iOS/Android)
- API for third-party integrations
```

---

## ⚠️ Issue #2: Vague Acceptance Criteria

### Symptom
User stories say "User can search jobs" with no details on HOW or WHAT success looks like.

### Root Cause
PM doesn't specify measurable outcomes or edge cases.

### Solution Pattern

**ACCEPTANCE CRITERIA TEMPLATE:**

```markdown
## User Story: [Epic Name] - [Feature Name]

**As a** [user role]
**I want to** [action]
**So that** [benefit/outcome]

### Acceptance Criteria

**Given** [context/precondition]
**When** [user action]
**Then** [expected system behavior]
**And** [additional outcome]

### Edge Cases
- What happens if [error condition]?
- What happens if [empty state]?
- What happens if [invalid input]?

### Success Metrics
- [Quantifiable metric]: [target value]
```

### Good Example

```markdown
## User Story: Connection Discovery - Find LinkedIn Connections

**As a** job seeker
**I want to** see my 2nd/3rd degree LinkedIn connections at a target company
**So that** I can request referrals from people I'm connected to

### Acceptance Criteria

**Given** user has pasted a valid LinkedIn job URL (e.g., https://linkedin.com/jobs/view/123456)
**When** user clicks "Find Connections" button
**Then** system queries LinkedIn API for user's 2nd/3rd degree connections at target company
**And** displays 2-10 connections sorted by confidence score (highest first)
**And** shows connection details: name, role, connection degree (2nd/3rd), mutual connection
**And** completes within 10 seconds (p95)
**And** displays loading skeleton while processing

### Edge Cases
- **No connections found:** Display message "No connections found at [Company Name]. Try expanding your LinkedIn network or searching a different job."
- **LinkedIn API fails:** Fallback to manual entry mode - "Enter connection names manually"
- **Rate limit hit:** Queue request, show "Processing... will notify when ready"
- **Invalid job URL:** Show inline validation error "Please enter a valid LinkedIn job URL"

### Success Metrics
- **Primary:** 70% of job searches return 2+ connections
- **Secondary:** <10 second response time (p95)
- **Engagement:** 60% of users who see connections click "Generate Message"
```

### Bad Example (Avoid This)

```markdown
## User Story: Connection Discovery

User can find connections at target company.

**Acceptance Criteria:**
- System finds connections
- User sees results
- Works fast
```

**Why this is bad:**
- Not measurable ("works fast" = how fast?)
- No edge cases (what if no connections?)
- No technical specifics (API? Scraping? How many results?)

---

## ⚠️ Issue #3: Missing Non-Functional Requirements

### Symptom
PRD has functional requirements (features) but no performance, security, or scalability requirements.

### Root Cause
PM focuses only on "what the system does" and forgets "how well it does it."

### Solution Pattern

**MANDATORY NON-FUNCTIONAL REQUIREMENTS SECTION:**

Include this section in EVERY PRD:

```markdown
## Non-Functional Requirements

### Performance
- **Page Load Time:** First Contentful Paint (FCP) <1.5s, Largest Contentful Paint (LCP) <2.5s (p95)
- **API Response Time:** All API routes respond in <500ms (p95), <1s (p99)
- **Message Generation:** Claude API call completes in <5s (p95)
- **Database Queries:** All SELECT queries <200ms (p95)

### Scalability
- **Concurrent Users:** Support 100 concurrent users without degradation
- **Data Volume:** Handle 100 users × 50 jobs × 5 connections = 25,000 records
- **Database Size:** Fit within Supabase free tier 500MB for 100 users
- **LLM API Costs:** <$5/user/month (at 10 messages/week × 4 weeks × $0.10/message)

### Security
- **Authentication:** Clerk-managed auth with MFA support
- **Authorization:** Row Level Security (RLS) on ALL user data tables
- **Data Encryption:** 
  - At rest: Supabase default AES-256
  - In transit: HTTPS only (TLS 1.3)
- **Secrets Management:** All API keys in Vercel environment variables (never in code)
- **Input Validation:** Zod schemas on all API routes (prevent XSS, SQL injection)
- **RLS Verification:** User A cannot access User B's data (enforced via `auth.uid() = user_id`)

### Reliability
- **Uptime:** >99% (7 hours downtime/month acceptable for MVP)
- **Error Handling:** All API routes wrapped in try-catch with proper HTTP status codes
- **Fallbacks:** 
  - If Claude API fails → Use template messages
  - If LinkedIn API fails → Manual connection entry mode
  - If Supabase unavailable → Accept the risk (99.9% uptime SLA)
- **Monitoring:** 
  - Sentry for error tracking (alert on >10 errors/hour)
  - PostHog for analytics (track user flows)
  - Vercel Analytics for performance (track Core Web Vitals)

### Usability
- **Time to First Value:** <5 minutes from signup to first message generated
- **Mobile Responsive:** All screens work on 375px width (iPhone SE)
- **Accessibility:** WCAG 2.1 Level A minimum (keyboard navigation, ARIA labels)
- **Loading States:** Skeleton loaders for all data fetching (not just spinners)
- **Error Messages:** User-friendly (not technical jargon or stack traces)

### Compliance
- **GDPR:** User data export, deletion on request
- **Data Retention:** Delete jobs/messages after 90 days (or user request)
- **Privacy Policy:** Disclose: what data we collect, how we use it, third-party services (Claude API, LinkedIn)
```

---

## 📋 Pre-Flight Checklist

Before generating PRD, verify:

- [ ] **Discovery loaded:** Have you read `docs/0-discovery/solution-discovery.md`?
- [ ] **Scope verified:** Are there ≤5 MUST-HAVE features?
- [ ] **Acceptance criteria:** Does EACH user story have Given/When/Then?
- [ ] **Edge cases:** Have you thought through error states, empty states, invalid inputs?
- [ ] **Non-functional requirements:** Have you included performance, security, scalability?
- [ ] **Success metrics:** Is every feature tied to a measurable outcome?

---

## 🚀 Output Template

Use this structure for PRDs:

```markdown
# Product Requirements Document - [Product Name]

## 1. Executive Summary
- Vision (1 sentence)
- Problem being solved
- Target users
- Success criteria

## 2. Feature Prioritization
- MUST-HAVE (≤5 features)
- SHOULD-HAVE (post-MVP)
- WON'T-HAVE (explicit exclusions)

## 3. User Stories & Acceptance Criteria
- One section per MUST-HAVE feature
- Given/When/Then format
- Edge cases documented
- Success metrics defined

## 4. Non-Functional Requirements
- Performance
- Scalability
- Security
- Reliability
- Usability
- Compliance

## 5. Out of Scope
- Explicitly list what we're NOT building (and why)

## 6. Success Metrics
- Primary metric (the ONE number that matters)
- Secondary metrics (supporting indicators)
- Validation plan (how we'll measure in 4 weeks)

## 7. Risks & Mitigations
- Technical risks (LinkedIn API limits, LLM costs)
- Market risks (competitors copy us, users don't adopt)
- Resource risks (solo dev, time constraints)
```

---

## 💡 Quick Reference: Common Mistakes

| Mistake | Fix |
|---------|-----|
| "User can view jobs" | "Given user is authenticated, When user navigates to /jobs, Then system displays 0-50 jobs sorted by created_at DESC, with skeleton loaders during fetch, and empty state if no jobs exist" |
| "Fast performance" | "API response time <500ms (p95)" |
| "Secure authentication" | "Clerk auth with MFA, RLS on all tables, API keys in env vars" |
| "Good user experience" | "Time to first value <5 minutes, mobile responsive 375px+, WCAG 2.1 Level A" |
| "Works at scale" | "Support 100 concurrent users, <500MB database, <$5/user/month LLM costs" |

---

**Remember:** The PRD is a contract between PM and Dev. Be specific, measurable, and ruthlessly focused on MVP scope.