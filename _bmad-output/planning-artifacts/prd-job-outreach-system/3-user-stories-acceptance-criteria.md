# 3. User Stories & Acceptance Criteria

## Feature: Resume Optimization (R-1 to R-5)

**User Story:** "As a job seeker, I want to optimize my resume for a specific job so I can pass ATS filters."

**Acceptance Criteria:**
*   **Given** a user has uploaded a Master Resume (DOCX)
*   **When** they paste a Job URL and click "Optimize"
*   **Then** the system extracts the JD text via the Chrome Extension
*   **And** Claude Sonnet generates a new version inserting top 5 missing keywords
*   **And** the system generates a downloadable PDF preserving the original formatting
*   **Success Metric:** Optimization completes in <30 seconds. Match score increases by >20 points.

**Edge Cases:**
*   **Invalid URL:** Show "Please use the Extension to capture this job."
*   **PDF Generation Fail:** Offer "Download Markdown" fallback.

## Feature: Contact Discovery (C-1, C-2)

**User Story:** "As a job seeker, I want to find a hiring manager to message so I can get a referral."

**Acceptance Criteria:**
*   **Given** a valid Company Name from the Job Description
*   **When** the user clicks "Find Contacts"
*   **Then** the system checks the `linkedin_search_cache` first
*   **And** if missing, queries Google Custom Search API for `site:linkedin.com/in/ "Company" AND "Recruiter"`
*   **And** displays 3-10 results with Name, Headline, and Profile Link
*   **Success Metric:** >80% of searches return at least 1 relevant result.

**Edge Cases:**
*   **Quota Exceeded:** Show "Daily limit reached. Try manual search."
*   **No Results:** Show "No direct contacts found. Try searching for 'Team Lead' manually."

## Feature: Outreach Generator (M-1 to M-3)

**User Story:** "As a job seeker, I want to draft a message in seconds so I don't overthink it."

**Acceptance Criteria:**
*   **Given** a selected Contact and a Job Description
*   **When** the user selects "Professional Tone"
*   **Then** Claude generates a 300-character message referencing the specific role and company
*   **And** the "Copy" button copies the text to clipboard
*   **And** the "Open Profile" button launches a Google Search for the person (Safe Handoff)
*   **Success Metric:** User edits <15% of the generated text.

---
