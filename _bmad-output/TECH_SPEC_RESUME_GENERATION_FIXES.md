# Technical Specification: Resume Generation Pipeline Fixes

**Date:** 2026-01-11
**Author:** Winston (Architect)
**Status:** Ready for Dev Implementation
**Priority:** P0 - CRITICAL (blocks MVP)
**Related:** CRITICAL_ISSUES_POST_AUTH_TESTING.md

---

## Executive Summary

Sprint 2.6.1 (User Authentication) testing revealed **two critical architectural flaws** in the resume generation pipeline that prevent delivery of value to users:

1. **Issue 1 (Content Quality):** Brittle metrics extraction + contradictory prompts → generic output
2. **Issue 2 (Schema Rigidity):** Strict Zod validation → parsing failures for real-world resumes

Both issues stem from **architectural gaps** in how we handle dynamic, user-specific data. This spec provides comprehensive fixes with prevention patterns.

---

## Issue 1: Content Quality - Root Cause Analysis

### The Pipeline Flow

```
User uploads resume
  ↓
[ResumeParser] Parses with Claude → structured JSON ✅
  ↓
[Database] Stores in user_resume_data table ✅
  ↓
[VerifiedMetrics] Extracts metrics using regex patterns ❌ FAILS HERE
  ↓
Returns: "Revenue not specified", "Platform name not specified"
  ↓
[SystemPrompt] Injects placeholders into LLM context
  ↓
[UserPrompt] CONTRADICTS system prompt: "Use ICC, WMS 2.0" ❌ CONTRADICTION
  ↓
[Claude] Generates content using placeholders → GENERIC OUTPUT
```

### Root Cause 1: Brittle Metrics Extraction

**File:** `frontend/lib/resume/verified-metrics.ts` (lines 423-564)

**Problem:** Seven extraction functions use **rigid regex patterns** expecting exact formats:

```typescript
// extractRevenueMetrics (line 423)
const revenuePatterns = {
  pm2_mrr: /₹(\d+[MK]\+?\s*(?:MRR|ARR|revenue))/i,  // Only matches "₹20M+ MRR"
  // ... more patterns
};

// If pattern doesn't match → returns fallback
let pm2_mrr = 'Revenue not specified';  // ❌ LOSES ACTUAL DATA
```

**Why It Fails:**
- User resumes rarely match exact patterns (different currencies, formats, phras ing)
- Regex can't understand context ("drove $2M in sales" vs "₹20M+ MRR")
- Falls back to "not specified" instead of preserving original bullets
- **We have an LLM (Claude) that can extract metrics - why use fragile regex?**

**Impact:**
- User 1 (Raghav): Parsing succeeded, but metrics extraction failed → Claude got placeholders
- System lost all the rich context from parsed resume
- Generic output because Claude had no real data to work with

### Root Cause 2: Contradictory Prompts

**File:** `frontend/lib/resume/system-prompt.ts` (line 509)

**The Contradiction:**

**System Prompt (lines 142-151, 208-214, 441-443) says:**
```
NEVER use specific company/product names in bullets:
❌ "Led ICC platform..." (ICC is company-specific)
❌ "Built WMS 2.0..." (internal product name)

Use generic descriptions:
✅ "Led enterprise integration platform..."
```

**User Prompt (line 509) says:**
```typescript
- Use specific platform names (ICC, WMS 2.0, not generic names)  // ❌ DIRECT CONTRADICTION!
```

**Why This Exists:**
- Line 509 was written for Raghav's specific resume (which mentions ICC, WMS 2.0)
- When copied as template, contradiction remained
- Claude receives conflicting instructions → defaults to placeholders (ICC, WMS 2.0) instead of extracting from user's actual resume

**Impact:**
- Even if metrics extraction worked, Claude would use placeholder company names
- User's actual company names (Meesho, Nextyn, Microsoft) ignored
- Output sounds like template, not personalized resume

---

## Issue 2: Schema Rigidity - Root Cause Analysis

### The Failure

**File:** `frontend/lib/resume/resume-parser.ts` (line 44-49)

```typescript
const CertificationSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),  // ❌ BLOCKING: requires non-empty string
  instructor: z.string().nullish(),
  achievement: z.string().nullish()
});
```

