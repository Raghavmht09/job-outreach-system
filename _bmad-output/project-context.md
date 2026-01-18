---
project_name: 'job-outreach-system'
user_name: 'Raghav'
date: '2026-01-02'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
existing_patterns_found: 14
status: 'complete'
completedAt: '2026-01-02'
rule_count: 155
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Core Framework & Language:**
- **Next.js 16.1.1** - App Router, Server Components, Streaming SSR
- **React 19.2.3** - Latest with React Compiler support
- **TypeScript 5.x** - Strict mode enabled (`strict: true` in tsconfig.json)

**State & Data Management:**
- **TanStack Query v5.90.16** - Server state, caching, mutations, optimistic updates
- **Supabase JS Client v2.89.0** - Postgres database, Auth (bypassed for MVP), Storage, RLS
- **Axios v1.13.2** - HTTP client for external APIs

**Styling & UI:**
- **Tailwind CSS v4** - With @tailwindcss/postcss (latest)
- **shadcn/ui** - Copy-paste components (NOT npm package)
- **Class Variance Authority v0.7.1** - Component variant management
- **Lucide React v0.562.0** - Icon library
- **tailwind-merge v3.4.0** - Merge Tailwind classes safely

**Additional Key Dependencies:**
- **React Hook Form v7.69.0** - Form validation (from architecture)
- **Zod** - Schema validation (from architecture)
- **Puppeteer + @sparticuz/chromium** - PDF generation for Vercel (from architecture)
- **pdf-parse** - PDF text extraction (from architecture)

