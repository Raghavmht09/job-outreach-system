# Project Context Analysis

## Requirements Overview

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

## Technical Constraints & Dependencies

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

## Cross-Cutting Concerns Identified

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

## Critical Architectural Decisions Made

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