**Why It Fails:**
- Real resumes often have certifications without dates
- LLM (Claude) correctly returns `null` for missing dates
- Zod validation rejects: "Invalid input: expected string, received null"
- **Entire parsing fails** → no data stored → optimization impossible

**Cascading Impact:**
```
Parsing fails at Zod validation
  ↓
No data in user_resume_data table
  ↓
buildVerifiedMetrics() query returns 0 rows
  ↓
Throws error: "Resume data not found"
  ↓
Optimization fails completely (User 2 blocked)
```

**Additional Risk:**
Same pattern may exist in other schemas:
- `education.graduation_date` - students may omit dates
- `work_experience.end_date` - "Present" might parse as null
- `certifications.credential_id` - often missing

---

## Comprehensive Fix Specification

### Fix 1A: Remove Brittle Metrics Extraction (Issue 1)

**File:** `frontend/lib/resume/verified-metrics.ts`

**Change:** Stop using regex extraction. Pass **raw resume data** directly to LLM.

**BEFORE (lines 351-361):**
```typescript
// Extract revenue metrics (simple pattern matching for MVP)
const revenue: VerifiedRevenue = extractRevenueMetrics(allBullets);  // ❌ LOSES DATA

// Extract client/efficiency/product metrics
const clients: VerifiedClients = extractClientMetrics(allBullets);  // ❌ BRITTLE
const efficiency: VerifiedEfficiency = extractEfficiencyMetrics(allBullets);
const team: VerifiedTeam = extractTeamMetrics(allBullets);
const product: VerifiedProduct = extractProductMetrics(allBullets);

// Platforms - extract from bullets or use generic
const platforms: VerifiedPlatforms = extractPlatformNames(allBullets);  // ❌ FAILS
```

**AFTER:**
```typescript
// Pass raw data directly - let LLM extract metrics during generation
// No pattern matching, no data loss
const metrics: VerifiedMetrics = {
  contact: {
    name: data.name,
    location: data.location || 'Location not provided',
    phone: data.phone || 'Phone not provided',
    email: data.email,
    linkedin: data.linkedin || 'LinkedIn not provided',
    portfolio: data.portfolio || 'Portfolio not provided'
  },

  // Technologies from skills section
  technologies: [
    ...(skills.technical || []),
    ...(skills.tools || [])
  ].slice(0, 10),

  // Education
  education: {
    degree: edu.degree,
    institution: edu.institution,
    period: edu.period,
    cgpa: edu.cgpa || 'N/A'
  },

  // Certifications
  certifications: certs.map(cert => ({
    name: cert.name,
    date: cert.date,
    instructor: cert.instructor,
    achievement: cert.achievement
  })),

  // ✅ CRITICAL: Pass raw work experience (company names, roles, bullets)
  // LLM will extract metrics during generation (it's better at this than regex!)
  work_experience: workExperience  // Full structured data with bullets
};
```

**Remove Deprecated Functions (lines 423-564):**
- Delete: `extractRevenueMetrics()`
- Delete: `extractClientMetrics()`
- Delete: `extractEfficiencyMetrics()`
- Delete: `extractTeamMetrics()`
- Delete: `extractProductMetrics()`
- Delete: `extractPlatformNames()`
- Delete: `extractMetric()`

**Update Interface (lines 267-294):**
```typescript
export interface VerifiedMetrics {
  contact: VerifiedContact;
  technologies: string[];
  education: {
    degree: string;
    institution: string;
    period: string;
    cgpa: string;
  };
  certifications: Array<{
    name: string;
    date: string;
    instructor?: string;
    achievement?: string;
  }>;
  work_experience: Array<{
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }>;

  // Remove: revenue, clients, efficiency, team, product, platforms
  // These will be extracted by LLM from work_experience during generation
}
```

**Rationale:**
- ✅ No data loss - preserve everything from parsed resume
- ✅ No brittle regex - LLM extracts metrics naturally
- ✅ Simpler code - fewer moving parts
- ✅ Works for any resume format - not tied to specific patterns

---

### Fix 1B: Update System Prompt (Issue 1)

**File:** `frontend/lib/resume/system-prompt.ts`

**Change 1: Remove deprecated metrics sections (lines 115-205)**

