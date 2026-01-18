# BMAD Architect Agent - Project Setup Orchestration

**Agent:** @bmm-architect
**Purpose:** Automate initial project setup and prepare context for Dev Agent
**Load this at:** Start of project initialization (before any development)
**Tool:** Claude Code (preferred) or Cursor

---

## 🎯 Your Role: Setup Orchestrator

You are responsible for:
1. ✅ Bootstrapping the Next.js project with Vercel Supabase starter
2. ✅ Creating environment file with placeholders (user will fill Supabase/API keys later)
3. ✅ Implementing auth bypass for MVP development
4. ✅ Generating TypeScript types structure (user will regenerate after Supabase setup)
5. ✅ Creating B-MAD folder structure
6. ✅ Setting up verification scripts
7. ✅ Documenting setup for Dev Agent context

**What you're NOT doing:**
- ❌ Creating Supabase project (user does this manually)
- ❌ Generating actual API keys (user does this manually)
- ❌ Running database migrations (user does this in Supabase dashboard)

---

## 📋 Pre-Execution Checklist

Verify with user before starting:

- [ ] **Node.js 18+ installed:** Run `node --version`
- [ ] **npm installed:** Run `npm --version`
- [ ] **Project directory chosen:** Where should I create the project? (e.g., `~/projects/`)
- [ ] **Project name confirmed:** Default is `linkedin-referral-finder` - change?
- [ ] **User has Supabase account:** They will create project manually
- [ ] **User has Anthropic account:** They will get API key manually

---

## 🚀 Phase 1: Bootstrap Project (Automated)

### Task 1.1: Create Next.js Project with Vercel Supabase Starter

**Command to execute:**

```bash
# Navigate to chosen directory
cd ~/projects  # Or user's preferred directory

# Create project from Vercel's official Supabase starter
npx create-next-app@latest linkedin-referral-finder \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase \
  --use-npm

# Navigate into project
cd linkedin-referral-finder

# Install dependencies
npm install
```

**Verification:**
```bash
# Check package.json exists
cat package.json | grep "name"
# Should output: "name": "linkedin-referral-finder"
```

**Output to user:**
```
✅ Phase 1.1 Complete: Next.js project created
   Location: ~/projects/linkedin-referral-finder
   Next step: Installing additional dependencies
```

---

### Task 1.2: Install shadcn/ui and Dependencies

**Commands to execute:**

```bash
# Initialize shadcn/ui with default settings
npx shadcn@latest init --defaults

# Install core shadcn/ui components
npx shadcn@latest add button input form dialog tabs table badge avatar progress skeleton toast alert select dropdown-menu card separator

# Install additional dependencies
npm install @tremor/react zod react-hook-form @hookform/resolvers date-fns

# Install Supabase CLI (for type generation later)
npm install supabase --save-dev
```

**Verification:**
```bash
# Check if shadcn components installed
ls components/ui/ | wc -l
# Should output: 14 (or more)

# Check package.json for all dependencies
cat package.json | grep -E "@tremor/react|zod|react-hook-form"
```

**Output to user:**
```
✅ Phase 1.2 Complete: Dependencies installed
   - shadcn/ui: 14 components
   - Tremor: Analytics library
   - Zod: Validation library
   - React Hook Form: Form management
   Next step: Creating environment file
```

---

## 🔐 Phase 2: Environment Variables Setup (Automated)

### Task 2.1: Create .env.local with Placeholders

**Create file: `.env.local`**

```env
# ============================================
# 🔴 IMPORTANT: FILL THESE VALUES BEFORE RUNNING THE APP
# ============================================
# This file contains placeholder values.
# Follow the instructions below to get real credentials.

# ============================================
# Supabase Configuration
# ============================================
# 📝 How to get these:
# 1. Go to https://supabase.com/dashboard
# 2. Create new project: "linkedin-referral-finder"
# 3. Go to Settings > API
# 4. Copy the values below

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# ⚠️ TODO: Replace placeholders above with real values from Supabase dashboard

# ============================================
# Auth Bypass (MVP Development Mode)
# ============================================
# ✅ These are pre-configured - NO CHANGES NEEDED
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_STUB_USER_ID=00000000-0000-0000-0000-000000000000

# ============================================
# Claude API (Anthropic)
# ============================================
# 📝 How to get these:
# 1. Go to https://console.anthropic.com/settings/keys
# 2. Create new API key
# 3. Copy the key (starts with sk-ant-api03-)

ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# ⚠️ TODO: Replace placeholder above with real API key from Anthropic console

# ============================================
# Application Configuration
# ============================================
# ✅ These are pre-configured - NO CHANGES NEEDED
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# Future Integrations (Post-MVP)
# ============================================
# Uncomment and add keys when needed:

# Upstash Redis (for caching LLM responses)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# Trigger.dev (for background jobs)
# TRIGGER_API_KEY=
# TRIGGER_API_URL=

# PostHog (for analytics)
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=

# Sentry (for error tracking)
# SENTRY_DSN=
```

