# Sprint 2: Multi-Tenant Resume System

**Created:** January 9, 2026
**Scrum Master:** Bob
**Sprint Goal:** Enable multiple users to upload their own resumes and receive personalized optimized resumes

---

## 🎯 Sprint Objective

Transform single-user resume system (hardcoded for Raghav) into multi-tenant system where each user's uploaded resume is parsed and used to generate their personalized optimized resumes.

**Why This Sprint:**
- Original architecture designed for multi-tenant from Day 1 (RLS policies exist)
- Sprint 1 delivered working DOCX generation but skipped resume parsing
- Current gap blocks multiple user adoption
- Missing component: Extract user data from uploaded DOCX files

---

## 📊 Sprint Scope

### IN SCOPE ✅

1. **Resume Parser Module** - Extract structured data from uploaded DOCX files using LLM
2. **Database Schema Extension** - Add `user_resume_data` table for parsed data
3. **Dynamic Metrics Builder** - Refactor static constants to per-user functions
4. **Multi-User Testing** - Verify User A and User B get their own data

### OUT OF SCOPE ❌

- Contact Finder (P1, deferred to Sprint 3)
- Outreach Message Generator (P1, deferred to Sprint 3)
- Additional resume formats (only DOCX for MVP)
- Manual data correction UI (v2 feature)

---

## 📋 User Stories

### Story 1: Resume Data Extraction

**As a** developer
**I want** to extract text from uploaded DOCX resume files
**So that** I can parse user-specific information

**Acceptance Criteria:**
- ✅ Read DOCX file from Supabase Storage path
- ✅ Extract plain text content (preserve structure)
- ✅ Handle various DOCX formats (Word 2016+, Google Docs exports)
- ✅ Return clean text suitable for LLM parsing
- ✅ Error handling for corrupted/invalid files

**Technical Approach:**
- Use `mammoth` or `docx` npm package for text extraction
- Store file path, read from Supabase Storage
- Clean extracted text (remove excessive whitespace, formatting artifacts)

**Effort:** 0.5 days

---

### Story 2: LLM-Based Resume Parsing

**As a** developer
**I want** to parse unstructured resume text into structured JSON
**So that** I can store user-specific data in the database

**Acceptance Criteria:**
- ✅ Call Claude API with resume text + structured prompt
- ✅ Extract: name, email, phone, location, LinkedIn, portfolio
- ✅ Extract: work experience (company, role, dates, bullets)
- ✅ Extract: skills (technical, product, tools)
- ✅ Extract: education (degree, institution, dates, GPA)
- ✅ Extract: certifications/achievements
- ✅ Validate extracted data with Zod schema
- ✅ Handle missing fields gracefully (optional vs required)
- ✅ Return structured `ParsedResumeData` object

**Technical Approach:**
- Reuse existing Claude API wrapper (`lib/api/claude.ts`)
- System prompt defines exact JSON schema to extract
- Validate with Zod before storing in database
- Store NULL for truly missing fields (not empty strings)

**Effort:** 1.5 days

---

### Story 3: Database Schema for Parsed Data

**As a** developer
**I want** to store parsed resume data per user
**So that** each user's data is isolated and retrievable

**Acceptance Criteria:**
- ✅ Create `user_resume_data` table with RLS policy
- ✅ Schema includes: contact info, work experience (JSONB), skills (JSONB), education (JSONB), certifications (JSONB)
- ✅ One row per user (UNIQUE constraint on `user_id`)
- ✅ RLS policy: `auth.uid() = user_id` (users can only access own data)
- ✅ Foreign key to `resumes` table
- ✅ Migration script tested locally before production

**Database Schema:**
```sql
CREATE TABLE user_resume_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Contact Info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin TEXT,
  portfolio TEXT,

  -- Structured Data (JSONB for flexibility)
  work_experience JSONB NOT NULL,  -- Array of roles
  skills JSONB NOT NULL,            -- Categorized skills
  education JSONB NOT NULL,         -- Degree, institution, dates
  certifications JSONB,             -- Optional achievements

  -- Metadata
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  source_resume_id UUID REFERENCES resumes(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE user_resume_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own resume data" ON user_resume_data
  FOR ALL USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_resume_data_user ON user_resume_data(user_id);
```

**Effort:** 0.5 days

