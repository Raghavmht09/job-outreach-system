# Sprint 1 - Manual QA Checklist

**Date:** January 3, 2026  
**Tester:** Raghav  
**Scope:** Resume Optimization + Message Generation (Claude API Integration)  
**Estimated Time:** 30 minutes

---

## 🎯 **PRE-TEST SETUP**

### **1. Verify Environment Variables**
```bash
cd frontend
cat .env.local | grep -E "ANTHROPIC_API_KEY|SUPABASE|STUB_USER"
```

**Expected:**
- ✅ `ANTHROPIC_API_KEY` is set (NOT "YOUR_ANTHROPIC_API_KEY_HERE")
- ✅ `NEXT_PUBLIC_SUPABASE_URL` is set with real URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- ✅ `NEXT_PUBLIC_STUB_USER_ID` is set

**If any are missing/placeholder:** ❌ STOP - Configure env vars first

---

### **2. Start Dev Server**
```bash
cd frontend
npm run dev
```

**Expected:**
- ✅ Server starts on http://localhost:3000
- ✅ No compilation errors
- ✅ Yellow "DEV MODE" banner appears

**If errors:** ❌ Check console for missing dependencies

---

## 🧪 **TEST SUITE 1: RESUME OPTIMIZATION (P0 - CRITICAL)**

### **Test 1.1: Happy Path - Resume Optimization with Real AI**

**Objective:** Verify Claude API generates real optimized resume content

**Steps:**
1. Navigate to http://localhost:3000
2. Click "Upload Resume" or go to `/jobs` page
3. Upload a PDF or DOCX resume (use a real one or create a test file)
4. Paste a job description (any real JD from LinkedIn)
5. Click "Optimize Resume"

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Process completes in <30 seconds
- ✅ Optimized resume content is displayed
- ✅ Content is **NOT** mock text like "Optimized Resume for Job..."
- ✅ Content includes keywords from job description
- ✅ Download button appears

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

**If Failed:**
- Check browser console for errors
- Check Network tab for `/api/job/optimize` response
- Verify `ANTHROPIC_API_KEY` is valid

---

### **Test 1.2: Job Title/Company Extraction**

**Objective:** Verify Claude extracts real job title and company from JD

**Steps:**
1. After completing Test 1.1 (resume optimization)
2. Open Supabase dashboard → Table Editor → `job_applications`
3. Find the most recent record (sort by `created_at` DESC)
4. Check `job_title` and `company_name` columns

**Expected Results:**
- ✅ `job_title` is **NOT** "Detected Job Title" or "Unknown Role"
- ✅ `company_name` is **NOT** "Detected Company" or "Unknown Company"
- ✅ Values match the job description you pasted

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Job Title Found:** ___________________________________________
- **Company Name Found:** ___________________________________________

**If Failed:**
- Check if job description had clear title/company
- Try with a more structured JD (LinkedIn format)
- Check API logs for Claude parsing errors

---

### **Test 1.3: Error Handling - Invalid API Key**

**Objective:** Verify graceful error handling when Claude API fails

**Steps:**
1. Stop dev server
2. Edit `.env.local` → Set `ANTHROPIC_API_KEY=invalid-key-test`
3. Restart dev server
4. Try to optimize a resume

**Expected Results:**
- ✅ User sees friendly error message (NOT "500 Internal Server Error")
- ✅ Error message mentions "AI service" or "optimization failed"
- ✅ No stack traces visible to user
- ✅ App doesn't crash

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Error Message Shown:** ___________________________________________

**After Test:**
- ⚠️ **IMPORTANT:** Restore real `ANTHROPIC_API_KEY` in `.env.local`
- Restart dev server

---

### **Test 1.4: Error Handling - Missing Resume File**

**Objective:** Verify error handling when resume file is missing/corrupted

**Steps:**
1. Try to optimize without uploading a resume first
2. OR upload a corrupted PDF file

**Expected Results:**
- ✅ User sees error message about missing/invalid resume
- ✅ No crash or 500 error

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

---

## 🧪 **TEST SUITE 2: MESSAGE GENERATION (P0 - CRITICAL)**

### **Test 2.1: Happy Path - Message Generation with Real AI**

**Objective:** Verify Claude API generates real personalized messages

**Steps:**
1. Navigate to `/messages/new` or click "Generate Message"
2. Enter contact details:
   - Name: "John Smith"
   - Title: "Senior Recruiter"
   - Company: "Google"
   - Job Title: "Software Engineer"
3. Select tone: "Professional"
4. Click "Generate Message"

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Message generates in <10 seconds
- ✅ Message is **NOT** a template like "Hi John, I'm a Software Engineer applicant..."
- ✅ Message is personalized and references specific role/company
- ✅ Message is ~250-350 characters (LinkedIn limit)
- ✅ "Copy to Clipboard" button works

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Generated Message:** ___________________________________________
- **Character Count:** ___________________________________________