**Verification:**
```bash
# Check .env.local exists
cat .env.local | head -5
```

**Output to user:**
```
✅ Phase 2 Complete: Environment file created
   Location: .env.local
   
   🔴 ACTION REQUIRED:
   1. Create Supabase project at https://supabase.com/dashboard
   2. Get API key from https://console.anthropic.com/settings/keys
   3. Replace placeholders in .env.local
   
   Variables to fill:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
   
   Next step: Setting up auth bypass
```

---

## 🔧 Phase 3: Auth Bypass Implementation (Automated)

### Task 3.1: Replace Middleware with Auth Bypass

**Update file: `middleware.ts`**

```typescript
// middleware.ts
// Purpose: Bypass authentication during MVP development
// 
// Auth bypass is controlled by NEXT_PUBLIC_BYPASS_AUTH environment variable.
// When true: All requests allowed (no auth check)
// When false: Normal auth flow (restore from starter template if needed)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if auth bypass is enabled
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  
  if (bypassAuth) {
    // Log bypass for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Auth bypass enabled - allowing all requests')
    }
    
    // Allow all requests through
    return NextResponse.next()
  }
  
  // When auth bypass is disabled, implement auth logic here
  // For now, allow everything (can restore starter's auth middleware later)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Verification:**
```bash
# Check middleware.ts content
cat middleware.ts | grep "NEXT_PUBLIC_BYPASS_AUTH"
# Should output line with bypass check
```

---

### Task 3.2: Update Root Layout with Dev Mode Banner

**Update file: `app/layout.tsx`**

```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'LinkedIn Referral Finder',
  description: 'Find referrals for any job in 1 click - AI-powered connection discovery',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const stubUserId = process.env.NEXT_PUBLIC_STUB_USER_ID

  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground">
        {/* Development Mode Banner */}
        {bypassAuth && (
          <div className="bg-yellow-100 border-b border-yellow-400 px-4 py-2 text-sm text-yellow-900">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <span className="font-bold">🚧 DEV MODE:</span>
              <span>Authentication bypassed. Using stub user ID:</span>
              <code className="bg-yellow-200 px-2 py-0.5 rounded font-mono text-xs">
                {stubUserId}
              </code>
              <span className="text-yellow-700 ml-auto text-xs">
                (Set NEXT_PUBLIC_BYPASS_AUTH=false to enable real auth)
              </span>
            </div>
          </div>
        )}
        
        <main className="min-h-screen flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}
```

**Verification:**
```bash
# Check layout.tsx has bypass banner
cat app/layout.tsx | grep "DEV MODE"
```

**Output to user:**
```
✅ Phase 3 Complete: Auth bypass configured
   - Middleware updated to bypass auth
   - Dev mode banner added to layout
   - Yellow banner will appear when NEXT_PUBLIC_BYPASS_AUTH=true
   
   Next step: TypeScript types structure
```

---

## 📝 Phase 4: TypeScript Types Structure (Automated)

### Task 4.1: Create Types Directory and Placeholder

**Create directory:**
```bash
mkdir -p types
```

**Create file: `types/index.ts`**

```typescript
// types/index.ts
// Purpose: Type aliases for database tables
// 
// IMPORTANT: After Supabase setup, regenerate types with:
// npx supabase gen types typescript --linked > types/supabase.ts

import type { Database } from './supabase'

// ============================================
// Database Table Types
// ============================================

// Jobs table
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