---

### Story 4: Refactor Static Data to Dynamic Builder

**As a** developer
**I want** to replace hardcoded metrics with dynamic per-user builders
**So that** generated resumes use each user's own data

**Acceptance Criteria:**
- ✅ Refactor `verified-metrics.ts`: Change from `const VERIFIED_METRICS` to `async function buildVerifiedMetrics(user_id)`
- ✅ Fetch user data from `user_resume_data` table
- ✅ Build metrics object dynamically from fetched data
- ✅ Update all call sites: `resume-generator.ts`, `system-prompt.ts`
- ✅ Maintain same TypeScript interface (no breaking changes to downstream code)
- ✅ Handle missing user data gracefully (throw error if no parsed data exists)

**Technical Approach:**
```typescript
// BEFORE (verified-metrics.ts)
export const VERIFIED_METRICS = {
  contact: { name: "Raghav Mehta", ... },
  // ... hardcoded
} as const;

// AFTER
export async function buildVerifiedMetrics(
  user_id: string
): Promise<VerifiedMetrics> {
  const { data, error } = await supabase
    .from('user_resume_data')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    throw new Error('Resume data not found. Please upload resume first.');
  }

  return {
    contact: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedin: data.linkedin,
      portfolio: data.portfolio
    },
    // ... build from user's data
  };
}
```

**Effort:** 1 day

---

### Story 5: Integration - Parse on Upload

**As a** user
**I want** my resume to be automatically parsed when I upload it
**So that** I don't need to manually enter my information

**Acceptance Criteria:**
- ✅ Update `/api/resume/upload` route to trigger parsing after successful upload
- ✅ Parse immediately (not deferred background job for MVP)
- ✅ Store parsed data in `user_resume_data` table
- ✅ Return parsing status to frontend (success/error)
- ✅ Show loading state during parsing (can take 10-15 seconds)
- ✅ Error handling: If parsing fails, allow user to retry or manually enter data (v2)

**API Flow:**
```
1. User uploads resume.docx
2. Store in Supabase Storage → Get file_path
3. Create row in `resumes` table
4. **NEW:** Parse resume (extract text → call Claude → validate → store)
5. Return success to frontend with parsing status
```

**Effort:** 0.5 days

---

### Story 6: Multi-User Testing & Validation

**As a** QA tester
**I want** to verify that each user gets their own personalized resume
**So that** we ensure multi-tenant functionality works correctly

**Acceptance Criteria:**
- ✅ Create 2 test user accounts (User A, User B)
- ✅ User A uploads resume_A.docx → System parses → Generate optimized resume → Verify has User A's name/data
- ✅ User B uploads resume_B.docx → System parses → Generate optimized resume → Verify has User B's name/data
- ✅ Verify User A cannot access User B's data (RLS test)
- ✅ Verify User B cannot access User A's data (RLS test)
- ✅ Test edge cases: Resume with missing education, non-standard formatting, multiple jobs at same company
- ✅ Document test results in Sprint 2 QA report

**Test Scenarios:**
1. **Happy Path:** Standard resume → Parse successfully → Generate correctly
2. **Missing Fields:** Resume without certifications → Parse with NULL values → Generate without errors
3. **Non-Standard Format:** Google Docs export → Parse successfully
4. **Data Isolation:** User A tries to fetch User B's resume_data → 403 Forbidden (RLS blocks)
5. **Update Resume:** User re-uploads new resume → Old data replaced, not duplicated

**Effort:** 1 day

---

## 🔧 Technical Implementation Details

### Resume Parser Architecture

**File:** `frontend/lib/resume/resume-parser.ts`

