# B-MAD Dev Agent - Guidelines & Common Issues

**Agent:** Developer (Dev)
**Purpose:** Implement features with proper TypeScript types, error handling, RLS verification, and testing
**Load this at:** Start of feature implementation in Cursor

---

## 🎯 Core Development Principles

**CRITICAL: Code Quality Standards**

- **TypeScript Strict Mode:** No `any` types, all functions have return types
- **Error Handling:** Every async operation wrapped in try-catch
- **Input Validation:** Zod schemas on all API routes
- **RLS Verification:** Test that User A cannot see User B's data
- **Loading States:** Skeleton loaders, not just spinners

---

## ⚠️ Issue #1: Missing TypeScript Types

### Symptom
Code uses `any` type everywhere, runtime errors from type mismatches.

### Root Cause
Dev skips type definitions to move faster.

### Solution Pattern

**Step 1: Enable TypeScript Strict Mode**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Step 2: Generate Supabase Types**

```bash
# Run this ONCE after creating database schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

**Step 3: Use Generated Types**

```typescript
// types/supabase.ts (auto-generated, DO NOT EDIT)
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          user_id: string;
          job_url: string;
          company_name: string | null;
          job_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_url: string;
          company_name?: string | null;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_url?: string;
          company_name?: string | null;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// In your code (types/index.ts)
import { Database } from './supabase';

export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];
```

**Step 4: Use Types in Components**

```typescript
// ❌ BAD: No types
async function getJobs(userId) {
  const jobs = await supabase.from('jobs').select().eq('user_id', userId);
  return jobs;
}

// ✅ GOOD: Typed
import { Job } from '@/types';

async function getJobs(userId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select()
    .eq('user_id', userId);
  
  if (error) throw error;
  return data ?? [];
}
```

---

## ⚠️ Issue #2: No Error Handling in API Routes

### Symptom
API routes crash on errors, return 200 OK even when operation fails, expose internal errors to users.

### Root Cause
Dev doesn't wrap async operations in try-catch, doesn't check for errors from Supabase/external APIs.

### Solution Pattern

**API Route Template (Copy This):**

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 1. Define input validation schema
const requestSchema = z.object({
  job_url: z.string().url().startsWith('https://linkedin.com/jobs/'),
  // Add more fields as needed
});

export async function POST(request: NextRequest) {
  try {
    // 2. Parse request body
    const body = await request.json();
    
    // 3. Validate input
    const validatedData = requestSchema.parse(body);
    
    // 4. Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 5. Business logic (database operations)
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        job_url: validatedData.job_url,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }
    
    // 6. Return success response
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    // 7. Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    // 8. Handle unexpected errors
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET route example
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('jobs')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- ✅ Input validation with Zod (reject malformed requests)
- ✅ Authentication check (reject unauthenticated requests)
- ✅ Error handling for Supabase operations
- ✅ Proper HTTP status codes (200, 201, 400, 401, 500)
- ✅ User-friendly error messages (not internal stack traces)
- ✅ Logging for debugging (console.error)

---

## ⚠️ Issue #3: Forgetting RLS (Row Level Security)

### Symptom
User A can see User B's data, massive security breach.

### Root Cause
Dev forgets to enable RLS or test RLS policies.

### Solution Pattern

**Step 1: Verify RLS is Enabled (SQL Query)**

```sql
-- Run this in Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Expected output:
-- tablename | rowsecurity
-- jobs      | t (true)
-- connections | t (true)
-- messages  | t (true)

-- If rowsecurity = 'f' (false), enable it:
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
```

**Step 2: Create RLS Policies**

```sql
-- Policy template for user-owned data
CREATE POLICY "Users can only access their own {table_name}"
ON {table_name}
FOR ALL
USING (auth.uid() = user_id);

-- Example: jobs table
CREATE POLICY "Users can only access their own jobs"
ON jobs
FOR ALL
USING (auth.uid() = user_id);

-- Example: connections table
CREATE POLICY "Users can only access their own connections"
ON connections
FOR ALL
USING (auth.uid() = user_id);
```

**Step 3: Test RLS Policies (TypeScript Test)**

```typescript
// __tests__/rls.test.ts
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('User A cannot see User B data', async () => {
    // Create two test users
    const userA = await signUpTestUser('usera@test.com', 'password123');
    const userB = await signUpTestUser('userb@test.com', 'password456');
    
    // User B creates a job
    const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userB.access_token}` } }
    });
    
    const { data: jobB } = await supabaseB
      .from('jobs')
      .insert({ job_url: 'https://linkedin.com/jobs/view/123' })
      .select()
      .single();
    
    // User A tries to query User B's job
    const supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userA.access_token}` } }
    });
    
    const { data: jobs } = await supabaseA
      .from('jobs')
      .select()
      .eq('id', jobB.id); // Try to access User B's job by ID
    
    // CRITICAL: Should return EMPTY array (RLS blocks access)
    expect(jobs).toEqual([]);
  });
});
```

**If test fails:**
1. Check RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'jobs';`
2. Check policy exists: `SELECT * FROM pg_policies WHERE tablename = 'jobs';`
3. Verify policy uses `auth.uid() = user_id`

