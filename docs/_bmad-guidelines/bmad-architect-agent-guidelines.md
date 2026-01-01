# B-MAD Architect Agent - Guidelines & Common Issues

**Agent:** Architect
**Purpose:** Design simple, Supabase-first architecture; avoid over-engineering; ensure security
**Load this at:** Start of `/architecture` generation

---

## 🎯 Core Architecture Principles

**CRITICAL: This is a Solo Developer MVP**

- **Supabase-First:** Use Supabase auto-APIs, avoid custom backend code
- **Thin Backend Logic:** Minimize Next.js API routes, prefer Supabase Edge Functions
- **Managed Services Only:** No self-hosted infrastructure, no Docker, no Kubernetes
- **Maximum 3 External Services:** Database (Supabase), Cache (Upstash), Background Jobs (Trigger.dev)

---

## ⚠️ Issue #1: Over-Engineered Architecture

### Symptom
Architecture includes 10+ services: API Gateway, Message Queue, Redis, Elasticsearch, Microservices, Kafka, etc.

### Root Cause
Architect assumes enterprise-scale from day 1.

### Solution Pattern

**ARCHITECTURE DECISION FRAMEWORK:**

Ask yourself in this order:

1. **Can Supabase handle this?**
   - ✅ YES → Use Supabase (auto-generated REST API, Database Functions, Storage)
   - ❌ NO → Go to #2

2. **Can Supabase Edge Functions handle this?**
   - ✅ YES → Use Edge Functions (for external API calls, complex logic)
   - ❌ NO → Go to #3

3. **Do we REALLY need custom code?**
   - ✅ YES → Use Next.js API routes (only as last resort)
   - ❌ NO → Rethink the requirement

### Good Example: LinkedIn Referral Finder

```markdown
## Architecture Layers

### Layer 1: Database & Storage (Supabase)
- **PostgreSQL:** User data, jobs, connections, messages
- **Supabase Storage:** Resume uploads (if needed)
- **Row Level Security (RLS):** All authorization via policies
- **Auto-generated APIs:** REST and GraphQL endpoints

### Layer 2: Authentication (Supabase Auth OR Clerk)
- **Choice:** Clerk (better DX, drop-in components)
- **Fallback:** Supabase Auth (if budget is concern)
- **Session Management:** Server-side cookies

### Layer 3: Frontend (Next.js 14 App Router)
- **Server Components:** Default for all pages (data fetching)
- **Client Components:** Only for interactivity (forms, modals)
- **Styling:** Tailwind CSS + shadcn/ui components

### Layer 4: External Services (Minimal)
- **LLM API:** Claude Sonnet 4 (via Anthropic API)
- **Cache (Optional):** Upstash Redis (only if LLM costs >$2/user/month)
- **Background Jobs (Optional):** Trigger.dev (only if we add follow-ups)

### Layer 5: Deployment & Monitoring
- **Hosting:** Vercel (free tier for MVP)
- **Monitoring:** Vercel Analytics + Sentry
- **Analytics:** PostHog (free tier)
```

### Bad Example (Avoid This)

```markdown
## Architecture Layers

### API Gateway Layer
- Kong API Gateway
- Rate limiting service
- Authentication proxy

### Microservices Layer
- User Service (Node.js)
- Job Service (Python)
- Connection Service (Go)
- Message Service (Rust)
- Inter-service communication via Kafka

### Data Layer
- PostgreSQL (primary database)
- Redis (caching)
- Elasticsearch (search)
- MongoDB (document storage)

### Queue Layer
- RabbitMQ for async jobs
- Bull for job scheduling

### Infrastructure
- Kubernetes for orchestration
- Docker for containerization
- Nginx for load balancing
```

**Why this is bad:**
- 10+ services for 100 users (massive over-engineering)
- Solo developer cannot maintain this complexity
- Monthly costs would be >$500/month
- Deployment complexity = slower iteration

---

## ⚠️ Issue #2: Missing Database Schema Details

### Symptom
Architecture doc says "We'll use PostgreSQL" but doesn't specify tables, columns, relationships, indexes, or RLS policies.

### Root Cause
Architect focuses on high-level system design and forgets database is 60% of the work.

### Solution Pattern

**DATABASE SCHEMA TEMPLATE:**