**BEFORE:**
```typescript
# VERIFIED METRICS - USE ONLY THESE

## Revenue Impact
- PM-2 role: ${metrics.revenue.pm2_mrr}  // ❌ DEPRECATED
- APM role: ${metrics.revenue.apm_expansion}
// ... more deprecated metrics
```

**AFTER:**
```typescript
# USER'S RESUME DATA

## Contact Information
- Name: ${metrics.contact.name}
- Location: ${metrics.contact.location}
- Email: ${metrics.contact.email}
- LinkedIn: ${metrics.contact.linkedin}

## Work Experience (Extract metrics from here!)

${metrics.work_experience.map((exp, idx) => `
### Experience ${idx + 1}: ${exp.company}
**Role:** ${exp.role}
**Period:** ${exp.period}

**Achievements:**
${exp.bullets.map(bullet => `- ${bullet}`).join('\n')}
`).join('\n')}

**YOUR TASK:** Extract metrics from bullets above:
- Revenue/growth numbers (MRR, ARR, expansion, clients, etc.)
- Efficiency improvements (uptime, delivery time, success rates, etc.)
- Team size and composition
- Product metrics (integrations, APIs, time savings, etc.)
- Platform/product names (use actual company names, NOT generic terms)

Use these extracted metrics naturally in your generated content.

## Education
${metrics.education.degree} - ${metrics.education.institution} (${metrics.education.period})
${metrics.education.cgpa !== 'N/A' ? `CGPA: ${metrics.education.cgpa}` : ''}

## Certifications
${metrics.certifications.map(cert =>
  `- ${cert.name} (${cert.date})${cert.instructor ? ` - ${cert.instructor}` : ''}${cert.achievement ? ` - ${cert.achievement}` : ''}`
).join('\n')}

## Technologies/Skills
${metrics.technologies.join(', ')}
```

**Change 2: Update accuracy rules (lines 115-160)**

**BEFORE:**
```typescript
## Rule 1: Only Use Verified Metrics

Every metric MUST come from the verified data below. If it's not listed, don't include it.

NEVER:
❌ Approximate ("~25%", "around 40%")
❌ Estimate ("roughly 15 engineers")
❌ Invent ("improved adoption 35%")
```

**AFTER:**
```typescript
## Rule 1: Extract and Use Metrics from Resume

Extract metrics from the Work Experience bullets above:
- Look for revenue/growth numbers (₹20M MRR, $2M expansion, 50+ clients, etc.)
- Look for efficiency improvements (99.9% uptime, 6 weeks → 10 days, 95% success rate, etc.)
- Look for team sizes (team of 10 engineers, led 20-person team, etc.)
- Look for product metrics (30+ integrations, 200+ hours saved, 60% faster, etc.)

CRITICAL RULES:
✅ Use EXACT numbers from bullets (don't modify or estimate)
✅ If a metric isn't explicitly stated, DON'T invent it
✅ Preserve currency symbols and formats (₹, $, %, etc.)
✅ Use actual company/platform names from work experience (not generic terms)

NEVER:
❌ Approximate explicit numbers ("~25%" when bullet says "25%")
❌ Estimate missing data ("roughly 15 engineers" if not stated)
❌ Invent metrics not found in bullets
❌ Use generic platform names when actual names are given ("integration platform" when bullet says "Channel Connect (ICC)")
```

**Change 3: Remove company name prohibition (lines 132-151)**

**DELETE THIS SECTION:**
```typescript
## Rule 2: Company Name Placement - CRITICAL

Company names appear ONLY in role header line:
[Company Name] | [Your Title] | [Dates]

In bullet content, use generic descriptions:
✅ "Led enterprise integration platform..."
✅ "Architected warehouse management system..."

NEVER use specific company/product names in bullets:
❌ "Led ICC platform..." (ICC is company-specific)
❌ "Built WMS 2.0..." (internal product name)
```

**REPLACE WITH:**
```typescript
## Rule 2: Use Actual Platform/Product Names

When the user's resume mentions specific platform or product names in bullets, USE THEM:
✅ "Led Channel Connect (ICC) platform..." (if resume says this)
✅ "Architected WMS 2.0 system..." (if resume says this)
✅ "Built order management solution..." (if resume uses generic term)

Mirror the terminology from the user's actual work experience bullets.
Don't genericize platform names that are explicitly stated in their resume.
```

