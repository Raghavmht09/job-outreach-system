# Sprint 1 - Test Plan & QA Strategy

**Project:** Job Outreach System  
**Sprint:** Sprint 1 - AI Integration (P0 Tasks)  
**Date:** January 3, 2026  
**TEA Agent:** Murat  
**Status:** Ready for Testing

---

## 📋 **EXECUTIVE SUMMARY**

### **What Was Built:**
- ✅ Claude API integration for resume optimization
- ✅ Claude API integration for message generation
- ✅ Job title/company extraction from JD using Claude
- ✅ Message persistence to `outreach_messages` table

### **What's Being Tested:**
- **P0 (Critical):** Claude API integration, error handling, data persistence
- **P1 (Important):** End-to-end workflows, database relationships
- **P2 (Nice-to-have):** Performance, loading states, UX polish

### **Testing Approach:**
- **Manual QA:** 30 minutes (12 test cases)
- **Automated Smoke Tests:** 5 minutes (API endpoint validation)
- **Total Time:** ~35-40 minutes

---

## 🎯 **TEST OBJECTIVES**

### **Primary Goals:**
1. ✅ Verify Claude API integration works with real API key
2. ✅ Confirm resume optimization generates non-mock content
3. ✅ Confirm message generation generates non-mock content
4. ✅ Validate error handling for API failures
5. ✅ Verify data persistence to Supabase

### **Success Criteria:**
- All P0 tests pass (8/12 tests)
- No critical bugs found
- App doesn't crash on error
- User experience is acceptable

### **Out of Scope:**
- ❌ Google Custom Search (still mocked - P1 task)
- ❌ Puppeteer PDF generation (still mocked - P1 task)
- ❌ Authentication UI (not required for internal app)
- ❌ Performance optimization (post-MVP)

---

## 🧪 **TEST STRATEGY**

### **Phase 1: Automated Smoke Tests (5 mins)**

**Tool:** Bash script (`api-smoke-tests.sh`)

**What It Tests:**
- Server health check
- API endpoint availability
- Request/response validation
- Error handling for invalid inputs

**How to Run:**
```bash
# Terminal 1: Start dev server
cd frontend
npm run dev

# Terminal 2: Run smoke tests
cd _bmad-output/implementation-artifacts
./api-smoke-tests.sh
```

**Expected Output:**
```
🧪 Starting API Smoke Tests...
================================

TEST SUITE 1: Server Health
✓ PASS - Status: 200

TEST SUITE 3: Message Generation API
✓ PASS - Status: 200
✓ PASS - Status: 400
✓ PASS - Status: 400

TEST SUITE 4: Contact Search API
✓ PASS - Status: 200
✓ PASS - Status: 400

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Passed: 6
Failed: 0

✓ All API smoke tests passed!
```

---

### **Phase 2: Manual QA Testing (30 mins)**

**Tool:** Manual checklist (`sprint-1-qa-checklist.md`)

**Test Suites:**
1. **Resume Optimization** (4 tests) - P0
2. **Message Generation** (4 tests) - P0
3. **Integration Tests** (2 tests) - P1
4. **Performance & UX** (2 tests) - P2

**How to Execute:**
1. Open `sprint-1-qa-checklist.md`
2. Follow each test case step-by-step
3. Mark Pass/Fail for each test
4. Document any issues found
5. Fill out test summary at the end

**Critical Test Cases (Must Pass):**
- ✅ Test 1.1: Resume optimization with real AI
- ✅ Test 1.2: Job title/company extraction
- ✅ Test 1.3: Error handling - Invalid API key
- ✅ Test 2.1: Message generation with real AI
- ✅ Test 2.2: Message persistence to database

---

## 🔍 **RISK ASSESSMENT**

### **High-Risk Areas:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API rate limit | 🟡 Medium | 🔴 High | Test with small batches, add retry logic |
| Invalid API key | 🟢 Low | 🔴 High | Validate key on startup, show clear error |
| Resume parsing fails | 🟡 Medium | 🟡 Medium | Fallback to text extraction, log errors |
| Database write fails | 🟢 Low | 🟡 Medium | Show error to user, retry once |
| Slow API response | 🟡 Medium | 🟢 Low | Add timeout (30s), show loading state |

### **Known Issues (Expected):**
- ✅ Contact search returns mock data (P1 task - not blocking)
- ✅ PDF generation is text-based (P1 task - not blocking)
- ✅ No message history UI (P2 task - not blocking)

---

## 📊 **TEST COVERAGE MATRIX**

### **Feature Coverage:**

| Feature | Unit Tests | Integration Tests | E2E Tests | Manual Tests |
|---------|-----------|------------------|-----------|--------------|
| Resume Upload | ❌ | ❌ | ❌ | ✅ |
| Resume Optimization | ❌ | ❌ | ❌ | ✅ |
| Job Parsing | ❌ | ❌ | ❌ | ✅ |
| Message Generation | ❌ | ❌ | ❌ | ✅ |
| Message Persistence | ❌ | ❌ | ❌ | ✅ |
| Contact Search | ❌ | ❌ | ❌ | ✅ |

**Current Coverage:** 0% automated, 100% manual  
**Target Coverage (Post-MVP):** 80% automated, 20% manual

---

## 🐛 **BUG TRACKING**

### **How to Report Bugs:**

1. **During Testing:**
   - Document in QA checklist under "Actual Results"
   - Note exact steps to reproduce
   - Capture error messages/screenshots

2. **After Testing:**
   - Create bug report in `_bmad-output/implementation-artifacts/bugs/`
   - Use template below

### **Bug Report Template:**

