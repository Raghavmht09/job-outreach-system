# 🧪 Testing Quick Start Guide

**For:** Raghav  
**Sprint:** Sprint 1 - AI Integration  
**Time Required:** 5-35 minutes (depending on path chosen)

---

## ⚡ **FASTEST PATH (5 minutes)**

### **Option 1: Automated Smoke Tests Only**

```bash
# Terminal 1: Start dev server
cd frontend
npm run dev

# Terminal 2: Run tests
cd _bmad-output/implementation-artifacts
./api-smoke-tests.sh
```

**What This Tests:**
- ✅ Server is running
- ✅ API endpoints respond
- ✅ Basic validation works

**What This DOESN'T Test:**
- ❌ Real Claude API integration
- ❌ Resume optimization quality
- ❌ Message generation quality
- ❌ Database persistence

**Use This When:**
- Quick sanity check before committing code
- Verifying server setup
- Testing after dependency updates

---

## 🎯 **RECOMMENDED PATH (35 minutes)**

### **Option 2: Full QA Suite**

**Step 1: Automated Tests (5 mins)**
```bash
cd _bmad-output/implementation-artifacts
./api-smoke-tests.sh
```

**Step 2: Manual Tests (30 mins)**
1. Open `sprint-1-qa-checklist.md`
2. Follow each test case step-by-step
3. Mark Pass/Fail for each test
4. Document any issues

**What This Tests:**
- ✅ Everything from automated tests
- ✅ Real Claude API integration
- ✅ Resume optimization with real AI
- ✅ Message generation with real AI
- ✅ Database persistence
- ✅ Error handling
- ✅ End-to-end workflows

**Use This When:**
- Before deploying to production
- After major feature changes
- Before sharing with beta users

---

## 🔍 **CUSTOM PATH (Variable time)**

### **Option 3: Pick Your Tests**

**Critical Tests Only (15 mins):**
- Test 1.1: Resume optimization with real AI
- Test 1.2: Job title/company extraction
- Test 2.1: Message generation with real AI
- Test 2.2: Message persistence

**Error Handling Tests (10 mins):**
- Test 1.3: Invalid API key
- Test 1.4: Missing resume file
- Test 2.4: Invalid input

**Integration Tests (10 mins):**
- Test 3.1: End-to-end workflow
- Test 3.2: Database relationships

---

## 📋 **PRE-TESTING CHECKLIST**

Before starting ANY tests, verify:

```bash
# 1. Check environment variables
cd frontend
cat .env.local | grep -E "ANTHROPIC_API_KEY|SUPABASE|STUB_USER"
```

