# Bug Report #005: Missing Job Input Methods (Scope Gap)

**Status:** ✅ FIXED  
**Date Found:** January 3, 2026  
**Date Fixed:** January 3, 2026  
**Tester:** Raghav  
**Developer:** Amelia (Dev Agent)  
**Severity:** P0 (Critical - Core feature not implemented)

---

## ✅ Resolution Summary

Sprint 1 now matches the PRD requirement of supporting **three job description input methods**.

### Deliverables

1. **Job URL Extraction**
   - New API: `POST /api/job/extract-url` (Cheerio + Claude Haiku)
   - Auto-detects job title/company + cleans description
   - UI tab with extraction button and editable preview

2. **Job PDF Upload**
   - New API: `POST /api/job/extract-pdf` (pdf-parse + Claude Haiku)
   - Validates PDF type/size, extracts + cleans text
   - UI tab with file picker, extraction button, and preview

3. **Company Name Multi-Source Extraction**
   - Utility: `lib/utils/company-extractor.ts`
   - Combines URL domain parsing + Claude results + fallbacks

4. **ResumeOptimizer Overhaul**
   - Tabbed UX for paste / URL / PDF flows
   - Job detail preview cards (title + company + description editor)
   - Guard rails (Optimize button disabled until JD ready)

### Testing

- Updated `api-smoke-tests.sh` to cover new endpoints  
- Manual QA checklist revised to include URL/PDF flows  
- Logging enabled to trace extraction + optimization requests

The remaining content below captures the original gap analysis for historical context.

---

---

## Description
The current implementation only supports manual job description paste. The PRD and Architecture documents specify **three job input methods**, but only one is implemented.

## Planned vs. Implemented

### **Planned (PRD + Architecture):**

**Three flexible input methods:**

1. **Option A: Manual Paste (Textarea)** ✅ IMPLEMENTED
   - User pastes job description text directly
   - Primary/fastest method

2. **Option B: Job URL Paste** ❌ NOT IMPLEMENTED
   - User pastes job posting URL (e.g., LinkedIn, Indeed)
   - System extracts job description automatically
   - Falls back to manual paste if extraction fails

3. **Option C: PDF Upload** ❌ NOT IMPLEMENTED
   - User saves job posting as PDF (browser "Save as PDF")
   - System extracts text using pdf-parse library
   - Useful for long/complex job descriptions

### **Current Implementation:**
- ✅ Textarea for job description (required field)
- ⚠️ Job URL field exists but is **optional** and **not used for extraction**
- ❌ No PDF upload option

---

## PRD References

### From `3-user-stories-acceptance-criteria.md` (Line 9-10):

> **When** they paste a Job URL and click "Optimize"  
> **Then** the system extracts the JD text via the Chrome Extension

### From `architecture/project-context-analysis.md` (Lines 7-22):

> **Three job description input methods:**
> - **Option A:** Manual paste of job description text (textarea)
> - **Option B:** Job URL paste (user copies link for metadata extraction)
> - **Option C:** PDF upload (user saves webpage as PDF, uploads to platform)

### From `architecture/project-structure-boundaries.md` (Lines 480-492):

> Step 2: User inputs job description (paste/URL/PDF)
>   → JobInputForm.tsx
>   → Three input methods:
>     - Paste: Direct text input
>     - URL: Extract from job posting URL
>     - PDF: POST /api/job/extract-pdf → pdf-parse → text cleanup

---

## Impact

### **User Experience:**
- Users must **manually copy/paste** long job descriptions (tedious, error-prone)
- No automatic company name extraction from URL
- No fallback if user can't copy text (e.g., image-based job postings)

### **Competitive Disadvantage:**
- Competitors like Teal.co and Rezi.ai support URL input
- Users expect "paste URL and we handle the rest"

### **Technical Debt:**
- Database schema supports `job_url` field (already designed for this)
- API route `/api/job/extract-pdf` mentioned but not implemented

---

## Required Implementation

### **Feature 1: Job URL Extraction**

**User Flow:**
1. User pastes job URL (e.g., `https://www.linkedin.com/jobs/view/123456`)
2. System attempts to extract:
   - Job title
   - Company name
   - Job description text