```markdown
# Bug Report: [Short Description]

**Date:** YYYY-MM-DD  
**Tester:** Raghav  
**Severity:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)

## Description
[What went wrong?]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen?]

## Actual Behavior
[What actually happened?]

## Screenshots/Logs
[Paste error messages or attach screenshots]

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Node: v20.x
- API Key: Valid / Invalid

## Impact
[How does this affect users?]

## Suggested Fix
[Optional - if you have ideas]
```

---

## 📈 **TEST METRICS**

### **What to Track:**

1. **Test Execution:**
   - Total tests run: _____
   - Tests passed: _____
   - Tests failed: _____
   - Tests blocked: _____

2. **Defect Metrics:**
   - P0 bugs found: _____
   - P1 bugs found: _____
   - P2 bugs found: _____

3. **Performance:**
   - Resume optimization time: _____ seconds
   - Message generation time: _____ seconds

4. **API Usage:**
   - Claude API calls made: _____
   - API errors encountered: _____

---

## 🚀 **POST-TESTING ACTIONS**

### **If All P0 Tests Pass:**

1. ✅ Mark Sprint 1 as "QA Complete"
2. ✅ Create test report (see template below)
3. ✅ Recommend deployment to staging
4. ✅ Plan Sprint 2 (P1 tasks)

### **If Any P0 Tests Fail:**

1. ❌ Document all failures in bug reports
2. ❌ Prioritize bugs (P0 = blocking, P1 = high, P2 = medium)
3. ❌ Invoke Dev Agent (Amelia) to fix P0 bugs
4. ❌ Re-test after fixes
5. ❌ Do NOT deploy until P0 bugs are resolved

### **If P1 Tests Fail:**

1. ⚠️ Document failures
2. ⚠️ Assess impact on user experience
3. ⚠️ Decide: Fix now or defer to Sprint 2?
4. ⚠️ Can still deploy if P0 tests pass

---

## 📄 **TEST REPORT TEMPLATE**

After completing all tests, create a final report:

```markdown
# Sprint 1 - QA Test Report

**Date:** January 3, 2026  
**Tester:** Raghav  
**Sprint:** Sprint 1 - AI Integration  
**Status:** PASS / FAIL / CONDITIONAL PASS

---

## Summary

- **Total Tests:** 12
- **Passed:** _____
- **Failed:** _____
- **Pass Rate:** _____% 

---

## Test Results by Priority

### P0 (Critical) - 8 tests
- Passed: _____
- Failed: _____

### P1 (Important) - 2 tests
- Passed: _____
- Failed: _____

### P2 (Nice-to-have) - 2 tests
- Passed: _____
- Failed: _____

---

## Bugs Found

### Critical (P0)
1. [Bug title] - [Status: Open/Fixed]
2. ...

### High (P1)
1. [Bug title] - [Status: Open/Fixed]
2. ...

### Medium (P2)
1. [Bug title] - [Status: Open/Fixed]
2. ...

---

## Performance Metrics

- Resume optimization: _____ seconds (target: <30s)
- Message generation: _____ seconds (target: <10s)
- API error rate: _____% (target: <5%)

---

## Recommendations

### Deploy to Production?
- [ ] YES - All P0 tests pass, ready for beta users
- [ ] NO - Critical bugs must be fixed first
- [ ] CONDITIONAL - Deploy with known issues (list below)

### Next Steps
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

---

**Tester Signature:** Raghav  
**Date:** January 3, 2026
```

---

## 🔄 **CONTINUOUS TESTING (Future)**

### **Sprint 2+ Improvements:**

1. **Set Up Test Framework:**
   - Install Vitest + React Testing Library
   - Write unit tests for API routes
   - Write integration tests for workflows

2. **Add E2E Tests:**
   - Install Playwright
   - Write critical path tests (resume → message flow)
   - Run in CI/CD pipeline

3. **Automate Regression Tests:**
   - Run tests on every PR
   - Block merge if tests fail
   - Track test coverage over time

4. **Performance Testing:**
   - Add Lighthouse CI
   - Monitor API response times
   - Set up error tracking (Sentry)

---

## 📞 **NEED HELP?**

### **Common Issues:**

**Issue:** Dev server won't start  
**Fix:** Check `npm install` ran successfully, verify Node version (v18+)

**Issue:** Claude API returns 401 Unauthorized  
**Fix:** Verify `ANTHROPIC_API_KEY` in `.env.local` is valid

**Issue:** Database errors (RLS policy violation)  
**Fix:** Verify `NEXT_PUBLIC_STUB_USER_ID` matches user in `auth.users` table

**Issue:** Resume upload fails  
**Fix:** Check Supabase storage bucket `resumes` exists and RLS policies allow insert

---

## 🎯 **TESTING CHECKLIST (Quick Reference)**

Before starting tests:
- [ ] Dev server running (`npm run dev`)
- [ ] `.env.local` configured with real API keys
- [ ] Supabase database accessible
- [ ] Browser console open (F12)

During testing:
- [ ] Run automated smoke tests first
- [ ] Follow manual QA checklist step-by-step
- [ ] Document all failures with screenshots
- [ ] Note performance metrics

After testing:
- [ ] Fill out test summary
- [ ] Create bug reports for failures
- [ ] Recommend deploy or fix
- [ ] Share results with team

---

**Ready to start testing, Raghav?** 🧪

Choose your path:
1. **Quick Path (5 mins):** Run automated smoke tests only
2. **Thorough Path (35 mins):** Run both automated + manual tests
3. **Custom Path:** Pick specific test suites to run

Let me know which path you want to take!


