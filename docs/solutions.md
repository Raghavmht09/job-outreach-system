# Job Outreach Platform - Solution Space for BMAD
**Project Type:** Personal productivity tool for cost savings  
**Primary Users:** Individual (me) + 10-20 friends/family actively job searching  
**Build Order:** Phase 1 (Resume Optimizer) → Phase 2 (Referral Finder) → Phase 3 (Tracker - Optional)  
**Timeline:** 3-4 weeks total (1-2 weeks per phase)  
**Success Metric:** Save 30+ min per job application (14.5 min from resume + 14.5 min from referrals)

---

## Core Insight: Cognitive Load Drives Build Order

**Key Discovery:** Features used at HIGH motivation moments (before applying) get used 100%. Features used at LOW motivation moments (after applying) get skipped 80%+ of the time.

### Motivation Mapping

| Task | When It Happens | User Energy Level | Actual Usage Rate | Build Priority |
|------|----------------|-------------------|-------------------|----------------|
| **Resume optimization** | Before applying (excited about job) | HIGH | 100% | **Phase 1** |
| **Finding referrals** | Before applying (want to maximize chances) | HIGH | 80% | **Phase 2** |
| **Tracking applications** | After applying (mentally drained) | LOW | 20% | **Phase 3 (Optional)** |

**Decision Rule:** Build features that intercept HIGH motivation moments first.

---

## Phase 1: Resume Optimizer (Week 1-2)

### Problem Statement

**Current pain:** Tailoring resume for each job takes 15 minutes of manual editing in Word/Google Docs. ATS systems auto-reject resumes that don't match keywords.

**User's mental model:**
- "I found a job I'm excited about"
- "I need to add relevant keywords to my resume"
- "I don't know which keywords matter most"
- "I'm guessing at formatting that ATS can parse"
- **Cognitive load: HIGH (decision fatigue about what to change)**

**Solution:** AI-powered resume optimization that shows match score + generates ATS-friendly PDF in 30 seconds.

### Job-to-be-Done

"When I find a job posting I want to apply to, I need my resume to pass ATS keyword filtering and match the job requirements, so that a human actually sees my application."

### User Flow (3 Screens Max)

**Screen 1: Input**
```
User action: Upload master resume (DOCX - one-time setup)
User action: Paste job URL (LinkedIn, Indeed, Wellfound)
System action: Validate URL format
Click: [Optimize Resume]
```

**Screen 2: Results (Single-shot, no intermediate steps)**
```
System displays:
- Match score: 78% (circular progress indicator)
- Keywords added: 12 (Python, Docker, Agile, etc.)
- Sections rewritten: 5 bullet points
- Formatting fixes: Removed tables, simplified to ATS-friendly format

User actions:
- [Download Optimized PDF] (primary CTA)
- [View Before/After] (optional, opens modal with diff)
```

**Screen 3: Before/After Comparison (Optional)**
```
Only shown if user clicks "View Before/After"
Side-by-side diff:
- Original resume (left)
- Optimized resume (right)
- Highlights showing keyword additions in green
```

**Time to value: <1 minute (upload → paste → download)**

### Core Features

#### 1. Job Description Scraper
**Technical approach:**
- Playwright headless browser for LinkedIn/Indeed/Wellfound
- Extract: job title, company name, full job description
- Fallback: If scraping fails, allow manual paste of JD text

**Implementation:**
```typescript
async function scrapeJobDescription(jobUrl: string): Promise<JobData> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(jobUrl, { waitUntil: 'networkidle' });
  
  if (jobUrl.includes('linkedin.com')) {
    return {
      title: await page.textContent('.job-details-jobs-unified-top-card__job-title'),
      company: await page.textContent('.job-details-jobs-unified-top-card__company-name'),
      description: await page.textContent('.jobs-description__content')
    };
  }
  // Similar logic for Indeed, Wellfound
  
  await browser.close();
}
```

#### 2. Keyword Extraction & Match Scoring
**Algorithm:**
```
Match Score = (Keyword Overlap × 40%) 
            + (Formatting Quality × 30%) 
            + (Section Structure × 20%) 
            + (Keyword Density × 10%)

Keyword Overlap:
- Extract hard skills, soft skills, tools, certifications from JD
- Count how many appear in resume
- Score = (matched keywords / total JD keywords) × 100

Formatting Quality:
- Penalty for: tables, images, multiple columns, fancy fonts
- Bonus for: simple single-column, standard fonts (Arial, Calibri)

Section Structure:
- Must have: Skills, Experience, Education sections
- Penalty if missing critical sections

Keyword Density:
- Penalize if keywords appear >3 times (keyword stuffing)
- Optimal: Each keyword appears 1-2 times naturally
```