**If Failed:**
- Check browser console for errors
- Check Network tab for `/api/message/generate` response
- Verify `ANTHROPIC_API_KEY` is valid

---

### **Test 2.2: Message Persistence to Database**

**Objective:** Verify messages are saved to `outreach_messages` table

**Steps:**
1. After completing Test 2.1 (message generation)
2. Open Supabase dashboard → Table Editor → `outreach_messages`
3. Find the most recent record (sort by `created_at` DESC)

**Expected Results:**
- ✅ New record exists with correct data:
  - `contact_name` = "John Smith"
  - `message_text` = generated message
  - `tone` = "professional"
  - `created_at` = recent timestamp

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Record Found:** [ ] Yes / [ ] No
- **Notes:** ___________________________________________

**If Failed:**
- Check API route logs for database errors
- Verify RLS policies allow insert for stub user
- Check if `user_id` matches `STUB_USER_ID`

---

### **Test 2.3: Different Tone Variants**

**Objective:** Verify all three tone options generate different messages

**Steps:**
1. Generate message with "Professional" tone → Note the message
2. Generate message with "Casual" tone → Note the message
3. Generate message with "Direct" tone → Note the message

**Expected Results:**
- ✅ All three messages are different
- ✅ Professional tone is formal and polite
- ✅ Casual tone is friendly and conversational
- ✅ Direct tone is concise and action-oriented

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Professional:** ___________________________________________
- **Casual:** ___________________________________________
- **Direct:** ___________________________________________

---

### **Test 2.4: Error Handling - Invalid Input**

**Objective:** Verify validation errors are handled gracefully

**Steps:**
1. Try to generate message with empty contact name
2. Try with very long company name (>200 characters)

**Expected Results:**
- ✅ Validation error shown before API call
- ✅ User-friendly error message
- ✅ No crash

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

---

## 🧪 **TEST SUITE 3: INTEGRATION TESTS (P1 - IMPORTANT)**

### **Test 3.1: End-to-End Resume → Message Flow**

**Objective:** Verify complete user workflow works

**Steps:**
1. Upload resume
2. Paste job description
3. Optimize resume
4. Navigate to contact search
5. Select a contact (even if fake)
6. Generate message for that contact

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Data flows correctly between steps
- ✅ Message references the job from step 2

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

---

### **Test 3.2: Database Relationships**

**Objective:** Verify foreign key relationships are correct

**Steps:**
1. After completing Test 3.1
2. In Supabase, check:
   - `job_applications` table has `resume_id` FK
   - `outreach_messages` table has `job_application_id` FK (if implemented)

**Expected Results:**
- ✅ Foreign keys are valid UUIDs
- ✅ No orphaned records

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

---

## 🧪 **TEST SUITE 4: PERFORMANCE & UX (P2 - NICE-TO-HAVE)**

### **Test 4.1: Loading States**

**Objective:** Verify users see appropriate loading indicators

**Steps:**
1. Observe UI during resume optimization
2. Observe UI during message generation

**Expected Results:**
- ✅ Loading spinner or skeleton appears
- ✅ User knows something is happening
- ✅ No blank screens

**Actual Results:**
- [ ] Pass / [ ] Fail
- **Notes:** ___________________________________________

---

### **Test 4.2: Response Times**

**Objective:** Verify operations complete within acceptable time

**Steps:**
1. Time resume optimization (start to finish)
2. Time message generation (start to finish)

**Expected Results:**
- ✅ Resume optimization: <30 seconds
- ✅ Message generation: <10 seconds

**Actual Results:**
- **Resume Optimization Time:** _____ seconds
- **Message Generation Time:** _____ seconds
- [ ] Pass / [ ] Fail

---

## 📊 **TEST SUMMARY**

### **Results:**
- **Total Tests:** 12
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____

### **Critical Issues Found:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### **Non-Critical Issues Found:**
1. ___________________________________________
2. ___________________________________________

### **Recommendations:**
- [ ] Ready to deploy (all P0 tests pass)
- [ ] Fix critical issues before deploy
- [ ] Add automated tests for regression prevention

---

## 🚀 **NEXT STEPS**

**If All P0 Tests Pass:**
1. Deploy to Vercel staging
2. Test in production-like environment
3. Share with 2-3 beta users

**If Any P0 Tests Fail:**
1. Document exact error messages
2. Share with Amelia (Dev Agent) for fixes
3. Re-test after fixes

**For Future Sprints:**
1. Set up automated test framework (Vitest)
2. Write integration tests for API routes
3. Add E2E tests with Playwright

---

**Tester Signature:** ___________________________________________  
**Date Completed:** ___________________________________________  
**Overall Status:** [ ] PASS / [ ] FAIL / [ ] BLOCKED