**Rationale:**
- ✅ LLM now has full resume context (company names, bullets, metrics)
- ✅ Instructions tell Claude to extract metrics (what LLMs are good at)
- ✅ No contradiction - use actual resume data, not placeholders
- ✅ Preserves user's actual accomplishments and terminology

---

### Fix 1C: Fix User Prompt Contradiction (Issue 1)

**File:** `frontend/lib/resume/system-prompt.ts` (line 509)

**BEFORE:**
```typescript
Remember:
- ONLY use metrics from VERIFIED METRICS section
- Team size is ALWAYS ${metrics.team.size} engineers
- Use specific platform names (ICC, WMS 2.0, not generic names)  // ❌ CONTRADICTION!
- Mirror JD language naturally
```

**AFTER:**
```typescript
Remember:
- Extract metrics from the Work Experience bullets provided in system prompt
- Use EXACT numbers from bullets (don't approximate or invent)
- Use actual company/platform names from user's resume (don't use placeholder names like "ICC" or "WMS 2.0" unless they appear in the user's actual bullets)
- Mirror JD language naturally while preserving user's actual accomplishments
- If a metric isn't explicitly stated in bullets, omit it (don't estimate)
```

**Rationale:**
- ✅ Removes contradiction
- ✅ Tells Claude to use actual resume data
- ✅ Prevents placeholder company names (ICC, WMS 2.0) from appearing

---

### Fix 2: Schema Flexibility (Issue 2)

**File:** `frontend/lib/resume/resume-parser.ts`

**Change 1: Fix Certification Schema (line 44-49)**

**BEFORE:**
```typescript
const CertificationSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),  // ❌ BLOCKING: requires string
  instructor: z.string().nullish(),
  achievement: z.string().nullish()
});
```

**AFTER:**
```typescript
const CertificationSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1).nullish(),  // ✅ FLEXIBLE: allows null/undefined
  instructor: z.string().nullish(),
  achievement: z.string().nullish()
});
```

**Change 2: Review All Schemas for Similar Issues**

**WorkExperienceSchema (lines 24-29):**
```typescript
// REVIEW: Should period be flexible too?
const WorkExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),  // Could be missing for very old roles
  bullets: z.array(z.string().min(1)).min(1)
});

// RECOMMENDATION: Make period flexible
period: z.string().min(1).nullish().default('Dates not specified'),
```

**EducationSchema (lines 37-42):**
```typescript
const EducationSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  period: z.string().min(1),  // Could be missing
  cgpa: z.string().nullish()  // ✅ Already flexible
});

// RECOMMENDATION: Make period flexible
period: z.string().min(1).nullish().default('Dates not specified'),
```

**Change 3: Improve Error Messages (lines 280-294)**

**BEFORE:**
```typescript
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error('[ResumeParser] LLM parsing failed', { error: JSON.stringify(error.errors) });

    try {
      const errorDetails = error.errors.map(e =>
        `- Field: ${e.path.join('.')}, Error: ${e.message}`
      ).join('\n');

      throw new Error(`Resume validation failed: ${errorDetails}`);
    } catch (mapError) {
      // Fallback if error formatting fails
      logger.error('[ResumeParser] Failed to format Zod errors', { mapError, zodError: error });
      throw new Error(`Resume validation failed: ${JSON.stringify(error.errors || 'No error details')}`);
    }
  }
```

**AFTER:**
```typescript
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorDetails = error.errors.map(e => {
      const field = e.path.join('.');
      const message = e.message;
      const expected = 'expected' in e ? e.expected : 'unknown';
      const received = 'received' in e ? e.received : 'unknown';

      return `Field "${field}": ${message} (expected: ${expected}, received: ${received})`;
    }).join('\n');

    logger.error('[ResumeParser] Zod validation failed', {
      error: errorDetails,
      raw_errors: error.errors
    });

    throw new Error(
      `Resume validation failed. Please check that your resume has:\n${errorDetails}\n\nIf you believe this is an error, please contact support.`
    );
  }
```

**Rationale:**
- ✅ Fixes immediate blocking issue (certification dates)
- ✅ Prevents similar issues in other fields
- ✅ Better error messages help users understand what went wrong
- ✅ System handles real-world resume variability

---

## Testing Strategy

### Test Case 1: User 1 (Raghav) - Content Quality