**Claude API Call:**
```typescript
const analysis = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  messages: [{
    role: 'user',
    content: `Analyze resume vs job description. Return JSON only.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return format:
{
  "matchScore": 0-100,
  "missingKeywords": ["Python", "Docker"],
  "keywordOverlap": ["JavaScript", "React", "Node.js"],
  "formattingIssues": ["Contains tables", "Uses fancy fonts"],
  "suggestions": ["Add Python to skills section", "Rewrite bullet to include 'led team of 5'"]
}`
  }]
});
```

#### 3. Resume Rewriting (AI-Powered)
**Approach:** Section-by-section optimization (not entire resume at once)

**Claude Prompt Template:**
```
You are optimizing a resume for ATS systems and human recruiters.

Context:
- Job Title: {jobTitle}
- Key Requirements: {topKeywords}
- User's Background: {resumeSummary}

Task: Rewrite the following resume section to naturally include these keywords: {missingKeywords}

Original:
{originalSection}

Requirements:
1. Maintain the user's voice and tone
2. Add keywords naturally (no keyword stuffing)
3. Use action verbs (Led, Architected, Implemented, Optimized)
4. Quantify impact where possible (e.g., "improved performance by 40%")
5. Keep bullet points concise (1-2 lines max)

Return ONLY the rewritten section, no preamble.
```

**Example transformation:**
```
Original:
"Worked on backend APIs for the company's main product"

Optimized (for Python/FastAPI role):
"Led development of scalable backend APIs using Python and FastAPI, serving 1M+ requests/day with 99.9% uptime"
```

#### 4. ATS-Friendly PDF Generation
**Technical approach:**
- Use Puppeteer to render HTML → PDF (better than LaTeX for control)
- Strict formatting rules:
  - Single column layout
  - Standard fonts only (Arial, Calibri, Times New Roman)
  - No images, no tables, no text boxes
  - Black text on white background
  - Standard section headings (Experience, Education, Skills)

**Validation:** Test generated PDFs with common ATS systems:
- Workday (upload PDF, check if it parses correctly)
- Greenhouse (same test)
- Lever (same test)

### Database Schema (Supabase)

```sql
-- Master resumes (one per user)
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  content_text TEXT NOT NULL, -- Extracted text from DOCX
  file_path TEXT NOT NULL, -- Supabase Storage path to original DOCX
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized resumes (generated per job)
CREATE TABLE optimized_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  master_resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  keywords_added TEXT[], -- Array of keywords added
  file_path TEXT NOT NULL, -- Supabase Storage path to optimized PDF
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own resumes"
  ON resumes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own optimized resumes"
  ON optimized_resumes FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_optimized_resumes_user_id ON optimized_resumes(user_id);
CREATE INDEX idx_optimized_resumes_created_at ON optimized_resumes(created_at DESC);
```

### API Endpoints

```typescript
// POST /api/upload-resume
// Upload master resume (one-time setup)
// Input: FormData with DOCX file
// Output: { resumeId, fileName }

// POST /api/optimize
// Generate optimized resume for a specific job
// Input: { resumeId, jobUrl }
// Output: { matchScore, keywordsAdded, pdfUrl }

// GET /api/resumes
// List user's master resume and all optimized versions
// Output: { master: Resume, optimized: OptimizedResume[] }

// DELETE /api/resumes/:id
// Delete resume (master or optimized)
// Also deletes file from Supabase Storage
```

### Success Metrics (Phase 1)

**Usage metrics:**
- [ ] 100% of job applications use the optimizer (me + friends)
- [ ] Average optimization time: <1 minute (vs 15 min manual)
- [ ] User rating: 4+/5 on resume quality

**Quality metrics:**
- [ ] Match scores improve from <50% to >70% on average
- [ ] User-reported: "I got more callbacks" (qualitative feedback)
- [ ] Zero complaints about ATS parsing failures

**Technical metrics:**
- [ ] Scraping success rate: >95% (LinkedIn, Indeed, Wellfound)
- [ ] PDF generation success: 100% (no corrupt files)
- [ ] Claude API cost: <$0.20 per optimization

### Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **PDF parsing fails on complex resumes** | High | Medium | Only support DOCX uploads (easier to parse). If user has PDF, ask them to convert to DOCX first. |
| **AI over-optimizes (keyword stuffing)** | Medium | High | Human-in-the-loop: User reviews optimized resume before downloading. Add prompt instruction: "Be natural, no keyword stuffing." |
| **LinkedIn/Indeed blocks scraping** | Medium | Medium | Fallback: Allow user to manually paste job description if scraping fails. |
| **Match score is inaccurate** | Medium | Critical | Add disclaimer: "This score estimates ATS compatibility based on common patterns. Actual ATS systems vary." A/B test with real applications to calibrate. |
| **Generated resume sounds robotic** | Low | High | Use Claude Sonnet 4 (best quality). Prompt emphasizes: "Maintain user's voice and tone." Show before/after diff so user can reject if needed. |