// Connections table
export type Connection = Database['public']['Tables']['connections']['Row']
export type ConnectionInsert = Database['public']['Tables']['connections']['Insert']
export type ConnectionUpdate = Database['public']['Tables']['connections']['Update']

// Messages table
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

// ============================================
// Supabase Client Type
// ============================================

export type SupabaseClient = ReturnType<typeof import('@/lib/supabase/client').createClient>
```

**Create file: `types/supabase.ts`** (placeholder)

```typescript
// types/supabase.ts
// 
// ⚠️ PLACEHOLDER FILE - WILL BE REGENERATED
// 
// This file will be automatically generated after:
// 1. User creates Supabase project
// 2. User runs database migration (creates tables)
// 3. User links project: npx supabase link --project-ref PROJECT_REF
// 4. User generates types: npx supabase gen types typescript --linked > types/supabase.ts
//
// For now, this is a minimal placeholder to prevent TypeScript errors.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          user_id: string
          job_url: string
          company_name: string | null
          job_title: string | null
          job_description: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          job_url: string
          company_name?: string | null
          job_title?: string | null
          job_description?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_url?: string
          company_name?: string | null
          job_title?: string | null
          job_description?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user_id: string
          job_id: string
          linkedin_profile_url: string | null
          name: string
          role: string | null
          connection_degree: number | null
          mutual_connection_name: string | null
          confidence_score: number | null
          confidence_reasoning: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          job_id: string
          linkedin_profile_url?: string | null
          name: string
          role?: string | null
          connection_degree?: number | null
          mutual_connection_name?: string | null
          confidence_score?: number | null
          confidence_reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          linkedin_profile_url?: string | null
          name?: string
          role?: string | null
          connection_degree?: number | null
          mutual_connection_name?: string | null
          confidence_score?: number | null
          confidence_reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          connection_id: string
          message_casual: string | null
          message_professional: string | null
          message_direct: string | null
          selected_variant: string | null
          sent_at: string | null
          response_status: string | null
          response_received_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          connection_id: string
          message_casual?: string | null
          message_professional?: string | null
          message_direct?: string | null
          selected_variant?: string | null
          sent_at?: string | null
          response_status?: string | null
          response_received_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          connection_id?: string
          message_casual?: string | null
          message_professional?: string | null
          message_direct?: string | null
          selected_variant?: string | null
          sent_at?: string | null
          response_status?: string | null
          response_received_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

**Verification:**
```bash
# Check types directory structure
ls -la types/
# Should show: index.ts, supabase.ts
```

**Output to user:**
```
✅ Phase 4 Complete: TypeScript types structure created
   - types/index.ts: Type aliases
   - types/supabase.ts: Placeholder (user will regenerate)
   
   🔴 ACTION REQUIRED (AFTER Supabase setup):
   1. npx supabase link --project-ref YOUR_PROJECT_REF
   2. npx supabase gen types typescript --linked > types/supabase.ts
   
   Next step: Creating folder structure
```

---

## 📂 Phase 5: B-MAD Folder Structure (Automated)

### Task 5.1: Create B-MAD Directory Structure

**Commands to execute:**

```bash
# Create B-MAD documentation folders
mkdir -p docs/0-discovery
mkdir -p docs/1-planning
mkdir -p docs/2-requirements/prd
mkdir -p docs/2-requirements/architecture
mkdir -p docs/design-system
mkdir -p docs/_bmad-guidelines

# Create component folders (organized by feature)
mkdir -p components/ui          # shadcn components (already exists)
mkdir -p components/jobs        # Job-related components
mkdir -p components/connections # Connection-related components
mkdir -p components/messages    # Message-related components
mkdir -p components/dashboard   # Dashboard components

# Create lib folders (utilities and integrations)
mkdir -p lib/supabase  # Supabase clients (already exists)
mkdir -p lib/ai        # AI/LLM integration (Claude API)
mkdir -p lib/utils     # General utilities
mkdir -p lib/validations  # Zod schemas
```

**Verification:**
```bash
# Verify structure
tree -L 3 -d docs/ components/ lib/
```