```typescript
import { Anthropic } from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/client'
import mammoth from 'mammoth' // or 'docx' package
import { z } from 'zod'

// Zod schema for validation
const ParsedResumeDataSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  work_experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    period: z.string(),
    bullets: z.array(z.string())
  })),
  skills: z.object({
    technical: z.array(z.string()),
    product: z.array(z.string()),
    tools: z.array(z.string())
  }),
  education: z.object({
    degree: z.string(),
    institution: z.string(),
    period: z.string(),
    cgpa: z.string().optional()
  }),
  certifications: z.array(z.object({
    name: z.string(),
    date: z.string(),
    instructor: z.string().optional()
  })).optional()
})

export type ParsedResumeData = z.infer<typeof ParsedResumeDataSchema>

export class ResumeParser {

  /**
   * Extract text from DOCX file
   */
  private async extractText(file_path: string): Promise<string> {
    const supabase = createClient()

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(file_path)

    if (error) throw new Error(`Failed to download resume: ${error.message}`)

    // Convert Blob to Buffer
    const buffer = await data.arrayBuffer()

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })

    return result.value // Plain text
  }

  /**
   * Parse resume text with Claude API
   */
  private async parseWithLLM(text: string): Promise<ParsedResumeData> {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })

    const system_prompt = `You are a resume parser. Extract structured data from the resume text.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "location": "string (optional)",
  "linkedin": "string (optional)",
  "portfolio": "string (optional)",
  "work_experience": [
    {
      "company": "string",
      "role": "string",
      "period": "string (e.g., 'Jan 2020 - Present')",
      "bullets": ["string", "string", ...]
    }
  ],
  "skills": {
    "technical": ["string", "string", ...],
    "product": ["string", "string", ...],
    "tools": ["string", "string", ...]
  },
  "education": {
    "degree": "string",
    "institution": "string",
    "period": "string",
    "cgpa": "string (optional)"
  },
  "certifications": [
    {
      "name": "string",
      "date": "string",
      "instructor": "string (optional)"
    }
  ] (optional)
}

