---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd-job-outreach-system.md'
  - '_bmad-output/planning-artifacts/product-brief-job-outreach-system-2025-12-31.md'
  - 'docs/discovery.md'
  - 'docs/solutions.md'
  - 'docs/tech-context.md'
  - 'docs/_bmad-guidelines/bmad-architect-agent-guidelines.md'
  - 'docs/_bmad-guidelines/bmad-pm-people-data-scraping.md'
workflowType: 'architecture'
project_name: 'job-outreach-system'
user_name: 'Raghav'
date: '2026-01-02'
status: 'complete'
completedAt: '2026-01-02'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (5 MUST-HAVE for MVP):**

1. **Resume Optimizer with Flexible Job Input**
   - Upload master resume (DOCX)
   - **Three job description input methods:**
     - **Option A:** Manual paste of job description text (textarea)
     - **Option B:** Job URL paste (user copies link for metadata extraction)
     - **Option C:** PDF upload (user saves webpage as PDF, uploads to platform)
   - PDF parsing to extract job description text (using pdf-parse library)
   - Company name extraction via multi-source strategy (URL parsing, PDF metadata, Claude NLP)
   - AI-powered keyword optimization using Claude Sonnet
   - Generate ATS-friendly PDF with match score (0-100%)
   - **Architectural implication:**
     - File upload/storage (resumes + temporary job PDFs)
     - PDF text extraction service (pdf-parse)
     - Text cleanup/sanitization (remove headers, footers, ads from extracted PDF text)
     - Claude API integration (Sonnet for optimization, Haiku for parsing/extraction)
     - Input validation (file size limits, PDF format validation, text length constraints)

2. **Contact Finder (X-Ray Search)**
   - Google Custom Search API for LinkedIn profiles at target company
   - Cache-first architecture (7-day TTL, >70% hit rate target)
   - Display 3-10 contacts with Name, Headline, Profile Link
   - **Architectural implication:** External API quota management, caching layer, dead link validation

3. **Outreach Generator**
   - AI-drafted messages (3 tone variants: casual, professional, direct)
   - Uses resume + job description + recipient profile
   - Safe handoff mode (Google search link, not direct LinkedIn URL)
   - **Architectural implication:** Claude API integration, clipboard API, template fallback system

4. **Company Name Extraction**
   - Parse company name from job URL or extract from pasted job description/PDF
   - Multi-source extraction strategy (URL domain, PDF metadata, Claude NLP text analysis)
   - User-editable company name field (fallback for ambiguous cases)
   - **Architectural implication:** URL parsing logic, PDF metadata extraction, NLP for company name extraction, input validation

5. **Auth & Security**
   - Supabase Auth (email/password)
   - Row Level Security (RLS) on ALL tables
   - User data isolation enforcement at database level
   - **Architectural implication:** Multi-tenant database design via RLS, not application logic

**Non-Functional Requirements:**

- **Performance:**
  - Page load: <1.5s First Contentful Paint (FCP)
  - API latency: <500ms (p95) for internal routes
  - Claude generation: <10s with skeleton loaders
  - Resume optimization: <30 seconds end-to-end
  - PDF text extraction: <3 seconds for typical job description PDFs

- **Security:**
  - RLS enabled on ALL user data tables (`auth.uid() = user_id`)
  - API keys stored in Vercel environment variables (never client-exposed)
  - Input validation via Zod schemas on all API routes (file uploads, URLs, text input)
  - PDF upload security: MIME type validation, file size limits (5MB max), malicious content scanning
  - HTTPS-only (TLS 1.3)

- **Reliability:**
  - Quota management: Cache hit rate >70% to prevent Google API 429s
  - Fallback chains: Manual templates if Claude API fails, manual paste if PDF extraction fails
  - Graceful degradation: Show cached results when quota exhausted

- **Scalability:**
  - Support 50 concurrent users (Supabase free tier)
  - Auto-delete generated PDFs after 24 hours (storage optimization)
  - Auto-delete uploaded job PDFs after processing (never persist long-term)
  - Database size target: <500MB (stay within free tier)

- **Cost Constraints:**
  - Total budget: <$10/month for 10-20 users
  - Claude API: <$0.20/optimization (use Haiku for parsing, Sonnet for generation)
  - Google API: Free tier only (100 queries/day, cache-first strategy)
  - Apollo.io: Free tier only (10K credits/month with rate limiting)
  - PDF parsing: $0 (open-source pdf-parse library, no API costs)

**Scale & Complexity:**

- **Primary domain:** Full-stack web application (Next.js only - NO browser extension)
- **Complexity level:** LOW
  - Internal tool for 10-20 users
  - Simple linear workflow (no branching logic)
  - No real-time collaboration features
  - No multi-tenancy complexity (RLS handles isolation)
  - **Reduced scope:** No browser extension development or maintenance
- **Estimated architectural components:**
  - 5-6 database tables (Phase 1-2 only for MVP)
  - 5-7 Next.js API routes (resume upload, job PDF upload, optimize, find contacts, generate message)
  - 3 external API integrations (Claude, Google, Apollo)
  - 1 PDF parsing service (pdf-parse library, in-process)

### Technical Constraints & Dependencies

**Hard Constraints:**

1. **FORBIDDEN: LinkedIn Dummy Account Scraping**
   - Legal risk: $500K penalty per hiQ Labs settlement
   - **Resolution:** Use Google Custom Search JSON API (X-Ray search) ONLY
   - No Playwright automation of LinkedIn with fake accounts