**Output to user:**
```
✅ Phase 5 Complete: Folder structure created

Directory structure:
docs/
├── 0-discovery/          # Discovery phase outputs
├── 1-planning/           # Product brief, PRD, architecture
├── 2-requirements/       # Sharded documents (epics, user stories)
│   ├── prd/
│   └── architecture/
├── design-system/        # UX design system
└── _bmad-guidelines/     # Agent guidelines (add guideline files here)

components/
├── ui/                   # shadcn/ui components
├── jobs/                 # Job URL input, job cards
├── connections/          # Connection cards, filters
├── messages/             # Message modal, message variants
└── dashboard/            # Dashboard metrics, tables

lib/
├── supabase/             # Supabase server/client
├── ai/                   # Claude API integration
├── utils/                # Helper functions
└── validations/          # Zod schemas for validation

Next step: Creating verification scripts
```

---

## ✅ Phase 6: Verification Scripts (Automated)

### Task 6.1: Create Environment Verification Script

**Create file: `scripts/verify-setup.ts`**

```typescript
// scripts/verify-setup.ts
// Purpose: Verify all environment variables are configured
// Usage: npx tsx scripts/verify-setup.ts

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_BYPASS_AUTH',
  'NEXT_PUBLIC_STUB_USER_ID',
]

console.log('🔍 Verifying environment setup...\n')

let allValid = true

requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar]
  
  // Check if value exists
  if (!value) {
    console.error(`❌ Missing: ${envVar}`)
    allValid = false
    return
  }
  
  // Check if value is placeholder
  if (value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
    console.warn(`⚠️  Placeholder detected: ${envVar}`)
    console.warn(`   Current value: ${value}`)
    console.warn(`   Action: Replace with real credential`)
    allValid = false
    return
  }
  
  // Mask sensitive values
  const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET')
    ? value.substring(0, 12) + '...' 
    : value
  
  console.log(`✅ ${envVar}: ${maskedValue}`)
})

console.log('\n' + '='.repeat(60))

if (allValid) {
  console.log('✅ All environment variables configured correctly!')
  console.log('\nNext steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Visit: http://localhost:3000')
  console.log('3. You should see yellow "DEV MODE" banner')
} else {
  console.log('❌ Some environment variables need attention')
  console.log('\nAction required:')
  console.log('1. Check .env.local file')
  console.log('2. Replace all placeholders with real credentials')
  console.log('3. Re-run: npx tsx scripts/verify-setup.ts')
  process.exit(1)
}
```

---

### Task 6.2: Create Database Connection Test (Will Run After Supabase Setup)

**Create file: `scripts/test-database.ts`**

```typescript
// scripts/test-database.ts
// Purpose: Test Supabase connection and verify tables exist
// Usage: npx tsx scripts/test-database.ts
// 
// NOTE: Run this AFTER:
// 1. Supabase project created
// 2. Database migration executed (tables created)
// 3. Environment variables filled in .env.local

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Check if credentials are placeholders
if (supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('❌ Error: Supabase credentials are still placeholders')
  console.error('\nAction required:')
  console.error('1. Create Supabase project at https://supabase.com/dashboard')
  console.error('2. Update .env.local with real credentials')
  console.error('3. Run database migration in Supabase SQL Editor')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database connection...\n')

  // Test 1: Connection
  try {
    const { error } = await supabase.from('jobs').select('count').limit(1)
    if (error) throw error
    console.log('✅ Database connection successful')
  } catch (error: any) {
    console.error('❌ Database connection failed')
    console.error('   Error:', error.message)
    console.error('\nPossible causes:')
    console.error('1. Database tables not created yet (run migration in Supabase SQL Editor)')
    console.error('2. Wrong Supabase URL or API key')
    console.error('3. Supabase project paused (free tier auto-pauses after 7 days)')
    process.exit(1)
  }

  // Test 2: Verify all tables exist
  const tables = ['jobs', 'connections', 'messages']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) throw error
      console.log(`✅ Table exists: ${table}`)
    } catch (error: any) {
      console.error(`❌ Table missing: ${table}`)
      console.error(`   Error: ${error.message}`)
      console.error('\nAction: Run database migration in Supabase SQL Editor')
      process.exit(1)
    }
  }

  // Test 3: Insert and query test record
  try {
    const testJob = {
      job_url: 'https://linkedin.com/jobs/view/test-' + Date.now(),
      company_name: 'Test Company',
      job_title: 'Test Role',
    }

    const { data: inserted, error: insertError } = await supabase
      .from('jobs')
      .insert(testJob)
      .select()
      .single()

    if (insertError) throw insertError
    console.log('✅ Test record inserted:', inserted.id)

    // Query the test record
    const { data: queried, error: queryError } = await supabase
      .from('jobs')
      .select()
      .eq('id', inserted.id)
      .single()

    if (queryError) throw queryError
    console.log('✅ Test record queried:', queried.job_title)

    // Delete the test record
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', inserted.id)

    if (deleteError) throw deleteError
    console.log('✅ Test record deleted')

  } catch (error: any) {
    console.error('❌ Database operations failed:', error.message)
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ All database tests passed!')
  console.log('\nYour Supabase setup is working correctly.')
  console.log('Ready to start building features!')
}

testDatabase()
```

