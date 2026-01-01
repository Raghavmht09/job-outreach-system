# Job Outreach Automation Platform - BMAD Project Context

**Project Type:** Internal productivity tool (NOT commercial)  
**Target Users:** 10-20 friends/family actively job searching  
**Primary Goal:** Replace $200-240/month/person in B2B SaaS subscriptions with shared internal platform  
**Timeline:** 8-week phased rollout  
**Success Metric:** $2,000+ annual savings per user while maintaining workflow quality

---

## Problem Statement

### Target User Profile
- Applying to 20-50+ roles per month
- Cannot afford enterprise tools (Apollo, LinkedIn Recruiter, Teal, Resume.io)
- Need systematic workflow: job discovery → resume optimization → outreach → application tracking
- Currently using: manual spreadsheets + free LinkedIn + generic resumes

### Pain Points Being Solved
1. **Manual resume customization:** 30+ minutes per job to tailor resume for ATS
2. **Contact discovery friction:** Can't find hiring managers without $50+/month tools
3. **Outreach message quality:** Generic cold messages get ignored
4. **Application tracking chaos:** Lost track across LinkedIn/Indeed/Wellfound/email
5. **Follow-up inconsistency:** Forget to follow up after 1-2 weeks

### What We're NOT Solving
- Getting more interview callbacks (depends on candidate skills)
- ATS algorithm manipulation (unrealistic promise)
- Guaranteed job placement (impossible to deliver)

### Cost Arbitrage Opportunity
**Current monthly cost per user (B2B tools):**
- LinkedIn Recruiter Lite: $140/mo
- Apollo/RocketReach: $50/mo
- Teal/Huntr Premium: $30/mo
- Resume optimizer: $20/mo
- **Total: $240/mo**

**Projected cost with our platform (shared across 10 users):**
- Claude API: $30-50/mo (shared)
- Supabase: $0 (free tier sufficient)
- Email finders: $0 (pool free tiers)
- **Per-user cost: $3-5/mo**

**ROI: 98% cost reduction ($2,800+/year savings per user)**

---

## Technical Architecture

### Stack Requirements

**Frontend:**
- Framework: Next.js 14+ (App Router)
- UI Components: shadcn/ui (Radix + Tailwind CSS)
- State Management: React Query for server state, minimal client state
- Deployment: Vercel free tier

**Backend:**
- Database: Supabase Postgres
- Authentication: Supabase Auth (email/password + magic links)
- Storage: Supabase Storage (resumes, PDFs)
- API Layer: Next.js API routes + Supabase Edge Functions
- Real-time: Supabase Realtime (optional for status updates)

**AI/Automation:**
- Primary LLM: Claude Sonnet 4 (complex reasoning tasks)
- Secondary LLM: Claude Haiku 4 (simple extraction tasks)
- Orchestration: Simple async functions (NO CrewAI/LangGraph - overkill for linear workflows)
- Job scraping: Playwright (headless browser automation)
- Email finding: Free tier rotation (Hunter.io 25/mo + Snov.io 50/mo + Apollo 5/mo)

### Architecture Constraints

**CRITICAL RULES:**
1. **LinkedIn scraping:** Use dummy account only, max 20 searches/day, 5-10 sec delays between requests
2. **Data privacy:** Supabase RLS policies enforce user isolation - NO cross-user data access
3. **API cost control:** Use Haiku for simple tasks, Sonnet only for optimization/analysis
4. **Manual fallbacks:** Every automated step must have manual override option
5. **No commercial use:** Internal tool only, no monetization, no external user data collection

**Security Requirements:**
- Environment variables for all API keys
- RLS policies on all Supabase tables
- HTTPS-only for production
- User can delete their account + all data anytime (CASCADE deletes)
- No data retention for analytics (not needed for internal tool)

---

## Implementation Phases

### Phase 1: Resume Optimizer (Week 1-2)

**Goal:** Prove AI can save 25+ minutes per job application vs manual resume editing