**Setup:**
- User: raghavmht9@gmail.com / secure_password_123
- Resume: Already uploaded and parsed successfully
- Job: Any technical PM role

**Test Steps:**
1. Log in as User 1
2. Optimize resume for a new job (different from previous test)
3. Download generated resume
4. **Verify content quality:**
   - [ ] Contains actual company names from resume (Meesho, Nextyn, Microsoft, etc.)
   - [ ] Contains actual metrics from resume bullets (not placeholders)
   - [ ] Contains actual skills from resume (SQL, Python, Product Analytics, etc.)
   - [ ] NO placeholder names (ICC, WMS 2.0, etc.) unless they're in User 1's actual resume
   - [ ] Bullets sound personalized, not generic
   - [ ] Professional summary mentions actual experience
5. **Check validation logs:**
   - [ ] No "unverified metric" warnings
   - [ ] Validation passes (is_valid: true)
   - [ ] No corrections needed

**Expected Result:**
- High-quality, personalized resume using User 1's actual data
- Validation passes without corrections
- User can confidently apply with this resume

---

### Test Case 2: User 2 (Test User) - Parsing Success

**Setup:**
- User: testuser@example.com / test_password_456
- Resume: Previously failed at parsing (certification dates)
- Job: Any senior SWE role

**Test Steps:**
1. Log in as User 2
2. Delete existing resume (if any) from dashboard
3. Upload Test_Resume_1.docx again
4. **Verify parsing succeeds:**
   - [ ] Upload completes without errors
   - [ ] Parsing status: "success" (not "failed")
   - [ ] Data visible in "Current Resume" section
   - [ ] Certifications displayed (even if dates missing)
5. Extract job description from LinkedIn
6. Click "Optimize Resume"
7. **Verify optimization succeeds:**
   - [ ] No "Resume data not found" error
   - [ ] Generation completes successfully
   - [ ] Download link appears
8. Download and review generated resume
9. **Verify content quality:**
   - [ ] Contains User 2's actual company names
   - [ ] Contains User 2's actual role ("Senior Software Engineer")
   - [ ] Contains User 2's actual skills and experience
   - [ ] Tailored to job description
   - [ ] Professional and personalized

**Expected Result:**
- Parsing succeeds despite missing certification dates
- Optimization completes successfully
- Generated resume is high quality and personalized

---

### Test Case 3: Multi-Tenant Data Isolation

**Setup:**
- User 1: raghavmht9@gmail.com (already has resume)
- User 2: testuser@example.com (now has resume after Fix 2)

**Test Steps:**
1. Log in as User 1
2. Optimize resume → download
3. **Verify User 1's resume:**
   - [ ] Contains User 1's data only (Raghav's companies, role, experience)
   - [ ] NO data from User 2's resume
4. Logout
5. Log in as User 2
6. Optimize resume → download
7. **Verify User 2's resume:**
   - [ ] Contains User 2's data only (Test User's companies, Senior SWE role)
   - [ ] NO data from User 1's resume (Raghav's data)
8. **Database check (optional):**
   - Query user_resume_data table
   - Verify each user's row contains only their data
   - Verify RLS policies working (user_id filtering)

**Expected Result:**
- Perfect data isolation - User 1 and User 2 never see each other's data
- RLS policies enforced correctly
- Multi-tenant architecture validated

---

### Test Case 4: Edge Cases (Resume Variability)

**Test different resume formats to ensure flexibility:**

**4A: Missing Optional Fields**
- Resume with no portfolio URL
- Resume with no LinkedIn
- Resume with certifications but no dates
- Resume with education but no CGPA
- **Expected:** Parsing succeeds, uses "not provided" for missing fields

**4B: "Present" Employment**
- Resume with current role (end date = "Present" or null)
- **Expected:** Parsing succeeds, period shows "Jan 2020 - Present"

**4C: Multiple Formats**
- Dates in different formats: "Jan 2020", "2020-01", "January 2020"
- Different currency symbols: ₹, $, €
- Different metrics formats: "20M+", "20 million", "20M"
- **Expected:** LLM extracts correctly, validation passes

**4D: Minimal Resume**
- Resume with only 1 work experience
- Resume with no certifications
- **Expected:** Parsing succeeds with minimal data, optimization works

---

## Implementation Checklist

### Priority 1: Fix Issue 2 (Blocking - 15 minutes)

