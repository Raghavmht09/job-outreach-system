# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**Critical Conflict Points Identified:** 8 areas where AI agents could make different implementation choices

This section defines mandatory patterns that ALL AI agents must follow when implementing features. These patterns prevent conflicts and ensure code works together seamlessly.

---

## Naming Patterns

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

## Structure Patterns

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

## Format Patterns

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

## Communication Patterns

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

## Process Patterns

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

## Enforcement Guidelines

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

## Pattern Examples

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