2. **Supabase-First Architecture (BMAD Guideline)**
   - Use Supabase auto-generated REST APIs where possible
   - Minimize Next.js API routes (only when Supabase can't handle it)
   - Prefer Supabase Edge Functions over custom serverless
   - **Maximum 3 external services** (Claude, Google, Apollo)

3. **Database Design Constraints**
   - ≤5 tables for MVP (BMAD guideline for solo developer)
   - RLS policies REQUIRED on every user data table
   - All foreign keys must have ON DELETE CASCADE
   - Indexes required on: `user_id`, `created_at`, foreign keys

4. **API Quota Limits**
   - Google Custom Search: 100 free queries/day (HARD LIMIT)
   - Apollo.io: 10,000 credits/month free tier
   - Claude API: Pay-as-you-go ($50/month budget cap)
   - **Consequence:** Architecture MUST include caching and fallback strategies

5. **Input Method: Flexible Multi-Option (MVP Enhancement)**
   - **Rationale:** Users have different preferences based on job board UX
   - Three input options: Manual paste (fastest), URL paste (metadata extraction), PDF upload (long JDs)
   - PDF upload constraints: 5MB max, application/pdf MIME type only, auto-delete after processing
   - **Post-MVP:** Chrome extension for one-click capture (if users request it)

**Technology Stack (Pre-decided):**

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **AI:** Claude Sonnet 4 (optimization), Claude Haiku 4 (parsing/extraction)
- **PDF Processing:** pdf-parse (Node.js library, open-source)
- **Deployment:** Vercel (free tier)
- ~~**Browser Extension:** Chrome Manifest V3~~ **REMOVED FROM MVP**

**External Dependencies:**

| Service | Purpose | Free Tier Limit | Cost if Exceeded | Fallback Strategy |
|---------|---------|-----------------|------------------|-------------------|
| **Google Custom Search API** | X-Ray search for LinkedIn profiles | 100 queries/day | $5/1000 queries | Cache results (7-day TTL), manual search fallback |
| **Apollo.io API** | Email/profile enrichment | 10,000 credits/month | $49/month for 10K more | Rotate to Hunter.io/Snov.io free tiers, manual entry |
| **Claude API (Anthropic)** | Resume optimization, message generation, company name extraction | Pay-as-you-go | $0.015/1K input tokens (Sonnet), $0.001/1K (Haiku) | Template-based fallback messages |
| **Supabase** | Database, Auth, Storage | 500MB DB, 1GB storage, 2GB bandwidth | $25/month (Pro tier) | Not acceptable - must stay within free tier |
| **pdf-parse** | PDF text extraction | Open-source (free) | N/A | Manual paste fallback if PDF extraction quality is poor |

### Cross-Cutting Concerns Identified

1. **Quota Exhaustion Protection (Critical)**
   - **Concern:** Google API 100/day limit shared across all users
   - **Architectural impact:**
     - Require cache-first lookup (check `linkedin_search_cache` table before API call)
     - Track daily usage per user in `api_usage` table
     - Display "Daily limit reached" message when quota hit
     - Manual search fallback UI component

2. **API Failure Resilience (Critical)**
   - **Concern:** External APIs (Claude, Google, Apollo) can timeout, fail, or return errors
   - **Architectural impact:**
     - Every API call must have: timeout (10-15s), retry logic (exponential backoff), fallback behavior
     - Template-based message generation if Claude fails
     - Cached results display if Google API fails
     - Manual paste fallback if PDF extraction fails
     - User-friendly error messages (not stack traces)

3. **Cost Monitoring & Alerting (High Priority)**
   - **Concern:** Claude API costs can spike if not controlled
   - **Architectural impact:**
     - Use Haiku for simple tasks ($0.001/1K tokens vs $0.015 for Sonnet)
     - Log all API calls to `api_usage` table
     - Dashboard for admin to monitor spend
     - Hard spend limit in Anthropic console ($50/month)

4. **Data Privacy & Multi-Tenancy (Critical)**
   - **Concern:** Users must not access each other's data (resumes, contacts, messages)
   - **Architectural impact:**
     - RLS policies on ALL tables (enforce `auth.uid() = user_id`)
     - No application-level authorization logic (database enforces it)
     - Audit all queries to ensure RLS is not bypassed
     - User data deletion via CASCADE (GDPR compliance)

5. **Input Validation & Sanitization (High Priority)**
   - **Concern:** Users pasting arbitrary text/URLs or uploading malicious files
   - **Architectural impact:**
     - Zod schemas for all input (job URL format validation, text length limits)
     - PDF MIME type validation (application/pdf only, reject executables)
     - File size limits (5MB max for job PDFs, 10MB max for resumes)
     - Sanitize extracted PDF text (remove control characters, normalize whitespace)
     - Validate company name extraction (prevent XSS in company name field)
     - Rate limiting on upload endpoints (max 10 uploads/hour per user)

6. **File Upload & Storage Optimization (Medium Priority)**
   - **Concern:** Resume uploads and generated PDFs consume storage
   - **Architectural impact:**
     - Auto-delete generated PDFs after 24 hours (reduce storage costs)
     - **Auto-delete uploaded job PDFs immediately after text extraction** (never persist)
     - Compress uploaded resumes before storing
     - Store only one master resume per user (replace on re-upload)
     - Supabase Storage bucket policies to prevent direct URL access

7. **Company Name Extraction Accuracy (Medium Priority)**
   - **Concern:** Extracting company name from job URL, PDF metadata, or pasted text can fail
   - **Architectural impact:**
     - Multi-source extraction strategy:
       1. Job URL domain parsing (e.g., `jobs.stripe.com` → "Stripe")
       2. PDF metadata extraction (if PDF uploaded)
       3. Claude Haiku NLP extraction from text content
     - Always show editable company name field (user can correct if wrong)
     - Cache company name per job URL (if user corrects it, remember for others)
     - Fallback: If extraction fails completely, require manual entry before proceeding

8. **PDF Text Extraction Quality (Medium Priority)**
   - **Concern:** PDFs can have complex layouts (multi-column, images, embedded ads, headers/footers)
   - **Architectural impact:**
     - Use pdf-parse (Node.js) for text extraction (good enough for MVP)
     - Post-processing cleanup:
       - Remove headers/footers (common patterns like "Page 1 of 3")
       - Strip navigation links, ads, company boilerplate
       - Normalize whitespace (replace multiple newlines)
     - Fallback: If PDF extraction quality is poor, prompt user to paste text instead
     - File size limit: 5MB max (prevent abuse, most job PDFs are <500KB)
     - Show preview of extracted text (first 200 chars) for user validation

9. **File Upload Security (High Priority)**
   - **Concern:** Users uploading malicious PDFs or executables disguised as PDFs
   - **Architectural impact:**
     - Validate file MIME type: application/pdf only (reject .exe, .zip, etc.)
     - Scan PDF structure for embedded scripts/exploits (basic validation via pdf-parse)
     - Use Supabase Storage with restricted bucket policies (private buckets only)
     - Auto-delete uploaded job PDFs after processing (don't persist long-term)
     - Rate limiting on upload endpoint (max 10 uploads/hour per user)
     - Serverless function timeout protection (kill PDF parsing if >10 seconds)

### Critical Architectural Decisions Made

**Decision 1: Remove Chrome Extension from MVP**

- **Rationale:**
  - Solo developer with 4-week timeline (extension adds 1-2 weeks of development)
  - 10-20 internal users can tolerate manual input methods
  - BMAD Guideline: Avoid over-engineering for MVP
  - Faster path to value (users can start using app immediately without installing extension)

- **Alternative chosen:** Three flexible input methods
  - **Primary input:** Textarea for job description text (paste directly)
  - **Secondary input:** Job URL field (for metadata extraction)
  - **Tertiary input:** PDF upload (for long/complex job descriptions)

- **Post-MVP consideration:** Add Chrome extension if users request it (move to SHOULD-HAVE)

**Decision 2: Add PDF Upload as Third Input Option**

- **Rationale:**
  - Long job descriptions (1000+ words) are tedious to copy/paste
  - "Save as PDF" is a familiar browser action for users
  - PDF parsing is free (open-source library, no API costs)
  - Improves UX flexibility without adding complexity

- **Implementation approach:**
  - Use pdf-parse library (Node.js, open-source)
  - Process PDFs in-memory, never persist (privacy + storage optimization)
  - Extract text, clean formatting artifacts, discard PDF immediately
  - Show preview of extracted text for user validation

- **Storage impact:** Zero (PDFs not stored, only extracted text kept)

**Decision 3: LinkedIn Scraping Strategy**

- **Discovery/Solutions documents:** Suggested dummy account scraping (Playwright automation, 20 searches/day rate limiting)
- **BMAD PM constraints:** FORBID dummy accounts due to $500K penalty risk (hiQ Labs settlement)
- **Product Brief approved approach:** Google X-Ray + Apollo.io ONLY

- **✅ Resolution:**
  - **Primary source:** Google Custom Search JSON API (`site:linkedin.com/in/ "Company" AND "Recruiter"`)
  - **Secondary source:** Apollo.io API for email/profile enrichment
  - **Forbidden:** Playwright scraping with dummy LinkedIn accounts
  - **Architecture impact:** Must design robust caching (7-day TTL) and manual fallback UI

**Decision 4: Company Name Extraction Strategy**

- **Multi-source extraction priority:**
  1. Job URL domain parsing (e.g., `jobs.stripe.com` → "Stripe")
  2. PDF metadata extraction (if user uploaded PDF with metadata)
  3. Claude Haiku NLP extraction from pasted job description text
  4. User manual entry (always show editable field as final fallback)

- **Validation:** Always allow user to correct company name before searching for contacts
- **Cost optimization:** Use Claude Haiku ($0.001/1K tokens) instead of Sonnet for extraction

---

## Starter Template Evaluation

### Selected Template: Vercel Supabase Starter (Option B)

**Initialization Command:**
```bash
npx create-next-app@latest job-outreach-system \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase
cd job-outreach-system
npm install
```

**Rationale for Selection:**

**Option A: Clean Slate (create-next-app)** was evaluated but rejected:
- Requires 4-6 hours of manual Supabase configuration
- Need to implement cookie-based auth from scratch (complex in App Router)
- Higher risk of security mistakes in auth implementation
- Does not align with 4-week MVP timeline

**Option B: Vercel Supabase Starter (SELECTED)** provides:
- ✅ **Pre-configured Supabase Auth** with cookie-based session management
- ✅ **Working middleware** for route protection
- ✅ **Server Components auth patterns** already implemented
- ✅ **Official template** maintained by Vercel team
- ✅ **Saves 4-6 hours** of boilerplate setup
- ✅ **Production-ready security** (PKCE flow, secure cookie handling)

**Version Details (as of 2026-01-02):**
- Next.js: 15.x (App Router)
- Supabase JS: Latest v2
- TypeScript: Pre-configured
- ESLint: Pre-configured

**Architectural Decisions Provided by Starter:**

1. **Authentication Pattern:**
   - Cookie-based sessions (not localStorage tokens)
   - Server-side auth validation via middleware
   - PKCE flow for OAuth security

2. **File Structure:**
   - `/app` directory for routes
   - `/components` for UI components
   - `/utils/supabase` for client creation (server/client/middleware variants)

3. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

**Post-Initialization Setup:**

Following the detailed setup orchestration from `bmad-architect-ux-setup.md`, the Dev Agent will:

1. **Add shadcn/ui:**
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button input textarea card
   ```

2. **Install Additional Dependencies:**
   ```bash
   npm install pdf-parse mammoth zod
   npm install --save-dev @types/pdf-parse
   ```

3. **Configure Environment Variables:**
   - Claude API: `ANTHROPIC_API_KEY`
   - Google Custom Search: `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`
   - Apollo.io: `APOLLO_API_KEY` (optional for MVP)

4. **Implement Auth Bypass Pattern (MVP Development):**
   - Create `STUB_USER_ID` environment variable for development
   - Modify auth middleware to use stub user when `NODE_ENV=development`
   - This allows frontend/backend work before Supabase auth is fully configured

5. **Database Setup:**
   - Initialize Supabase project
   - Run migration scripts (to be created in Step 4)
   - Enable RLS on all tables

**Trade-offs Accepted:**

- **Opinionated structure:** Starter has specific patterns we must follow (acceptable for MVP)
- **Some unused code:** Auth examples we'll need to clean up (minor cost)
- **Dependency on Vercel patterns:** If we migrate off Vercel, may need auth refactor (unlikely for internal tool)

**Alternative Considered:**

Razikus Supabase Starter was evaluated but not selected:
- More feature-rich (Stripe, analytics, multi-tenancy)
- Over-engineered for our 10-20 user internal tool
- Higher learning curve
- Not officially maintained by Vercel

**Next Steps (Step 4):**

With starter template selected, we'll now design:
1. Database schema (5-6 tables with RLS policies)
2. API endpoint architecture (Supabase-first approach)
3. External service integration patterns (Claude, Google, Apollo)
4. Error handling and fallback strategies

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Database schema design (5 tables with RLS policies)
2. API route architecture (6 custom routes + Supabase auto-generated)
3. PDF generation library (Puppeteer with @sparticuz/chromium)
4. State management (TanStack Query + React Context)
5. Form handling (React Hook Form + Zod)
6. Error handling patterns (retry + fallback chains)
7. Caching strategy (database-level, minimal for MVP)

**Important Decisions (Shape Architecture):**
8. Monitoring & cost tracking (Vercel logs + custom dashboard)
9. Environment configuration (stub user for dev, feature flags)
10. Deployment strategy (Vercel auto-deploy, Supabase CLI migrations)

**Deferred Decisions (Post-MVP):**
- Message template caching (reduces Claude API costs)
- Sentry error tracking (better than console.log)
- GitHub Actions CI/CD (automated testing)
- Apollo.io integration (email enrichment)

---

### Data Architecture

**Decision: Database Schema (5 Tables)**

**Final Schema:**

```sql
-- Table 1: resumes (master resume storage)
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  original_filename TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One master resume per user
);

-- Table 2: job_applications (optimization history)
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT NOT NULL, -- Cached for regeneration
  optimized_resume_path TEXT, -- Generated PDF
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Table 3: linkedin_search_cache (Google X-Ray cache)
CREATE TABLE linkedin_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  results JSONB NOT NULL, -- [{name, title, url, snippet}]
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(company_name, search_query)
);

-- Table 4: api_usage (quota tracking + cost monitoring)
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'google', 'apollo', 'claude'
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  UNIQUE(user_id, service, date)
);

-- Table 5: outreach_messages (message history + edits)
CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_linkedin_url TEXT,
  message_text TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('casual', 'professional', 'direct')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_jobs_user ON job_applications(user_id);
CREATE INDEX idx_jobs_created ON job_applications(created_at DESC);
CREATE INDEX idx_cache_expiry ON linkedin_search_cache(expires_at);
CREATE INDEX idx_usage_user_date ON api_usage(user_id, service, date);
CREATE INDEX idx_messages_job ON outreach_messages(job_application_id);

-- RLS Policies (CRITICAL - enforces multi-tenancy)
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own resumes" ON resumes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own job applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can READ own API usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own messages" ON outreach_messages
  FOR ALL USING (auth.uid() = user_id);

-- linkedin_search_cache is shared (no RLS) - all users benefit
```

**Rationale:**
- ✅ **5 tables total** - Meets BMAD guideline (≤5-6 tables for MVP)
- ✅ **RLS on all user data** - Database enforces authorization, not application logic
- ✅ **ON DELETE CASCADE** - User deletion automatically cleans up all related data (GDPR compliance)
- ✅ **Job description caching** - Reduces Claude API re-calls for message regeneration
- ✅ **Message history** - Enables user to view past messages, edit, and reuse for similar contacts
- ✅ **Lazy deletion** - `expires_at` field for cleanup on session login (simpler than cron for MVP)

**UI Implications:**
- Right-side history panel showing recent outreach messages
- Message edit functionality for reuse
- Cost dashboard showing API usage per service

---

**Decision: Caching Strategy (Database-Level)**

**Selected: Option A (Minimal Caching)**

**Implementation:**
- Google X-Ray results cached in `linkedin_search_cache` (7-day TTL)
- Job description text cached in `job_applications` (permanent, user-owned)
- API usage tracked in `api_usage` (for quota management)

**Post-MVP Enhancement (Option B):**
```sql
-- Deferred: Message template caching to reduce Claude costs
CREATE TABLE message_templates_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  tone TEXT NOT NULL,
  template TEXT NOT NULL, -- Generic: "Hi {name}, I'm applying..."
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(job_title, company_name, tone)
);
```

**Rationale:**
- Option A is sufficient for 10-20 users in MVP phase
- If Claude API costs exceed $5/month, implement Option B
- Reduces complexity during initial development

---

**Decision: File Storage & Cleanup**

**Strategy:**
- **Resumes:** One master resume per user in Supabase Storage (replace on re-upload)
- **Job PDFs:** Process in-memory, never persist (privacy + storage optimization)
- **Optimized PDFs:** Store in Supabase Storage, auto-delete after 24 hours

**Lazy Deletion Implementation:**
```typescript
// /app/api/cleanup/expired/route.ts
export async function POST(request: Request) {
  const { data: expired } = await supabase
    .from('job_applications')
    .select('optimized_resume_path')
    .lt('expires_at', new Date().toISOString())

  // Delete from Supabase Storage
  for (const app of expired) {
    await supabase.storage.from('resumes').remove([app.optimized_resume_path])
  }

  // Delete database records
  await supabase.from('job_applications').delete().lt('expires_at', new Date())
}
```

**Trigger:** Call from Next.js middleware on user session login

---

### API & Communication Patterns

**Decision: API Route Architecture (Supabase-First)**

**Use Supabase Auto-Generated REST APIs (Direct from Client):**
- ✅ CRUD on `resumes`, `job_applications`, `outreach_messages`
- ✅ SELECT from `linkedin_search_cache`, `api_usage`
- **Why:** RLS enforces authorization automatically, no custom server logic needed

**Custom Next.js API Routes (Server-Side Only):**

```
/api/resume/
  - POST /upload       → File validation + Supabase Storage
  - POST /optimize     → Claude API + Puppeteer PDF generation