**Required:**
- ✅ `ANTHROPIC_API_KEY` is set (NOT placeholder)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` is set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- ✅ `NEXT_PUBLIC_STUB_USER_ID` is set

```bash
# 2. Verify Supabase connection
# Open Supabase dashboard and check:
# - Project is accessible
# - Tables exist (resumes, job_applications, outreach_messages)
# - Storage buckets exist (resumes, optimized-resumes)
```

```bash
# 3. Start dev server
cd frontend
npm run dev
# Wait for "Ready in X ms" message
```

```bash
# 4. Verify server is running
curl http://localhost:3000
# Should return HTML (not error)
```

---

## 🐛 **WHAT TO DO IF TESTS FAIL**

### **Automated Tests Fail:**

**Error:** `Connection refused`  
**Fix:** Dev server not running → Run `npm run dev`

**Error:** `404 Not Found`  
**Fix:** API route missing → Check file exists in `app/api/`

**Error:** `400 Bad Request`  
**Fix:** Expected for invalid input tests → Check test expectations

**Error:** `500 Internal Server Error`  
**Fix:** Server-side error → Check terminal logs for stack trace

---

### **Manual Tests Fail:**

**Test 1.1 Fails (Resume Optimization):**
1. Check browser console for errors
2. Check Network tab → `/api/job/optimize` response
3. Verify `ANTHROPIC_API_KEY` is valid
4. Try with different resume/JD

**Test 1.2 Fails (Job Parsing):**
1. Check if JD has clear title/company
2. Try with LinkedIn-formatted JD
3. Check Supabase table for actual values

**Test 2.1 Fails (Message Generation):**
1. Check browser console for errors
2. Check Network tab → `/api/message/generate` response
3. Verify `ANTHROPIC_API_KEY` is valid
4. Try with different contact details

**Test 2.2 Fails (Message Persistence):**
1. Check Supabase table `outreach_messages`
2. Verify RLS policies allow insert
3. Check `user_id` matches `STUB_USER_ID`

---

## 📊 **AFTER TESTING**

### **All Tests Pass? ✅**

1. Create test report:
   ```bash
   cp _bmad-output/implementation-artifacts/sprint-1-test-plan.md \
      _bmad-output/implementation-artifacts/sprint-1-test-report-$(date +%Y%m%d).md
   ```

2. Fill out summary section

3. Recommend next steps:
   - **Option A:** Deploy to Vercel staging
   - **Option B:** Continue to Sprint 2 (P1 tasks)
   - **Option C:** Share with beta users

---

### **Some Tests Fail? ❌**

1. Document failures:
   ```bash
   mkdir -p _bmad-output/implementation-artifacts/bugs
   # Create bug report for each failure
   ```

2. Prioritize:
   - **P0 (Critical):** Blocks deployment → Fix immediately
   - **P1 (High):** Degrades UX → Fix before deploy
   - **P2 (Medium):** Minor issue → Can defer

3. Invoke Dev Agent to fix:
   ```
   @bmm-dev
   Hi Amelia! QA found some issues in Sprint 1.
   Please review bug reports in _bmad-output/implementation-artifacts/bugs/
   and fix all P0 bugs before we deploy.
   ```

4. Re-test after fixes

---

## 📞 **NEED HELP?**

### **Common Questions:**

**Q: Do I need to test contact search?**  
A: No, it's still mocked (P1 task). Skip those tests.

**Q: Do I need to test PDF generation?**  
A: No, it's still mocked (P1 task). Skip those tests.

**Q: What if Claude API is slow?**  
A: Expected. Resume optimization can take 20-30 seconds.

**Q: What if I get rate limited?**  
A: Wait 1 minute, then retry. If persistent, check API quota.

**Q: Can I test without real API key?**  
A: No, you'll just get mocked responses. Need real key for QA.

---

## 🎯 **TESTING DECISION TREE**

```
START
  │
  ├─ Need quick sanity check?
  │   └─ YES → Run automated smoke tests (5 mins)
  │
  ├─ Ready to deploy?
  │   └─ YES → Run full QA suite (35 mins)
  │
  ├─ Testing specific feature?
  │   └─ YES → Run custom tests (10-15 mins)
  │
  └─ Just committed code?
      └─ YES → Run automated smoke tests (5 mins)
```

---

## 📁 **TESTING FILES REFERENCE**

| File | Purpose | When to Use |
|------|---------|-------------|
| `api-smoke-tests.sh` | Automated API tests | Quick sanity checks |
| `sprint-1-qa-checklist.md` | Manual test cases | Before deployment |
| `sprint-1-test-plan.md` | Full test strategy | Reference guide |
| `TESTING-QUICK-START.md` | This file | Quick reference |

---

## ⏱️ **TIME ESTIMATES**

| Test Suite | Time | Priority |
|-----------|------|----------|
| Automated smoke tests | 5 mins | P0 |
| Resume optimization tests | 10 mins | P0 |
| Message generation tests | 10 mins | P0 |
| Integration tests | 10 mins | P1 |
| Performance tests | 5 mins | P2 |
| **TOTAL** | **40 mins** | - |

---

**Ready to start testing?** 🚀

Pick your path and let's go!

1. **Quick (5 mins):** `./api-smoke-tests.sh`
2. **Thorough (35 mins):** Open `sprint-1-qa-checklist.md`
3. **Custom:** Tell me what you want to test

---

**Questions?** Ask Murat (TEA Agent) - I'm here to help! 🧪