---

### Task 6.3: Create App Verification Script

**Create file: `scripts/verify-app.ts`**

```typescript
// scripts/verify-app.ts
// Purpose: Verify Next.js app configuration
// Usage: npx tsx scripts/verify-app.ts

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🔍 Verifying Next.js app configuration...\n')

const checks = [
  {
    name: 'package.json exists',
    path: 'package.json',
    test: (content: string) => {
      const pkg = JSON.parse(content)
      return pkg.name === 'linkedin-referral-finder'
    },
  },
  {
    name: 'shadcn/ui components installed',
    path: 'components/ui',
    test: () => existsSync('components/ui/button.tsx'),
  },
  {
    name: 'Supabase client configured',
    path: 'lib/supabase/client.ts',
    test: () => true,
  },
  {
    name: 'Middleware has auth bypass',
    path: 'middleware.ts',
    test: (content: string) => content.includes('NEXT_PUBLIC_BYPASS_AUTH'),
  },
  {
    name: 'TypeScript types structure',
    path: 'types/index.ts',
    test: () => existsSync('types/supabase.ts'),
  },
  {
    name: 'B-MAD folder structure',
    path: 'docs/_bmad-guidelines',
    test: () => existsSync('docs/0-discovery'),
  },
]

let allPassed = true

checks.forEach(({ name, path, test }) => {
  try {
    let content = ''
    
    if (existsSync(path)) {
      // If it's a file, read content
      if (path.includes('.')) {
        content = readFileSync(path, 'utf-8')
      }
      
      const passed = test(content)
      
      if (passed) {
        console.log(`✅ ${name}`)
      } else {
        console.error(`❌ ${name}: Failed validation`)
        allPassed = false
      }
    } else {
      console.error(`❌ ${name}: File/folder not found at ${path}`)
      allPassed = false
    }
  } catch (error: any) {
    console.error(`❌ ${name}: ${error.message}`)
    allPassed = false
  }
})

console.log('\n' + '='.repeat(60))

if (allPassed) {
  console.log('✅ All app configuration checks passed!')
  console.log('\nNext steps:')
  console.log('1. Fill in .env.local with real credentials')
  console.log('2. Run: npx tsx scripts/verify-setup.ts')
  console.log('3. Run: npm run dev')
} else {
  console.log('❌ Some checks failed')
  console.log('\nReview errors above and fix issues')
  process.exit(1)
}
```

**Create directory for scripts:**
```bash
mkdir -p scripts
```

**Verification:**
```bash
# Check all scripts created
ls -la scripts/
# Should show: verify-setup.ts, test-database.ts, verify-app.ts
```

**Output to user:**
```
✅ Phase 6 Complete: Verification scripts created

Scripts available:
1. scripts/verify-app.ts     - Verify Next.js app structure
2. scripts/verify-setup.ts   - Verify environment variables
3. scripts/test-database.ts  - Test Supabase connection (after setup)

Run order:
1. npm run dev (verify app starts)
2. npx tsx scripts/verify-app.ts (check project structure)
3. Fill .env.local with real credentials
4. npx tsx scripts/verify-setup.ts (check env vars)
5. npx tsx scripts/test-database.ts (test database)

Next step: Generating setup summary
```

---

## 📄 Phase 7: Generate Setup Summary for Dev Agent

### Task 7.1: Create Setup Summary Document

**Create file: `docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md`**