/api/job/
  - POST /extract-pdf  → pdf-parse + text cleanup

/api/contacts/
  - POST /search       → Google Custom Search + cache-first lookup

/api/message/
  - POST /generate     → Claude API + template fallback

/api/cleanup/
  - POST /expired      → Lazy deletion of old PDFs
```

**Rationale:**
- Minimizes custom API routes (aligns with Supabase-first principle)
- Server-side routes only for: external API calls, file processing, complex workflows
- RLS handles all authorization logic

---

**Decision: Error Handling & Fallback Patterns**

**Standard Pattern:**

```typescript
// Type-safe API responses
type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fallback?: T }

// Retry logic with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  timeoutMs = 15000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ])
    } catch (err) {
      if (i === maxRetries - 1) throw err
      await sleep(2 ** i * 1000) // 1s, 2s, 4s
    }
  }
}

// Fallback chain example
async function generateMessage(params) {
  try {
    return await withRetry(() => claudeAPI.generate(params), 2, 15000)
  } catch (err) {
    console.error('Claude API failed, using template:', err)
    return generateTemplate(params) // Fallback to template
  }
}
```

**Timeout Settings:**
- Claude API: 15 seconds (2 retries)
- Google Custom Search: 10 seconds (1 retry)
- PDF parsing (pdf-parse): 10 seconds (no retry, fallback to manual paste)
- File uploads: 30 seconds (no retry)

**Fallback Chains (Per PRD Requirements):**

| Feature | Primary | Fallback 1 | Fallback 2 |
|---------|---------|------------|------------|
| **Message Generation** | Claude API | Template with {name} placeholders | Show manual textarea |
| **Contact Search** | Google API | Cached results (if available) | Manual LinkedIn search link |
| **PDF Extraction** | pdf-parse | User manual paste | Error: "Upload failed, paste JD instead" |
| **Resume Optimization** | PDF download | Markdown download | Copy to clipboard |

**User-Facing Error Messages:**
- ❌ **Bad:** "500 Internal Server Error"
- ✅ **Good:** "AI service temporarily unavailable. Using template message instead."

---

### Frontend Architecture

**Decision: State Management**

**Selected: TanStack Query v5.90.16 + React Context**

**Installation:**
```bash
npm install @tanstack/react-query@latest
```

**Rationale:**
- ✅ **TanStack Query for server state** - API calls, caching, loading states
- ✅ **React Context for UI state** - Sidebar open/closed, current step
- ✅ **Built-in retry logic** - Aligns with error handling requirements
- ✅ **Auto-refetch on window focus** - Fresh data when user returns
- ✅ **Cache invalidation** - Refresh message history after generating new message

**Usage Example:**
```typescript
// Query for job applications
const { data, isLoading, error } = useQuery({
  queryKey: ['job-applications'],
  queryFn: async () => {
    const { data } = await supabase.from('job_applications').select('*')
    return data
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 2
})

// Mutation for message generation
const generateMutation = useMutation({
  mutationFn: async (params) => fetch('/api/message/generate', {...}),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['outreach-messages'] })
  }
})
```

**Sources:**
- [TanStack Query v5 Documentation](https://tanstack.com/query/latest)
- [NPM: @tanstack/react-query](https://www.npmjs.com/package/@tanstack/react-query)

---

**Decision: Form Handling**

**Selected: React Hook Form v7.69.0 + Zod**

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Rationale:**
- ✅ PRD already specifies Zod for input validation
- ✅ Client-side validation before expensive API calls
- ✅ Excellent TypeScript integration
- ✅ File upload progress indicators
- ✅ Multi-step form support

**Usage Example:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const jobSchema = z.object({
  job_url: z.string().url().optional(),
  job_description: z.string().min(50).max(10000),
  company_name: z.string().min(2).max(100)
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(jobSchema)
})
```

**Sources:**
- [React Hook Form Documentation](https://react-hook-form.com/)
- [NPM: react-hook-form v7.69.0](https://www.npmjs.com/package/react-hook-form)

---

**Decision: PDF Generation**

**Selected: Puppeteer + @sparticuz/chromium for Vercel**

**Installation:**
```bash
# Production dependencies
npm install puppeteer-core @sparticuz/chromium

# Development dependency
npm install --save-dev puppeteer
```

**Rationale:**
- ✅ **Perfect formatting control** - HTML/CSS templates for ATS-friendly layouts
- ✅ **Vercel compatible** - @sparticuz/chromium fits in 250MB function limit
- ✅ **Zero ongoing costs** - No external PDF API fees
- ✅ **Preserves original formatting** - Can recreate resume layout exactly

**Implementation Pattern:**
```typescript
// /app/api/resume/optimize/route.ts
import { launch } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function POST(request: Request) {
  const browser = await launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless
  })

  const page = await browser.newPage()
  await page.setContent(optimizedResumeHTML)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  // Upload to Supabase Storage
  const { data } = await supabase.storage
    .from('resumes')
    .upload(`${userId}/optimized-${Date.now()}.pdf`, pdf)

  return Response.json({ success: true, path: data.path })
}
```

**Vercel Configuration:**
- Function timeout: 60 seconds (for PDF generation)
- Memory: 1024 MB (default)
- Region: auto

**Sources:**
- [Vercel Guide: Deploying Puppeteer with Next.js](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel)
- [Running Puppeteer on Vercel 2024](https://peterwhite.dev/posts/vercel-puppeteer-2024)

---

### Infrastructure & Deployment

**Decision: Monitoring & Cost Tracking**

**Selected: Vercel Logs + Custom Admin Dashboard**

**Cost Tracking Implementation:**
```typescript
// /app/api/admin/usage/route.ts
export async function GET() {
  const { data } = await supabase
    .from('api_usage')
    .select('service, date, sum(count), sum(cost_usd)')
    .group_by('service, date')
    .order('date', { ascending: false })

  return Response.json(data)
}

// Budget check before expensive operations
async function checkBudget() {
  const { data } = await supabase.rpc('get_monthly_spend')
  const BUDGET_USD = 10

  if (data.total_cost >= BUDGET_USD) {
    throw new Error('Monthly budget exceeded')
  }
}
```

**Error Logging:**
- Development: `console.log` + `console.error`
- Production: Vercel Function Logs (2-day retention)
- Future: Migrate to Sentry (5K errors/month free tier) when needed

**Alerting:**
- Email alert at 80% budget ($8)
- Hard block at 100% budget ($10)
- Admin dashboard at `/admin/usage` (protected route)

---

**Decision: Environment Configuration**

**Environment Variables:**
```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
ANTHROPIC_API_KEY=
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_ID=
APOLLO_API_KEY= # optional for MVP

# Development: Auth Bypass
STUB_USER_ID=00000000-0000-0000-0000-000000000000
NODE_ENV=development

# Budget Limits
MONTHLY_BUDGET_USD=10
CLAUDE_DAILY_LIMIT=50

# Feature Flags
FEATURE_PDF_UPLOAD=true
FEATURE_APOLLO_ENRICHMENT=false
```

**Vercel Environment Setup:**
- **Production:** All real API keys, no stub user, feature flags ON
- **Preview:** Same as production (test full auth flow)
- **Development:** Stub user enabled, reduced rate limits

**Auth Bypass Pattern (Development):**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development' && process.env.STUB_USER_ID) {
    // Skip auth, use stub user
    return NextResponse.next()
  }
  // Normal auth flow
  return await updateSession(request)
}
```

---

**Decision: Deployment Strategy**

**Primary Deployment: Vercel (Free Tier)**
- Auto-deploy from `main` branch → Production
- Auto-deploy from PRs → Preview URLs
- Environment variables in Vercel dashboard
- No config needed (Next.js auto-detected)

**Database Migrations: Supabase CLI**
```bash
# Initialize Supabase locally
npx supabase init

# Create migration
npx supabase migration new create_initial_schema

# Apply locally
npx supabase db reset

# Push to production
npx supabase db push
```

**Migration Files:**
- Stored in `/supabase/migrations/`
- Version controlled in Git
- Manual push for MVP (automated in GitHub Actions post-MVP)

**CI/CD Pipeline:**
- **MVP:** Vercel's built-in CI (build + deploy)
- **Post-MVP:** Add GitHub Actions for:
  - TypeScript type checking
  - ESLint
  - Vitest unit tests
  - Migration validation

---

### Decision Impact Analysis

**Implementation Sequence:**

1. **Phase 1: Database Setup**
   - Create Supabase project
   - Run migration script (5 tables + indexes + RLS)
   - Configure Supabase Storage buckets
   - Verify RLS policies in Supabase dashboard

2. **Phase 2: Authentication & Environment**
   - Clone Vercel Supabase Starter
   - Configure environment variables
   - Implement auth bypass for development
   - Test stub user authentication

3. **Phase 3: Core API Routes**
   - `/api/resume/upload` (file validation + storage)
   - `/api/job/extract-pdf` (pdf-parse integration)
   - `/api/resume/optimize` (Claude + Puppeteer)
   - `/api/contacts/search` (Google Custom Search + cache)
   - `/api/message/generate` (Claude + templates)

4. **Phase 4: Frontend Components**
   - Resume upload form (React Hook Form + Zod)
   - Job input (3 methods: paste, URL, PDF)
   - Contact search results (TanStack Query)
   - Message generator (3 tone variants)
   - History sidebar (outreach messages)

5. **Phase 5: Error Handling & Monitoring**
   - Implement retry logic on all API calls
   - Add fallback chains
   - Create admin usage dashboard
   - Test budget enforcement

6. **Phase 6: Testing & Deployment**
   - Manual testing with 3-5 users
   - Verify RLS policies work correctly
   - Deploy to Vercel production
   - Monitor costs for first week

**Cross-Component Dependencies:**

- Database Schema → RLS Policies → Supabase Client → TanStack Query → React Components
- Puppeteer Setup → PDF Generation API → Resume Optimizer
- Error Handling → All API Routes → TanStack Query Retry
- Environment Config → Auth Bypass → Development Workflow

**Critical Path:**
Database → RLS → Auth → API Routes → Frontend Components

Any delay in database design blocks all subsequent work.

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 8 areas where AI agents could make different implementation choices

This section defines mandatory patterns that ALL AI agents must follow when implementing features. These patterns prevent conflicts and ensure code works together seamlessly.

---

### Naming Patterns

**Database Naming Conventions:**

```sql
-- Table names: snake_case, plural
CREATE TABLE job_applications (...);
CREATE TABLE outreach_messages (...);

-- Column names: snake_case
user_id UUID
created_at TIMESTAMPTZ
job_description TEXT

-- Foreign keys: {table}_id format
resume_id UUID REFERENCES resumes(id)
user_id UUID REFERENCES auth.users(id)

-- Indexes: idx_{table}_{column(s)}
CREATE INDEX idx_jobs_user ON job_applications(user_id);
CREATE INDEX idx_jobs_created ON job_applications(created_at DESC);

-- RLS policies: "{Action} {description}" format
CREATE POLICY "Users can CRUD own resumes" ON resumes FOR ALL;
CREATE POLICY "Users can READ own API usage" ON api_usage FOR SELECT;
```

**API Naming Conventions:**

```
REST Endpoints:
  - Plural nouns: /api/resume/upload, /api/contacts/search
  - Kebab-case for multi-word: /api/job/extract-pdf
  - Route params: /api/users/:id (colon notation for Next.js dynamic routes)

Query Parameters (camelCase):
  - /api/contacts/search?companyName=Stripe&jobTitle=Engineer

Headers (kebab-case):
  - Content-Type, Authorization, X-Request-ID
```

**Code Naming Conventions:**

```typescript
// Component files: PascalCase
UserCard.tsx
MessageHistory.tsx
ResumeUploadForm.tsx

// Component exports: Match filename
export default function UserCard() { ... }

// Utility files: kebab-case
api-client.ts
error-handler.ts
supabase-server.ts

// Functions: camelCase
async function generateMessage() { ... }
function getUserData() { ... }

// Variables: camelCase
const userId = '123'
const isLoading = true
const jobApplications = []

// Types/Interfaces: PascalCase
interface APIResponse<T> { ... }
type JobApplication = { ... }

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024
const BUDGET_USD = 10
const CLAUDE_TIMEOUT_MS = 15000

// Enum values: PascalCase
enum MessageTone {
  Casual = 'casual',
  Professional = 'professional',
  Direct = 'direct'
}
```

---

### Structure Patterns

**Project Organization:**

```
/app                          ← Next.js App Router
  /api                        ← API routes (server-side only)
    /resume
      /upload
        route.ts              ← File validation + Supabase Storage
      /optimize
        route.ts              ← Claude + Puppeteer PDF generation
    /job
      /extract-pdf
        route.ts              ← pdf-parse integration
    /contacts
      /search
        route.ts              ← Google Custom Search + caching
    /message
      /generate
        route.ts              ← Claude + template fallback
    /cleanup
      /expired
        route.ts              ← Lazy deletion

  /dashboard                  ← Main application page
    page.tsx
    layout.tsx

  /(auth)                     ← Auth pages (grouped route)
    /login
      page.tsx
    /signup
      page.tsx

/components                   ← Reusable UI components
  /ui                         ← shadcn/ui components
    button.tsx
    input.tsx
    card.tsx

  /forms                      ← Form components
    ResumeUploadForm.tsx
    JobInputForm.tsx

  /layout                     ← Layout components
    Sidebar.tsx
    MessageHistory.tsx

/lib                          ← Utility functions & services
  /supabase                   ← Supabase client variants
    server.ts                 ← Server Component client
    client.ts                 ← Client Component client
    middleware.ts             ← Middleware client

  /api                        ← External API wrappers
    claude.ts                 ← Anthropic API client
    google-search.ts          ← Google Custom Search wrapper
    pdf-parser.ts             ← pdf-parse wrapper

  /utils                      ← Helper functions
    error-handler.ts
    retry-logic.ts
    validation.ts

/types                        ← TypeScript type definitions
  api.ts                      ← API response types
  database.ts                 ← Supabase auto-generated types

/hooks                        ← Custom React hooks
  useJobApplication.ts
  useContactSearch.ts
  useMessageGenerator.ts

/supabase                     ← Supabase configuration
  /migrations                 ← Database migration SQL files
    20260102_create_initial_schema.sql

/__tests__                    ← Test files (separate from source)
  /api                        ← API route tests
    resume.test.ts
    contacts.test.ts
  /components                 ← Component tests
    user-card.test.tsx
  /lib                        ← Utility tests
    error-handler.test.ts
```

**File Organization Rules:**

1. **API routes MUST be in `/app/api/`** and named `route.ts` (Next.js requirement)
2. **Page components MUST be named `page.tsx`** (Next.js requirement)
3. **Reusable components go in `/components/`** organized by purpose (ui, forms, layout)
4. **Utilities go in `/lib/`** with descriptive kebab-case names
5. **Tests go in `/__tests__/`** mirroring source structure

---

### Format Patterns

**API Response Formats:**

**Standard Response Wrapper:**

```typescript
// Type definition
type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fallback?: T }