**User Flow:**
1. User uploads master resume (PDF/DOCX) → stored in Supabase Storage
2. User pastes job URL (LinkedIn, Wellfound, Indeed)
3. System scrapes job description using Playwright
4. Claude Sonnet analyzes: required skills, nice-to-haves, company context
5. Claude generates skill match score (0-100) + gap analysis
6. Claude optimizes resume: keyword injection, reordering, tailoring
7. System generates PDF download
8. User can edit before submitting

**Success Criteria:**
- 3 users × 5 jobs = 15 successful optimizations in Week 2
- Average time per job: <5 minutes (vs 30+ minutes manual)
- User feedback: "Good enough to submit without major edits"
- Zero users paid for Teal/Resume.io this month

**Database Schema:**
```sql
-- Master resumes (one per user)
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  content TEXT NOT NULL, -- Extracted text from PDF/DOCX
  file_path TEXT, -- Supabase Storage path
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized resumes (one per job application)
CREATE TABLE optimized_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  master_resume_id UUID REFERENCES resumes(id),
  job_url TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  match_score INTEGER, -- 0-100
  suggestions JSONB, -- Gap analysis output
  file_path TEXT, -- Supabase Storage path to optimized PDF
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own resumes only"
  ON resumes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users access own optimized resumes only"
  ON optimized_resumes FOR ALL
  USING (auth.uid() = user_id);
```

**API Requirements:**
- `POST /api/upload-resume` - Store master resume in Supabase
- `POST /api/optimize-resume` - Scrape JD → analyze → optimize → generate PDF
- `GET /api/resumes` - List user's master + optimized resumes
- `DELETE /api/resumes/:id` - Delete resume + storage file

---

### Phase 2: Contact Finder (Week 3-4)

**Goal:** Find hiring manager contacts without paying for Apollo/RocketReach

**User Flow:**
1. From Phase 1 results, user clicks "Find Contacts"
2. System extracts company name from job URL
3. Hybrid contact discovery:
   - **Step A:** Check free email finder APIs (Hunter, Snov, Apollo free tiers)
   - **Step B:** If no email found, scrape LinkedIn for hiring manager profiles
4. Return: Name, title, LinkedIn URL, email (if found), source
5. User can click "Draft Message" to generate personalized outreach

**Success Criteria:**
- Found contacts for 80%+ of jobs using free tools
- Zero LinkedIn account bans (via rate limiting)
- Users successfully sent messages based on tool's output

**Database Schema:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  optimized_resume_id UUID REFERENCES optimized_resumes(id),
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  linkedin_url TEXT,
  email TEXT,
  source TEXT, -- 'hunter', 'snov', 'apollo', 'linkedin_scrape'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track API usage to avoid exceeding free tiers
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  linkedin_searches INTEGER DEFAULT 0,
  hunter_searches INTEGER DEFAULT 0,
  snov_searches INTEGER DEFAULT 0,
  apollo_searches INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own contacts only"
  ON contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own usage only"
  ON api_usage FOR ALL USING (auth.uid() = user_id);