```markdown
# Project Setup Summary - For Dev Agent Context

**Generated:** [CURRENT_DATE]
**By:** BMAD Architect Agent
**Status:** ✅ Automated setup complete

---

## ✅ What's Been Configured

### 1. Project Bootstrap
- ✅ Next.js 14 with App Router
- ✅ Vercel Supabase starter template
- ✅ TypeScript strict mode enabled
- ✅ Tailwind CSS configured

### 2. Dependencies Installed
- ✅ shadcn/ui: 14 components
- ✅ Tremor: Analytics library
- ✅ Zod: Validation
- ✅ React Hook Form: Form management
- ✅ Supabase CLI: Type generation

### 3. Environment Configuration
- ✅ `.env.local` created with placeholders
- ✅ Auth bypass enabled (NEXT_PUBLIC_BYPASS_AUTH=true)
- ✅ Stub user ID configured (00000000-0000-0000-0000-000000000000)

### 4. Auth Bypass
- ✅ Middleware updated to bypass authentication
- ✅ Dev mode banner added to layout (shows yellow banner)
- ✅ All requests allowed without login

### 5. TypeScript Types
- ✅ types/index.ts: Type aliases created
- ✅ types/supabase.ts: Placeholder created (user will regenerate)

### 6. Folder Structure
```
linkedin-referral-finder/
├── docs/
│   ├── 0-discovery/
│   ├── 1-planning/
│   ├── 2-requirements/
│   ├── design-system/
│   └── _bmad-guidelines/      # ← Add guideline files here
├── components/
│   ├── ui/                     # shadcn components
│   ├── jobs/                   # Job-related components (create here)
│   ├── connections/            # Connection components (create here)
│   ├── messages/               # Message components (create here)
│   └── dashboard/              # Dashboard components (create here)
├── lib/
│   ├── supabase/               # ✅ Configured (server.ts, client.ts)
│   ├── ai/                     # AI integration (create here)
│   ├── utils/                  # Helper functions (create here)
│   └── validations/            # Zod schemas (create here)
├── scripts/                    # Verification scripts
└── types/                      # TypeScript types
```

### 7. Verification Scripts
- ✅ scripts/verify-app.ts: Check project structure
- ✅ scripts/verify-setup.ts: Check environment variables
- ✅ scripts/test-database.ts: Test Supabase connection

---

## 🔴 What User Must Do Next

### Step 1: Create Supabase Project (15 minutes)
1. Go to https://supabase.com/dashboard
2. Create new project: "linkedin-referral-finder"
3. Save database password securely
4. Wait for project to provision (~2 minutes)

### Step 2: Run Database Migration (10 minutes)
1. In Supabase dashboard, go to SQL Editor
2. Create new query
3. Paste SQL migration from `docs/2-requirements/architecture/database-schema.md`
4. Run migration (creates jobs, connections, messages tables)
5. Verify tables exist in Table Editor

### Step 3: Get API Credentials (5 minutes)
1. Supabase dashboard > Settings > API
2. Copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)
3. Anthropic console > Settings > Keys
4. Copy API key (starts with sk-ant-api03-)

### Step 4: Update Environment File (5 minutes)
1. Open `.env.local`
2. Replace all placeholders:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
3. Save file

### Step 5: Generate TypeScript Types (5 minutes)
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase gen types typescript --linked > types/supabase.ts
```

### Step 6: Verify Setup (5 minutes)
```bash
# Run verification scripts
npx tsx scripts/verify-app.ts
npx tsx scripts/verify-setup.ts
npx tsx scripts/test-database.ts

# Start app
npm run dev
# Visit http://localhost:3000
# Should see yellow "DEV MODE" banner
```

**Total user time:** ~45 minutes

---

## 📚 Files for Dev Agent to Reference

When invoking BMAD Dev Agent, load these files:

### Required Context Files:
1. `docs/_bmad-guidelines/bmad-dev-agent-guidelines.md`
   - TypeScript patterns, API templates, error handling

2. `docs/_bmad-guidelines/bmad-ux-agent-guidelines.md`
   - Component library choices, interaction patterns

3. `docs/2-requirements/architecture/database-schema.md`
   - Table schemas, relationships, RLS policies

4. `docs/2-requirements/prd/functional-requirements.md`
   - Feature specifications, user stories

5. `docs/design-system/design-system.md`
   - Color palette, typography, component specs

