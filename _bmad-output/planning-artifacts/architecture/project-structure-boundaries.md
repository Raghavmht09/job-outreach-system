# Project Structure & Boundaries

## Implementation Priority (P0/P1/P2)

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

## Complete Project Directory Structure

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

## Architectural Boundaries

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

## Requirements to Structure Mapping

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

## Integration Points

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

## File Organization Patterns

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

## Development Workflow Integration

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

## P0 Implementation Checklist (Dev Agent Sprint 1)

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
