# Sprint 2.5: Complete Resume Optimizer

**Created:** January 10, 2026
**Scrum Master:** Bob
**Sprint Goal:** Complete Feature 1 (Resume Optimizer) to 100% before starting Feature 2

---

## 🎯 Sprint Objective

Finish Resume Optimizer completely:
- Test end-to-end with real user data
- Verify multi-tenant isolation (RLS)
- Implement role extraction (seniority-based customization)
- Update documentation

**Why Sprint 2.5 (not Sprint 3):**
- Sprint 2 is 75% done - finish it properly
- Don't start new features with incomplete work
- 2 days investment = fully working Feature 1

---

## 📋 User Stories

### Story 1: End-to-End Testing & Validation

**As a** product owner
**I want** to verify resume generation works end-to-end with real user data
**So that** we can confidently claim multi-tenant is working

**Acceptance Criteria:**
- ✅ Generate optimized resume from uploaded resume
- ✅ Generated resume shows user's actual data (not hardcoded "Raghav Mehta")
- ✅ Multi-user isolation verified (User A ≠ User B data)
- ✅ RLS policies block cross-user access
- ✅ No P0 bugs found

**Tasks:**
1. Test resume generation (1.5 hours)
   - Upload resume (already done)
   - Paste job description
   - Click "Optimize Resume"
   - Download DOCX
   - Verify: Name, email, work experience correct

