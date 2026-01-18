# Manual QA - Reusable Test Job URLs

**Last Updated:** January 3, 2026  
**Purpose:** Quick reference for job URLs tested during manual QA cycles

---

## ✅ **Verified Working URLs**

### **1. Greenhouse (Duolingo)**
```
https://boards.greenhouse.io/duolingo/jobs/5568130003
```
**Status:** ✅ Tested (Jan 3, 2026)  
**Notes:** 
- Initially had extraction issues (fixed with Jina fallback)
- Good test case for Greenhouse board format
- Company: Duolingo

---

### **2. Skyflow (Product Manager Role)**
```
https://boards.greenhouse.io/skyflow/jobs/[ID]
```
**Status:** ✅ Verified extraction accuracy (Jan 3, 2026)  
**Notes:**
- Used for accuracy verification (99.5% content match)
- Company: Skyflow
- Role: Product Manager

**Actual JD Content (for reference):**
- Company: Skyflow (data privacy vault company)
- Role: Product Manager
- Requirements: 1-3 years PM experience, SaaS platforms, API design

---

## 🔄 **Alternative Test URLs (Not Yet Tested)**

### **LinkedIn Jobs**
```
https://www.linkedin.com/jobs/view/[JOB_ID]
```
**Status:** ⚠️ Not yet tested  
**Notes:** 
- Requires public job posting
- May need authentication for some postings
- Good test for dynamic content extraction

---

### **Indeed**
```
https://www.indeed.com/viewjob?jk=[JOB_KEY]
```
**Status:** ⚠️ Not yet tested  
**Notes:**
- Common job board format
- Good test for generic job board parsing

---

### **Lever**
```
https://jobs.lever.co/[COMPANY]/[JOB_ID]
```
**Status:** ⚠️ Not yet tested  
**Notes:**
- Popular ATS format
- Clean HTML structure (usually easy to parse)

---

### **Company Career Pages**
```
https://[company].com/jobs/[role]
https://jobs.[company].com/[role]
```
**Status:** ⚠️ Not yet tested  
**Examples:**
- `https://stripe.com/jobs/[role]`
- `https://jobs.stripe.com/[role]`

---

## 📝 **Usage Instructions**

### **For Manual QA:**

1. **Copy a URL from above**
2. **Navigate to:** `http://localhost:3000/jobs`
3. **Select "Job URL" tab**
4. **Paste URL and click "Extract Job Description"**
5. **Verify:**
   - ✅ Job title extracted correctly
   - ✅ Company name extracted correctly
   - ✅ Job description text is complete (>200 chars)
   - ✅ No extraction errors

### **For Regression Testing:**

Use the **Verified Working URLs** section to ensure:
- Previously working URLs still work after code changes
- Extraction quality hasn't degraded
- Error handling still works correctly

---

## 🐛 **Known Issues & Workarounds**

### **Issue: Some Greenhouse URLs Redirect**
**Example:** `boards.greenhouse.io/duolingo/jobs/5568130003` → redirects to `job-boards.greenhouse.io`

**Status:** ✅ Fixed with Jina fallback  
**Workaround:** System automatically uses Jina Reader API if direct HTML parsing fails

---

### **Issue: Private/Internal Job Postings**
**Symptom:** Extraction fails with "Unable to extract job description"

**Workaround:** 
- Use "Paste JD" tab instead
- Or use "Job PDF" tab if you have a saved PDF

---

## 📊 **Test Coverage Matrix**

| URL Type | Status | Last Tested | Notes |
|----------|--------|-------------|-------|
| Greenhouse | ✅ Working | Jan 3, 2026 | Jina fallback enabled |
| LinkedIn | ⚠️ Not tested | - | May require auth |
| Indeed | ⚠️ Not tested | - | Generic format |
| Lever | ⚠️ Not tested | - | Clean HTML |
| Company Pages | ⚠️ Not tested | - | Varies by company |

---

## 🔍 **How to Add New Test URLs**

When testing a new URL:

1. **Add to this document** with:
   - Full URL
   - Company name
   - Job title (if known)
   - Test date
   - Status (✅ Working / ❌ Failed / ⚠️ Partial)

2. **Document any issues** in the "Known Issues" section

3. **Update Test Coverage Matrix** with results

---

## 💡 **Tips for Finding Test URLs**

1. **Public Job Boards:**
   - LinkedIn Jobs (filter by "Easy Apply" for public postings)
   - Indeed (most postings are public)
   - Company career pages (usually public)

2. **ATS Platforms:**
   - Greenhouse (many companies use this)
   - Lever (popular with startups)
   - Workday (less common, harder to parse)

3. **Avoid:**
   - Internal/private job postings (require login)
   - Job aggregators that redirect (can break extraction)
   - PDF-only postings (use PDF upload instead)

---

**Next Steps:**
- [ ] Test LinkedIn URLs
- [ ] Test Indeed URLs  
- [ ] Test Lever URLs
- [ ] Add more Greenhouse examples from different companies


