---
title: Product Requirements Document (PRD)
project: Job Outreach System
status: Approved
date: 2026-01-02
author: Raghav (PM: John)
version: 1.1 (Refined)
---

# Product Requirements Document: Job Outreach System

## 1. Executive Summary

**Job Outreach System** is an internal productivity tool designed to eliminate the "friction-motivation death spiral" for job seekers. By unifying Resume Optimization, Contact Discovery, and Outreach Drafting into a single <5-minute workflow, it enables users to apply to 2-3x more jobs with higher quality materials.

**Target Audience:** 10-20 friends/family members (internal use only).
**Core Value Prop:** "Apply to jobs without the burnout." Replaces $200+/mo fragmented tools with a unified, free/low-cost workflow.

---

## 2. Feature Prioritization

### MUST-HAVE (MVP - Week 1-4)
1.  **Resume Optimizer:** Upload master resume, parse job URL, AI-rewrite content, download PDF.
2.  **Contact Finder (X-Ray):** Google API search for recruiters at target company.
3.  **Outreach Generator:** AI-drafted messages based on resume + JD + recipient.
4.  **Chrome Extension (Passive):** Capture job details from LinkedIn/Indeed to avoid scraping blocks.
5.  **Auth & Security:** Supabase Auth + RLS for user data isolation.

### SHOULD-HAVE (Post-MVP)
*   Apollo.io integration (Deep profile enrichment).
*   Diff View (Before/After resume comparison).
*   Message history/favorites.

### WON'T-HAVE (Explicitly Excluded)
*   Application Tracking System (Kanban).
*   Email Finding (Hunter.io).
*   Mobile App.
*   Payment Processing (Internal tool).

---

## 3. User Stories & Acceptance Criteria

### Feature: Resume Optimization (R-1 to R-5)

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

### Feature: Contact Discovery (C-1, C-2)

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

### Feature: Outreach Generator (M-1 to M-3)

**User Story:** "As a job seeker, I want to draft a message in seconds so I don't overthink it."

**Acceptance Criteria:**
*   **Given** a selected Contact and a Job Description
*   **When** the user selects "Professional Tone"
*   **Then** Claude generates a 300-character message referencing the specific role and company
*   **And** the "Copy" button copies the text to clipboard
*   **And** the "Open Profile" button launches a Google Search for the person (Safe Handoff)
*   **Success Metric:** User edits <15% of the generated text.

---

## 4. Non-Functional Requirements

### Performance
*   **Page Load:** <1.5s (FCP) on Dashboard.
*   **API Latency:** Internal routes <500ms (p95).
*   **AI Latency:** Claude generation <10s (Show skeleton loader).
*   **Scraping:** Extension capture <1s (Instant DOM read).

### Security
*   **Auth:** Supabase Auth (Email/Password).
*   **Data Isolation:** RLS enabled on ALL tables (`auth.uid() = user_id`).
*   **API Keys:** Stored in Vercel Env Vars, never exposed to client.

### Reliability
*   **Quota Management:** Cache hits target >70% to prevent Google API 429s.
*   **Fallbacks:** If AI fails, show "Manual Template" (fill-in-the-blanks).

### Scalability
*   **Users:** Support 50 concurrent users (Supabase Free Tier).
*   **Storage:** Auto-delete generated PDFs after 24h to save space.

---

## 5. Success Metrics

### Primary Metric (North Star)
*   **Applications Submitted:** >20 applications/week per active user.

### Secondary Metrics
*   **Time Savings:** Average session length <5 minutes per job.
*   **Cost:** <$10/month total API cost for pilot group.
*   **Quality:** Resume Match Score average >75%.

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Google API Ban** | Critical | Use "Safe Search" patterns. Cache results. Use multiple API keys if needed. |
| **LinkedIn Structure Change** | High | Extension uses broad DOM selectors (heuristic) rather than brittle class names. |
| **Claude Cost Spike** | Medium | Set hard monthly spend limit in Anthropic console ($50). |
| **User Trust** | Medium | Always show "Diff View" so users see exactly what changed in their resume. |

---