// Success response example
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "resume": {
      "id": "123",
      "filePath": "resumes/user123/master.pdf",
      "uploadedAt": "2026-01-02T10:30:00Z"
    }
  }
}

// Error response with fallback example
{
  "success": false,
  "error": "Claude API timeout. Using template message instead.",
  "fallback": {
    "messageText": "Hi {name}, I'm applying for the {jobTitle} role at {company}..."
  }
}

// Error response without fallback
{
  "success": false,
  "error": "Daily search limit reached. Please try again tomorrow."
}
```

**Data Exchange Formats:**

```typescript
// Field naming: camelCase in JSON (transforms from snake_case database)
{
  "userId": "123",              // database: user_id
  "createdAt": "2026-01-02...", // database: created_at
  "jobDescription": "...",      // database: job_description
  "matchScore": 85              // database: match_score
}

// Dates: ISO 8601 strings (YYYY-MM-DDTHH:MM:SSZ)
{
  "createdAt": "2026-01-02T10:30:00Z",
  "expiresAt": "2026-01-03T10:30:00Z"
}

// Booleans: true/false (not 1/0 or "true"/"false")
{
  "isLoading": true,
  "hasError": false
}

// Arrays: Always use arrays, even for single items (consistency)
{
  "contacts": [
    { "name": "John Doe", "title": "Recruiter" }
  ]
}

// Null handling: Use null for missing optional values, omit for undefined
{
  "jobUrl": null,          // explicitly no URL provided
  "matchScore": 85         // omit if not calculated yet
}
```

---

### Communication Patterns

**State Management Patterns (TanStack Query):**

```typescript
// Query key naming: Array format, hierarchical
const { data } = useQuery({
  queryKey: ['job-applications'],              // List all
  queryKey: ['job-applications', id],          // Single item
  queryKey: ['contacts', companyName],         // Parameterized
  queryKey: ['api-usage', userId, 'claude'],   // Multi-level
  // ...
})

// Mutation naming: {action}Mutation
const generateMessageMutation = useMutation({ ... })
const uploadResumeMutation = useMutation({ ... })
const searchContactsMutation = useMutation({ ... })

// Cache invalidation: Invalidate parent queries on mutation
const generateMutation = useMutation({
  mutationFn: async (params) => ...,
  onSuccess: () => {
    // Invalidate messages for this job
    queryClient.invalidateQueries({ queryKey: ['outreach-messages'] })
  }
})

// Loading states: Use TanStack Query built-ins
const { data, isLoading, isPending, error } = useQuery(...)
// DO NOT create separate isLoading state variables
```

**Event System Patterns (if needed post-MVP):**

```typescript
// Event naming: {resource}.{action} (lowercase, dot-separated)
'user.created'
'resume.uploaded'
'message.generated'

// Event payload: Consistent structure
interface DomainEvent<T> {
  type: string
  timestamp: string
  data: T
  userId?: string
}
```

---

### Process Patterns

**Error Handling Patterns:**

**User-Facing Error Messages:**

```typescript
// ALWAYS provide: What failed + What's happening instead
// NEVER show: Stack traces, internal codes, technical details

// Good examples:
"AI service timed out. Using template message instead."
"Daily search limit reached. Showing cached results."
"Could not read PDF. Please paste job description instead."
"Permission denied. Please log in again."

// Bad examples (AVOID):
"Error: ECONNREFUSED"
"500 Internal Server Error"
"Anthropic API returned status 429"
"RLS policy violation on table job_applications"
```

**Server-Side Logging:**

```typescript
// Logging format: Structured, includes context
console.error('[API_ERROR]', {
  timestamp: new Date().toISOString(),
  endpoint: '/api/message/generate',
  error: err.message,
  stack: err.stack,
  userId: user?.id,
  params: { companyName, jobTitle, tone }
})

// Log levels:
console.log('[INFO]', ...)    // Normal operations
console.warn('[WARN]', ...)   // Recoverable issues (using fallback)
console.error('[ERROR]', ...) // Failed operations (user sees error)
```

**Retry & Timeout Patterns:**

```typescript
// Use standard withRetry utility for all external API calls
import { withRetry } from '@/lib/utils/retry-logic'

// Standard retry pattern (from decision 7)
const result = await withRetry(
  () => claudeAPI.generate(params),
  2,        // maxRetries
  15000     // timeoutMs
)

// Timeout settings (MUST follow these):
- Claude API: 15 seconds, 2 retries
- Google Custom Search: 10 seconds, 1 retry
- PDF parsing: 10 seconds, 0 retries (fallback to manual)
- File uploads: 30 seconds, 0 retries
```

**Loading State Patterns:**

```typescript
// Use TanStack Query loading states (DO NOT duplicate)
const { isLoading, isPending } = useQuery(...)

// Global loading (for full-page operations)
// Use React Context + Suspense boundary
const { setGlobalLoading } = useGlobalLoadingContext()

// Local loading (for inline operations)
// Use mutation.isPending from TanStack Query
const { isPending: isGenerating } = generateMutation

// Loading UI:
- Skeleton loaders for data fetching (job applications list)
- Spinner for mutations (generating message)
- Progress bar for file uploads (resume upload)
```

---

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Use snake_case for database tables/columns**, transform to camelCase in TypeScript/JSON
2. **Follow the standard `APIResponse<T>` wrapper** for all API routes
3. **Use the `withRetry()` utility** for all external API calls with specified timeouts
4. **Follow the project structure** - components in `/components/`, utilities in `/lib/`, API routes in `/app/api/`
5. **Use TanStack Query for server state** - DO NOT create custom data fetching logic
6. **Use React Hook Form + Zod** for all forms - DO NOT use native form handling
7. **Name files according to conventions** - PascalCase components, kebab-case utilities
8. **Write user-friendly error messages** - NEVER expose technical details
9. **Place tests in `/__tests__/`** directory - DO NOT co-locate
10. **Use ISO 8601 strings for dates** - NEVER use timestamps or custom formats

**Pattern Enforcement:**

- **Code reviews:** Dev Agent must verify patterns are followed before PRs
- **TypeScript:** Enforce types via `api.ts` and `database.ts` type files
- **Linting:** ESLint rules for naming conventions (PascalCase components, camelCase functions)
- **Testing:** Tests MUST follow naming convention `{filename}.test.ts(x)`

**Process for Updating Patterns:**

1. Discuss pattern change in architecture document
2. Update this section with new pattern
3. Search codebase for violations of old pattern
4. Update all existing code to match new pattern
5. Document in commit message: "refactor: update {pattern} to {new_pattern}"

---

### Pattern Examples

**Good Examples:**

```typescript
// ✅ API Route: Standard response wrapper
export async function POST(request: Request) {
  try {
    const result = await withRetry(() => claudeAPI.generate(params), 2, 15000)
    return Response.json({
      success: true,
      data: { messageText: result }
    })
  } catch (err) {
    return Response.json({
      success: false,
      error: "AI service timed out. Using template message instead.",
      fallback: { messageText: generateTemplate(params) }
    }, { status: 200 }) // Still 200, client handles via success flag
  }
}

// ✅ Component: TanStack Query + proper naming
export default function MessageHistory() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['outreach-messages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('outreach_messages')  // snake_case database
        .select('*')
      return data  // Transforms to camelCase automatically
    }
  })

  if (isLoading) return <Skeleton />

  return (
    <div className="space-y-4">
      {messages?.map(msg => (
        <Card key={msg.id}>
          <p>{msg.messageText}</p>  {/* camelCase in TypeScript */}
          <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
        </Card>
      ))}
    </div>
  )
}

// ✅ Utility: Proper error logging
export async function searchContacts(companyName: string) {
  try {
    const results = await googleSearchAPI.search(companyName)
    return { success: true, data: results }
  } catch (err) {
    console.error('[API_ERROR]', {
      timestamp: new Date().toISOString(),
      function: 'searchContacts',
      error: err.message,
      companyName
    })

    // Return user-friendly error
    return {
      success: false,
      error: "Daily search limit reached. Showing cached results."
    }
  }
}

// ✅ Form: React Hook Form + Zod validation
const jobSchema = z.object({
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().min(50).max(10000),
  companyName: z.string().min(2).max(100)
})

export function JobInputForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema)
  })

  const onSubmit = (data) => {
    // data is already validated and typed
    console.log(data.jobDescription) // camelCase
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('jobDescription')} />
      {errors.jobDescription && <p>{errors.jobDescription.message}</p>}
    </form>
  )
}
```

**Anti-Patterns (AVOID):**

```typescript
// ❌ Inconsistent response format (missing wrapper)
export async function POST(request: Request) {
  const result = await claudeAPI.generate(params)
  return Response.json(result)  // Should be { success: true, data: result }
}

