# Claude Code System Prompt - Resume System (Testing & Refinement)

**Context:** All 8 phases COMPLETE. LLM-as-Judge score: 98/100. Status: APPROVED FOR TESTING.

---

## ✅ Current Implementation Status

### Complete (All Phases Implemented)

```
frontend/lib/resume/
├── verified-metrics.ts              ✅ 100% Complete
├── role-configs.ts                  ✅ 100% Complete
├── system-prompt.ts                 ✅ 100% Complete
├── content-generator.ts             ✅ Fixed & Complete
├── content-validator.ts             ✅ Fixed & Complete
├── content-mapper.ts                ✅ 100% Complete
├── javascript-document-generator.ts ✅ 100% Complete
├── resume-generator.ts              ✅ 100% Complete
├── config.ts                        ✅ Complete
└── index.ts                         ✅ Complete

frontend/app/api/job/optimize/route.ts  ✅ Complete
frontend/lib/api/claude.ts              ✅ Updated (system prompt support)
```

**LLM-as-Judge Verdict:** ⭐⭐⭐⭐⭐ APPROVED FOR TESTING

---

## 🎯 Your Mission (Testing & Refinement Phase)

### Priority 1: Validate Installation ⭐ START HERE

**Check 1: docx Package**
```bash
cd frontend
npm list docx
```

**If missing:**
```bash
npm install docx
```

**Expected:** `docx@latest` installed

---

**Check 2: Environment Variables**
```bash
# Verify in .env or .env.local
cat .env.local | grep ANTHROPIC_API_KEY
cat .env.local | grep RESUME
```

**Required:**
- `ANTHROPIC_API_KEY` - Must be set
- `RESUME_WORKING_DIR` - Optional (defaults to temp)
- `RESUME_OUTPUT_DIR` - Optional (defaults to temp)

**If missing API key:**
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
```

---

**Check 3: Development Server**
```bash
npm run dev
```

**Expected:** Server starts on http://localhost:3000

---

### Priority 2: End-to-End Testing

**Test 1: Simple Technical PM Resume**

**Sample JD:**
```
Product Manager - Cloud Support Platform

We're looking for a PM to lead our cloud support platform serving enterprise customers.

Requirements:
- 4+ years PM experience with technical platforms
- Experience with support escalation workflows
- Strong collaboration with engineering teams
- Track record of 99.9%+ uptime

You'll work on platform architecture, API design, and reliability improvements.
```

**Expected Output:**
```
✅ Resume generated: Raghav_Mehta_Resume_CloudSupportPlatform_2025.docx
✅ File size: 20-40KB
✅ Uploaded to Supabase
✅ Signed URL returned
```

**Validation:**
1. Download .docx file
2. Open in Word/LibreOffice
3. Verify exactly 1 page
4. Check all metrics are verified (no "35-45% adoption")
5. Check team size is 20 (not 15)
6. Check platform names specific (ICC, WMS 2.0)

---

**Test 2: Growth PM Resume**

**Sample JD:**
```
Growth Product Manager

Join our growth team to drive user acquisition and retention.

Requirements:
- Experience with A/B testing and experimentation
- Data-driven decision making
- User analytics platforms (Mixpanel, Amplitude)
- Growth strategy and execution
```

**Expected Output:**
- Skills emphasize Growth & Experimentation
- Summary mentions growth focus
- Different from Test 1 (role-specific customization)

---

**Test 3: UX-Focused PM Resume**

**Sample JD:**
```
Product Manager - User Experience

Lead product initiatives with strong UX focus.

Requirements:
- User research and usability testing
- Collaboration with design teams
- Creating user-centered products
- Balancing user needs with business goals
```

**Expected Output:**
- Skills emphasize UX/UI & Design
- Summary mentions user-centered approach
- Different from Tests 1 & 2

---

### Priority 3: Validation Checks (Critical)

**Run these after each test:**

**Check 1: Metric Accuracy**
```bash
# Open generated .docx
# Search for these patterns:

✅ SHOULD appear:
- "₹20M+ MRR"
- "20 engineers" (or "20 senior engineers")
- "Channel Connect (ICC)" or "ICC"
- "WMS 2.0"
- "99.9% uptime"
- "95%+ deployment success"

❌ SHOULD NOT appear:
- "35-45% adoption" (unverified)
- "~25%" (approximation)
- "15 engineers" (wrong team size)
- "support platform" (too generic - should be ICC)
- "warehouse platform" (too generic - should be WMS 2.0)
```

**Check 2: Page Length**
```bash
# Method 1: Visual inspection (open in Word)
# Should be exactly 1 page, no overflow

# Method 2: If PDF conversion available
pdfinfo Resume.pdf | grep "Pages:"
# Should output: Pages: 1
```

**Check 3: File Structure**
```bash
# Check .docx file
ls -lh /path/to/outputs/*.docx

# Expected: 20-40KB (20KB if minimal, 40KB if full content)
# If < 10KB: File might be empty/corrupted
# If > 100KB: File might have images/issues
```

---

### Priority 4: Bug Fixes & Improvements

**If Issues Found During Testing:**

**Issue 1: "Module not found: docx"**
```bash
cd frontend
npm install docx
npm run dev
```

**Issue 2: "ANTHROPIC_API_KEY not found"**
```bash
# Add to .env.local
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." >> .env.local
# Restart server
```

**Issue 3: Resume exceeds 1 page**
```typescript
// Check content-generator.ts
// LLM should be instructed to keep content concise

// If needed, adjust in system-prompt.ts:
// - Reduce PM-2 bullets from 3 to 2
// - Shorten summary from 8 to 6 lines
```

**Issue 4: Unverified metrics appear**
```typescript
// content-validator.ts should catch these
// If not caught, strengthen validation in:
frontend/lib/resume/content-validator.ts

// Check auto-correct is enabled:
const validation_result = this.validator.validate(content, true); // true = auto-correct
```

**Issue 5: Generic platform names**
```typescript
// content-validator.ts should detect
// Check GENERIC_PLATFORM_NAMES in content-validator.ts

// Should flag:
- "support platform" → suggest "Channel Connect (ICC)"
- "warehouse platform" → suggest "WMS 2.0"
```

---

### Priority 5: Performance Optimization (Optional)

**If generation is slow (> 30 seconds):**

**Check 1: Claude API Response Time**
```typescript
// Add timing logs in content-generator.ts
console.time('Claude API call');
const response = await generateWithClaudeAdvanced(...);
console.timeEnd('Claude API call');
```

**Check 2: Node.js Execution Time**
```typescript
// Add timing logs in javascript-document-generator.ts
console.time('JavaScript execution');
await execPromise(`cd ${WORKING_DIR} && node ${TEMP_JS_FILE}`);
console.timeEnd('JavaScript execution');
```

**Typical Timings:**
- Claude API: 5-15 seconds
- JavaScript execution: 2-5 seconds
- Total: 10-25 seconds
- If > 30 seconds: investigate bottleneck

---

## 🔍 LLM-as-Judge Findings (What Was Fixed)

### Fix 1: Content Generator - Claude API Wrapper ✅

**Before (Wrong):**
```typescript
const response = await fetch(ANTHROPIC_API_URL, { ... })
```

**After (Correct):**
```typescript
const response_text = await generateWithClaudeAdvanced({
  userPrompt: user_prompt,
  systemPrompt: system_prompt,  // ✅ Now supports system prompts
  model: MODEL,
  maxTokens: MAX_TOKENS
});
```

**Status:** ✅ Fixed and verified

---

### Fix 2: Content Validator - Strengthened Metric Detection ✅

**Added patterns:**
```typescript
const metric_patterns = [
  /\d+-\d+%/g,                    // 35-45%, 80-90%
  /\d+%/g,                        // 25%, 95%
  /₹\d+M\+?/g,                    // ₹20M+
  /\$\d+M\+?/g,                   // $10M+
  /\d+\s+engineers?/gi,           // 20 engineers
  /\d+\.\d+%/g,                   // 99.9%
];

// Special team size validation
const team_match = normalized_metric.match(/(\d+)\s+engineers?/i);
if (team_match) {
  const found_size = parseInt(team_match[1]);
  return found_size === 20;  // Only 20 is verified
}
```

**Status:** ✅ Fixed and verified

---

### Fix 3: File Path Configuration ✅

**Added config.ts:**
```typescript
export const FILE_PATHS = {
  working_dir: process.env.RESUME_WORKING_DIR || path.join(os.tmpdir(), 'resume-generator'),
  output_dir: process.env.RESUME_OUTPUT_DIR || path.join(os.tmpdir(), 'resume-outputs'),
  get temp_script() {
    return path.join(this.working_dir, 'temp_resume_generator.js');
  }
};
```

**Status:** ✅ Fixed and verified

---

### Fix 4: Education & Certifications ✅

**Added to content-mapper.ts:**
```typescript
education: {
  degree: string;
  institution: string;
  period: string;
  cgpa: string;
};
certifications: Array<{
  name: string;
  instructor?: string;
  achievement?: string;
  date: string;
}>;
```

**Status:** ✅ Fixed and verified

---

## 📊 Testing Checklist

### Pre-Testing Setup
- [ ] `npm install docx` completed
- [ ] `ANTHROPIC_API_KEY` set in .env.local
- [ ] `npm run dev` running successfully
- [ ] Can access http://localhost:3000

### Test Execution
- [ ] Test 1: Technical PM JD → Resume generated
- [ ] Test 2: Growth PM JD → Resume generated (different from Test 1)
- [ ] Test 3: UX-focused PM JD → Resume generated (different from Tests 1-2)

### Validation (For Each Test)
- [ ] File size 20-40KB
- [ ] Opens in Word/LibreOffice
- [ ] Exactly 1 page
- [ ] All metrics verified (₹20M+ MRR, 20 engineers, 99.9% uptime)
- [ ] Platform names specific (ICC, WMS 2.0)
- [ ] No unverified metrics (35-45% adoption)
- [ ] No approximations (~25%)
- [ ] Team size is 20 (not 15)
- [ ] Contact info correct (Bangalore, India)
- [ ] Horizontal lines under section headers only
- [ ] Text is justified

### Role-Specific Customization
- [ ] Technical PM emphasizes Platform & Architecture
- [ ] Growth PM emphasizes Growth & Experimentation
- [ ] UX PM emphasizes UX/UI & Design
- [ ] Summary changes per role type
- [ ] Skills categories change per role type

---

## 🚨 Known Issues (From LLM-as-Judge)

### Issue 1: Page Length Optimizer Not Implemented

**Status:** Deferred (low priority)  
**Impact:** Low - System prompt instructs LLM to fit on 1 page  
**Workaround:** Manual adjustment if needed

**If needed in future:**
```typescript
// Create: frontend/lib/resume/page-length-optimizer.ts
class PageLengthOptimizer {
  optimize(content: string): string {
    // 1. Estimate page length
    // 2. If > 1 page, reduce:
    //    - PM-2 bullets from 3 to 2
    //    - Summary from 8 to 6 lines
    // 3. Regenerate
  }
}
```

---

### Issue 2: PDF Conversion Not Implemented

**Status:** User decision - DOCX only  
**Impact:** None (user will convert manually if needed)  
**Action:** No action required

---

## 💡 Potential Improvements (After Testing)

### Improvement 1: Caching Role Classifications

**Current:** Classifies JD text every time  
**Improvement:** Cache classification for same JD

```typescript
// In content-generator.ts
const cache = new Map<string, RoleType>();
const cached_role = cache.get(jd_text_hash);
if (cached_role) return cached_role;
```

**Priority:** Low (nice-to-have)

---

### Improvement 2: Batch Resume Generation

**Current:** One resume at a time  
**Improvement:** Generate multiple resumes for multiple JDs

```typescript
// New function in resume-generator.ts
async generateBatch(requests: GenerateRequest[]): Promise<GenerateResult[]> {
  return Promise.all(requests.map(req => this.generate(req)));
}
```

**Priority:** Medium (useful for testing)

---

### Improvement 3: Resume Preview (Before Download)

**Current:** User downloads to see result  
**Improvement:** Show preview in browser

**Priority:** Low (requires frontend work)

---

## 🎯 Success Criteria (Final Validation)

### Technical Validation
- [ ] All 3 test resumes generate successfully
- [ ] Each resume exactly 1 page
- [ ] All metrics verified (no false claims)
- [ ] Team size always 20
- [ ] Platform names specific
- [ ] File sizes 20-40KB
- [ ] No errors in console

### User Acceptance
- [ ] Generated resumes match user's manual quality
- [ ] Role-specific customization works
- [ ] Generation time < 30 seconds
- [ ] Downloads work in browser
- [ ] No manual post-processing needed

### Code Quality
- [ ] No TypeScript errors
- [ ] All imports resolve
- [ ] Error handling comprehensive
- [ ] Logging clear and helpful

---

## 🚀 Your Action Plan

### Step 1: Validate Installation (5 minutes)
```bash
cd frontend
npm install docx
npm list docx
cat .env.local | grep ANTHROPIC_API_KEY
npm run dev
```

### Step 2: Run First Test (10 minutes)
```bash
# Start dev server: npm run dev
# Navigate to: http://localhost:3000/resume-optimizer
# Upload any resume (placeholder)
# Enter Technical PM JD (see sample above)
# Click "Optimize Resume"
# Download .docx
# Open and validate
```

### Step 3: Validate Output (5 minutes)
```bash
# Check file:
ls -lh /path/to/downloaded/Resume.docx

# Open in Word/LibreOffice
# Verify:
# - 1 page only
# - ₹20M+ MRR appears
# - 20 engineers appears
# - ICC or WMS 2.0 appears
# - No "35-45%" or "~25%"
# - No "15 engineers"
```

### Step 4: Run Additional Tests (20 minutes)
```bash
# Repeat Step 2-3 with:
# - Growth PM JD
# - UX-focused PM JD

# Compare outputs:
# - Should have different skills categories
# - Should have different summaries
# - Should emphasize different aspects
```

### Step 5: Report Results
```bash
# If all tests pass:
✅ System validated and ready for production

# If issues found:
❌ Report specific issues with examples
🔧 Fix issues using guidance above
🔄 Re-test after fixes
```

---

## 📝 Quick Reference

### File Locations
```
Implementation:    frontend/lib/resume/
API Route:         frontend/app/api/job/optimize/route.ts
Reference Docs:    docs/_bmad-guidelines/
User's JS Script:  docs/_bmad-guidelines/resume-generation-script.js
```

### Key Commands
```bash
npm install docx                    # Install dependency
npm run dev                         # Start server
npm run build                       # Production build
npx tsx scripts/test-resume.ts      # If test script exists
```

### Important Constants
```typescript
MODEL: "claude-sonnet-4-20250514"
MAX_TOKENS: 4096
TEAM_SIZE: 20 (always)
PAGE_LENGTH: 1 (always)
```

---

## 🎬 START HERE

**Your first command:**

```bash
cd frontend && npm install docx && npm list docx && npm run dev
```

**Expected output:**
```
docx@8.5.0

> dev
> next dev

▲ Next.js 14.x.x
- Local: http://localhost:3000
```

**Then:** Navigate to resume optimizer page and run Test 1 (Technical PM JD).

---

**Implementation is COMPLETE. Focus on TESTING and VALIDATION.** 🚀