- [ ] **File:** `frontend/lib/resume/resume-parser.ts`
  - [ ] Line 46: Change `date: z.string().min(1)` → `date: z.string().min(1).nullish()`
  - [ ] Review other schemas (WorkExperience, Education) for similar issues
  - [ ] Update error messages for better UX (lines 280-294)
- [ ] Test: User 2 uploads resume → parsing succeeds
- [ ] Test: User 2 optimizes resume → generation succeeds

### Priority 2: Fix Issue 1A (Metrics Extraction - 30 minutes)

- [ ] **File:** `frontend/lib/resume/verified-metrics.ts`
  - [ ] Lines 351-361: Remove all `extract*Metrics()` calls
  - [ ] Replace with direct pass-through of parsed data
  - [ ] Delete deprecated functions (lines 423-564)
  - [ ] Update `VerifiedMetrics` interface (lines 267-294)
  - [ ] Remove static constants (lines 22-161) or mark clearly as deprecated
- [ ] Test: buildVerifiedMetrics() returns full work_experience data
- [ ] Test: No "not specified" fallbacks in metrics object

### Priority 3: Fix Issue 1B (System Prompt - 30 minutes)

- [ ] **File:** `frontend/lib/resume/system-prompt.ts`
  - [ ] Lines 162-205: Replace "VERIFIED METRICS" with "USER'S RESUME DATA"
  - [ ] Inject full work_experience bullets with formatting
  - [ ] Update Rule 1 (accuracy) to "Extract and Use" (lines 115-130)
  - [ ] Delete Rule 2 (company name prohibition) (lines 132-151)
  - [ ] Replace with new Rule 2 (use actual names)
- [ ] Test: System prompt includes full resume bullets
- [ ] Test: No contradiction about company names

### Priority 4: Fix Issue 1C (User Prompt - 5 minutes)

- [ ] **File:** `frontend/lib/resume/system-prompt.ts`
  - [ ] Line 509: Remove "Use specific platform names (ICC, WMS 2.0)"
  - [ ] Replace with "Use actual names from user's resume"
- [ ] Test: User prompt doesn't contradict system prompt

### Priority 5: End-to-End Testing (30 minutes)

- [ ] Test Case 1: User 1 content quality
- [ ] Test Case 2: User 2 parsing + optimization
- [ ] Test Case 3: Multi-tenant data isolation
- [ ] Test Case 4: Edge cases

### Priority 6: Update Story Status

- [ ] Mark Story 2.6.1 Task 7 as complete
- [ ] Update story status to "done"
- [ ] Document testing results in story file

**Total Estimated Effort:** ~2 hours (including testing)

---

## Architectural Patterns (Prevent Future Regressions)

### Pattern 1: Trust the LLM

**DON'T:**
```typescript
// ❌ Brittle regex extraction
function extractMetric(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match ? match[1] : 'Not found';
}
```

**DO:**
```typescript
// ✅ Pass raw data to LLM, let it extract
const prompt = `
User's work experience:
${bullets.join('\n')}

Extract revenue metrics from above.
`;
```

**Rationale:** LLMs are built for context understanding. Regex is brittle. Use the right tool for the job.

---

### Pattern 2: Flexible Schemas (Real-World Data)

**DON'T:**
```typescript
// ❌ Strict schema breaks on real resumes
const schema = z.object({
  date: z.string().min(1),  // Requires exact string
  phone: z.string().min(1),  // What if no phone?
});
```

**DO:**
```typescript
// ✅ Flexible schema handles variability
const schema = z.object({
  date: z.string().min(1).nullish().default('Date not provided'),
  phone: z.string().nullish().default('Phone not provided'),
});
```

**Rationale:** Real-world data is messy. Schemas should be defensive and flexible.

---

### Pattern 3: Preserve Raw Data (Don't Transform Early)

**DON'T:**
```typescript
// ❌ Early transformation loses data
const revenue = extractRevenue(bullets);  // Returns "Not found" if pattern fails
// Original bullets lost!
```

**DO:**
```typescript
// ✅ Keep raw data, transform late (or let LLM do it)
const metrics = {
  work_experience: bullets  // Preserve everything
};
// LLM extracts during generation
```

**Rationale:** Early transformation is lossy. Keep raw data as long as possible.

---