// ❌ Snake_case in TypeScript (should be camelCase)
const job_description = data.job_description
const created_at = new Date()

// ❌ Custom data fetching (should use TanStack Query)
const [messages, setMessages] = useState([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  async function fetchMessages() {
    const { data } = await supabase.from('outreach_messages').select('*')
    setMessages(data)
    setIsLoading(false)
  }
  fetchMessages()
}, [])

// ❌ Exposing internal errors to users
return Response.json({
  error: "Error: ECONNREFUSED at Socket.connect (net.js:937:16)"
})

// ❌ Timestamp instead of ISO string
{
  createdAt: 1704193800000  // Should be "2026-01-02T10:30:00Z"
}

// ❌ Wrong file naming
user-card.tsx              // Should be UserCard.tsx (component)
APIClient.ts               // Should be api-client.ts (utility)

// ❌ Ignoring timeout settings
const result = await claudeAPI.generate(params)  // No timeout or retry
```

---

## Project Structure & Boundaries

### Implementation Priority (P0/P1/P2)

**P0 (Critical Path - Must implement first):**
1. Database setup (5 tables + RLS)
2. Supabase Storage (resumes bucket)
3. External API integrations (Claude, Google, Puppeteer)
4. Core API routes (6 routes)
5. Frontend core components (4 components + dashboard)

**P1 (Important, post-MVP):**
6. Auth system (login/signup pages)
7. Message history UI
8. Admin cost dashboard

**P2 (Future enhancements):**
9. Lazy deletion automation
10. Apollo.io integration
11. Message template caching

---

### Complete Project Directory Structure

```
job-outreach-system/
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json                      ← shadcn/ui config
├── .env.local                           ← Dev environment (gitignored)
├── .env.example                         ← Template for team
├── .gitignore
├── .eslintrc.json
├── .github/
│   └── workflows/
│       └── ci.yml                       ← P2: GitHub Actions CI
│
├── app/                                 ← Next.js 15 App Router
│   ├── globals.css
│   ├── layout.tsx                       ← Root layout with TanStack Query provider
│   ├── page.tsx                         ← Landing page (redirect to /dashboard)
│   ├── middleware.ts                    ← P0: Auth bypass (stub user for MVP)
│   │
│   ├── dashboard/                       ← P0: Main application
│   │   ├── page.tsx                     ← Linear workflow: Upload → Job Input → Optimize → Contacts → Message
│   │   └── layout.tsx                   ← Dashboard layout (no sidebar for MVP)
│   │
│   ├── admin/                           ← P1: Admin pages (cost monitoring)
│   │   └── usage/
│   │       └── page.tsx                 ← API usage dashboard
│   │
│   └── api/                             ← P0: API routes (server-side only)
│       ├── resume/
│       │   ├── upload/
│       │   │   └── route.ts             ← POST: File validation + Supabase Storage
│       │   └── optimize/
│       │       └── route.ts             ← POST: Claude API + Puppeteer PDF generation
│       ├── job/
│       │   └── extract-pdf/
│       │       └── route.ts             ← POST: pdf-parse + text cleanup
│       ├── contacts/
│       │   └── search/
│       │       └── route.ts             ← POST: Google Custom Search + caching
│       ├── message/
│       │   └── generate/
│       │       └── route.ts             ← POST: Claude API + template fallback
│       └── cleanup/
│           └── expired/
│               └── route.ts             ← P2: Lazy deletion of old PDFs
│
├── components/                          ← Reusable UI components
│   ├── ui/                              ← P0: shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── select.tsx
│   │   ├── label.tsx
│   │   ├── toast.tsx
│   │   └── progress.tsx
│   │
│   ├── forms/                           ← P0: Form components
│   │   ├── ResumeUploadForm.tsx         ← Step 1: Master resume upload (DOCX)
│   │   └── JobInputForm.tsx             ← Step 2: Job description input (3 methods) + company extraction
│   │
│   ├── features/                        ← P0: Feature-specific components
│   │   ├── ContactList.tsx              ← Step 3: Display Google X-Ray results
│   │   ├── MessageGenerator.tsx         ← Step 4: AI message generation (3 tones)
│   │   └── MatchScore.tsx               ← Resume match score display
│   │
│   └── layout/                          ← P1: Layout components
│       ├── MessageHistory.tsx           ← Right-side message history panel (P1)
│       └── Header.tsx                   ← App header with user menu (P1)
│
├── lib/                                 ← Utility functions & services
│   ├── supabase/                        ← P0: Supabase client variants
│   │   ├── server.ts                    ← Server Component client
│   │   ├── client.ts                    ← Client Component client
│   │   └── middleware.ts                ← Middleware client
│   │
│   ├── api/                             ← P0: External API wrappers
│   │   ├── claude.ts                    ← Anthropic API client (Sonnet + Haiku)
│   │   ├── google-search.ts             ← Google Custom Search wrapper
│   │   ├── pdf-parser.ts                ← pdf-parse wrapper + text cleanup
│   │   └── apollo.ts                    ← P2: Apollo.io API (deferred)
│   │
│   ├── utils/                           ← P0: Helper functions
│   │   ├── error-handler.ts             ← User-friendly error messages
│   │   ├── retry-logic.ts               ← withRetry utility with exponential backoff
│   │   ├── validation.ts                ← Zod schemas for API validation
│   │   ├── file-utils.ts                ← File size validation, MIME type checks
│   │   └── company-extractor.ts         ← Multi-source company name extraction
│   │
│   └── templates/                       ← P0: Message templates (fallback)
│       └── message-templates.ts         ← Template-based messages (casual, professional, direct)
│
├── types/                               ← P0: TypeScript type definitions
│   ├── api.ts                           ← API response types (APIResponse<T>, Resume, JobApplication, Contact, Message)
│   ├── database.ts                      ← Supabase auto-generated types (from `supabase gen types`)
│   └── env.d.ts                         ← Environment variable types
│
├── hooks/                               ← P0: Custom React hooks
│   ├── useJobApplication.ts             ← TanStack Query hook for job applications
│   ├── useContactSearch.ts              ← TanStack Query hook for contact search
│   ├── useMessageGenerator.ts           ← TanStack Query mutation for message generation
│   └── useResumeUpload.ts               ← TanStack Query mutation for resume upload
│
├── supabase/                            ← P0: Supabase configuration
│   ├── config.toml                      ← Supabase CLI config
│   ├── seed.sql                         ← Database seed data (for testing)
│   └── migrations/                      ← Database migration SQL files
│       ├── 20260102000001_create_initial_schema.sql  ← 5 tables + indexes + RLS
│       └── 20260102000002_add_budget_tracking.sql    ← RPC function for budget check
│
├── __tests__/                           ← P1: Test files (separate from source)
│   ├── api/                             ← API route tests
│   │   ├── resume.test.ts
│   │   ├── contacts.test.ts
│   │   └── message.test.ts
│   ├── components/                      ← Component tests
│   │   ├── resume-upload-form.test.tsx
│   │   ├── job-input-form.test.tsx
│   │   └── message-generator.test.tsx
│   ├── lib/                             ← Utility tests
│   │   ├── error-handler.test.ts
│   │   ├── retry-logic.test.ts
│   │   └── company-extractor.test.ts
│   └── setup.ts                         ← Test setup (Vitest config)
│
├── public/                              ← P0: Static assets
│   ├── favicon.ico
│   └── assets/
│       ├── logo.svg
│       └── placeholder-resume.png
│
└── docs/                                ← Project documentation
    ├── discovery.md
    ├── solutions.md
    ├── tech-context.md
    ├── _bmad-guidelines/
    │   ├── bmad-architect-agent-guidelines.md
    │   ├── bmad-architect-ux-setup.md
    │   └── bmad-pm-people-data-scraping.md
    └── _bmad-output/
        └── planning-artifacts/
            ├── product-brief-job-outreach-system-2025-12-31.md
            ├── prd-job-outreach-system.md
            └── architecture.md          ← THIS DOCUMENT
