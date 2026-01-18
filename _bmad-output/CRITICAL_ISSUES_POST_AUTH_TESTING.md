# Critical Issues Found - Post-Authentication Testing

**Date:** 2026-01-11
**Sprint:** 2.6.1 (User Authentication)
**Testing Phase:** Multi-tenant authentication testing with 2 users
**Status:** 🔴 CRITICAL - Quality and functionality issues blocking MVP

---

## Executive Summary

Authentication implementation (Story 2.6.1) is complete and working, but testing revealed **two critical quality issues** that prevent the system from generating high-quality, personalized resumes:

1. **Issue 1 (User 1)**: Content generation not using actual resume context - produces generic output instead of personalized content
2. **Issue 2 (User 2)**: Resume parsing fails due to strict Zod schema validation, blocking optimization entirely

Both issues indicate **architectural gaps** in the resume generation pipeline that need immediate attention.

---

## Issue 1: Content Quality - Not Using Resume Context 🔴

### Observed Behavior (User 1: raghavmht9@gmail.com)
- ✅ Authentication works
- ✅ Resume upload successful
- ✅ Resume parsing successful (3 work experiences, 3 certifications)
- ✅ Optimization workflow completes
- ❌ **Generated resume content is generic and doesn't use actual resume data**

### Expected vs Actual

**Expected:** Generated resume should extract and use:
- Actual company names from work experience (e.g., "Meesho", "Nextyn", "Microsoft")
- Real skills from resume (e.g., "SQL", "Python", "Product Analytics")
- Verified metrics from resume (e.g., "Led 5-person team", "Improved conversion by 15%")
- Professional experience descriptions matching job description requirements

**Actual:** Generated content appears generic/templated without pulling specific data from the parsed resume.

### Root Cause Analysis (from logs)

```
[INFO] [ResumeParser] Resume parsed successfully {
  name: 'RAGHAV MEHTA',
  email: 'raghavmht9@gmail.com',
  work_experience_count: 3,
  certifications_count: 3
}
```
✅ Parsing works - data is extracted and stored in database

```
[INFO] [VerifiedMetrics] Metrics built successfully {
  user_id: '5544832a-6f3b-407d-8821-45054dc28761',
  name: 'RAGHAV MEHTA'
}
```
✅ Metrics system loads user data

```
[WARN] [ContentValidator] Removed unverified metric { metric: '5+' }
[INFO] [ContentValidator] Validation complete { is_valid: false, errors: 1, warnings: 2, corrections_made: 1 }
```
⚠️ **Validation failing** - suggests content doesn't match user's actual metrics

### Technical Investigation Needed

1. **Content Generator LLM Prompt**: Is it actually receiving the parsed resume data?
   - Check `frontend/lib/resume/content-generator.ts`
   - Verify `buildSystemPrompt()` includes user's work experience, skills, certifications
   - Verify job description context is properly passed

2. **Verified Metrics System**: Is it building metrics from actual resume or using placeholders?
   - Check `frontend/lib/resume/verified-metrics.ts`
   - Verify `buildVerifiedMetrics(user_id)` fetches and processes real data

3. **Content Validator**: Why is validation failing?
   - Check `frontend/lib/resume/content-validator.ts`
   - Are validation rules too strict?
   - Is the LLM output format mismatched?

### Similar Issues from Sprint 2

**Note from user:** "It has the same problems which we tried solving during Sprint 2 around the content generation taking context out of the resume file about different data points: company name, keywords being used, skill set, professional experience matching it back to the job description."

**Action Required:** Review Sprint 2 fixes and verify they're still applied correctly.

---

## Issue 2: Resume Parsing Fails for User 2 (Zod Schema) 🔴

### Observed Behavior (User 2: testuser@example.com)
- ✅ Authentication works
- ✅ Resume file uploaded to storage
- ❌ **Resume parsing fails with Zod validation error**
- ❌ No data stored in `user_resume_data` table
- ❌ Optimization fails: "Resume data not found"

### Error Details

```
[ERROR] [ResumeParser] LLM parsing failed {
  error: '[
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["certifications", 0, "date"],
      "message": "Invalid input: expected string, received null"
    },
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["certifications", 1, "date"],
      "message": "Invalid input: expected string, received null"
    }
  ]'
}
```

### Root Cause

**Zod Schema Too Strict:**
File: `frontend/lib/resume/resume-parser.ts` (or schema definition file)

Current schema (presumed):
```typescript
certifications: z.array(z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),  // ❌ STRICT - requires string, doesn't allow null
  credential_id: z.string().optional()
}))
```