---

## Phase 2: Referral Finder (Week 3)

### Problem Statement

**Current pain:** Finding who you know at a company takes 15 minutes of manual LinkedIn stalking. Crafting a non-awkward referral request is mentally taxing.

**User's mental model:**
- "I found a great job at Company X"
- "Referrals increase my chances 10x, but..."
- "I don't know who I know there"
- "Even if I find someone, I don't know what to say"
- "Asking feels awkward and salesy"
- **Cognitive load: HIGH (social anxiety + manual search friction)**

**Solution:** Paste job URL → See your 1st/2nd degree connections at that company → AI generates 3 referral message variants → Copy and send.

### Job-to-be-Done

"When I find a job I'm excited about, I need to identify who I know at that company and get a ready-to-send referral request message, so I can increase my interview chances without the awkwardness."

### User Flow (2 Screens)

**Screen 1: Input**
```
User pastes job URL (from LinkedIn job posting)
System extracts: Company name, job title
Click: [Find My Connections]
Loading: "Searching your network..." (5-10 seconds)
```

**Screen 2: Results**
```
Display: List of connections (sorted by likelihood of helping)

Each connection card shows:
- Avatar (LinkedIn photo)
- Name (John Doe)
- Title (Senior Engineering Manager at Acme Corp)
- Connection degree (2nd degree via Jane Smith)
- Confidence score (85% likely to help - worked together 2019-2021)
- [Generate Referral Message]

User clicks on one connection:
→ Modal opens with 3 message variants:
  1. Casual tone
  2. Professional tone
  3. Direct/brief tone

User selects one, optionally edits, then:
- [Copy to Clipboard]
- Manually sends via LinkedIn

System tracks: Message generated (user marks as "sent" manually)
```

**Time to value: <2 minutes (paste URL → see connections → copy message)**

### Core Features

#### 1. LinkedIn Connection Discovery

**Challenge:** LinkedIn official API only provides 1st-degree connections (useless for referral finding).

**Options:**

**Option A: Official LinkedIn API (Safe, Limited)**
- Use OAuth to access user's 1st-degree connections only
- Filter by company name
- **Limitation:** Misses 2nd/3rd degree (where most opportunities are)
- **Use case:** Good enough if user has 500+ connections (likely to have 5-10 at target company)

**Option B: LinkedIn Scraping (Risky, Comprehensive)**
- Use Playwright to scrape LinkedIn search results
- Search query: "People who work at [Company] in my network"
- Extract: Name, title, profile URL, connection degree, mutual connection name
- **Risk:** LinkedIn may ban dummy account (mitigation: use dummy, not main account)
- **Rate limits:** Max 20 searches/day, 5-10 second delays between requests

**Recommended Approach for Personal Use:**
- Start with Option B (scraping) - you're only using it for yourself + 10 friends
- Use dummy LinkedIn account (NOT your main profile)
- If account gets banned → Create new one (takes 15 min)
- **For YOU, the risk is negligible (15 min inconvenience vs hours of manual searching)**