For EVERY table, specify:

```sql
-- Table: {table_name}
-- Purpose: {one-sentence description}

CREATE TABLE {table_name} (
  -- Primary key (always UUID)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key to auth.users (for user-owned data)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business columns
  {column_name} {data_type} {constraints},
  
  -- Audit columns (always include)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (REQUIRED for foreign keys and common queries)
CREATE INDEX idx_{table_name}_user_id ON {table_name}(user_id);
CREATE INDEX idx_{table_name}_created_at ON {table_name}(created_at DESC);

-- Row Level Security (REQUIRED for all user data)
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own {table_name}"
ON {table_name}
FOR ALL
USING (auth.uid() = user_id);

-- Update timestamp trigger (auto-update updated_at)
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON {table_name}
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Complete Example: LinkedIn Referral Finder Schema

```sql
-- ==============================================
-- Table: jobs
-- Purpose: Store job postings user wants to apply to
-- ==============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job metadata
  job_url TEXT NOT NULL,
  company_name TEXT,
  job_title TEXT,
  job_description TEXT,
  location TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_job_url UNIQUE(user_id, job_url)
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_company_name ON jobs(company_name); -- For filtering by company

-- RLS Policy
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own jobs"
ON jobs FOR ALL
USING (auth.uid() = user_id);

-- ==============================================
-- Table: connections
-- Purpose: LinkedIn connections at target company
-- ==============================================

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Connection details
  linkedin_profile_url TEXT,
  name TEXT NOT NULL,
  role TEXT,
  connection_degree INTEGER CHECK (connection_degree IN (1, 2, 3)),
  mutual_connection_name TEXT, -- For 2nd/3rd degree connections
  
  -- Confidence scoring
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_factors JSONB, -- Store factors: {relationship_strength: 0.8, recency: 0.6, ...}
  
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_job_id ON connections(job_id);
CREATE INDEX idx_connections_confidence_score ON connections(confidence_score DESC);

-- RLS Policy
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own connections"
ON connections FOR ALL
USING (auth.uid() = user_id);

-- ==============================================
-- Table: messages
-- Purpose: Generated referral request messages
-- ==============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  
  -- Message variants (AI-generated)
  message_variants JSONB NOT NULL, -- {casual: "...", professional: "...", direct: "..."}
  selected_variant TEXT CHECK (selected_variant IN ('casual', 'professional', 'direct')),
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  response_status TEXT CHECK (response_status IN ('pending', 'sent', 'responded', 'declined', 'no_response')),
  response_received_at TIMESTAMPTZ,
  
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_response_status ON messages(response_status);

-- RLS Policy
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own messages"
ON messages FOR ALL
USING (auth.uid() = user_id);

-- ==============================================
-- Function: update_updated_at_column
-- Purpose: Auto-update updated_at timestamp
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at_jobs
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_connections
BEFORE UPDATE ON connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_messages
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Key Points:**
- ✅ All tables have `user_id` with RLS policy
- ✅ All foreign keys have `ON DELETE CASCADE` (clean up orphaned records)
- ✅ All tables have indexes on `user_id` and `created_at`
- ✅ Constraints enforce data integrity (CHECK, UNIQUE)
- ✅ JSONB used for flexible data (message_variants, confidence_factors)

---

## ⚠️ Issue #3: No Error Handling Strategy

### Symptom
Architecture doc doesn't mention what happens when external services fail.

### Root Cause
Architect only designs the "happy path" and forgets failure modes.

### Solution Pattern

**FAILURE MODE ANALYSIS (Required Section):**

For EVERY external dependency:

```markdown
## Failure Mode Analysis

### Dependency: {Service Name}

**What can fail?**
- {Specific failure scenario}

**Likelihood:** {High/Medium/Low}

**Impact:** {Critical/High/Medium/Low}

**Mitigation Strategy:**
- Immediate: {What happens when failure occurs}
- Recovery: {How system recovers}
- Monitoring: {How we detect failures}

**Fallback:**
- {Alternative behavior if service unavailable}
```

### Complete Example

