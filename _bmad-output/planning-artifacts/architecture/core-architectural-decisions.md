# Core Architectural Decisions

## Decision Priority Analysis

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

## Data Architecture

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

## API & Communication Patterns

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

## Frontend Architecture

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

## Infrastructure & Deployment

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

## Decision Impact Analysis

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