**Implementation:**
```typescript
async function findConnectionsAtCompany(
  companyName: string, 
  linkedinAccessToken?: string // Optional: for official API
): Promise<Connection[]> {
  
  // Option A: Official API (if user connected LinkedIn)
  if (linkedinAccessToken) {
    const connections = await linkedInAPI.getConnections({
      accessToken: linkedinAccessToken,
      company: companyName,
      limit: 100
    });
    
    return connections.map(conn => ({
      name: conn.firstName + ' ' + conn.lastName,
      title: conn.headline,
      profileUrl: conn.publicProfileUrl,
      degree: 1, // API only gives 1st degree
      confidenceScore: calculateConfidence(conn)
    }));
  }
  
  // Option B: Scraping (fallback or primary for 2nd/3rd degree)
  const browser = await chromium.launch({ 
    headless: false, // Less detectable
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...'
  });
  
  const page = await browser.newPage();
  
  // Login with dummy account (credentials from env vars)
  await page.goto('https://www.linkedin.com/login');
  await page.fill('#username', process.env.LINKEDIN_DUMMY_EMAIL);
  await page.fill('#password', process.env.LINKEDIN_DUMMY_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  // Search for connections at company
  const searchQuery = `people who work at ${companyName}`;
  await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`);
  
  // Random delay (anti-detection)
  await page.waitForTimeout(3000 + Math.random() * 2000);
  
  // Extract results
  const connections = await page.$$eval('.reusable-search__result-container', (elements) => {
    return elements.slice(0, 10).map(el => ({
      name: el.querySelector('.entity-result__title-text')?.innerText?.trim(),
      title: el.querySelector('.entity-result__primary-subtitle')?.innerText?.trim(),
      profileUrl: el.querySelector('a.app-aware-link')?.href,
      degree: el.querySelector('.entity-result__badge-text')?.innerText?.includes('2nd') ? 2 : 
              el.querySelector('.entity-result__badge-text')?.innerText?.includes('3rd') ? 3 : 1,
      mutualConnection: el.querySelector('.entity-result__summary')?.innerText?.match(/via (.+)/)?.[1]
    }));
  });
  
  await browser.close();
  
  return connections;
}
```

**Anti-Detection Measures:**
```typescript
const SCRAPING_CONFIG = {
  maxSearchesPerDay: 20, // Stay under LinkedIn's radar
  delayBetweenRequests: 5000 + Math.random() * 3000, // 5-8 seconds
  headless: false, // Headed mode occasionally (less suspicious)
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Simulate human behavior
  randomMouseMovements: true,
  randomScrolls: true,
  typingDelay: 100 // ms per character when filling forms
};
```

#### 2. Confidence Scoring

**Algorithm:** Calculate likelihood that connection will help (0-100%)

```typescript
function calculateConfidence(connection: Connection): number {
  let score = 50; // Base score
  
  // Factor 1: Relationship strength (40% weight)
  if (connection.workedTogetherYears >= 2) score += 20;
  else if (connection.workedTogetherYears >= 1) score += 10;
  else if (connection.metInPerson) score += 5;
  
  // Factor 2: Recency (30% weight)
  const monthsSinceContact = calculateMonthsSince(connection.lastInteraction);
  if (monthsSinceContact <= 1) score += 15;
  else if (monthsSinceContact <= 6) score += 10;
  else if (monthsSinceContact <= 12) score += 5;
  else score -= 5; // Penalty for stale relationship
  
  // Factor 3: Role relevance (20% weight)
  if (connection.title.includes('Hiring Manager')) score += 15;
  else if (connection.title.includes('Recruiter')) score += 10;
  else if (connection.title.includes('Engineer') || connection.title.includes('Manager')) score += 5;
  
  // Factor 4: Connection degree (10% weight)
  if (connection.degree === 1) score += 10; // Direct connection
  else if (connection.degree === 2 && connection.mutualConnectionStrength === 'high') score += 5;
  else if (connection.degree === 3) score -= 5; // Weak connection
  
  return Math.min(Math.max(score, 0), 100); // Clamp to 0-100
}
```

#### 3. Referral Message Generator

**Prompt Engineering:**

```typescript
async function generateReferralMessage(
  connection: Connection,
  jobTitle: string,
  userBackground: string,
  tone: 'casual' | 'professional' | 'direct'
): Promise<string> {
  
  const toneInstructions = {
    casual: "Friendly, conversational, like texting a friend. Use 'Hey' to open.",
    professional: "Polite and respectful, use 'Hi' or 'Hello'. Slightly formal.",
    direct: "Brief and to-the-point. Get to the ask quickly. Ultra-concise."
  };
  
  const prompt = `Generate a LinkedIn referral request message.

Context:
- Recipient: ${connection.name}, ${connection.title} at ${connection.company}
- Connection type: ${connection.degree}${connection.degree > 1 ? ` degree via ${connection.mutualConnection}` : ''}
- Job I'm applying for: ${jobTitle} at ${connection.company}
- My background: ${userBackground}
- Message tone: ${toneInstructions[tone]}

Requirements:
1. Keep under 300 characters (LinkedIn connection message limit)
2. Reference our connection (if 2nd degree, mention mutual friend)
3. Mention ONE specific skill/experience that matches the role
4. Clear, low-pressure ask: "Would you be open to referring me?"
5. NO fluff, get to the point quickly
6. End with easy next step (offer to send resume, happy to chat)

Generate ONLY the message text, no preamble or explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return response.content[0].text.trim();
}
```

**Example Messages:**

**Casual Tone (2nd degree connection via Jane):**
> Hey John! Jane mentioned you're at Acme. I'm applying for the Senior PM role and saw we both worked on B2B SaaS products. Would you be open to referring me? Happy to send my resume over. Thanks!

**Professional Tone (1st degree):**
> Hi John, I hope you're doing well. I noticed Acme is hiring for a Senior PM role, which aligns perfectly with my 5 years in product management. Would you be willing to provide a referral? I'd be happy to share my resume and discuss further. Thank you for considering!

**Direct Tone:**
> John - Quick ask: I'm applying for Senior PM at Acme. Would you refer me? I have 5 years PM experience in B2B SaaS. Can send resume if helpful. Thanks!

### Database Schema (Phase 2 Addition)

```sql
-- Connections found for each job
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL, -- Which job is this connection for?
  linkedin_profile_url TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT NOT NULL,
  connection_degree INTEGER CHECK (connection_degree IN (1, 2, 3)),
  mutual_connection_name TEXT, -- Only for 2nd/3rd degree
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral messages generated
CREATE TABLE referral_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  tone TEXT CHECK (tone IN ('casual', 'professional', 'direct')),
  sent_at TIMESTAMPTZ, -- NULL if not sent yet
  response_status TEXT DEFAULT 'pending', -- 'pending', 'agreed', 'declined', 'no_response'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track LinkedIn scraping usage (rate limiting)
CREATE TABLE linkedin_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  searches_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- RLS Policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own connections only"
  ON connections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own messages only"
  ON referral_messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own usage only"
  ON linkedin_usage FOR ALL USING (auth.uid() = user_id);
```

### API Endpoints (Phase 2)

```typescript
// POST /api/find-connections
// Input: { jobUrl }
// Output: { connections: Connection[], usageToday: number, dailyLimit: 20 }

// POST /api/generate-message
// Input: { connectionId, tone: 'casual' | 'professional' | 'direct' }
// Output: { messageText }

// POST /api/mark-sent
// Input: { messageId, sentAt: timestamp }
// Updates referral_messages.sent_at

// GET /api/usage/today
// Check if user has hit daily scraping limit
// Output: { searchesToday: number, limit: 20, canSearch: boolean }
```

### Success Metrics (Phase 2)

**Usage metrics:**
- [ ] 60%+ of job applications use referral finder (not all jobs warrant referrals)
- [ ] Average time to find connections: <1 minute (vs 15 min manual)
- [ ] Messages actually sent: >60% (users copy and send, not just generate and abandon)

**Quality metrics:**
- [ ] User feedback: "Messages sound natural, not robotic" (4+/5 rating)
- [ ] Response rate: >10% (industry baseline for cold LinkedIn messages is 5-10%)

**Technical metrics:**
- [ ] Connection discovery success: >80% (found at least 1 connection for 80% of jobs)
- [ ] Scraping uptime: >90% (account not banned, scraper not broken)
- [ ] Zero account bans on user's main LinkedIn profile (only dummy accounts banned)

### Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **LinkedIn bans dummy account** | High | Low | Create new dummy account in 15 min. Keep 2-3 accounts ready as backups. For personal use, this is a minor inconvenience. |
| **User has small network (<100 connections)** | Medium | High | Focus on 1st-degree connections only (official API). Add feature: "Expand your network" suggestions (people to connect with at target companies). |
| **Scraping breaks (LinkedIn changes DOM)** | Medium | Medium | Use semantic selectors (data-* attributes, ARIA labels). Monitor for breakages. Manual fallback: User searches LinkedIn themselves. |
| **Users feel awkward sending messages** | Low | Medium | Provide stats in UI: "Referrals increase interview rates 10x". A/B test tones (casual vs professional). User education: "This is normal, not spammy." |
| **Message quality is generic/robotic** | Low | High | Use Claude Sonnet 4 (best quality). Show 3 variants so user can pick. Allow inline editing before sending. |

---

## Phase 3: Application Tracker (Week 4+ - Optional)

### Problem Statement

**Current pain:** Tracking applications manually in spreadsheets takes 30 minutes/week. Forgetting to follow up after 1-2 weeks = lost opportunities.

**User's mental model:**
- "I just applied to a job, now I need to log it"
- **Energy level: LOW (mentally drained from applying)**
- "This feels like busywork, I'll do it later" (never does it)
- **Cognitive load: LOW (simple data entry, but post-motivation moment)**

**Solution:** Chrome extension auto-captures applications → Dashboard shows all jobs → Automated follow-up reminders.

### Job-to-be-Done

"When I apply to many jobs, I need to track what I applied to and remember to follow up at the right time, so I don't lose opportunities due to forgetfulness."

### Why This is Phase 3 (Optional)

**Behavioral reality:**
- Tracking happens AFTER applying (low energy moment)
- Most users skip tracking 80% of the time
- For 10-20 applications, a simple spreadsheet is "good enough"

**Build this ONLY if:**
- You're applying to 50+ jobs (manual tracking becomes painful)
- Resume Optimizer + Referral Finder are working well (proven value)
- Users explicitly request it ("I wish I had tracking")

**Otherwise:** Skip it. Google Sheets is fine.

### User Flow (If Built)

**Screen 1: Chrome Extension Auto-Capture**
```
User applies to job on LinkedIn (clicks "Submit Application")
Extension detects application submission (monitors DOM for confirmation modal)
Extension captures: Job title, company, URL, date
Extension saves to Supabase (background, user doesn't see anything)
Extension shows toast: "Application tracked ✓"
```

**Screen 2: Dashboard (Simple List)**
```
Display all applications in table:
- Company | Job Title | Applied Date | Status | Actions

User actions:
- Update status dropdown (Applied, Followed Up, Interviewing, Rejected, Offer)
- Click "Send Follow-up" (after 7 days, generates AI message)
- Add notes (text area for each application)

Auto-calculated fields:
- Days since applied (e.g., "Applied 5 days ago")
- Follow-up due date (Applied + 7 days)
- Visual indicator: "Follow-up due!" (if >7 days and status still "Applied")
```

**Screen 3: Follow-up Message Generator (Optional)**
```
After 7 days, if status is still "Applied":
- Dashboard shows "Follow-up due" badge
- User clicks "Generate Follow-up Message"
- Claude generates short, polite follow-up:
  - Week 1: "Checking in on my application, want to reiterate my interest"
  - Week 2: "Following up one last time, happy to provide additional info"
- User copies and sends via LinkedIn or email
- User marks as "Followed Up"
```

### Database Schema (Phase 3)

```sql
CREATE TYPE application_status AS ENUM (
  'applied',
  'followed_up',
  'interviewing',
  'rejected',
  'offer'
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  optimized_resume_id UUID REFERENCES optimized_resumes(id), -- Link to Phase 1
  job_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  platform TEXT, -- 'linkedin', 'indeed', 'wellfound', 'email', 'other'
  status application_status DEFAULT 'applied',
  applied_date DATE NOT NULL,
  follow_up_date DATE GENERATED ALWAYS AS (applied_date + INTERVAL '7 days') STORED,
  second_follow_up_date DATE GENERATED ALWAYS AS (applied_date + INTERVAL '14 days') STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own applications only"
  ON applications FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_follow_up_date ON applications(follow_up_date);
```

### Chrome Extension Implementation

**manifest.json (Manifest V3):**
```json
{
  "manifest_version": 3,
  "name": "Job Application Tracker",
  "version": "1.0",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "*://*.linkedin.com/*",
    "*://*.indeed.com/*",
    "*://*.wellfound.com/*"
  ],
  "content_scripts": [{
    "matches": [
      "*://*.linkedin.com/jobs/*",
      "*://*.indeed.com/*",
      "*://*.wellfound.com/*"
    ],
    "js": ["content.js"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

**content.js (Detect application submission):**
```javascript
// LinkedIn detection
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // LinkedIn shows "Application sent" modal after submission
      if (node.querySelector?.('[data-test-modal-id="application-sent"]')) {
        captureLinkedInApplication();
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

function captureLinkedInApplication() {
  const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText?.trim();
  const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText?.trim();
  const jobUrl = window.location.href;
  
  if (jobTitle && company) {
    chrome.runtime.sendMessage({
      action: 'saveApplication',
      data: {
        jobTitle,
        company,
        jobUrl,
        platform: 'linkedin',
        appliedDate: new Date().toISOString().split('T')[0]
      }
    });
    
    // Show confirmation toast
    showToast('Application tracked ✓');
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px; border-radius: 8px; z-index: 10000;';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

**background.js (Save to Supabase):**
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveApplication') {
    saveToSupabase(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error }));
    
    return true; // Keep message channel open for async response
  }
});