---

## ⚠️ Issue #4: Supabase Client Confusion (Server vs Client)

### Symptom
`JWTExpired` errors, auth not working, can't access user data.

### Root Cause
Using wrong Supabase client (client-side client in server components, or vice versa).

### Solution Pattern

**Rule: Server Components → Server Client, Client Components → Client Client**

**Setup: Create Both Clients**

```typescript
// lib/supabase/server.ts (for Server Components & API Routes)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// lib/supabase/client.ts (for Client Components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Usage: Server Component**

```typescript
// app/jobs/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';

export default async function JobsPage() {
  const supabase = createClient(); // ← Server client
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select();
  
  return (
    <div>
      {jobs?.map(job => (
        <div key={job.id}>{job.job_title}</div>
      ))}
    </div>
  );
}
```

**Usage: Client Component**

```typescript
// components/AddJobButton.tsx (Client Component)
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AddJobButton() {
  const supabase = createClient(); // ← Client-side client
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .insert({ job_url: 'https://linkedin.com/jobs/view/123' });
    setLoading(false);
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add Job'}
    </button>
  );
}
```

**Usage: API Route**

```typescript
// app/api/jobs/route.ts (API Route)
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient(); // ← Server client
  
  const { data, error } = await supabase
    .from('jobs')
    .insert({ job_url: '...' });
  
  return Response.json(data);
}
```

---

## ⚠️ Issue #5: Missing Loading & Error States

### Symptom
UI shows blank screen while data loads, crashes on errors.

### Root Cause
Dev only implements "happy path" (data loads successfully).

### Solution Pattern

**Complete Component Template**

```typescript
// app/jobs/page.tsx
import { createClient } from '@/lib/supabase/server';
import { JobCard } from '@/components/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default async function JobsPage() {
  const supabase = createClient();
  
  // Fetch data
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select()
    .order('created_at', { ascending: false });
  
  // ERROR STATE: Show user-friendly error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load jobs. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  // EMPTY STATE: No jobs yet
  if (!jobs || jobs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">No jobs yet</h2>
        <p className="text-muted-foreground mb-4">
          Paste a LinkedIn job URL to get started
        </p>
        <Button>Add Your First Job</Button>
      </div>
    );
  }
  
  // SUCCESS STATE: Display jobs
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Jobs</h1>
      <div className="grid gap-4">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

// LOADING STATE: Separate loading.tsx file
// app/jobs/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Skeleton className="h-10 w-48 mb-6" /> {/* Title skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" /> {/* Card skeleton */}
        ))}
      </div>
    </div>
  );
}
```

**For Client Components (with useState)**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('jobs')
          .select();
        
        if (error) throw error;
        setJobs(data ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);
  
  // LOADING STATE
  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }
  
  // ERROR STATE
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // EMPTY STATE
  if (jobs.length === 0) {
    return <p>No jobs found.</p>;
  }
  
  // SUCCESS STATE
  return (
    <div className="grid gap-4">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

---

## 📋 Pre-Flight Checklist

Before committing code, verify:

- [ ] **TypeScript:** No `any` types, strict mode enabled
- [ ] **Error handling:** All async ops wrapped in try-catch
- [ ] **Input validation:** Zod schemas on API routes
- [ ] **RLS test:** User A cannot see User B's data
- [ ] **Loading states:** Skeleton loaders implemented
- [ ] **Error states:** User-friendly error messages
- [ ] **Empty states:** Helpful text + CTA
- [ ] **Mobile responsive:** Test on 375px width
- [ ] **Accessibility:** ARIA labels, keyboard navigation

---

## 🚀 Quick Reference

### Common Patterns

**Fetch data in Server Component:**
```typescript
const supabase = createClient();
const { data, error } = await supabase.from('table').select();
```

**Fetch data in Client Component:**
```typescript
const [data, setData] = useState([]);
useEffect(() => {
  const supabase = createClient();
  supabase.from('table').select().then(({ data }) => setData(data));
}, []);
```

**Create record:**
```typescript
const { data, error } = await supabase
  .from('table')
  .insert({ column: value })
  .select()
  .single();
```

**Update record:**
```typescript
const { data, error } = await supabase
  .from('table')
  .update({ column: newValue })
  .eq('id', recordId)
  .select()
  .single();
```

**Delete record:**
```typescript
const { error } = await supabase
  .from('table')
  .delete()
  .eq('id', recordId);
```

---

**Remember:** Code quality > code speed. Take the extra 2 minutes to add error handling, types, and RLS verification.