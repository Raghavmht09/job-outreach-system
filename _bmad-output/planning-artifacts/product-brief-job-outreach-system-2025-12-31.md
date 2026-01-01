
## User Journey

### Phase 1: Resume Optimizer (Weeks 1-2)

**Goal:** Transform a generic resume into a highly competitive, ATS-optimized PDF in <1 minute.

1.  **Job Input**
    *   User navigates to Dashboard.
    *   User pastes URL from LinkedIn/Indeed/Wellfound.
    *   **System Action:** Scrapes JD content (Title, Skills, Requirements, Company).

2.  **Analysis & Strategy**
    *   System compares Master Resume vs. JD.
    *   **Output:** "Match Score" (e.g., 45%) + "Gap Analysis" (Missing skills: React, TypeScript).

3.  **Optimization Loop**
    *   User clicks "Optimize".
    *   **System Action:** Claude rewrites Summary and Bullet Points to naturally include missing keywords.
    *   **Output:** New "Match Score" (e.g., 85%) + Diff View (Old vs. New).

4.  **Finalize**
    *   User reviews changes (accepts/rejects optional).
    *   User clicks "Download PDF".
    *   **System Action:** Generates clean, ATS-parsed PDF.

### Phase 2: Contact Discovery & Outreach (Weeks 3-4)

**Goal:** Identify a human to contact and generate a personalized message in <2 minutes.

1.  **Discovery**
    *   User clicks "Find Contacts" (on the same Job Result page).
    *   **System Action:** Searches for "Recruiter", "Hiring Manager", "Peer Role" at [Company].
    *   **Display:** List of Profiles (Name, Title, Headline).

2.  **Selection & Drafting**
    *   User selects a profile (e.g., "Sarah Jones - Tech Recruiter").
    *   User selects Tone: "Direct" (for recruiters) or "Casual" (for peers).
    *   **System Action:** Generates message using [User Resume] + [JD] + [Recipient Profile].

3.  **Handoff (The "Risk-Aware" Flow)**
    *   User clicks "Copy Message".
    *   **Default Mode (Safe):** System displays "Search for 'Sarah Jones' at 'Acme Corp' on LinkedIn" with a copy button for the search term.
    *   **Advanced Mode (Risky):** *If enabled in Settings*, system displays "Open Profile" button linking directly to `linkedin.com/in/sarah-jones`.
    *   **Action:** User navigates to LinkedIn (via Search or Link), connects, and pastes the message.

### Phase 3: Tracking (Post-MVP)

*Deferred as per Product Scope agreements.*