**Problem:** Some resumes don't have certification dates (e.g., "AWS Certified - no date listed"). The LLM correctly returns `null` for missing dates, but Zod rejects it.

### Fix Required

Make certification date optional/nullable:
```typescript
certifications: z.array(z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional().nullable(),  // ✅ FLEXIBLE - allows null/undefined
  credential_id: z.string().optional().nullable()
}))
```

### Cascading Impact

Because parsing failed:
1. Resume data NOT stored in database
2. `verified-metrics.ts` can't find user data
3. Optimization fails with error: "Resume data not found. Please upload your resume first"

**Error logs:**
```
[ERROR] [VerifiedMetrics] Resume data not found {
  user_id: 'd64fc881-3443-472e-9a73-e7cbb02730a9',
  error: {
    code: 'PGRST116',
    details: 'The result contains 0 rows',
    message: 'Cannot coerce the result to a single JSON object'
  }
}
```

### Additional Schema Review Needed

Check ALL Zod schemas for similar strict validation issues:
- `education.graduation_date` - might be missing
- `work_experience.end_date` - might be "Present" or null
- `certifications.credential_id` - often missing
- `skills.proficiency_level` - user might not specify

---

## Impact Assessment

### User Experience Impact
- 🔴 **Critical:** User 2 cannot use the system at all (parsing fails)
- 🔴 **Critical:** User 1 gets low-quality output (defeats purpose of the tool)
- 🔴 **Blocker:** Cannot test multi-tenant data isolation properly without both users working

### Technical Debt Impact
- Quality regression from Sprint 2 work
- Suggests testing gaps in previous sprints
- Schema rigidity issues across multiple parsers

### MVP Risk
- **Cannot ship to 10 users** with these quality issues
- User trust will be lost if output is generic
- Parsing failures will cause frustration

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (Dev Agent)
1. **Fix Zod Schema** (Issue 2):
   - Make `certifications.date` optional/nullable
   - Review all schemas for similar issues
   - Add better error messages for validation failures
   - **Estimated effort:** 30 minutes

2. **Verify Content Generation Context** (Issue 1):
   - Audit `content-generator.ts` to ensure parsed data is passed to LLM
   - Verify `verified-metrics.ts` builds metrics from actual resume
   - Check system prompt includes all user data
   - **Estimated effort:** 1 hour

### Phase 2: Architectural Review (Architect Agent)
1. Review entire resume generation pipeline:
   - Resume Parser → Verified Metrics → Content Generator → Validator
2. Identify gaps in context passing
3. Design comprehensive testing strategy for content quality
4. Document expected data flow

### Phase 3: Quality Assurance (QA Agent)
1. Test with diverse resume formats
2. Verify content quality with 5+ test cases
3. Check multi-tenant data isolation
4. Validate all edge cases (missing dates, ongoing employment, etc.)

---

## Testing Credentials

**User 1 (Working auth, poor quality output):**
- Email: `raghavmht9@gmail.com`
- Password: `secure_password_123`
- UUID: `5544832a-6f3b-407d-8821-45054dc28761`

**User 2 (Working auth, parsing failure):**
- Email: `testuser@example.com`
- Password: `test_password_456`
- UUID: `d64fc881-3443-472e-9a73-e7cbb02730a9`

---

## Related Files for Investigation

### Issue 1 (Content Quality):
- `frontend/lib/resume/content-generator.ts` - LLM content generation
- `frontend/lib/resume/verified-metrics.ts` - User metrics builder
- `frontend/lib/resume/system-prompt.ts` - LLM system prompt
- `frontend/lib/resume/content-validator.ts` - Output validation

### Issue 2 (Schema Validation):
- `frontend/lib/resume/resume-parser.ts` - Parser and Zod schema
- `frontend/types/resume.ts` - Type definitions (if separate schema file exists)

### Related API Routes:
- `frontend/app/api/resume/upload/route.ts` - Handles parsing
- `frontend/app/api/job/optimize/route.ts` - Handles generation

---

## Next Steps

1. ✅ Document issues (this file)
2. 🔄 Invoke Scrum Master to coordinate fixes
3. ⏳ Architect review of content generation pipeline
4. ⏳ Dev implements fixes for both issues
5. ⏳ QA tests with both users
6. ⏳ Complete Story 2.6.1 when quality is verified

---

**🎯 Created by Amelia (Dev Agent) - 2026-01-11**
**Reported by:** Raghav Mehta (Product Owner)
**Severity:** P0 - CRITICAL (blocks MVP)