```

**Key Changes from Standard Template:**
- ❌ **Removed:** `/app/(auth)/login/` and `/app/(auth)/signup/` - Moved to P1 (stub user for MVP)
- ❌ **Removed:** `/components/forms/ContactSearchForm.tsx` - Not needed (company flows from JobInputForm)
- ❌ **Removed:** `/components/layout/Sidebar.tsx` - Not needed for linear workflow
- ✅ **Added:** Priority labels (P0/P1/P2) for dev agent focus

---

### Architectural Boundaries

**API Boundaries:**

1. **External API Integrations (P0 - server-side only):**
   - `/lib/api/claude.ts` → Anthropic Claude API (Sonnet 4 + Haiku 4)
   - `/lib/api/google-search.ts` → Google Custom Search JSON API
   - `/lib/api/apollo.ts` → Apollo.io API (P2 - deferred)

2. **Next.js API Routes (P0 - `/app/api/**/route.ts`):**
   - All external API calls MUST go through these routes
   - Client components NEVER call external APIs directly
   - All routes return standardized `APIResponse<T>` format

3. **Supabase Direct Access (P0 - client-side allowed with RLS):**
   - CRUD operations on `resumes`, `job_applications`, `outreach_messages`
   - SELECT from `linkedin_search_cache`, `api_usage`
   - RLS enforces authorization automatically (uses stub user_id for MVP)

**Component Boundaries:**

1. **UI Components (P0 - `/components/ui/`):**
   - No business logic
   - Purely presentational
   - Accept props, emit events
   - Managed by shadcn/ui (copy-paste, not npm package)

2. **Form Components (P0 - `/components/forms/`):**
   - React Hook Form + Zod validation
   - Call API routes via TanStack Query mutations
   - Handle file uploads with progress indicators
   - JobInputForm extracts company name automatically

3. **Feature Components (P0 - `/components/features/`):**
   - Business logic for specific features
   - Use custom hooks for data fetching
   - Stateful components with TanStack Query integration

4. **Layout Components (P1 - `/components/layout/`):**
   - MessageHistory panel (P1 - nice-to-have)
   - Header with user menu (P1 - minimal for MVP)

**Service Boundaries:**

1. **Supabase Services (P0 - `/lib/supabase/*`):**
   - `server.ts`: For Server Components and API routes
   - `client.ts`: For Client Components
   - `middleware.ts`: For Next.js middleware (stub user bypass)
   - **NEVER** mix these clients (causes hydration errors)

2. **External API Wrappers (P0 - `/lib/api/*`):**
   - Encapsulate all external API logic
   - Handle rate limiting, retries, timeouts
   - Return standardized `{ success, data, error }` format
   - Imported ONLY by API routes, never by components

3. **Utility Services (P0 - `/lib/utils/*`):**
   - Shared across API routes and components
   - Pure functions (no side effects)
   - Type-safe with TypeScript generics

**Data Boundaries:**

1. **Database Layer (P0 - Supabase Postgres):**
   - 5 tables: `resumes`, `job_applications`, `linkedin_search_cache`, `api_usage`, `outreach_messages`
   - RLS policies on all user-owned tables (uses stub user_id for MVP)
   - `auth.users` table exists but not used in MVP (all data uses stub user_id)
   - Migrations in `/supabase/migrations/`

2. **Storage Layer (P0 - Supabase Storage):**
   - Bucket: `resumes` (private, RLS-protected)
   - Master resumes: `resumes/{stubUserId}/master.pdf`
   - Optimized resumes: `resumes/{stubUserId}/optimized-{timestamp}.pdf`
   - Auto-deletion: P2 (manual deletion for MVP)

3. **Caching Layer (P0):**
   - Database-level: `linkedin_search_cache` table (7-day TTL)
   - Job description: Stored in `job_applications.job_description` column
   - TanStack Query: Client-side cache (5-minute staleTime)

4. **API Usage Tracking (P0):**
   - Logged to `api_usage` table on every external API call
   - Checked before expensive operations (budget enforcement)
   - Queried by admin dashboard (P1)

---

### Requirements to Structure Mapping

**Feature: Resume Optimizer (P0)**
- **Frontend:**
  - `/components/forms/ResumeUploadForm.tsx` → Step 1: Upload master resume (DOCX, 10MB max)
  - `/components/forms/JobInputForm.tsx` → Step 2: Job description input (paste/URL/PDF)
  - `/components/features/MatchScore.tsx` → Display match score after optimization
  - `/app/dashboard/page.tsx` → Main workflow UI
- **API Routes:**
  - `/app/api/resume/upload/route.ts` → File validation + Supabase Storage
  - `/app/api/resume/optimize/route.ts` → Claude Sonnet + Puppeteer PDF
  - `/app/api/job/extract-pdf/route.ts` → pdf-parse + text cleanup
- **Services:**
  - `/lib/api/claude.ts` → Sonnet for optimization, Haiku for parsing
  - `/lib/api/pdf-parser.ts` → PDF text extraction
  - `/lib/utils/company-extractor.ts` → Extract company from URL/PDF/text
- **Database:**
  - `resumes` table → Master resume metadata
  - `job_applications` table → Optimization history + match scores
- **Workflow:**
  ```
  User uploads DOCX
    → POST /api/resume/upload
    → Store in Supabase Storage
    → Save metadata in resumes table

  User inputs job (paste/URL/PDF)
    → JobInputForm extracts company name automatically
    → If PDF: POST /api/job/extract-pdf
    → Display extracted company name (user can edit)

  User clicks "Optimize Resume"
    → POST /api/resume/optimize
    → Claude Sonnet: resume + job_description → optimized content
    → Puppeteer: HTML → PDF
    → Store in Supabase Storage
    → Save job_applications record with match_score
    → Download optimized PDF
  ```

**Feature: Contact Finder (P0)**
- **Frontend:**
  - `/components/forms/JobInputForm.tsx` → Extracts company name (reused from optimization step)
  - `/components/features/ContactList.tsx` → Display 3-10 search results
  - `/app/dashboard/page.tsx` → "Find Contacts" button (uses company from JobInputForm)
- **API Routes:**
  - `/app/api/contacts/search/route.ts` → Google Custom Search + cache-first lookup
- **Services:**
  - `/lib/api/google-search.ts` → Google Custom Search JSON API wrapper
- **Database:**
  - `linkedin_search_cache` table → 7-day TTL, shared cache (no RLS)
  - `api_usage` table → Track Google API quota (100/day)
- **Workflow:**
  ```
  User completes Step 2 (JobInputForm)
    → Company name extracted: "Stripe"
    → User verifies/edits company name

  User clicks "Find Contacts"
    → POST /api/contacts/search { companyName: "Stripe" }
    → Check linkedin_search_cache (cache-first)
    → If miss: Google Custom Search API
      → Query: site:linkedin.com/in/ "Stripe" AND ("Recruiter" OR "Hiring Manager")
    → Store results in cache (7-day TTL)
    → Track usage in api_usage table
    → Display ContactList component (3-10 results)
  ```

**Feature: Outreach Generator (P0)**
- **Frontend:**
  - `/components/features/MessageGenerator.tsx` → 3 tone variants (casual, professional, direct)
  - `/components/features/ContactList.tsx` → Click contact to generate message
  - `/components/layout/MessageHistory.tsx` → P1: Right-side history panel
- **API Routes:**
  - `/app/api/message/generate/route.ts` → Claude Sonnet + template fallback
- **Services:**
  - `/lib/api/claude.ts` → Sonnet for message generation
  - `/lib/templates/message-templates.ts` → Fallback templates
- **Database:**
  - `outreach_messages` table → Message history (created but not displayed in MVP)
- **Workflow:**
  ```
  User clicks on a contact from ContactList
    → MessageGenerator component opens
    → User selects tone: "Professional"

  User clicks "Generate Message"
    → POST /api/message/generate {
        contactName: "John Doe",
        contactTitle: "Recruiter",
        jobTitle: "Software Engineer",
        companyName: "Stripe",
        tone: "professional"
      }
    → Try: Claude Sonnet API (uses job_description from Step 2)
    → If fail: Template fallback with {name} placeholders
    → Save to outreach_messages table
    → Display message in MessageGenerator
    → User clicks "Copy" to copy to clipboard

  P1: Display in MessageHistory.tsx panel for reuse
  ```

**Cross-Cutting: Auth & Security (P0 for RLS, P1 for UI)**
- **Middleware (P0):**
  - `/middleware.ts` → Stub user bypass for MVP
  ```typescript
  export async function middleware(request: NextRequest) {
    // MVP: Always use stub user
    if (process.env.STUB_USER_ID) {
      return NextResponse.next()
    }
    // P1: Real auth check
    return await updateSession(request)
  }
  ```
- **Services (P0):**
  - `/lib/supabase/server.ts`, `/lib/supabase/client.ts`, `/lib/supabase/middleware.ts`
- **Database (P0):**
  - `auth.users` table exists (Supabase-managed)
  - RLS policies on all user data tables (enforced, uses stub user_id)
  - P1: Add login/signup UI when real users need separate accounts

**Cross-Cutting: Error Handling & Monitoring (P0 for errors, P1 for dashboard)**
- **Services (P0):**
  - `/lib/utils/error-handler.ts` → User-friendly error messages
  - `/lib/utils/retry-logic.ts` → Exponential backoff retry
- **API Routes:**
  - P2: `/app/api/cleanup/expired/route.ts` → Lazy deletion (manual for MVP)
- **Database (P0):**
  - `api_usage` table → Cost tracking per user/service/day
- **Frontend (P1):**
  - `/app/admin/usage/page.tsx` → Admin dashboard (P1 - use Supabase dashboard for MVP)

---

### Integration Points

**Internal Communication:**

1. **Client → API Routes (via TanStack Query):**
   ```typescript
   // hooks/useResumeUpload.ts (P0)
   const { mutate: uploadResume } = useMutation({
     mutationFn: async (file: File) => {
       const formData = new FormData()
       formData.append('file', file)
       const res = await fetch('/api/resume/upload', {
         method: 'POST',
         body: formData
       })
       return res.json()
     }
   })
   ```

2. **API Routes → Supabase (via server client):**
   ```typescript
   // app/api/resume/upload/route.ts (P0)
   import { createClient } from '@/lib/supabase/server'

   const supabase = createClient()
   const { data, error } = await supabase.storage
     .from('resumes')
     .upload(`${stubUserId}/master.pdf`, file)
   ```

3. **Components → Supabase (via client, RLS-protected):**
   ```typescript
   // components/features/MessageHistory.tsx (P1)
   import { createClient } from '@/lib/supabase/client'

   const supabase = createClient()
   const { data } = await supabase
     .from('outreach_messages')  // RLS filters by stub user_id
     .select('*')
   ```

**External Integrations (P0):**

1. **Claude API (`/lib/api/claude.ts`):**
   - Endpoint: `https://api.anthropic.com/v1/messages`
   - Auth: `ANTHROPIC_API_KEY` (env var)
   - Models: `claude-sonnet-4-20241022` (optimization), `claude-haiku-4-20241022` (parsing)
   - Called from: `/app/api/resume/optimize/route.ts`, `/app/api/message/generate/route.ts`

2. **Google Custom Search API (`/lib/api/google-search.ts`):**
   - Endpoint: `https://www.googleapis.com/customsearch/v1`
   - Auth: `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` (env vars)
   - Quota: 100 queries/day (free tier)
   - Called from: `/app/api/contacts/search/route.ts`

3. **Puppeteer (`/app/api/resume/optimize/route.ts`):**
   - Package: `puppeteer-core` + `@sparticuz/chromium`
   - Used for: HTML → PDF conversion (optimized resumes)
   - Timeout: 60 seconds (Vercel function limit)

**Data Flow (Corrected Linear Workflow):**

```
Step 1: User uploads resume (DOCX)
  → ResumeUploadForm.tsx
  → POST /api/resume/upload
  → File validation (size, MIME type)
  → Supabase Storage (resumes bucket)
  → Database (resumes table with metadata)
  → Return file_path to client

Step 2: User inputs job description (paste/URL/PDF)
  → JobInputForm.tsx
  → Three input methods:
    - Paste: Direct text input
    - URL: Extract from job posting URL
    - PDF: POST /api/job/extract-pdf → pdf-parse → text cleanup
  → Extract company name automatically:
    1. Try URL domain parsing (jobs.stripe.com → "Stripe")
    2. Try PDF metadata
    3. Try Claude Haiku NLP extraction
    4. Fallback: User edits company name field
  → Display extracted company name (editable)
  → Store jobData in component state: { jobDescription, companyName, jobTitle }

Step 3: User clicks "Optimize Resume" (optional)
  → POST /api/resume/optimize
  → Uses jobData.jobDescription from Step 2
  → Fetch master resume from Supabase Storage
  → Call Claude Sonnet API (resume + JD)
  → Generate HTML from optimized content
  → Puppeteer: HTML → PDF
  → Upload optimized PDF to Supabase Storage
  → Save job_application record (with match_score)
  → Download optimized PDF

Step 4: User clicks "Find Contacts"
  → Uses jobData.companyName from Step 2 (no separate form)
  → POST /api/contacts/search { companyName }
  → Check linkedin_search_cache (cache-first)
  → If miss: Google Custom Search API
  → Store results in cache (7-day TTL)
  → Track usage in api_usage table
  → Display ContactList component

Step 5: User clicks on a contact
  → MessageGenerator.tsx opens
  → User selects tone (casual/professional/direct)
  → POST /api/message/generate {
      contactName,
      contactTitle,
      jobData.jobTitle,        ← from Step 2
      jobData.companyName,     ← from Step 2
      jobData.jobDescription,  ← from Step 2
      tone
    }
  → Try: Claude Sonnet API
  → If fail: Template fallback with {name} placeholders
  → Save to outreach_messages table
  → Display message
  → User clicks "Copy" to clipboard

P1: MessageHistory.tsx panel shows past messages for reuse
```

---

### File Organization Patterns

**Configuration Files (P0):**

```
Root level:
- package.json            → Dependencies, scripts
- next.config.js          → Next.js config (Puppeteer memory, Vercel settings)
- tailwind.config.ts      → Tailwind CSS config
- tsconfig.json           → TypeScript compiler options
- components.json         → shadcn/ui configuration
- .env.local              → Development env vars (gitignored)
- .env.example            → Template for team (checked in)
- .eslintrc.json          → ESLint rules (PascalCase components, camelCase functions)
- .gitignore              → Ignore node_modules, .env.local, .next, etc.
```

**Source Organization (P0):**

```
/app → Pages & API routes (Next.js convention)
  - dashboard/page.tsx → Linear workflow UI
  - api/**/route.ts → 6 server-side API routes

/components → UI components (organized by purpose)
  - ui/ → shadcn/ui components
  - forms/ → 2 form components (ResumeUploadForm, JobInputForm)
  - features/ → 3 feature components (ContactList, MessageGenerator, MatchScore)
  - layout/ → P1 (MessageHistory, Header)

/lib → Services & utilities
  - supabase/ → 3 client variants
  - api/ → 3 external API wrappers (Claude, Google, pdf-parse)
  - utils/ → 5 helper functions
  - templates/ → Message fallback templates

/types → TypeScript types (api.ts, database.ts, env.d.ts)
/hooks → 4 custom React hooks (TanStack Query wrappers)
```

**Test Organization (P1):**

```
/__tests__ → Mirrors source structure
  /api → API route tests (test endpoints, caching, error handling)
  /components → Component tests (test forms, validation, user interactions)
  /lib → Utility tests (test retry logic, error handler, company extractor)