CRITICAL:
- If a field is missing, use null (NOT empty string)
- Extract ALL work experience bullets (don't summarize)
- Preserve exact company names, role titles, dates`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: system_prompt,
      messages: [{
        role: 'user',
        content: `Parse this resume:\n\n${text}`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected Claude response type')
    }

    // Parse JSON from Claude response
    const parsed_data = JSON.parse(content.text)

    // Validate with Zod
    return ParsedResumeDataSchema.parse(parsed_data)
  }

  /**
   * Main entry point: Parse resume and store in database
   */
  async parse(file_path: string, user_id: string): Promise<ParsedResumeData> {
    // Step 1: Extract text from DOCX
    const text = await this.extractText(file_path)

    // Step 2: Parse with Claude API
    const parsed_data = await this.parseWithLLM(text)

    // Step 3: Store in database
    const supabase = createClient()

    const { error } = await supabase
      .from('user_resume_data')
      .upsert({
        user_id,
        name: parsed_data.name,
        email: parsed_data.email,
        phone: parsed_data.phone,
        location: parsed_data.location,
        linkedin: parsed_data.linkedin,
        portfolio: parsed_data.portfolio,
        work_experience: parsed_data.work_experience,
        skills: parsed_data.skills,
        education: parsed_data.education,
        certifications: parsed_data.certifications,
        parsed_at: new Date().toISOString()
      })

    if (error) throw new Error(`Failed to store parsed data: ${error.message}`)

    return parsed_data
  }
}
```

---

## 📅 Sprint Timeline (6 Working Days)

**Day 1:**
- Dev: Research DOCX parsing libraries (mammoth vs docx) - 2 hours
- Dev: Implement text extraction (Story 1) - 4 hours
- QA: Prepare test resumes (2-3 samples with different formats) - 2 hours

**Day 2:**
- Dev: Implement LLM parsing (Story 2) - Full day
- QA: Write test plan for multi-user scenarios

**Day 3:**
- Dev: Create database migration (Story 3) - 4 hours
- Dev: Test migration locally - 2 hours
- SM: Review progress, adjust timeline if needed

**Day 4:**
- Dev: Refactor static → dynamic metrics (Story 4) - Full day

**Day 5:**
- Dev: Integration - parse on upload (Story 5) - 4 hours
- QA: Start manual testing (parser unit tests) - 4 hours

**Day 6:**
- Dev: Fix bugs from QA - 4 hours
- QA: Multi-user integration tests (Story 6) - 4 hours
- SM: Sprint review + retrospective

---

## ⚠️ Risk Assessment

### Risk 1: Resume Parsing Accuracy ⭐⭐⭐⭐

**Risk:** LLM may fail to extract all fields correctly from non-standard resume formats

**Likelihood:** HIGH
**Impact:** HIGH (blocks user from generating optimized resume)

**Mitigation:**
- Use detailed system prompt with examples
- Validate with Zod schema (fail fast if critical fields missing)
- V2: Add manual correction UI for users to fix parsing errors
- Test with 10+ different resume formats before deployment

---

### Risk 2: Parsing Performance ⭐⭐⭐

**Risk:** Claude API call takes 10-15 seconds → users wait during upload

**Likelihood:** MEDIUM
**Impact:** MEDIUM (UX friction, not blocking)

**Mitigation:**
- Show clear loading state: "Analyzing your resume... (This may take up to 20 seconds)"
- Add progress indicators
- V2: Deferred background job (parse asynchronously, notify when done)

---

### Risk 3: Existing Hardcoded Data Migration ⭐⭐

**Risk:** Raghav's existing optimized resumes were generated with hardcoded data, need to migrate

**Likelihood:** MEDIUM
**Impact:** LOW (only affects 1 user - Raghav)

**Mitigation:**
- One-time manual upload: Raghav re-uploads his resume
- System parses and stores his data
- Future optimizations use new dynamic system
- No data loss (old optimized resumes remain in storage)

---

### Risk 4: RLS Policy Not Working ⭐⭐⭐⭐⭐

**Risk:** User A accidentally sees User B's resume data (data leak)

**Likelihood:** LOW (RLS is battle-tested)
**Impact:** CRITICAL (privacy violation)

**Mitigation:**
- **MUST VERIFY:** QA explicitly tests RLS (User A tries to fetch User B's data)
- Use Supabase client with proper auth context
- Test with 2 real user accounts (not stub users)
- Add automated RLS tests to test suite

---

### Risk 5: Missing Fields Handling ⭐⭐⭐

**Risk:** Some resumes may not have certifications, portfolio links, etc.

**Likelihood:** HIGH
**Impact:** LOW (can handle gracefully)

**Mitigation:**
- Make optional fields nullable in database schema
- LLM prompt instructs to return `null` for missing fields (not empty strings)
- Content generator handles null values gracefully (skip sections if data missing)

---

## 🧪 Testing Strategy

### Unit Tests (Dev Responsibility)

**Files to Test:**
- `resume-parser.ts` - All methods (extractText, parseWithLLM, parse)
- `verified-metrics.ts` (refactored) - buildVerifiedMetrics function
- Database migration - Schema validation

**Test Coverage Target:** 90%+ for new code

**Approach:**
- Mock Supabase client (storage download, database queries)
- Mock Claude API (return sample parsed data)
- Mock file system (sample DOCX bytes)

---

### Integration Tests (QA Responsibility)

**Test Scenarios:**
1. **Full Flow:** Upload resume → Parse → Verify stored in database
2. **Generate Resume:** Upload resume → Parse → Generate optimized resume → Verify personalized
3. **Multi-User:** User A + User B upload different resumes → Both generate correctly
4. **RLS Verification:** User A cannot access User B's data
5. **Update Resume:** User re-uploads → Old data replaced

**Test Data:**
- Resume A: Standard format (Raghav's current resume)
- Resume B: Different format (Google Docs export, different name)
- Resume C: Missing certifications (edge case)

---

### Manual QA Checklist

- [ ] Resume upload triggers parsing (loading state shown)
- [ ] Parsing completes within 20 seconds
- [ ] Parsed data visible in Supabase `user_resume_data` table
- [ ] Generated resume has correct name (User A's name, not "Raghav Mehta")
- [ ] Generated resume has correct contact info (User A's email/phone)
- [ ] Generated resume has correct work experience (User A's jobs)
- [ ] User A cannot see User B's resume data (403 error)
- [ ] Re-uploading resume replaces old data (no duplicates)
- [ ] Error handling: Invalid DOCX shows user-friendly error
- [ ] Error handling: Parsing failure shows retry option

---

## 📁 Files to Create/Modify

### New Files ✨

1. `/frontend/lib/resume/resume-parser.ts` (300-400 lines)
2. `/supabase/migrations/YYYYMMDDHHMMSS_add_user_resume_data.sql` (50 lines)
3. `/frontend/__tests__/lib/resume/resume-parser.test.ts` (200-300 lines)

### Modified Files ✏️

1. `/frontend/lib/resume/verified-metrics.ts` - Refactor from const to async function
2. `/frontend/lib/resume/resume-generator.ts` - Accept dynamic metrics
3. `/frontend/lib/resume/system-prompt.ts` - Accept dynamic metrics
4. `/frontend/app/api/resume/upload/route.ts` - Add parsing step
5. `/frontend/types/resume.ts` - Add ParsedResumeData type

### Dependencies to Install 📦

```json
{
  "dependencies": {
    "mammoth": "^1.6.0" // DOCX text extraction
  }
}
```

**Alternative:** `docx` package (if mammoth doesn't meet needs)

---

## 📊 Success Metrics

**Sprint 2 Success = ALL of these:**

✅ **Functional:**
- 2+ users can upload different resumes
- Each user's generated resume has their own data (not hardcoded)
- RLS policies verified (users isolated)

✅ **Technical:**
- Database migration deployed
- Resume parser unit tests pass (90%+ coverage)
- Multi-user integration tests pass
- No P0 bugs reported by QA

✅ **Quality:**
- Parsing accuracy: 95%+ fields extracted correctly
- Parsing performance: <20 seconds per resume
- Zero data leaks (RLS working)

---

## 🔄 Context Document Recommendation

### Should We Update `project-context.md`?

**RECOMMENDATION: YES - Add Resume Parsing Rules**

**Rationale:**
- Resume parsing is a new critical component (not covered in current context)
- Dev agents need clear rules on parsing, validation, error handling
- Risk of agents recreating hardcoded approach if not documented

**Proposed Addition to `project-context.md`:**

```markdown
### Resume Parsing Rules (CRITICAL - Multi-Tenant)

**Resume Parser Requirements:**
- ✅ **ALWAYS parse on upload** - Extract user data from DOCX immediately
- ✅ **Use LLM for extraction** - Claude Sonnet 4 with structured output
- ✅ **Validate with Zod** - Ensure all required fields present before storing
- ✅ **Store per-user in database** - `user_resume_data` table with RLS policy
- ❌ **NEVER use hardcoded user data** - Always fetch from database dynamically

**Dynamic Metrics Pattern:**
```typescript
// ❌ WRONG - Hardcoded (single-user)
export const VERIFIED_METRICS = {
  contact: { name: "Raghav Mehta", ... }
}

// ✅ CORRECT - Dynamic (multi-tenant)
export async function buildVerifiedMetrics(user_id: string): Promise<VerifiedMetrics> {
  const { data } = await supabase
    .from('user_resume_data')
    .select('*')
    .eq('user_id', user_id)
    .single()
  return { contact: { name: data.name, ... } }
}
```

**Error Handling:**
- ⚠️ **Missing resume data** - Show error: "Please upload resume first"
- ⚠️ **Parsing failure** - Retry with different prompt, then fallback to manual entry (v2)
- ⚠️ **Invalid DOCX** - User-friendly error: "Invalid file format. Please upload Word DOCX."
```

**Files NOT Needed in Context:**
- `BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md` - Too specific, only for initial architecture phase (done)
- `BMAD-DEV-RESUME-IMPLEMENTATION-GUIDE.md` - Too detailed, relevant parts already in project-context
- `resume-generation-script.js` - User's personal script, not needed by agents after integration complete

**Context Update Priority:** HIGH (add before Sprint 2 starts)

---

## 🎯 Definition of Done

Sprint 2 is DONE when:

- [ ] All 6 user stories accepted by Product Owner
- [ ] Resume parser implemented and tested
- [ ] Database migration deployed to production
- [ ] Multi-user testing complete (2+ real test users)
- [ ] RLS policies verified (zero data leaks)
- [ ] QA sign-off document created
- [ ] `project-context.md` updated with resume parsing rules
- [ ] Sprint retrospective completed
- [ ] No P0 or P1 bugs outstanding

---

## 📞 Next Steps

1. **SM (Bob):** Review this plan with Product Owner → Get approval
2. **Dev (Amelia):** Read this plan → Ask clarifying questions → Start Day 1 tasks
3. **QA (Murat):** Prepare test data (2-3 sample resumes) → Draft test plan

**Ready to kick off?** Let's build the multi-tenant foundation! 🚀

---

**Prepared By:** Bob (Scrum Master)
**Date:** January 9, 2026
**Sprint Duration:** 6 working days
**Estimated Completion:** January 17, 2026