```markdown
## Failure Mode Analysis

### Dependency: LinkedIn API

**What can fail?**
- Rate limit exceeded (100 requests/hour for free tier)
- API timeout (>30 seconds)
- API downtime (scheduled maintenance or outage)
- Authentication revoked (user disconnects LinkedIn)

**Likelihood:** Medium (rate limits are common, outages are rare)

**Impact:** Critical (connection discovery is core feature)

**Mitigation Strategy:**
- **Immediate:** Display user-friendly error message "LinkedIn is temporarily unavailable. You can enter connection names manually or try again in 1 hour."
- **Recovery:** Implement exponential backoff (retry after 1min, 5min, 15min)
- **Monitoring:** Log all API errors to Sentry, alert if >10 failures in 1 hour

**Fallback:**
- Manual connection entry mode: User types connection names, roles manually
- Cached results: If we fetched connections for this job before, show cached data (with "Last updated: X hours ago" indicator)

---

### Dependency: Claude API (Anthropic)

**What can fail?**
- API timeout (>30 seconds for message generation)
- Rate limit exceeded (rare, but possible)
- Model unavailable (scheduled downtime)
- High latency (>10 seconds response time)

**Likelihood:** Low (Anthropic has 99.9% uptime)

**Impact:** Critical (message generation is core feature)

**Mitigation Strategy:**
- **Immediate:** Set 10-second timeout on all Claude API calls
- **Recovery:** If timeout, fallback to template messages
- **Monitoring:** Track response times in Vercel Analytics, alert if p95 >5s

**Fallback:**
- Template message system:
  ```
  Casual: "Hey {name}! I saw you're at {company} and I'm really interested in the {role} position. Would you be open to providing a referral or sharing insights about the role?"
  
  Professional: "Hi {name}, I hope this message finds you well. I noticed your position at {company} and wanted to reach out regarding the {role} opening. Would you be willing to provide a referral or connect me with the hiring team?"
  
  Direct: "{name} - I'm applying for {role} at {company}. Would you be open to referring me? Happy to provide my resume and any additional information needed."
  ```
- Cache all generated messages for 30 days (Upstash Redis), so regeneration is instant

---

### Dependency: Supabase (Database)

**What can fail?**
- Database downtime (Supabase SLA is 99.9% = ~45 minutes/month)
- Connection pool exhausted (>60 concurrent connections on free tier)
- Query timeout (>5 seconds for complex queries)

**Likelihood:** Low (Supabase is very reliable)

**Impact:** Critical (entire app depends on database)

**Mitigation Strategy:**
- **Immediate:** Display maintenance page "We're experiencing technical difficulties. Please try again in a few minutes."
- **Recovery:** Supabase auto-recovers, no action needed
- **Monitoring:** Use Supabase status page (status.supabase.com), subscribe to alerts

**Fallback:**
- Accept the risk (99.9% uptime is acceptable for MVP)
- No self-hosted fallback (too complex for solo dev)
- Communicate transparently: "Our database provider (Supabase) is experiencing downtime. We'll be back shortly."
```

---

## ⚠️ Issue #4: Ignoring Security Best Practices

### Symptom
No mention of RLS policies, API key management, or input validation.

### Root Cause
Security is treated as an afterthought, not designed into architecture.

### Solution Pattern

**SECURITY ARCHITECTURE (Required Section):**

```markdown
## Security Architecture

### 1. Authentication & Authorization

**Authentication Provider:** Clerk (managed service)
- Sign-up/login flows
- Session management (server-side cookies)
- Password reset, email verification

**Authorization Mechanism:** Supabase Row Level Security (RLS)
- ALL user data tables have RLS enabled
- Policy: `auth.uid() = user_id` enforced at database level
- Prevents User A from accessing User B's data

### 2. Data Protection

**At Rest:**
- Supabase PostgreSQL: AES-256 encryption (default)
- Vercel environment variables: Encrypted storage

**In Transit:**
- HTTPS only (TLS 1.3)
- HSTS headers enforced
- No HTTP fallback

**Secrets Management:**
- All API keys in Vercel environment variables
- Never commit secrets to Git (.env.local in .gitignore)
- Rotate API keys every 90 days

### 3. Input Validation

**All API Routes:**
- Zod schemas for request validation
- Sanitize user input (DOMPurify on frontend)
- Reject malformed requests with 400 status

**Example:**
```typescript
import { z } from 'zod';

const schema = z.object({
  job_url: z.string().url().startsWith('https://linkedin.com/jobs/'),
});