### Pattern 4: Consistent Instructions (No Contradictions)

**DON'T:**
```typescript
// System prompt
const systemPrompt = "Never use company names in bullets";

// User prompt
const userPrompt = "Use company names like ICC, WMS 2.0";  // ❌ CONTRADICTION
```

**DO:**
```typescript
// System prompt
const systemPrompt = "Use actual company names from user's resume";

// User prompt
const userPrompt = "Extract company names from resume data above";  // ✅ CONSISTENT
```

**Rationale:** LLMs can't handle contradictions. Ensure instructions align across all prompts.

---

### Pattern 5: Comprehensive Error Messages

**DON'T:**
```typescript
// ❌ Cryptic error
throw new Error("Validation failed");
```

**DO:**
```typescript
// ✅ Actionable error
throw new Error(`
Resume validation failed:
- Field "certifications[0].date": expected string, received null
- Suggestion: Ensure all certifications have dates, or contact support

Raw error: ${JSON.stringify(zodError.errors)}
`);
```

**Rationale:** Users can't fix problems they don't understand. Detailed errors improve UX.

---

## Rollback Plan (If Fixes Fail)

### Rollback Strategy

**If Priority 1 fix causes issues:**
1. Revert `resume-parser.ts` schema change
2. Tell User 2 to add dates to certifications manually
3. Continue with Issue 1 fixes

**If Priority 2/3/4 fixes cause issues:**
1. Revert to regex extraction temporarily
2. Add logging to understand failure modes
3. Iterate on LLM prompt instructions

### Safe Rollback Points

- Commit after Priority 1 (schema fix) - isolated change
- Commit after Priority 2 (metrics extraction) - isolated from prompts
- Commit after Priority 3+4 (prompts) - can rollback independently

### Monitoring

After deployment:
- Check validation logs for new error patterns
- Monitor content quality metrics (user feedback)
- Track parsing success rates by user

---

## Long-Term Improvements (Post-MVP)

### V2 Enhancements

1. **LLM-based Metrics Extraction**
   - Use Claude to extract metrics from bullets (currently we pass raw bullets)
   - More sophisticated than regex, more structured than raw bullets

2. **Content Quality Scoring**
   - Automated quality checks on generated content
   - Metrics: keyword density, metric usage, personalization score
   - Alert if quality drops below threshold

3. **User Feedback Loop**
   - Allow users to rate generated resumes
   - Learn which JD + resume combinations produce best results
   - Improve prompts based on feedback

4. **Resume Format Diversity**
   - Support PDF parsing (currently DOCX only)
   - Support multiple languages
   - Handle different resume structures (European CV, academic CV, etc.)

5. **Prompt A/B Testing**
   - Test different system prompt variations
   - Measure content quality across variations
   - Optimize prompts based on data

---

## References

### Files Modified

**Issue 2 (Schema):**
- `frontend/lib/resume/resume-parser.ts` - Zod schema definitions

**Issue 1 (Content Quality):**
- `frontend/lib/resume/verified-metrics.ts` - Metrics extraction
- `frontend/lib/resume/system-prompt.ts` - System + user prompt builders

### Related Documentation

- Sprint 2 Multi-Tenant Work (for context on verified metrics design)
- Story 2.6.1 Implementation (authentication work that enabled this testing)
- CRITICAL_ISSUES_POST_AUTH_TESTING.md (problem analysis)

### Testing Credentials

- User 1: raghavmht9@gmail.com / secure_password_123
- User 2: testuser@example.com / test_password_456
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

**🏗️ Technical Specification Complete**

**Next Steps:**
1. Hand off to Dev Agent (Amelia) for implementation
2. Dev implements fixes following Priority 1 → 5
3. Dev commits after each priority for safe rollback
4. Dev runs all test cases
5. QA validates with both test users
6. Mark Story 2.6.1 as complete when tests pass

**Questions/Clarifications:** Contact Winston (Architect) or Bob (Scrum Master)

---

**Document Status:** Ready for Implementation
**Estimated Implementation Time:** 2 hours (including testing)
**Risk Level:** Low (well-isolated changes, clear rollback strategy)
**MVP Blocker:** YES - must fix before shipping to 10 users

**Created by:** Winston (Architect)
**Date:** 2026-01-11
**Approved by:** Pending (Bob, Scrum Master)