```

**Asset Organization (P0):**

```
/public → Static assets (favicon, logo)
/supabase → Database migrations (versioned SQL files)
/docs → Project documentation (discovery, architecture)
```

---

### Development Workflow Integration

**Development Server Structure (P0):**

```bash
# Start Next.js dev server
npm run dev

# Start Supabase locally (optional for dev)
npx supabase start

# Run database migrations
npx supabase db reset

# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --local > types/database.ts
```

**Environment (P0):**
```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# External APIs (use real keys even in dev)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_ID=...

# Auth bypass (P0 for MVP)
STUB_USER_ID=00000000-0000-0000-0000-000000000000
NODE_ENV=development

# Budget limits
MONTHLY_BUDGET_USD=10
CLAUDE_DAILY_LIMIT=50

# Feature flags (P0 for MVP)
FEATURE_PDF_UPLOAD=true
FEATURE_APOLLO_ENRICHMENT=false
```

**Build Process Structure (P0):**

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Output:
#   .next/ → Next.js build artifacts
#   .next/server/ → Server-side code (API routes)
#   .next/static/ → Client-side assets (components)
```

**Deployment Structure (P0):**

```bash
# Vercel deployment (auto-triggered on git push to main)
vercel

# Supabase production migration
npx supabase db push

# Environment variables (set in Vercel dashboard):
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_ID=...
MONTHLY_BUDGET_USD=10

# NO STUB_USER_ID in production (P1: add real auth)
```

---

### P0 Implementation Checklist (Dev Agent Sprint 1)

**Week 1: Database + API Setup**

1. ✅ **Supabase Project Setup (2 hours)**
   - Create Supabase project
   - Run migration: `/supabase/migrations/20260102000001_create_initial_schema.sql`
     - 5 tables: resumes, job_applications, linkedin_search_cache, api_usage, outreach_messages
     - Indexes: idx_jobs_user, idx_jobs_created, idx_cache_expiry, etc.
     - RLS policies: All tables except linkedin_search_cache
   - Generate TypeScript types: `npx supabase gen types typescript > types/database.ts`

2. ✅ **Supabase Storage Setup (1 hour)**
   - Create `resumes` bucket (private)
   - Configure RLS policies on bucket
   - Test upload/download with stub user

3. ✅ **External API Integration (4 hours)**
   - `/lib/api/claude.ts` → Anthropic SDK setup (Sonnet + Haiku)
   - `/lib/api/google-search.ts` → Google Custom Search wrapper
   - `/lib/api/pdf-parser.ts` → pdf-parse wrapper + text cleanup
   - `/lib/utils/retry-logic.ts` → withRetry utility
   - `/lib/utils/error-handler.ts` → User-friendly error messages
   - `/lib/utils/company-extractor.ts` → Multi-source company extraction

4. ✅ **Puppeteer Setup for Vercel (2 hours)**
   - Install: `puppeteer-core`, `@sparticuz/chromium`
   - Test locally: HTML → PDF conversion
   - Configure next.config.js for Vercel (memory, timeout)

**Week 2: API Routes + Frontend**

5. ✅ **API Routes Implementation (8 hours)**
   - `/app/api/resume/upload/route.ts` → File validation + Supabase Storage
   - `/app/api/resume/optimize/route.ts` → Claude Sonnet + Puppeteer
   - `/app/api/job/extract-pdf/route.ts` → pdf-parse + text cleanup
   - `/app/api/contacts/search/route.ts` → Google API + cache-first
   - `/app/api/message/generate/route.ts` → Claude Sonnet + template fallback
   - All routes use `APIResponse<T>` wrapper
   - All external calls use `withRetry()`

6. ✅ **Frontend Core Components (10 hours)**
   - `/components/forms/ResumeUploadForm.tsx` → React Hook Form + file upload
   - `/components/forms/JobInputForm.tsx` → 3 input methods + company extraction
   - `/components/features/ContactList.tsx` → Display search results
   - `/components/features/MessageGenerator.tsx` → 3 tone variants
   - `/components/features/MatchScore.tsx` → Display match percentage
   - `/app/dashboard/page.tsx` → Linear workflow UI (5 steps)
   - `/hooks/useResumeUpload.ts`, `/hooks/useContactSearch.ts`, etc.

7. ✅ **Integration Testing (3 hours)**
   - Test full workflow: Upload → Job Input → Optimize → Contacts → Message
   - Verify caching works (linkedin_search_cache)
   - Verify RLS works (stub user can CRUD their data)
   - Verify error handling (Claude timeout → template fallback)

**Total P0 Estimate: ~30 hours (2 weeks for solo dev)**

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All architectural decisions work together without conflicts:

- ✅ **Technology Stack:** Next.js 15 + TypeScript + Supabase + TanStack Query v5.90.16 + React Hook Form v7.69.0 + Puppeteer (all versions verified compatible)
- ✅ **External APIs:** Claude (Sonnet 4 + Haiku 4) + Google Custom Search + pdf-parse (all HTTP/library-based, framework-agnostic)
- ✅ **No version conflicts:** All dependencies work together in Next.js 15 environment
- ✅ **Vercel compatibility:** Puppeteer + @sparticuz/chromium verified for serverless deployment

**Pattern Consistency:**

Implementation patterns fully support architectural decisions:

- ✅ **Naming patterns align with tech stack:** snake_case (database) → camelCase (TypeScript) transformation via Supabase client
- ✅ **API response format consistent:** All 6 API routes use `APIResponse<T>` wrapper
- ✅ **Error handling uniform:** All external API calls use `withRetry()` utility with specified timeouts
- ✅ **State management coherent:** TanStack Query for server state, React Context for UI state (no conflicts)
- ✅ **Form validation consistent:** React Hook Form + Zod on all forms (ResumeUploadForm, JobInputForm)

**Structure Alignment:**

Project structure supports all architectural decisions:

- ✅ **Directory structure matches patterns:** `/app/api/` for API routes, `/components/forms/` for form components, `/lib/api/` for external API wrappers
- ✅ **File naming follows conventions:** PascalCase components (MessageGenerator.tsx), kebab-case utilities (retry-logic.ts)
- ✅ **Test structure mirrors source:** `/__tests__/api/`, `/__tests__/components/`, `/__tests__/lib/`
- ✅ **P0/P1/P2 priorities clear:** Dev agent can focus on critical path (database, storage, API routes, core UI)

---

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

All 5 MUST-HAVE features from PRD fully supported:

1. ✅ **Resume Optimizer (3 input methods):**
   - Upload DOCX: `/app/api/resume/upload/route.ts` + `ResumeUploadForm.tsx`
   - Job input (paste/URL/PDF): `JobInputForm.tsx` + `/app/api/job/extract-pdf/route.ts`
   - Company extraction: `/lib/utils/company-extractor.ts` (multi-source: URL, PDF metadata, Claude NLP)
   - AI optimization: `/app/api/resume/optimize/route.ts` (Claude Sonnet)
   - PDF generation: Puppeteer + @sparticuz/chromium
   - Storage: Supabase Storage (`resumes` bucket)

2. ✅ **Contact Finder (X-Ray Search):**
   - Google Custom Search: `/lib/api/google-search.ts`
   - Cache-first (7-day TTL): `linkedin_search_cache` table
   - Quota tracking: `api_usage` table (100/day free tier)
   - Display contacts: `ContactList.tsx`

3. ✅ **Outreach Generator:**
   - AI messages: `/app/api/message/generate/route.ts` (Claude Sonnet)
   - 3 tone variants: `MessageGenerator.tsx` (casual, professional, direct)
   - Template fallback: `/lib/templates/message-templates.ts`
   - Message history: `outreach_messages` table (P1 for UI display)

4. ✅ **Company Name Extraction:**
   - Multi-source: URL parsing, PDF metadata, Claude Haiku NLP
   - User-editable: `JobInputForm.tsx` shows editable company name field
   - Implementation: `/lib/utils/company-extractor.ts`

5. ✅ **Auth & Security:**
   - RLS policies: All 4 user data tables (`resumes`, `job_applications`, `api_usage`, `outreach_messages`)
   - Stub user for MVP: `/middleware.ts` auth bypass (P0)
   - Login/signup UI: Deferred to P1 (Vercel Supabase Starter provides templates)

**Functional Requirements Coverage:**

All core workflows architecturally supported:

- ✅ **Linear workflow:** Upload resume → Input job → Optimize → Find contacts → Generate message
- ✅ **Company name flows between steps:** JobInputForm extracts once, reused for contact search and message generation
- ✅ **No redundant forms:** ContactSearchForm removed (company flows from JobInputForm)
- ✅ **Caching reduces API costs:** Google X-Ray results cached 7 days, job description cached in database

**Non-Functional Requirements Coverage:**

All NFRs addressed architecturally:

- ✅ **Performance:**
  - Page load <1.5s FCP: Next.js 15 App Router + Turbopack
  - API latency <500ms p95: Next.js API routes (serverless)
  - Claude <10s: 15s timeout + skeleton loaders
  - Resume optimization <30s: Puppeteer 60s timeout
  - PDF extraction <3s: pdf-parse 10s timeout

- ✅ **Security:**
  - RLS on ALL user tables: Migration includes RLS policies
  - API keys in env vars: `.env.local` (never client-exposed)
  - Input validation: Zod schemas on all forms
  - PDF security: MIME validation, 5MB limit, auto-delete after processing
  - HTTPS-only: Vercel enforces TLS 1.3

- ✅ **Reliability:**
  - Cache hit rate >70%: `linkedin_search_cache` (7-day TTL, shared across users)
  - Fallback chains: Claude → templates, Google API → cached results, PDF parse → manual paste
  - Graceful degradation: User-friendly error messages (never stack traces)

- ✅ **Scalability:**
  - 50 concurrent users: Supabase free tier supports this
  - Auto-delete PDFs after 24h: `expires_at` field in job_applications (P2 automation)
  - Database <500MB: 5 tables, minimal data storage

- ✅ **Cost Constraints:**
  - <$10/month total: Claude ($0.20/optimization with Haiku for parsing), Google free tier, pdf-parse free
  - Budget enforcement: `MONTHLY_BUDGET_USD` env var + `api_usage` tracking

---

### Implementation Readiness Validation ✅

**Decision Completeness:**

All critical decisions documented with implementation details:

- ✅ **Database schema:** Complete SQL with 5 tables, indexes, RLS policies, foreign key cascades
- ✅ **API routes:** 6 routes with specific responsibilities, error handling, timeout settings
- ✅ **External integrations:** Claude API (Sonnet + Haiku), Google Custom Search, Puppeteer + @sparticuz/chromium
- ✅ **State management:** TanStack Query v5.90.16 with usage examples, React Context for UI state
- ✅ **Form handling:** React Hook Form v7.69.0 + Zod with code examples
- ✅ **Error handling:** `withRetry()` utility with exponential backoff, user-friendly messages
- ✅ **Versions verified:** All packages have specific version numbers from web search

**Structure Completeness:**

Complete project tree with all files and directories:

- ✅ **All directories defined:** From `/app` to `/__tests__`, no placeholders
- ✅ **All key files specified:** route.ts files, components, utilities, migrations
- ✅ **Priority labels:** P0 (critical path), P1 (post-MVP), P2 (future)
- ✅ **File naming:** PascalCase components, kebab-case utilities, route.ts for API routes
- ✅ **Test structure:** Mirrors source structure in `/__tests__/`

**Pattern Completeness:**

All potential conflict points addressed with mandatory patterns:

- ✅ **Naming conventions:** 8 categories (database, API, code, components, variables, types, constants, enums)
- ✅ **API response format:** `APIResponse<T>` wrapper mandatory for all routes
- ✅ **Error messages:** User-friendly format (what failed + what's happening instead)
- ✅ **File organization:** 5 clear rules (API routes, pages, components, utilities, tests)
- ✅ **State management:** TanStack Query for server state (no custom fetching), React Context for UI state
- ✅ **Loading states:** Use TanStack Query built-ins (isLoading, isPending), no duplicate state
- ✅ **Code examples:** Good vs anti-pattern examples for all major patterns
- ✅ **Enforcement:** 10 mandatory rules all AI agents MUST follow

---

### Gap Analysis Results

**Critical Gaps:** ✅ NONE FOUND

All blocking decisions, patterns, and structure elements are complete and ready for implementation.

**Important Gaps:** ✅ NONE FOUND

P1 items (auth UI, message history, admin dashboard) are intentionally deferred to post-MVP and clearly labeled.

**Nice-to-Have Gaps (Optional Enhancements):**

1. **Database Migration SQL Content:**
   - Current: Migration file path specified (`/supabase/migrations/20260102000001_create_initial_schema.sql`)
   - Enhancement: Could include complete SQL as appendix for quick reference
   - **Decision:** Dev agent can create migration from schema in Data Architecture section

2. **Message Template Examples:**
   - Current: Template fallback mentioned (`/lib/templates/message-templates.ts`)
   - Enhancement: Could show 3 example templates with {name} placeholders
   - **Decision:** Dev agent can create templates based on tone descriptions (casual, professional, direct)

3. **Company Extraction Decision Tree:**
   - Current: Multi-source strategy described (URL, PDF metadata, Claude NLP, manual)
   - Enhancement: Could show pseudo-code for extraction priority logic
   - **Decision:** Dev agent can implement based on priority list (URL → PDF → Claude → manual)

**Overall:** Architecture is complete and ready for implementation. The 3 optional enhancements are nice-to-have but not required for dev agent success.

---

### Validation Issues Addressed

**Issues Found During Validation:**

1. ✅ **Auth Workflow Redundancy (RESOLVED)**
   - **Issue:** Initial structure included `/app/(auth)/login/` and `/app/(auth)/signup/` for MVP
   - **Resolution:** Removed from P0, moved to P1. MVP uses stub user bypass (`STUB_USER_ID` env var)
   - **Rationale:** Internal tool with 10-20 trusted users doesn't need auth for MVP

2. ✅ **Contact Finder Workflow Redundancy (RESOLVED)**
   - **Issue:** Initial design had separate `ContactSearchForm.tsx` where user re-enters company name
   - **Resolution:** Removed separate form. Company name extracted in `JobInputForm` and flows to contact search button
   - **Rationale:** Better UX (user doesn't re-enter data), simpler code (less state management)

3. ✅ **P0/P1/P2 Prioritization Clarity (RESOLVED)**
   - **Issue:** Original structure didn't clearly distinguish MVP-critical from nice-to-have
   - **Resolution:** Added P0/P1/P2 labels throughout project structure and implementation checklist
   - **Rationale:** Dev agent can focus on critical path (database, storage, API routes, core UI) without distraction

**All validation issues successfully resolved before finalizing architecture.**

---

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (5 MUST-HAVE features, NFRs, cost constraints)
- [x] Scale and complexity assessed (LOW complexity, 10-20 internal users, <$10/month)
- [x] Technical constraints identified (Supabase-first, ≤5-6 tables, Google 100/day quota, no LinkedIn scraping)
- [x] Cross-cutting concerns mapped (error handling, quota exhaustion, cost monitoring, file storage optimization)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions (TanStack Query v5.90.16, React Hook Form v7.69.0, Puppeteer + @sparticuz/chromium)
- [x] Technology stack fully specified (Next.js 15, Supabase, Claude Sonnet 4 + Haiku 4, Google Custom Search, pdf-parse)
- [x] Integration patterns defined (API boundaries, Supabase direct access with RLS, external API wrappers)
- [x] Performance considerations addressed (timeouts, retries, fallbacks, caching, lazy deletion)

**✅ Implementation Patterns**

- [x] Naming conventions established (snake_case database, camelCase TypeScript, PascalCase components, kebab-case utilities)
- [x] Structure patterns defined (project organization, file naming, test organization, asset organization)
- [x] Communication patterns specified (TanStack Query keys, mutation naming, cache invalidation)
- [x] Process patterns documented (error handling, retry logic, loading states, user-facing messages)

**✅ Project Structure**

- [x] Complete directory structure defined (all directories from `/app` to `/__tests__` specified)
- [x] Component boundaries established (UI, forms, features, layout with clear responsibilities)
- [x] Integration points mapped (client → API routes, API routes → Supabase, components → Supabase, external APIs)
- [x] Requirements to structure mapping complete (each feature mapped to specific files, components, API routes, database tables)

---

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH**

All architectural decisions are complete, coherent, and specific enough for AI agents to implement consistently.

**Key Strengths:**

1. ✅ **Clear P0/P1/P2 prioritization** - Dev agent knows exactly what to build first (database, storage, API routes, core UI)
2. ✅ **Corrected workflow eliminates redundancy** - Company name flows from JobInputForm, no duplicate forms
3. ✅ **Auth simplified for MVP** - Stub user bypass for 10-20 internal users, move to P1 when needed
4. ✅ **Complete code examples** - Good vs anti-pattern examples for all major patterns (API routes, components, utilities, forms)
5. ✅ **Specific file structure** - Not generic placeholders, actual file paths with responsibilities
6. ✅ **All external APIs verified** - Claude, Google, Puppeteer all confirmed compatible with Next.js 15 + Vercel
7. ✅ **Comprehensive error handling** - Retry logic, fallback chains, timeout settings, user-friendly messages
8. ✅ **Database design optimized** - 5 tables with RLS, caching strategy, auto-deletion plan
9. ✅ **Cost constraints met** - <$10/month budget with Claude Haiku for parsing, Sonnet for generation, Google free tier, pdf-parse free
10. ✅ **Implementation checklist** - Dev agent has 30-hour P0 sprint plan with 7 clear tasks

**Areas for Future Enhancement (Post-MVP):**

1. **P1:** Auth system (login/signup UI) - when users need separate accounts
2. **P1:** Message history UI (`MessageHistory.tsx`) - for message reuse
3. **P1:** Admin cost dashboard (`/admin/usage/page.tsx`) - for spend monitoring (use Supabase dashboard for MVP)
4. **P2:** Lazy deletion automation (`/app/api/cleanup/expired/route.ts`) - manual deletion for MVP
5. **P2:** Apollo.io integration (`/lib/api/apollo.ts`) - email enrichment
6. **P2:** Message template caching - reduce Claude API costs if >$5/month

---

### Implementation Handoff

**AI Agent Guidelines:**

- ✅ **Follow all architectural decisions exactly as documented** - database schema, API routes, component structure
- ✅ **Use implementation patterns consistently across all components** - naming conventions, API response format, error handling
- ✅ **Respect project structure and boundaries** - components in `/components/`, utilities in `/lib/`, API routes in `/app/api/`
- ✅ **Refer to this document for all architectural questions** - this is the source of truth for implementation decisions

**First Implementation Priority (P0 Sprint 1):**

```bash
# Step 1: Clone Vercel Supabase Starter
npx create-next-app@latest job-outreach-system \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase

cd job-outreach-system
npm install

# Step 2: Install additional dependencies
npm install @tanstack/react-query@latest react-hook-form zod @hookform/resolvers
npm install pdf-parse mammoth puppeteer-core @sparticuz/chromium
npm install --save-dev @types/pdf-parse

# Step 3: Configure shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input textarea card skeleton select label toast progress

# Step 4: Create Supabase project and run migrations
npx supabase init
# Copy migration SQL from Data Architecture section into /supabase/migrations/
npx supabase db reset

# Step 5: Generate TypeScript types
npx supabase gen types typescript --local > types/database.ts

# Step 6: Configure environment variables
cp .env.example .env.local
# Add: STUB_USER_ID, ANTHROPIC_API_KEY, GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID

# Step 7: Begin P0 implementation
# Follow P0 Implementation Checklist (Week 1-2, ~30 hours)
```

**Implementation Sequence:**
1. Database + Storage setup (3 hours)
2. External API integration (4 hours)
3. Puppeteer setup (2 hours)
4. API routes (8 hours)
5. Frontend components (10 hours)
6. Integration testing (3 hours)

**Total: ~30 hours for P0 MVP**

---

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅  
**Total Steps Completed:** 8  
**Date Completed:** 2026-01-02  
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- 8 core architectural decisions made (Database, API Routes, State Management, Forms, PDF Generation, Error Handling, Monitoring, Deployment)
- 10 mandatory implementation patterns defined
- 30+ architectural components specified (5 tables, 6 API routes, 15+ components)
- 5 MUST-HAVE requirements fully supported + all NFRs

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Next.js 15, Supabase, TanStack Query v5.90.16, React Hook Form v7.69.0, Puppeteer)
- Consistency rules that prevent implementation conflicts (naming, API format, error handling, state management)
- Project structure with clear P0/P1/P2 boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**  
This architecture document is your complete guide for implementing the Job Outreach System. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**

```bash
npx create-next-app@latest job-outreach-system \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase

cd job-outreach-system
npm install @tanstack/react-query@latest react-hook-form zod @hookform/resolvers
npm install pdf-parse mammoth puppeteer-core @sparticuz/chromium

npx shadcn@latest init
npx shadcn@latest add button input textarea card skeleton select label toast progress
```

**Development Sequence:**

1. **Database + Storage Setup** (3 hours) - Create 5 tables with RLS, configure Supabase Storage for resumes bucket
2. **External API Integration** (4 hours) - Set up Claude API client, Google Custom Search wrapper, pdf-parse utilities
3. **Puppeteer Setup** (2 hours) - Configure @sparticuz/chromium for Vercel, create resume PDF template
4. **API Routes** (8 hours) - Implement 6 API routes (resume upload/optimize, PDF extract, contact search, message generate, cleanup)
5. **Frontend Components** (10 hours) - Build dashboard, forms (ResumeUpload, JobInput), features (ContactList, MessageGenerator, MatchScore)
6. **Integration Testing** (3 hours) - End-to-end workflow testing, error handling validation

**Total P0 Sprint: ~30 hours**

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible (Next.js 15 + Supabase + TanStack Query v5 + React Hook Form v7)
- [x] Patterns support the architectural decisions (APIResponse<T>, withRetry(), snake_case → camelCase)
- [x] Structure aligns with all choices (Supabase-first, minimal Next.js API routes)

**✅ Requirements Coverage**

- [x] All functional requirements are supported (Resume Optimizer, Contact Finder, Outreach Generator, Company Extraction, Auth with stub)
- [x] All non-functional requirements are addressed (Performance <3s, Security via RLS, Reliability with cache/retries, Scalability 50 users)
- [x] Cross-cutting concerns are handled (Error handling, monitoring, cost management)
- [x] Integration points are defined (Client → API routes → Supabase, External APIs → Caching)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable (exact versions, specific library choices)
- [x] Patterns prevent agent conflicts (10 mandatory rules with examples)
- [x] Structure is complete and unambiguous (full directory tree with file purposes)
- [x] Examples are provided for clarity (code snippets for API routes, components, utilities, forms)

### Project Success Factors

**🎯 Clear Decision Framework**  
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**  
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**  
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**  
The chosen Vercel Supabase Starter template and architectural patterns provide a production-ready foundation following current best practices.

**💰 Cost-Optimized Design**  
Architecture achieves <$10/month target through Claude Haiku for parsing, Google free tier (100/day), pdf-parse (free), Supabase free tier (50 users), and strategic caching (>70% hit rate).

**🚀 MVP-Focused Approach**  
P0/P1/P2 prioritization ensures dev agent focuses on critical path first (database, API, core UI), deferring auth and admin features to post-MVP.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
