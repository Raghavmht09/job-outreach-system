# Sprint 1 - Scope Gap Analysis

**Date:** January 3, 2026  
**Discovered By:** Raghav (Manual QA)  
**Analyzed By:** Murat (TEA Agent) + Amelia (Dev Agent)  
**Status:** ✅ RESOLVED (Jan 3, 2026)

> **Update:** Job URL extraction + PDF upload were implemented in Sprint 1 (see Resolution Summary below). The remainder of this document preserves the original analysis for historical context.

---

## ✅ Resolution Summary

1. **URL Extraction Implemented**
   - API: `POST /api/job/extract-url`
   - Cheerio + Claude Haiku for metadata
   - Editable preview + guard rails in UI

2. **PDF Upload Implemented**
   - API: `POST /api/job/extract-pdf`
   - Reuses `pdf-parse`, cleans text, runs Claude Haiku
   - Dedicated tab in UI with file picker + extraction button

3. **Company Extraction Utility**
   - `lib/utils/company-extractor.ts` (URL domain + Claude + fallback)

4. **ResumeOptimizer Overhaul**
   - Tabs for Paste / URL / PDF flows
   - Job metadata preview (title + company + description editor)
   - Optimize button disabled until JD ready

5. **Testing**
   - `api-smoke-tests.sh` updated
   - Manual QA checklist refreshed to include new flows
   - Logging enabled for extraction + optimization endpoints

Manual QA should now resume using the updated workflow.

---

---

## 🚨 **Executive Summary**

During manual QA, Raghav discovered that **Sprint 1 is missing two core MUST-HAVE features** defined in the PRD and Architecture documents.

**What Was Planned (PRD):**
- 3 job description input methods: Manual Paste, URL Extraction, PDF Upload

**What Was Built:**
- 1 job description input method: Manual Paste only

**Impact:**  
- Current MVP is **incomplete** per original product requirements
- Users cannot use URL extraction (expected by 80%+ of users per UX research)
- No fallback for long/complex job descriptions (PDF upload)

---

## 📊 **Gap Summary**

| Feature | PRD Status | Architecture Docs | Implementation Status | Priority |
|---------|-----------|-------------------|----------------------|----------|
| **Job Description - Manual Paste** | MUST-HAVE | ✅ Designed | ✅ IMPLEMENTED | P0 |
| **Job Description - URL Extraction** | MUST-HAVE | ✅ Designed | ❌ NOT IMPLEMENTED | P0 |
| **Job Description - PDF Upload** | MUST-HAVE | ✅ Designed | ❌ NOT IMPLEMENTED | P0 |
| **Company Name Auto-Extraction** | MUST-HAVE | ✅ Designed | ❌ NOT IMPLEMENTED | P0 |

---

## 🔍 **Detailed Gap Analysis**

### **Gap 1: Job URL Extraction (P0 - CRITICAL)**

**PRD Reference:**  
`3-user-stories-acceptance-criteria.md`, Lines 9-10:

> **When** they paste a Job URL and click "Optimize"  
> **Then** the system extracts the JD text via the Chrome Extension

**Architecture Reference:**  
`project-context-analysis.md`, Lines 7-14:

> **Option B:** Job URL paste (user copies link for metadata extraction)

**Current Implementation:**
- Job URL field exists (`job_url`) but is **optional** and **not used**
- No extraction logic implemented
- Users must manually copy/paste job descriptions

**Impact:**
- **UX:** Users expect "paste URL → auto-fill" (standard in competitors)
- **Data Quality:** Manual copy/paste introduces errors
- **Adoption:** Major friction point for new users

**Effort Estimate:** 4-6 hours (scraping + parsing + UI integration)

---

### **Gap 2: PDF Upload for Job Descriptions (P0 - CRITICAL)**

**Architecture Reference:**  
`project-context-analysis.md`, Lines 11-12:

> **Option C:** PDF upload (user saves webpage as PDF, uploads to platform)

**PRD User Story:**

> "As a job seeker with a long job description (1000+ words), I want to upload a PDF so I don't have to manually copy/paste."

**Current Implementation:**
- No PDF upload UI for job descriptions
- PDF parsing logic exists (for resumes) but not exposed for JDs

**Impact:**
- **UX:** Long job descriptions (1000+ words) are tedious to paste
- **Accessibility:** Some job postings are image-based or PDF-only
- **Competitive:** Teal.co and Rezi.ai support PDF upload

**Effort Estimate:** 2-3 hours (reuse resume PDF logic + UI)

---

### **Gap 3: Company Name Auto-Extraction (P0 - TIED TO URL/PDF)**

**Architecture Reference:**  
`project-context-analysis.md`, Lines 13-14:

> Company name extraction via multi-source strategy (URL parsing, PDF metadata, Claude NLP)

**Multi-source strategy:**
1. Parse URL domain (`jobs.stripe.com` → "Stripe")
2. Extract from PDF metadata (author/creator fields)
3. Use Claude Haiku NLP extraction from job text
4. Fallback: User manually edits field