**Critical Version Notes:**
- TanStack Query v5.x has breaking changes from v4 - always use `queryKey` arrays
- React 19.x requires Next.js 15+ for compatibility
- Tailwind v4 is CSS-first, different from v3 config patterns
- @sparticuz/chromium is required for Puppeteer on Vercel (standard chromium won't work)

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**TypeScript Configuration Requirements:**
- ✅ **Strict mode is ENABLED** - No implicit any, strictNullChecks, strictFunctionTypes all enforced
- ✅ **Path aliases** - Use `@/*` for imports from project root (e.g., `import { Button } from '@/components/ui/button'`)
- ✅ **Type imports** - Use `import type` for type-only imports (e.g., `import type { Metadata } from 'next'`)
- ❌ **NEVER use `any`** - Use `unknown` if type is truly unknown, then narrow with type guards

**Import/Export Patterns:**
- ✅ **Named exports for utilities** - `export function withRetry() { ... }`
- ✅ **Default exports for components** - `export default function HomePage() { ... }`
- ✅ **Group imports logically** - React/Next → Third-party → Local (@/*) → Relative (./)
- ✅ **Barrel exports for components** - Use `index.ts` to re-export from `/components/ui/`

**Naming Conventions (CRITICAL - From Architecture):**
- ✅ **Database fields: snake_case** - `user_id`, `created_at`, `job_description`
- ✅ **TypeScript/JSON: camelCase** - `userId`, `createdAt`, `jobDescription`
- ✅ **Supabase transforms automatically** - DB snake_case → JS camelCase via client
- ✅ **Components: PascalCase** - `UserCard.tsx`, `MessageGenerator.tsx`
- ✅ **Utilities: kebab-case** - `error-handler.ts`, `retry-logic.ts`
- ✅ **Constants: UPPER_SNAKE_CASE** - `const MAX_FILE_SIZE = 5 * 1024 * 1024`

**Error Handling Patterns (MANDATORY - From Architecture):**
- ✅ **All API routes MUST return** `APIResponse<T>` wrapper:
  ```typescript
  type APIResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; fallback?: T }
  ```
- ✅ **All external API calls MUST use** `withRetry()` utility:
  ```typescript
  const result = await withRetry(
    () => claudeAPI.generate(prompt),
    3, // maxRetries
    15000 // timeoutMs
  )
  ```
- ✅ **User-facing error messages** - NEVER expose stack traces, always friendly messages
- ✅ **ISO 8601 date strings** - Always use `toISOString()`, NEVER timestamps

**Type Safety Rules:**
- ✅ **Use Zod schemas for validation** - All form inputs and API payloads
- ✅ **Infer types from Zod** - `type FormData = z.infer<typeof formSchema>`
- ✅ **Readonly props for components** - `type Props = Readonly<{ userId: string }>`
- ✅ **Discriminated unions for state** - Use `{ status: 'loading' | 'success' | 'error', ... }`

### Framework-Specific Rules (Next.js 16 + React 19)

**Next.js App Router Patterns (CRITICAL):**
- ✅ **Server Components by default** - All components in `/app` are Server Components unless `'use client'` directive
- ✅ **Client Components need directive** - Add `'use client'` at TOP of file for hooks, event handlers, browser APIs
- ✅ **Data fetching in Server Components** - Use `async/await` directly in components, NOT useEffect
- ✅ **API routes in `/app/api/`** - Use `route.ts` files with named exports (GET, POST, etc.)
- ❌ **NEVER fetch in useEffect on server** - Server Components can't use hooks
- ❌ **NEVER import client-only code in server** - Will break at build time

**React 19 Patterns:**
- ✅ **Use React Compiler features** - No manual memoization needed (useMemo/useCallback)
- ✅ **Server Actions** - Can use for mutations, but prefer API routes for this project (per architecture)
- ✅ **Suspense boundaries** - Wrap async Server Components in `<Suspense fallback={...}>`
- ✅ **Error boundaries** - Use `error.tsx` files for route segment error handling

**Component Structure (MANDATORY):**
- ✅ **Props type first** - Define props interface/type before component
- ✅ **Readonly props** - Always use `Readonly<{ ... }>` for component props
- ✅ **Explicit return types** - Server Components return `JSX.Element`, Client return `ReactElement`
- ✅ **Component file organization**:
  ```typescript
  'use client' // if needed
  
  import type { ... } from 'next' // type imports first
  import { ... } from 'react' // React imports
  import { ... } from '@/components/...' // local imports
  
  type Props = Readonly<{ ... }> // props type
  
  export default function Component({ ... }: Props) { // component
    // implementation
  }
  ```

**State Management (From Architecture):**
- ✅ **TanStack Query for server state** - ALL API data fetching
- ✅ **React Context for UI state** - Sidebar open/closed, current step, theme
- ❌ **NEVER use useState for server data** - Always use TanStack Query
- ✅ **Query keys as arrays** - `['job-applications', userId]` NOT `'job-applications'`
- ✅ **Mutations invalidate queries** - Always call `queryClient.invalidateQueries()` after mutations

**Performance Rules:**
- ✅ **Dynamic imports for heavy components** - Use `next/dynamic` for charts, editors, etc.
- ✅ **Image optimization** - Always use `next/image`, NEVER `<img>` tags
- ✅ **Font optimization** - Use `next/font` (already configured with Geist fonts)
- ✅ **Streaming with Suspense** - Wrap slow components in Suspense for better UX
- ❌ **NEVER block rendering** - Use Suspense boundaries instead of loading entire page

**Routing & Navigation:**
- ✅ **Use `next/link` for navigation** - Server-side navigation, automatic prefetching
- ✅ **Use `useRouter` from `next/navigation`** - NOT `next/router` (old Pages Router)
- ✅ **Route handlers return Response** - Use `NextResponse.json()` for API routes
- ✅ **Middleware runs on Edge** - Keep middleware.ts lightweight (auth bypass for MVP)

### Testing Rules

**Test Organization (From Architecture):**
- ✅ **Tests in `/__tests__/` directory** - NOT co-located with source files
- ✅ **Mirror source structure** - `/__tests__/components/ui/Button.test.tsx` mirrors `/components/ui/Button.tsx`
- ✅ **Test file naming** - Use `.test.tsx` or `.test.ts` suffix (e.g., `MessageGenerator.test.tsx`)
- ✅ **Setup files in `/__tests__/setup/`** - Mock data, test utilities, global setup

**Testing Framework (To Be Configured):**
- ✅ **Vitest recommended** - Fast, Vite-powered, works well with Next.js 15+
- ✅ **React Testing Library** - For component testing (user-centric tests)
- ✅ **MSW (Mock Service Worker)** - For mocking API calls in tests
- ✅ **Playwright** - For E2E tests (P1 - post-MVP)

**Test Coverage Requirements:**
- ✅ **API routes: 100% coverage** - All routes must have tests (error cases, success cases, edge cases)
- ✅ **Utilities: 100% coverage** - Pure functions like `withRetry()`, `company-extractor.ts`
- ✅ **Components: Focus on behavior** - Not implementation details, test user interactions
- ✅ **Integration tests for workflows** - Full resume optimization flow, contact search flow

**Component Testing Patterns:**
- ✅ **Test user behavior, not implementation** - Click buttons, fill forms, see results
- ✅ **Use testing-library queries** - `getByRole`, `getByLabelText` over `getByTestId`
- ✅ **Mock Supabase client** - Use MSW to mock database queries
- ✅ **Mock TanStack Query** - Use `QueryClientProvider` with test query client
- ❌ **NEVER test internal state** - Test what user sees, not component internals

**API Route Testing Patterns:**
- ✅ **Test all response formats** - Success with data, error with message, fallback scenarios
- ✅ **Test retry logic** - Verify `withRetry()` is called, handles failures correctly
- ✅ **Test validation** - Invalid inputs return proper error messages
- ✅ **Test external API mocking** - Mock Claude API, Google API, Puppeteer
- ✅ **Test database operations** - Use test database or mock Supabase client

**Integration Testing (P0 - Critical Path):**
- ✅ **Resume optimization flow** - Upload → Parse → Optimize → Download PDF
- ✅ **Contact search flow** - Job input → Extract company → Search contacts → Display results
- ✅ **Message generation flow** - Select contact → Generate message → Copy to clipboard
- ✅ **Error handling flows** - API failures, quota exceeded, validation errors

**Test Data & Mocks:**
- ✅ **Fixture files in `/__tests__/fixtures/`** - Sample resumes, job descriptions, API responses
- ✅ **Factory functions** - Create test data with `createMockUser()`, `createMockJob()`
- ✅ **Consistent test IDs** - Use UUIDs like `'test-user-123'` for predictable tests
- ❌ **NEVER use production data** - Always synthetic test data

**Performance Testing (P1 - Post-MVP):**
- ✅ **API latency targets** - Ensure routes respond <500ms (p95)
- ✅ **Claude API timeout** - Verify 15s timeout works correctly
- ✅ **Cache hit rate** - Test that Google X-Ray cache returns cached results

### Code Quality & Style Rules

**Tailwind CSS v4 Patterns (CRITICAL - Different from v3):**
- ✅ **Use `@tailwindcss/postcss` plugin** - NOT traditional tailwind.config.js
- ✅ **CSS-first configuration** - Define custom styles in CSS files, not JS config
- ✅ **Class organization** - Group by layout → spacing → typography → colors → effects
- ✅ **Responsive design** - Mobile-first, use `sm:`, `md:`, `lg:`, `xl:` prefixes
- ✅ **Dark mode support** - Use `dark:` prefix (already configured in layout)
- ✅ **Use `cn()` helper** - For conditional classes (from `tailwind-merge`):
  ```typescript
  import { cn } from '@/lib/utils'
  <div className={cn('base-class', condition && 'conditional-class')} />
  ```

**Component Styling Patterns:**
- ✅ **shadcn/ui for base components** - Button, Input, Card, etc. (copy-paste, not npm)
- ✅ **Use CVA for variants** - Define component variants with Class Variance Authority:
  ```typescript
  const buttonVariants = cva('base-classes', {
    variants: {
      variant: { default: '...', outline: '...' },
      size: { sm: '...', md: '...', lg: '...' }
    }
  })
  ```
- ✅ **Lucide React for icons** - Consistent icon library, tree-shakeable
- ❌ **NEVER use inline styles** - Always use Tailwind classes
- ❌ **NEVER mix CSS modules with Tailwind** - Tailwind only for this project

**File Organization Rules:**
- ✅ **Components in `/components/`** - Organized by type (ui, forms, features, layout)
- ✅ **Utilities in `/lib/utils/`** - Helper functions like `error-handler.ts`, `retry-logic.ts`
- ✅ **API wrappers in `/lib/api/`** - External API clients (Claude, Google, Supabase)
- ✅ **Types in `/types/`** - Shared TypeScript types (database types, API types)
- ✅ **One component per file** - No multiple components in single file
- ✅ **Index files for barrel exports** - `/components/ui/index.ts` re-exports all UI components

**Naming Standards (Already documented, reinforced here):**
- ✅ **Database: snake_case** - `user_id`, `created_at`
- ✅ **TypeScript: camelCase** - `userId`, `createdAt`
- ✅ **Components: PascalCase** - `UserCard.tsx`, `MessageGenerator.tsx`
- ✅ **Files (non-components): kebab-case** - `error-handler.ts`, `retry-logic.ts`
- ✅ **Constants: UPPER_SNAKE_CASE** - `MAX_FILE_SIZE`, `API_TIMEOUT_MS`

**Documentation & Comments:**
- ✅ **JSDoc for public APIs** - Document all exported functions, especially utilities
- ✅ **Inline comments for complex logic** - Explain WHY, not WHAT
- ✅ **Type-only files need brief header** - Explain purpose of type definitions
- ❌ **NEVER over-comment** - Code should be self-explanatory, only add comments when truly needed
- ✅ **TODO comments format** - `// TODO(username): Description of what needs to be done`

**ESLint & Code Quality:**
- ✅ **Use Next.js ESLint config** - Already configured (`eslint-config-next`)
- ✅ **Fix linting errors before commit** - Run `npm run lint` before committing
- ✅ **No unused variables** - ESLint will catch, remove or prefix with `_` if intentionally unused
- ✅ **No console.log in production** - Use proper logging (can use console in dev, but remove for prod)
- ❌ **NEVER disable ESLint rules** - Unless absolutely necessary, and document why

**Code Formatting:**
- ✅ **Consistent indentation** - 2 spaces (TypeScript standard)
- ✅ **Single quotes for strings** - Except when template literals needed
- ✅ **Trailing commas** - In multiline objects, arrays (helps with git diffs)
- ✅ **Max line length: 100 chars** - Break long lines for readability
- ✅ **Semicolons required** - TypeScript convention

### Development Workflow Rules

**Git & Branch Management:**
- ✅ **Main branch: `main`** - Protected branch, all changes via PR
- ✅ **Branch naming convention** - `feature/description`, `fix/bug-name`, `refactor/area`
- ✅ **Keep branches focused** - One feature/fix per branch
- ✅ **Delete branches after merge** - Keep repository clean
- ❌ **NEVER commit directly to main** - Always use pull requests

**Commit Message Format:**
- ✅ **Use conventional commits** - `type(scope): description`
- ✅ **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- ✅ **Examples**:
  - `feat(resume): add PDF upload support`
  - `fix(contacts): handle Google API quota exceeded`
  - `refactor(api): extract retry logic to utility`
  - `test(message): add integration tests for generation flow`
- ✅ **Keep first line under 72 characters** - Git best practice
- ✅ **Add body for complex changes** - Explain WHY, not WHAT

**Pre-Commit Checklist:**
- ✅ **Run linter** - `npm run lint` in frontend directory
- ✅ **Fix all linting errors** - Zero warnings in production
- ✅ **Run tests** - Ensure all tests pass (when test suite exists)
- ✅ **Review changes** - `git diff --staged` before committing
- ✅ **No secrets in commits** - Never commit API keys, `.env` files

**Pull Request Requirements:**
- ✅ **Descriptive PR title** - Follow conventional commit format
- ✅ **PR description includes**:
  - Summary of changes (1-3 bullet points)
  - Link to related issue/story (if applicable)
  - Test plan (how to verify changes)
  - Screenshots (for UI changes)
- ✅ **Self-review code** - Check your own PR before requesting review
- ✅ **Address all comments** - Resolve or respond to all review feedback
- ✅ **Squash commits on merge** - Keep main branch history clean

**Environment Variables (CRITICAL - Security):**
- ✅ **Use `.env.local` for local dev** - NEVER commit this file
- ✅ **Use Vercel env vars for production** - Set in Vercel dashboard
- ✅ **Required env vars (from architecture)**:
  - `STUB_USER_ID` - For MVP auth bypass
  - `ANTHROPIC_API_KEY` - Claude API key
  - `GOOGLE_CSE_API_KEY` - Google Custom Search API key
  - `GOOGLE_CSE_ID` - Google Custom Search Engine ID
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- ❌ **NEVER prefix server secrets with `NEXT_PUBLIC_`** - Exposes to client
- ✅ **Validate required env vars at startup** - Fail fast if missing

**Deployment Patterns (Vercel):**
- ✅ **Preview deployments for PRs** - Automatic on every PR
- ✅ **Production deployment on merge** - Automatic when merged to main
- ✅ **Review preview before merging** - Test in preview environment first
- ✅ **Monitor deployment logs** - Check Vercel dashboard for errors
- ✅ **Rollback if needed** - Vercel supports instant rollbacks

**Local Development Setup:**
- ✅ **Run frontend dev server** - `cd frontend && npm run dev`
- ✅ **Start Supabase locally (optional)** - `npx supabase start` (if using local DB)
- ✅ **Use stub user for MVP** - Set `STUB_USER_ID` in `.env.local`
- ✅ **Hot reload enabled** - Next.js watches for file changes automatically

**Database Migrations (Supabase):**
- ✅ **Migrations in `/supabase/migrations/`** - SQL files with timestamps
- ✅ **Test migrations locally first** - `npx supabase db reset`
- ✅ **Apply to production via Supabase dashboard** - Or use CLI with caution
- ✅ **Never edit migration files after applied** - Create new migration instead
- ❌ **NEVER run raw SQL in production** - Always use migrations

### Critical Don't-Miss Rules

**Anti-Patterns to AVOID (Architecture-Specific):**

❌ **NEVER use custom fetch in components** - ALWAYS use TanStack Query
```typescript
// ❌ WRONG - Manual fetch
const [data, setData] = useState(null)
useEffect(() => {
  fetch('/api/contacts').then(res => setData(res.json()))
}, [])

// ✅ CORRECT - TanStack Query
const { data } = useQuery({
  queryKey: ['contacts'],
  queryFn: async () => {
    const res = await fetch('/api/contacts')
    return res.json()
  }
})
```

❌ **NEVER access Supabase from Client Components without RLS** - Always verify RLS policies
```typescript
// ❌ WRONG - Direct query from client (vulnerable if RLS missing)
const { data } = await supabase.from('resumes').select('*')

// ✅ CORRECT - Use API route OR ensure RLS policy exists
// In API route:
const { data } = await supabase
  .from('resumes')
  .select('*')
  .eq('user_id', userId) // Explicit filter + RLS
```

❌ **NEVER call external APIs without retry logic** - Use `withRetry()` utility
```typescript
// ❌ WRONG - Direct API call
const response = await fetch('https://api.anthropic.com/...')

// ✅ CORRECT - With retry and timeout
const response = await withRetry(
  () => fetch('https://api.anthropic.com/...'),
  3, // retries
  15000 // 15s timeout
)
```

❌ **NEVER return raw errors to client** - Use APIResponse<T> wrapper
```typescript
// ❌ WRONG - Exposes internal errors
return NextResponse.json({ error: error.stack })

// ✅ CORRECT - User-friendly message + fallback
return NextResponse.json({
  success: false,
  error: 'Failed to generate message. Please try again.',
  fallback: { messageText: templateMessage }
})
```

**Edge Cases & Data Validation:**

⚠️ **Company name extraction can fail** - Always provide fallback UI
```typescript
// Job URL parsing might return null
const companyName = extractCompanyFromJobUrl(jobUrl)
if (!companyName) {
  return (
    <Input
      label="Company Name"
      placeholder="Enter company name manually"
      required
    />
  )
}
```

⚠️ **Google API quota (100/day) WILL be exceeded** - Check cache first
```typescript
// ALWAYS check cache before calling Google API
const cached = await supabase
  .from('linkedin_search_cache')
  .select('*')
  .eq('company_name', companyName)
  .single()

if (cached && !isExpired(cached.expires_at)) {
  return cached.results // Return cached data
}

// Only call Google if cache miss
const results = await googleCustomSearch(companyName)
```

⚠️ **Claude API can timeout (15s limit)** - Show fallback template
```typescript
try {
  const message = await withRetry(() => claude.generate(...), 3, 15000)
} catch (error) {
  // Timeout or failure - use template
  return {
    success: false,
    error: 'AI generation timed out',
    fallback: {
      messageText: `Hi ${contactName}, I'm applying for ${jobTitle} at ${company}...`
    }
  }
}
```

⚠️ **File uploads can be malicious** - Validate MIME type and size
```typescript
// ALWAYS validate before processing
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type. Only PDF and DOCX allowed.')
}
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large. Maximum 5MB.')
}
```

**Security Rules (CRITICAL):**

🔒 **NEVER expose API keys to client** - Check environment variable prefixes
```typescript
// ❌ WRONG - Exposed to client bundle
const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

// ✅ CORRECT - Server-only
const apiKey = process.env.ANTHROPIC_API_KEY // No NEXT_PUBLIC_ prefix
```

🔒 **ALWAYS use Row Level Security (RLS)** - Every table except caches
```sql
-- ✅ CORRECT - RLS policy on resumes table
CREATE POLICY "Users can only access own resumes"
ON resumes FOR ALL
USING (auth.uid() = user_id);

-- ⚠️ EXCEPTION - linkedin_search_cache is shared (no RLS)
-- But still safe because no user_id column
```

🔒 **NEVER trust user input** - Sanitize and validate everything
```typescript
// Use Zod for all form inputs
const formSchema = z.object({
  jobUrl: z.string().url().or(z.literal('')), // Allow empty for PDF upload
  jobDescription: z.string().max(10000), // Prevent DOS with huge inputs
  companyName: z.string().max(100).optional()
})
```

🔒 **MVP uses stub user - REMOVE before production** - Security reminder
```typescript
// middleware.ts - FOR MVP ONLY
if (process.env.STUB_USER_ID) {
  // ⚠️ TODO: REMOVE THIS BEFORE PRODUCTION
  // This bypasses authentication for internal testing
  return NextResponse.next()
}
```

**Performance Gotchas:**

⚡ **Puppeteer PDF generation is SLOW (5-10s)** - Show loading state
```typescript
// ALWAYS use Suspense or loading skeleton
<Suspense fallback={<Skeleton className="h-96" />}>
  <ResumePreview />
</Suspense>
```

⚡ **@sparticuz/chromium is 50MB** - Use dynamic import
```typescript
// ❌ WRONG - Bundles chromium in every route
import chromium from '@sparticuz/chromium'

// ✅ CORRECT - Dynamic import only when needed
const chromium = await import('@sparticuz/chromium')
```

⚡ **TanStack Query caches forever by default** - Set staleTime
```typescript
// ❌ WRONG - Data never refetches
useQuery({ queryKey: ['jobs'], queryFn: fetchJobs })

// ✅ CORRECT - Refetch after 5 minutes
useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
  staleTime: 5 * 60 * 1000 // 5 minutes
})
```

⚡ **Server Components can't use hooks** - Add 'use client' when needed
```typescript
// ❌ WRONG - useState in Server Component
export default function Dashboard() {
  const [open, setOpen] = useState(false) // ERROR!
}

// ✅ CORRECT - Mark as Client Component
'use client'
export default function Dashboard() {
  const [open, setOpen] = useState(false) // Works!
}
```

**Common Mistakes (Learn from these!):**

🐛 **Supabase auto-transforms snake_case → camelCase** - Don't manually convert
```typescript
// ❌ WRONG - Double conversion
const { data } = await supabase.from('job_applications').select('*')
const jobs = data.map(job => ({
  userId: job.user_id, // Already converted by Supabase!
  createdAt: job.created_at
}))

// ✅ CORRECT - Already camelCase
const { data: jobs } = await supabase.from('job_applications').select('*')
console.log(jobs[0].userId) // Works directly
```

🐛 **Date serialization breaks across Server/Client boundary** - Use ISO strings
```typescript
// ❌ WRONG - Date object doesn't serialize
return { createdAt: new Date() }

// ✅ CORRECT - ISO 8601 string
return { createdAt: new Date().toISOString() }
```

🐛 **Vercel serverless functions have 250MB limit** - Keep bundles small
```typescript
// Check bundle size after adding dependencies
// If API route exceeds 250MB, split into multiple routes
```

🐛 **Google X-Ray results can be stale (90+ days)** - Show freshness warning
```typescript
// Always show when cached data was indexed
if (daysSinceIndexed > 60) {
  return (
    <Alert variant="warning">
      ⚠️ This profile may be outdated (last indexed {daysSinceIndexed} days ago).
      Verify on LinkedIn before reaching out.
    </Alert>
  )
}
```

---

## Usage Guidelines

**For AI Agents:**

- ✅ **Read this file before implementing any code** - This contains critical project-specific patterns
- ✅ **Follow ALL rules exactly as documented** - These prevent common mistakes and ensure consistency
- ✅ **When in doubt, prefer the more restrictive option** - Better to be safe with validation and security
- ✅ **Reference this file during implementation** - Use it as a checklist for code reviews

**For Humans:**

- 📝 **Keep this file lean and focused on agent needs** - Only include rules that AI agents might miss
- 🔄 **Update when technology stack changes** - New versions, new dependencies, new patterns
- 📅 **Review quarterly for outdated rules** - Remove rules that have become obvious or no longer apply
- ✂️ **Remove rules that become obvious over time** - Keep the file optimized for LLM context efficiency

**Maintenance:**
- Last Updated: 2026-01-02
- Review Frequency: Quarterly or when major architectural changes occur
- Update Trigger: New technology versions, new patterns emerge, team feedback

---

_This project context file ensures consistent, high-quality implementation across all AI agents working on the job-outreach-system._