// In API route:
const validatedData = schema.parse(requestBody); // Throws if invalid
```

### 4. SQL Injection Prevention

**Supabase Client (Parameterized Queries):**
```typescript
// ✅ SAFE (parameterized)
const { data } = await supabase
  .from('jobs')
  .select()
  .eq('user_id', userId); // Supabase sanitizes this

// ❌ UNSAFE (string concatenation)
const { data } = await supabase
  .rpc('unsafe_query', { sql: `SELECT * FROM jobs WHERE user_id = '${userId}'` });
```

**Rule:** NEVER use raw SQL with user input. Always use Supabase client methods.

### 5. XSS Prevention

**React/Next.js Default Protection:**
- React escapes JSX content automatically
- Never use `dangerouslySetInnerHTML` with user input

**Additional Protection:**
- DOMPurify for rich text (if we add WYSIWYG editor)
- Content Security Policy (CSP) headers in next.config.js

### 6. CSRF Protection

**Next.js Built-In:**
- Server Actions have CSRF tokens by default
- Clerk has CSRF protection

**No additional work needed** (framework handles it).

### 7. Rate Limiting (Optional for MVP)

**If we add:**
- Upstash Rate Limit (serverless rate limiting)
- Limit: 100 requests/hour per user for LLM API calls
- Limit: 1000 requests/hour per user for database queries

### 8. Data Retention & Privacy

**GDPR Compliance:**
- User data export: Supabase provides all data as JSON
- User data deletion: CASCADE deletes remove all associated records
- Privacy policy: Disclose data collection (user profile, job URLs, messages)

**Data Retention:**
- Jobs: Delete after 90 days of inactivity (scheduled job via Trigger.dev)
- Messages: Keep forever (user might reference old messages)
- Connections: Delete when parent job is deleted (CASCADE)
```

---

## 📋 Pre-Flight Checklist

Before generating architecture document, verify:

- [ ] **Database schema:** ≤5 tables for MVP (avoid over-engineering)
- [ ] **RLS policies:** Every user data table has RLS enabled
- [ ] **Indexes:** Foreign keys, user_id, created_at all indexed
- [ ] **Foreign keys:** All have ON DELETE CASCADE or SET NULL
- [ ] **Failure modes:** Documented for LinkedIn API, Claude API, Supabase
- [ ] **Security:** Input validation, secrets management, data encryption
- [ ] **Monitoring:** Sentry (errors), PostHog (analytics), Vercel (performance)

---

## 🚀 Output Template

Use this structure for Architecture documents:

```markdown
# Technical Architecture - [Product Name]

## 1. System Overview
- High-level architecture diagram (ASCII or Mermaid)
- Technology stack (Next.js, Supabase, Clerk, etc.)
- Deployment architecture (Vercel, Supabase Cloud)

## 2. Database Schema
- All tables with columns, types, constraints
- Indexes on foreign keys, user_id, created_at
- RLS policies (one per table)
- Relationships diagram

## 3. API Design
- All API routes with request/response schemas
- Authentication & authorization patterns
- Error handling strategy
- Rate limiting (if applicable)

## 4. External Integrations
- LinkedIn API (connection discovery)
- Claude API (message generation)
- Clerk/Supabase Auth (authentication)
- For each: authentication, rate limits, error handling

## 5. Failure Mode Analysis
- For each external dependency: failure scenarios, mitigations, fallbacks

## 6. Security Architecture
- Authentication & authorization
- Data protection (at rest, in transit)
- Input validation
- SQL injection & XSS prevention
- Secrets management

## 7. Performance Optimization
- Caching strategy (Upstash Redis for LLM responses)
- Database query optimization (indexes, connection pooling)
- CDN strategy (Vercel Edge Network)

## 8. Monitoring & Observability
- Error tracking (Sentry)
- Analytics (PostHog)
- Performance monitoring (Vercel Analytics)
- Alerting thresholds

## 9. Deployment & DevOps
- CI/CD pipeline (GitHub Actions → Vercel)
- Environment management (dev, staging, production)
- Database migrations (Supabase CLI)
```

---

**Remember:** Simple, Supabase-first architecture wins. Avoid premature optimization. You can always add complexity later when you hit actual bottlenecks.