**Current Implementation:**
- Company name is **extracted from job description text** using Claude
- No URL or PDF metadata extraction
- Users must manually enter if extraction fails

**Impact:**
- **Data Quality:** Company names inconsistent (Stripe, stripe.com, Stripe Inc.)
- **UX:** Extra manual step if extraction fails

**Effort Estimate:** 2-3 hours (URL/PDF parsing + fallback UI)

---

## 🤔 **Why Was This Missed?**

### **Possible Reasons:**

1. **Time Constraints:** Sprint 1 focused on AI integration (P0), deferred input methods
2. **Miscommunication:** Dev agent (Amelia) may not have loaded full Architecture context
3. **Prioritization:** Manual paste considered "good enough" for MVP testing
4. **Scope Creep:** Chrome Extension confusion (originally planned, then removed)

### **Evidence from Architecture Docs:**

`project-structure-boundaries.md`, Lines 480-492:

```
Step 2: User inputs job description (paste/URL/PDF)
  → JobInputForm.tsx
  → Three input methods:
    - Paste: Direct text input
    - URL: Extract from job posting URL
    - PDF: POST /api/job/extract-pdf → pdf-parse → text cleanup
```

**Conclusion:** This was **architected and designed** but **not implemented**.

---

## 📋 **Technical Debt Created**

### **Database Schema:**
- `job_applications.job_url` column exists but unused ✅
- `job_applications.company_name` column exists ✅
- No wasted schema (good!)

### **API Routes:**
- `/api/job/extract-pdf` mentioned in Architecture but not created ❌
- `/api/job/extract-url` not mentioned, but implied ❌

### **Code Complexity:**
- Adding URL/PDF extraction now requires:
  - New UI components
  - API route changes
  - Testing all three input methods
  - Regression risk for existing manual paste flow

---

## 🎯 **Recommendations**

### **Option A: Implement Now (Before Full QA)**
**Rationale:**
- These are **MUST-HAVE P0 features** per PRD
- Current MVP is incomplete
- Better to finish before extensive testing

**Effort:** 8-10 hours total
- URL extraction: 4-6 hours
- PDF upload: 2-3 hours
- Testing: 2 hours

**Risk:** Delays QA completion by 1-2 days

---

### **Option B: Defer to Sprint 2 (Ship Manual Paste Only)**
**Rationale:**
- Manual paste is functional for internal testing
- Can get feedback from friends/family first
- Implement URL/PDF based on user demand

**Impact:**
- Ship **incomplete MVP** (PRD not met)
- Need to update PRD to reflect actual scope
- Risk: Users complain "why can't I paste a URL?"

**Risk:** User adoption suffers, bad first impression

---

### **Option C: Hybrid (Quick Fix + Full Later)**
**Rationale:**
- Implement **simple URL extraction** now (2 hours)
- Defer PDF upload to Sprint 2

**Quick Fix Approach:**
- Use OpenGraph metadata extraction (fast, works for 70% of job sites)
- Fallback to manual paste if metadata missing
- Skip complex scraping (Puppeteer/Apify)

**Effort:** 2-3 hours
**Risk:** Low (doesn't touch existing flows)

---

## 🗳️ **Decision Required**

### **Questions for SM/PM:**

1. **Was this an intentional de-scope or an oversight?**
   - If intentional: Update PRD to reflect new scope
   - If oversight: Implement before continuing QA

2. **Can we ship without URL extraction?**
   - PRD says MUST-HAVE
   - But user testing hasn't started yet

3. **Chrome Extension confusion:**
   - Original PRD mentions "Chrome Extension extracts JD text"
   - Architecture doc says "direct URL scraping (no extension needed)"
   - **Which approach is correct?**

4. **Sprint 1 vs Sprint 2:**
   - Fix now (delays QA by 1-2 days)
   - Fix later (ship incomplete MVP, risk user frustration)

---

## 📁 **Related Documents**

**Bug Reports:**
- `bugs/bug-004-json-parse-error.md` - JSON parsing issue (P1)
- `bugs/bug-005-missing-job-input-methods.md` - Scope gap (P0)

**Planning Artifacts:**
- `prd-job-outreach-system/3-user-stories-acceptance-criteria.md`
- `architecture/project-context-analysis.md` (Lines 7-22)
- `architecture/project-structure-boundaries.md` (Lines 480-492)

**Implementation Files:**
- `frontend/components/jobs/ResumeOptimizer.tsx` - Current (incomplete) UI
- `frontend/app/api/job/extract-pdf/route.ts` - Not created (mentioned in Architecture)

---

## ✅ **Next Steps**

1. **Invoke SM Agent** to discuss prioritization and scope
2. **Fix Bug #004** (JSON parse error) regardless of decision
3. **Decide on Option A/B/C** for missing features
4. **Update sprint plan** based on decision
5. **Resume QA** once scope is clarified

---

**Prepared By:** Murat (TEA Agent)  
**Reviewed By:** Amelia (Dev Agent)  
**Awaiting Decision From:** Bob (SM Agent) + Product Owner