2. Multi-user RLS testing (1.5-2 hours)
   - Create User A via SQL (uuid: 11111111-1111-1111-1111-111111111111)
   - Create User B via SQL (uuid: 22222222-2222-2222-2222-222222222222)
   - Upload Resume A (Alice Smith)
   - Upload Resume B (Bob Jones)
   - Generate resumes for each
   - Verify data isolation
   - Test RLS (User A cannot access User B's data)

3. Bug fixes (0-1 hour buffer)
   - Fix any issues discovered

**Effort:** 3-4 hours
**Assigned:** Raghav (manual testing)
**Status:** READY TO START NOW

**SQL Scripts for Testing:**
```sql
-- Create User A
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'user-a@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Alice Smith"}'::jsonb, 'authenticated', 'authenticated');

-- Create User B
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('22222222-2222-2222-2222-222222222222'::uuid, 'user-b@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Bob Jones"}'::jsonb, 'authenticated', 'authenticated');

-- Verify RLS isolation
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
SELECT * FROM user_resume_data WHERE user_id = '22222222-2222-2222-2222-222222222222'; -- Should return EMPTY
RESET ROLE;
```

---

### Story 2: User Role Extraction

**As a** resume generator
**I want** to extract and use the user's actual role from their resume
**So that** generated content matches their seniority level and experience

**Context from Architect (Winston):**
- Current: System uses JD keyword matching only (ignores user's role)
- Gap: User's actual title ("PM - 2", "Senior PM") not used
- Solution: Hybrid approach (JD emphasis + user seniority)

**Acceptance Criteria:**
- ✅ Seniority level extracted from user's title (1-5 scale)
- ✅ System prompt tone adapts to seniority:
  - Level 1 (Associate): "Contributed to", "Collaborated with"
  - Level 2 (Mid): "Built", "Delivered", "Improved"
  - Level 3 (Senior): "Architected", "Led", "Drove"
  - Level 4 (Staff): "Established", "Designed org-wide"
  - Level 5 (Director+): "Drove vision", "Led organization"
- ✅ JD classification still used (hybrid, not replacement)
- ✅ Multi-tenant compatible (dynamic per user)
- ✅ Defaults gracefully for non-standard titles

**Implementation Design:**

**New File:** `lib/resume/role-extractor.ts` (150 lines)
```typescript
interface UserRoleProfile {
  raw_title: string;           // "Product Manager - 2"
  seniority_level: number;     // 1-5 scale
  base_title: string;          // "Product Manager"
  years_experience: number;    // Calculated from dates
}

export function extractUserRoleProfile(work_experience: WorkExperience[]): UserRoleProfile {
  const current = work_experience[0]; // Most recent role

  return {
    raw_title: current.role,
    seniority_level: parseSeniorityLevel(current.role),
    base_title: normalizeTitle(current.role),
    years_experience: calculateTotalYears(work_experience)
  };
}

function parseSeniorityLevel(role: string): number {
  // Extract numeric: "PM - 2" → 2, "PM-II" → 2
  const numMatch = role.match(/[-\s](\d+)$/);
  if (numMatch) return parseInt(numMatch[1]);

  // Keywords
  if (/senior|sr\.?|lead/i.test(role)) return 3;
  if (/associate|junior|jr\.?/i.test(role)) return 1;
  if (/staff|principal/i.test(role)) return 4;
  if (/director|vp|head/i.test(role)) return 5;

  return 2; // Default: mid-level
}

function calculateTotalYears(work_experience: WorkExperience[]): number {
  // Parse dates from period strings ("Jan 2020 - Present")
  // Sum durations
  // Return total years
}

function normalizeTitle(role: string): string {
  // "Product Manager - 2" → "Product Manager"
  return role.replace(/[-\s]\d+$/, '').trim();
}
```

**Modified File:** `lib/resume/content-generator.ts` (+20 lines)
```typescript
import { extractUserRoleProfile } from './role-extractor';

async generateResumeContent(
  jd_text: string,
  company_name: string,
  metrics: VerifiedMetrics
): Promise<ResumeContent> {

  // EXISTING: JD classification
  const jd_role_type = classifyRoleType(jd_text);

  // NEW: User's actual role
  const user_role = extractUserRoleProfile(metrics.work_experience);

  // HYBRID: Use both
  const system_prompt = buildSystemPrompt(jd_role_type, user_role, metrics);

  // ... rest unchanged
}
```

**Modified File:** `lib/resume/system-prompt.ts` (+60 lines)
```typescript
import type { UserRoleProfile } from './role-extractor';

export function buildSystemPrompt(
  jd_role_type: RoleType,
  user_role: UserRoleProfile,
  metrics: VerifiedMetrics
): string {

  const role_config = ROLE_CONFIGS[jd_role_type];
  const tone_guide = getSeniorityToneGuide(user_role.seniority_level);

  return `You're tailoring a resume for ${metrics.contact.name}, a ${user_role.raw_title} with ${user_role.years_experience}+ years of experience.

${tone_guide}

The target role emphasizes: ${role_config.emphasis.join(', ')}

...rest of prompt...
`;
}

function getSeniorityToneGuide(level: number): string {
  if (level >= 4) {
    return `Tone: Executive leadership. Focus on vision, strategy, cross-org impact. Use "Drove", "Established", "Led organization-wide".`;
  } else if (level === 3) {
    return `Tone: Senior expertise. Balance hands-on technical work with team leadership. Use "Architected", "Led", "Drove".`;
  } else if (level === 2) {
    return `Tone: Proven contributor. Show ownership and measurable impact. Use "Built", "Delivered", "Improved".`;
  } else {
    return `Tone: Eager learner with growing impact. Emphasize learning, collaboration, concrete contributions. Use "Contributed to", "Collaborated with", "Supported".`;
  }
}
```

**Testing Plan:**
1. Test "Product Manager - 2" → Expects level 2, mid-level tone
2. Test "Senior Product Manager" → Expects level 3, senior tone
3. Test "Associate PM" → Expects level 1, junior tone
4. Test "Director, Product" → Expects level 5, executive tone
5. Test "Product Lead" → Expects level 3 (keyword match)
6. Test non-standard title → Expects level 2 (default)

**Effort:** 4-5 hours
**Assigned:** Dev Agent (Amelia)
**Dependencies:** Story 1 complete
**Status:** READY FOR HANDOFF

---

### Story 3: Documentation Updates

**As a** future developer/agent
**I want** clear documentation on resume parsing and role extraction
**So that** I don't recreate the same patterns or make mistakes

**Acceptance Criteria:**
- ✅ project-context.md updated with resume parsing rules
- ✅ Dynamic metrics pattern documented
- ✅ Role extraction pattern documented
- ✅ Sprint 2 completion summary created

**Tasks:**
1. Update project-context.md (30 mins)
   - Add "Resume Parsing Rules" section
   - Document `buildVerifiedMetrics(user_id)` pattern
   - Document role extraction pattern
   - Add anti-patterns (never use hardcoded data)

2. Create Sprint 2 completion summary (30 mins)
   - What was built (6 stories from Sprint 2 plan)
   - What was tested (Story 1 results)
   - Architecture decisions made
   - Known limitations
   - Next steps (Feature 2)

**Effort:** 1 hour
**Assigned:** Dev Agent (Amelia) or Raghav
**Status:** READY AFTER STORY 2

**Content to Add to project-context.md:**
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

**Role Extraction Pattern:**
```typescript
// Extract user's actual role for seniority-based customization
const user_role = extractUserRoleProfile(work_experience);
// Combine with JD classification for hybrid approach
const system_prompt = buildSystemPrompt(jd_role_type, user_role, metrics);
```

**Error Handling:**
- ⚠️ **Missing resume data** - Show error: "Please upload resume first"
- ⚠️ **Parsing failure** - Retry with different prompt, fallback to manual (v2)
- ⚠️ **Invalid DOCX** - User-friendly error: "Invalid file format"
```

---

## 📅 Sprint Timeline (1.5-2 Days)

**Day 1 (Today):**
- Morning: Raghav tests Story 1 (generation + multi-user) - 3-4 hours
- Afternoon: Amelia starts Story 2 (role extraction) - 2 hours
  - Create role-extractor.ts
  - Modify content-generator.ts

**Day 2 (Tomorrow):**
- Morning: Amelia finishes Story 2 - 2-3 hours
  - Modify system-prompt.ts
  - Test role extraction
- Afternoon: Amelia/Raghav Story 3 (documentation) - 1 hour
- End of day: Sprint 2.5 COMPLETE

---

## ⚠️ Risk Assessment

### Risk 1: Testing Uncovers Bugs ⭐⭐⭐
**Likelihood:** MEDIUM
**Impact:** MEDIUM (delays completion)

**Mitigation:**
- Budget 1 hour for bug fixes in Story 1
- If bugs take longer, extend sprint by 0.5 day
- Document bugs in Sprint 2 completion summary

---

### Risk 2: Role Extraction Too Complex ⭐⭐
**Likelihood:** LOW
**Impact:** MEDIUM (Story 2 takes longer)

**Mitigation:**
- Winston's design is simple (pattern matching, no ML)
- Default to mid-level if detection fails
- Can defer edge cases to post-MVP

---

### Risk 3: Multi-User Testing Blocked ⭐⭐⭐⭐
**Likelihood:** LOW
**Impact:** HIGH (can't verify RLS)

**Mitigation:**
- SQL scripts provided (tested commands)
- If Supabase auth has issues, use service role workaround
- Worst case: Skip automated test, manual verification in production

---

## 📊 Success Metrics

**Sprint 2.5 Success = ALL of these:**

✅ **Functional:**
- Resume generation tested end-to-end with real data
- Multi-user isolation verified (RLS working)
- Role extraction implemented (seniority-based tone)

✅ **Technical:**
- No P0 bugs
- All code tested manually
- Documentation updated

✅ **Quality:**
- Generated resumes have correct user data (not hardcoded)
- Seniority level detection accuracy: 80%+ (simple cases work)
- System prompt adapts tone appropriately

---

## 🔄 Post-Sprint 2.5: What's Next?

### Feature 1 (Resume Optimizer): 100% COMPLETE ✅
- Sprint 1: Resume generation (DOCX output) - DONE
- Sprint 2: Multi-tenant parsing - DONE
- Sprint 2.5: Testing + role extraction - DONE (after this sprint)

### Feature 2 (Contact Finder): Next Sprint
- Status: NOT STARTED
- Priority: P1 MUST-HAVE
- Effort: 2-3 days
- Dependencies: None (can start immediately after Sprint 2.5)

### Feature 3 (Outreach Generator): Sprint 4
- Status: NOT STARTED
- Priority: P1 MUST-HAVE
- Effort: 2-3 days
- Dependencies: None (but Contact Finder is logical prerequisite)

**MVP Completion Timeline:**
- Sprint 2.5: Jan 10-11 (Feature 1 done)
- Sprint 3: Jan 13-15 (Feature 2 done)
- Sprint 4: Jan 16-18 (Feature 3 done)
- **MVP Launch:** Jan 19, 2026

---

## 📁 Files to Create/Modify

### New Files ✨
1. `lib/resume/role-extractor.ts` (150 lines) - Story 2
2. `_bmad-output/implementation-artifacts/sprint-2-completion-summary.md` - Story 3

### Modified Files ✏️
1. `lib/resume/content-generator.ts` (+20 lines) - Story 2
2. `lib/resume/system-prompt.ts` (+60 lines) - Story 2
3. `_bmad-output/project-context.md` (+50 lines) - Story 3

### SQL Scripts 📜
1. Create test users (User A, User B) - Story 1
2. Verify RLS policies - Story 1
3. Clean up test users - Story 1

---

## 🎯 Definition of Done

Sprint 2.5 is DONE when:

- [ ] Story 1 complete (tested, bugs fixed)
- [ ] Story 2 complete (role extraction working)
- [ ] Story 3 complete (docs updated)
- [ ] All acceptance criteria met
- [ ] No P0 bugs outstanding
- [ ] Sprint 2 completion summary created
- [ ] Feature 1 = 100% DONE ✅

---

## 📞 Next Steps

1. **Raghav:** Start Story 1 testing NOW
   - Test resume generation (your data)
   - Run multi-user SQL scripts
   - Verify RLS isolation

2. **Bob (SM):** Monitor progress, unblock issues

3. **Amelia (Dev):** Stand by for Story 2 handoff
   - Wait for Story 1 completion
   - Implement role extraction
   - Update documentation

4. **Post-Sprint:** Review and plan Sprint 3 (Contact Finder)

---

**Prepared By:** Bob (Scrum Master)
**Date:** January 10, 2026
**Sprint Duration:** 1.5-2 days
**Estimated Completion:** January 11, 2026