```

**LinkedIn Scraping Rate Limits:**
- Max 20 searches per day per account
- 5-10 second delay between requests
- Random variance: 0-3 seconds
- Use headless: false occasionally (anti-detection)
- Manual fallback: If CAPTCHA detected, notify user to search manually

**API Requirements:**
- `POST /api/find-contacts` - Multi-source contact discovery
- `GET /api/contacts/:resumeId` - List contacts for a specific job
- `GET /api/usage/today` - Check today's API usage limits

---

### Phase 3: Application Tracker (Week 5-6)

**Goal:** Single dashboard for all applications across platforms (LinkedIn, Indeed, Wellfound, email)

**User Flow:**
1. User adds application (manual entry or Chrome extension auto-capture)
2. System stores: job URL, company, title, date applied, platform, status
3. Dashboard displays:
   - Kanban board: Applied → Reached Out → Interview → Offer/Rejected
   - Calendar view with follow-up reminders
   - Stats: total applications, response rate, applications by platform
4. Automated reminders: 7 days after apply (if no response), 14 days (second follow-up)

**Success Criteria:**
- All users actively updating applications in tool (not spreadsheets)
- Follow-up reminders sent and users act on them
- Zero users maintaining external trackers

**Database Schema:**
```sql
CREATE TYPE application_status AS ENUM (
  'applied',
  'reached_out',
  'interview_scheduled',
  'rejected',
  'offer'
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  optimized_resume_id UUID REFERENCES optimized_resumes(id),
  job_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  platform TEXT, -- 'linkedin', 'indeed', 'wellfound', 'email', 'other'
  status application_status DEFAULT 'applied',
  applied_date DATE NOT NULL,
  follow_up_date DATE, -- Auto-calculated: applied_date + 7 days
  second_follow_up_date DATE, -- applied_date + 14 days
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own applications only"
  ON applications FOR ALL USING (auth.uid() = user_id);
```

**API Requirements:**
- `POST /api/applications` - Add new application
- `PATCH /api/applications/:id` - Update status or add notes
- `GET /api/applications` - List all applications with filters (status, date range)
- `GET /api/applications/stats` - Aggregate stats (total, by status, response rate)
- `GET /api/applications/reminders` - Get pending follow-ups

---

### Phase 4: Outreach Automation (Week 7-8)

**Goal:** Draft personalized messages quickly (NO automated sending to avoid LinkedIn bans)

**User Flow:**
1. User selects contact from Phase 2
2. User chooses message type: "Ask for Referral" or "Cold Introduction"
3. Claude generates personalized message using:
   - User's resume highlights
   - Job description keywords
   - Contact's title/background (if available)
4. User edits message (always review before sending)
5. User copies to LinkedIn/email manually
6. User marks as "Sent" → system tracks outreach

**Success Criteria:**
- Message quality: "Would send with minor edits" (user feedback)
- Users actually sending messages (not just drafting)
- Zero complaints about generic/robotic messages

**Database Schema:**
```sql
CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  message_type TEXT, -- 'referral_ask', 'cold_intro'
  message_text TEXT NOT NULL,
  channel TEXT, -- 'linkedin', 'email'
  sent_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own messages only"
  ON outreach_messages FOR ALL 
  USING (auth.uid() = (SELECT user_id FROM applications WHERE id = application_id));
```

**Claude Message Generation Prompt Template:**
```
Generate a personalized {message_type} message for LinkedIn.

Context:
- Sender: {user_name}, {user_current_title}
- Sender's top skills: {resume_highlights}
- Target: {contact_name}, {contact_title} at {company_name}
- Job: {job_title} at {company_name}
- Relevant match: {skill_match_from_resume}

Requirements:
- Keep under 300 characters (LinkedIn connection message limit)
- Friendly, conversational tone (not salesy)
- Mention ONE specific skill/experience match
- Clear ask: {referral_ask_or_intro_request}
- No fluff, get to the point

Output the message only (no preamble).
```

**API Requirements:**
- `POST /api/generate-message` - Claude generates personalized message
- `POST /api/outreach` - Save outreach message + mark as sent
- `GET /api/outreach/:applicationId` - List outreach messages for a job

---

## Success Metrics

### Phase-Level Metrics

**Phase 1 (Resume Optimizer):**
- ✅ 15 successful optimizations (3 users × 5 jobs)
- ✅ <5 min average time per job
- ✅ User rating: 4+/5 on quality

**Phase 2 (Contact Finder):**
- ✅ 80%+ contact discovery success rate
- ✅ Zero LinkedIn account bans
- ✅ 5+ outreach messages sent by users

**Phase 3 (Application Tracker):**
- ✅ 100% of users actively using tracker
- ✅ Follow-up reminders acted upon (50%+ completion rate)

**Phase 4 (Outreach Automation):**
- ✅ User rating: 4+/5 on message quality
- ✅ 20+ messages sent across user group

### Platform-Level Metrics (End of Week 8)

**Cost Savings:**
- [ ] $2,000+ saved per user annually (vs B2B tools)
- [ ] Claude API cost: <$10/user/month
- [ ] Infrastructure cost: $0 (free tiers)

**Adoption:**
- [ ] 8+/10 users actively using tool weekly (80% retention)
- [ ] 100+ total job applications tracked in system
- [ ] 50+ resumes optimized across user group

**Quality:**
- [ ] Zero data loss incidents
- [ ] Zero security breaches
- [ ] <24 hour bug fix response time

---

## Technical Constraints & Risks

### Known Limitations

**LinkedIn Scraping:**
- **Risk:** Account ban if detected
- **Mitigation:** Dummy account, strict rate limits, manual fallback
- **Acceptance:** Users informed of risk upfront

**Email Discovery:**
- **Risk:** Free tier limits exhausted (80 lookups/month shared)
- **Mitigation:** Pool across users, rotate services, manual search fallback
- **Acceptance:** Won't find 100% of emails, focus on LinkedIn messaging

**API Costs:**
- **Risk:** Claude API costs spike with heavy usage
- **Mitigation:** Use Haiku for simple tasks, set monthly budget alerts
- **Acceptance:** May need to limit free usage per user (e.g., 50 jobs/month)

**Maintenance Burden:**
- **Risk:** LinkedIn DOM changes break scraper
- **Mitigation:** Expect breakage, quick fixes, manual fallback always available
- **Acceptance:** This is a beta tool, users expect bugs

### Non-Functional Requirements

**Performance:**
- Resume optimization: <30 seconds end-to-end
- Contact discovery: <60 seconds (including scraping)
- Dashboard load time: <2 seconds

**Reliability:**
- 95%+ uptime (Vercel + Supabase SLA)
- Graceful degradation if API fails (show cached results)

**Usability:**
- Mobile-responsive (users job search on phones)
- Minimal clicks to core actions (optimize, find, track)
- Clear error messages (no technical jargon)

---

## Dependencies & Integration Points

### External Services

**Required:**
- Supabase (database, auth, storage, edge functions)
- Anthropic API (Claude Sonnet 4, Claude Haiku 4)
- Vercel (hosting, deployment)

**Optional (Free Tiers):**
- Hunter.io (email finding, 25/month free)
- Snov.io (email finding, 50/month free)
- Apollo.io (email finding, 5/month free)

### Internal Service Dependencies

**Phase Dependencies:**
- Phase 2 depends on Phase 1 (needs optimized_resumes table)
- Phase 3 depends on Phase 1 (needs optimized_resumes for linking)
- Phase 4 depends on Phase 2 + Phase 3 (needs contacts + applications)

**Data Flow:**
```
Upload Resume (Phase 1)
  ↓
Optimize for Job (Phase 1) → generates optimized_resume
  ↓
Find Contacts (Phase 2) → links to optimized_resume
  ↓
Track Application (Phase 3) → links to optimized_resume
  ↓
Draft Outreach (Phase 4) → uses contact + application data
```

---

## Open Questions for BMAD PM Agent

1. **Chrome Extension Scope:** Should Phase 3 include a Chrome extension for auto-capturing applications, or is manual entry sufficient for MVP?

2. **Referral Tracking:** Should we track whether referrals were successful (i.e., did user get interview after referral)? Or is this over-engineering for internal tool?

3. **Multi-Resume Support:** Should users be able to maintain multiple master resumes (e.g., one for PM roles, one for consulting)? Or single master only?

4. **Company Research:** Should Phase 4 include automated company research (funding, recent news) to personalize outreach messages? Or too complex for Week 7-8?

5. **Interview Prep:** Out of scope for now, or worth adding Phase 5 (AI-powered interview question prep)?

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Next Review:** After BMAD PM agent generates PRD