3. If extraction succeeds → Auto-populate fields
4. If extraction fails → Prompt user to paste manually

**Technical Approach:**
- **Option A (Simple):** Use Cheerio/Puppeteer to scrape public job pages
- **Option B (Robust):** Use Apify/ScrapingBee API for reliable extraction
- **Option C (Fast):** Use OpenGraph metadata (limited data)

**Files to Create:**
- `frontend/app/api/job/extract-url/route.ts` - URL extraction endpoint
- `frontend/lib/api/job-scraper.ts` - Scraping logic

**Files to Modify:**
- `frontend/components/jobs/ResumeOptimizer.tsx` - Add URL extraction UI

---

### **Feature 2: PDF Upload for Job Descriptions**

**User Flow:**
1. User saves job posting as PDF (browser feature)
2. User uploads PDF via file input
3. System extracts text using pdf-parse
4. System cleans formatting artifacts (headers, footers, ads)
5. Auto-populate job description field

**Technical Approach:**
- Reuse existing PDF parsing logic from resume upload
- Add new file input for job description PDFs
- Process in-memory, never persist (privacy)

**Files to Create:**
- `frontend/app/api/job/extract-pdf/route.ts` - PDF extraction endpoint

**Files to Modify:**
- `frontend/components/jobs/ResumeOptimizer.tsx` - Add PDF upload UI
- `frontend/lib/api/pdf-parser.ts` - Extend for job PDFs

---

### **Feature 3: Company Name Auto-Extraction**

**Multi-source strategy (as designed in Architecture):**

1. **From URL:** `jobs.stripe.com` → "Stripe"
2. **From PDF metadata:** Extract author/creator fields
3. **From text (NLP):** Use Claude Haiku to extract company name
4. **Fallback:** User manually edits field

**Files to Create:**
- `frontend/lib/utils/company-extractor.ts` - Company name extraction logic

---

## Architectural Alignment

### **Database Schema:**
Already supports this! ✅
- `job_applications.job_url` column exists
- `job_applications.company_name` column exists

### **Storage:**
- No persistent storage needed (PDFs processed in-memory)
- Extraction results stored in `job_applications` table

### **API Quota:**
- PDF parsing: Free (open-source `pdf-parse`)
- URL scraping: Free if using Cheerio/Puppeteer
- NLP extraction: Uses existing Claude API quota

---

## Priority Recommendation

### **Sprint 2 (P0):**
- ✅ Implement Job URL extraction (most requested feature)
- ✅ Implement PDF upload for job descriptions

### **Sprint 3 (P1):**
- ✅ Add company name auto-extraction (multi-source)
- ✅ Polish error handling and fallback UX

---

## Questions for PM/PO

1. **Why was this not implemented in Sprint 1?**
   - Was it deprioritized due to time constraints?
   - Was it missed during dev handoff?

2. **Should we implement URL extraction BEFORE manual QA?**
   - This is a core MUST-HAVE feature per PRD
   - Current MVP is incomplete without it

3. **Do we need Chrome Extension for URL extraction?**
   - Original PRD mentions "Chrome Extension extracts JD text"
   - But Architecture shows direct URL scraping (no extension needed)
   - **Clarification needed:** Which approach?

---

## Related Files

**Planning Artifacts:**
- `_bmad-output/planning-artifacts/prd-job-outreach-system/3-user-stories-acceptance-criteria.md`
- `_bmad-output/planning-artifacts/architecture/project-context-analysis.md` (Lines 7-22)
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` (Lines 480-492)

**Implementation Files:**
- `frontend/components/jobs/ResumeOptimizer.tsx` - Current (incomplete) implementation
- `frontend/app/api/job/extract-pdf/route.ts` - Not implemented (mentioned in Architecture)

---

## Recommendation

**BLOCKER:** This is not a bug—it's a **missing core feature**.

**Action Required:**
1. Invoke SM/PM Agent to reassess Sprint 1 scope
2. Decide: Fix now or defer to Sprint 2?
3. If defer: Update PRD to reflect actual MVP scope
4. If implement: Allocate 4-6 hours for URL extraction + PDF upload

**Current State:** MVP is **incomplete** per original PRD.