### Project-Specific Context:
- **Database schema:** 3 tables (jobs, connections, messages)
- **Auth mode:** Bypassed (stub user ID: 00000000-0000-0000-0000-000000000000)
- **Component library:** shadcn/ui + Tremor
- **Validation:** Zod schemas
- **State management:** React Query (TanStack Query)

---

## 🚀 Ready for Dev Agent!

**When user completes steps above, they can invoke Dev Agent:**

```
@bmm-dev

Load context:
- docs/_bmad-guidelines/bmad-dev-agent-guidelines.md
- docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md

Manual setup complete. Project ready for feature development.

Implement Job URL Input page:
- Location: app/jobs/page.tsx
- Component: components/jobs/JobUrlForm.tsx
- Validation: lib/validations/job.ts
- Use shadcn Form + Input
- Insert to jobs table on submit
```

**Dev Agent will have full context of:**
- What's already configured (don't recreate Supabase clients)
- What to ignore (app/login, app/signup folders)
- What to build (your features in the right folders)
- How to build (following guidelines and patterns)
```

**Verification:**
```bash
# Check summary exists
cat docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md | head -10
```

**Output to user:**
```
✅ Phase 7 Complete: Setup summary generated
   Location: docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md
   
   This document contains:
   - What's been automated
   - What user must do manually
   - Files for Dev Agent to reference
   - How to invoke Dev Agent with proper context
```

---

## 🎉 Final Output to User

**Display this summary at the end:**

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  ✅ AUTOMATED SETUP COMPLETE!                                     ║
║                                                                    ║
║  Project: linkedin-referral-finder                                ║
║  Location: ~/projects/linkedin-referral-finder                    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

📦 What I've Done:

✅ Phase 1: Bootstrapped Next.js project with Vercel Supabase starter
✅ Phase 2: Created .env.local with placeholders
✅ Phase 3: Implemented auth bypass for MVP development
✅ Phase 4: Set up TypeScript types structure
✅ Phase 5: Created B-MAD folder structure
✅ Phase 6: Added verification scripts
✅ Phase 7: Generated setup summary for Dev Agent

⏱️  Time saved: ~1.5 hours of manual setup

---

🔴 YOUR ACTION REQUIRED (45 minutes):

1. Create Supabase project (15 min)
   - Go to: https://supabase.com/dashboard
   - Create: "linkedin-referral-finder"

2. Run database migration (10 min)
   - Supabase dashboard > SQL Editor
   - Paste SQL from: docs/2-requirements/architecture/database-schema.md
   - Execute

3. Get API credentials (5 min)
   - Supabase: Project URL + API keys
   - Anthropic: API key from console

4. Update .env.local (5 min)
   - Replace all placeholders with real credentials

5. Generate TypeScript types (5 min)
   - npx supabase link --project-ref YOUR_REF
   - npx supabase gen types typescript --linked > types/supabase.ts

6. Verify setup (5 min)
   - npx tsx scripts/verify-app.ts
   - npx tsx scripts/verify-setup.ts
   - npx tsx scripts/test-database.ts
   - npm run dev (should see yellow DEV MODE banner)

---

📚 NEXT STEP: Invoke BMAD Dev Agent

After completing above steps, use this command in Cursor:

@bmm-dev

Load context:
- docs/_bmad-guidelines/bmad-dev-agent-guidelines.md
- docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md

Manual setup complete. Implement Job URL Input page.

---

📁 Important Files:

Environment: .env.local (fill placeholders before running)
Setup Summary: docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md
Verification: scripts/verify-setup.ts
Database Test: scripts/test-database.ts

---

Need help? Check the setup summary at:
docs/_bmad-guidelines/PROJECT-SETUP-SUMMARY.md
```

---

## ✅ Pre-Handoff Checklist for Architect Agent

Before completing this task, verify:

- [ ] Project created successfully (package.json exists)
- [ ] All dependencies installed (node_modules exists)
- [ ] .env.local created with clear placeholders
- [ ] Middleware replaced with auth bypass logic
- [ ] Layout updated with dev mode banner
- [ ] TypeScript types structure created
- [ ] B-MAD folders created
- [ ] Verification scripts created
- [ ] Setup summary document generated
- [ ] Final summary displayed to user

**If all checked:** Setup orchestration complete! User can proceed with manual Supabase configuration.