async function saveToSupabase(data) {
  // Get user's auth token from storage
  const { supabaseToken } = await chrome.storage.local.get('supabaseToken');
  
  const response = await fetch('https://YOUR_PROJECT.supabase.co/rest/v1/applications', {
    method: 'POST',
    headers: {
      'apikey': 'YOUR_SUPABASE_ANON_KEY',
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error('Failed to save application');
}
```

### Success Metrics (Phase 3)

**Usage metrics:**
- [ ] 80%+ of applications auto-captured (vs 0% manual entry rate)
- [ ] 50%+ of users actually send follow-ups (vs 10% without reminders)

**Quality metrics:**
- [ ] User feedback: "I never would have followed up without this" (qualitative)
- [ ] Follow-up response rate: >5% (baseline for follow-ups)

**Technical metrics:**
- [ ] Extension uptime: >95% (doesn't break when LinkedIn updates UI)
- [ ] Auto-capture accuracy: >90% (correctly identifies job title, company)

---

## Technical Architecture (All Phases)

### Stack Summary

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  UI Library: shadcn/ui (Radix + Tailwind CSS)
  State Management: TanStack Query (React Query) for server state
  Deployment: Vercel (free tier sufficient for 10-20 users)

Backend:
  Database: Supabase Postgres
  Authentication: Supabase Auth (email/password)
  Storage: Supabase Storage (resumes, PDFs)
  API: Next.js API Routes (server-side logic)
  Edge Functions: Supabase Edge Functions (webhooks, cron jobs if needed)

AI:
  Primary: Claude Sonnet 4 (resume optimization, message generation)
  Secondary: Claude Haiku 4 (simple tasks like keyword extraction)
  API: Anthropic SDK (@anthropic-ai/sdk)

Automation:
  Scraping: Playwright (LinkedIn, job boards)
  Browser: Chromium headless (for scraping)
  Rate Limiting: Custom Redis-like logic (track searches per day)

Chrome Extension (Phase 3 only):
  Manifest: V3 (latest standard)
  Content Scripts: Detect application submissions
  Background Worker: Save to Supabase
```

### Cost Projection (10 users, moderate usage)

| Service | Free Tier Limit | Projected Usage | Monthly Cost |
|---------|----------------|-----------------|--------------|
| **Supabase** | 500MB DB, 1GB storage, 2GB bandwidth | 50MB DB, 200MB storage, 500MB bandwidth | $0 |
| **Vercel** | 100GB bandwidth | ~5GB bandwidth | $0 |
| **Claude API** | Pay-as-you-go | 50 optimizations/user/month × 10 users = 500 × $0.10 | $50 |
| **Playwright** | Open-source | Self-hosted on Vercel serverless | $0 |
| **Total** | | | **$50/month** |

**Per-user cost:** $5/month (vs $200/month for B2B tools)

**ROI:** 97.5% cost savings

### Environment Variables

```bash
# .env.local (NEVER commit to Git)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# LinkedIn Scraping (Dummy Account)
LINKEDIN_DUMMY_EMAIL=jobtracker_bot_123@gmail.com
LINKEDIN_DUMMY_PASSWORD=SecurePassword123!

# Optional: Paid services (if free tiers exhausted)
HUNTER_API_KEY=... # Email finder (25/month free)
SNOV_API_KEY=... # Email finder (50/month free)
```

### Development Workflow

**Week 1: Phase 1 (Resume Optimizer)**
```bash
# Day 1: Setup
npx create-next-app@latest job-outreach --typescript --tailwind --app
cd job-outreach
npx shadcn-ui@latest init
npm install @supabase/supabase-js @anthropic-ai/sdk playwright

# Day 2-3: Core feature
# Build: Upload page, scraping function, Claude integration
# Test: Optimize YOUR resume for a real job

# Day 4: PDF generation
# Library: Puppeteer or jsPDF
# Test: Download and verify PDF is ATS-friendly

# Day 5: Polish + deploy
# Fix bugs, deploy to Vercel, use for real job applications
```

**Week 2: Phase 1 Polish + Start Phase 2**
```bash
# Day 1-2: User feedback
# Use Phase 1 for 5 real job applications
# Fix bugs, improve prompts based on quality

# Day 3-5: Start Phase 2 (Referral Finder)
# Build: LinkedIn scraping OR official API integration
# Test: Find connections for YOUR target companies
```

**Week 3: Phase 2 Complete**
```bash
# Day 1-3: Message generation
# Claude prompts for 3 tone variants
# Test: Generate messages for YOUR connections, verify quality

# Day 4-5: Integration + testing
# Connect Phase 1 + Phase 2 (from dashboard, optimize resume + find referrals)
# Use for real job applications
```

**Week 4: Optional Phase 3 OR Stop**
```bash
# Decision point: Are Phases 1+2 providing value?
# If YES and applying to 50+ jobs → Build Phase 3
# If YES but only applying to 10-20 jobs → Stop here, use Google Sheets for tracking
# If NO → Debug why Phases 1+2 aren't working before building more
```

---

## User Stories & Acceptance Criteria

### Phase 1: Resume Optimizer

**User Story 1: Upload Master Resume**
```
As a job seeker,
I want to upload my master resume once,
So that I can reuse it for multiple job optimizations without re-uploading.

Acceptance Criteria:
- [ ] User can drag-drop or click to upload DOCX file
- [ ] System validates file type (reject if not DOCX)
- [ ] System extracts text and stores in Supabase
- [ ] System shows confirmation: "Resume uploaded ✓"
- [ ] User can view uploaded resume filename in profile
```

**User Story 2: Optimize Resume for Job**
```
As a job seeker,
I want to paste a job URL and get an optimized resume,
So that I can apply with an ATS-friendly resume in <1 minute.

Acceptance Criteria:
- [ ] User can paste LinkedIn/Indeed/Wellfound job URL
- [ ] System scrapes job description (or allows manual paste if scraping fails)
- [ ] System generates match score (0-100%) within 30 seconds
- [ ] System lists missing keywords and sections rewritten
- [ ] User can download optimized PDF
- [ ] PDF is ATS-friendly (no tables, simple formatting)
```

**User Story 3: View Optimization History**
```
As a job seeker,
I want to see past optimizations,
So that I can re-download a resume I generated last week.

Acceptance Criteria:
- [ ] Dashboard shows list of optimized resumes (most recent first)
- [ ] Each entry shows: Company, Job Title, Match Score, Date
- [ ] User can click to re-download PDF
- [ ] User can delete old optimizations
```

### Phase 2: Referral Finder

**User Story 4: Find Connections at Company**
```
As a job seeker,
I want to see who I know at a company,
So that I can ask for referrals without manually searching LinkedIn.

Acceptance Criteria:
- [ ] User pastes job URL
- [ ] System extracts company name
- [ ] System searches user's LinkedIn network (or uses API)
- [ ] Results show: Name, Title, Connection degree, Confidence score
- [ ] Results are sorted by confidence score (highest first)
- [ ] If no connections found, show message: "No connections at this company. Try expanding your network."
```

**User Story 5: Generate Referral Message**
```
As a job seeker,
I want to get a ready-to-send referral request message,
So that I don't have to craft it from scratch (saves time + reduces anxiety).

Acceptance Criteria:
- [ ] User clicks "Generate Message" for a connection
- [ ] System generates 3 message variants (casual, professional, direct)
- [ ] Each message is under 300 characters (LinkedIn limit)
- [ ] User can select a variant and edit inline
- [ ] User can copy to clipboard with one click
- [ ] System tracks message as "generated" (user manually marks as "sent")
```

**User Story 6: Rate Limiting (Prevent LinkedIn Ban)**
```
As the system,
I want to limit scraping to 20 searches/day,
So that the dummy LinkedIn account doesn't get banned.

Acceptance Criteria:
- [ ] System tracks searches per day per user
- [ ] If user hits 20 searches, show message: "Daily limit reached. Try again tomorrow."
- [ ] System resets count at midnight (user's timezone)
- [ ] Manual fallback: If limit reached, allow user to manually enter connections
```

### Phase 3: Application Tracker (Optional)

**User Story 7: Auto-Capture Applications**
```
As a job seeker,
I want applications auto-tracked when I submit them,
So that I don't have to manually log each one.

Acceptance Criteria:
- [ ] Chrome extension detects LinkedIn "Application sent" confirmation
- [ ] Extension captures: Job title, Company, URL, Date
- [ ] Extension saves to Supabase in background
- [ ] Extension shows toast notification: "Application tracked ✓"
- [ ] User can view tracked applications in dashboard
```

**User Story 8: Follow-up Reminders**
```
As a job seeker,
I want to be reminded to follow up after 1 week,
So that I don't forget and lose opportunities.

Acceptance Criteria:
- [ ] Dashboard shows "Follow-up due" badge for applications >7 days old
- [ ] User can click "Generate Follow-up Message"
- [ ] System generates short, polite follow-up message
- [ ] User copies and sends manually
- [ ] User marks status as "Followed Up"
- [ ] After 2 weeks, shows "Second follow-up due" (if still no response)
```

---

## Open Questions for BMAD PM Agent

1. **LinkedIn API vs Scraping:** Should we use official LinkedIn API (safe, limited to 1st degree) or scraping (risky, comprehensive 2nd/3rd degree)? For personal use, scraping risk is low (just create new dummy account if banned). Agree?

2. **Phase 3 Necessity:** Given that tracking happens at a low-energy moment (after applying), should we skip Phase 3 entirely for MVP? Or is auto-capture valuable enough to overcome the behavioral friction?

3. **Resume Format Support:** Should we support PDF uploads (harder to parse, more edge cases) or force DOCX-only (easier, but some users may not have DOCX)? Recommendation: DOCX-only for MVP, add PDF support if users request it.

4. **Confidence Score Display:** Should we show the 0-100% confidence score to users, or is it too "data-heavy"? Alternative: Simple labels like "High likelihood", "Medium", "Low".

5. **Monetization (Future):** If this works well and we want to open it to external users, what's the pricing model? $10/month unlimited? $2 per resume optimization? Freemium (5 free/month, $15 for unlimited)?

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Next Review:** After BMAD PM agent reviews and provides feedback  
**Build Timeline:** Start Week 1 (Resume Optimizer) immediately after BMAD validation