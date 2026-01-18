# Implementation Constraints - Referral Finder
**For BMAD PM Agent - Critical Context for PRD Creation**

---

## ✅ **APPROVED APPROACH: Google X-Ray + Apollo.io**

**DO NOT use LinkedIn scraping with dummy accounts.** Legal risk confirmed via hiQ Labs settlement ($500K penalty for fake accounts).

**USE instead:**
1. **Google Custom Search JSON API** - X-Ray search of LinkedIn profiles (100 free queries/day, $5/1000 after)
2. **Apollo.io free tier** - 10,000 email credits/month with LinkedIn URLs included

---

## 🚨 **CRITICAL FAILURE MODES & MITIGATIONS**

### **1. Google API Quota Exhaustion**

**What breaks:**
- Free tier = 100 queries/day
- User applies to 15 jobs/day × finds 5 contacts each = 75 queries
- Second user pushes total to 150 queries → **API returns 429 error**

**Mitigation:**
```yaml
Implementation:
  - Cache results in Supabase (company_name + title filters)
  - TTL: 7 days (hiring managers don't change weekly)
  - If cache miss + quota exceeded: Show message "Daily limit reached. Results cached for [Company X]."
  - Fallback: Allow manual entry of LinkedIn URLs

Cost ceiling:
  - Upgrade to Site-Restricted JSON API ($5/1000 queries, no daily limit)
  - Budget: 200 queries/day × 30 days = 6,000 queries = $30/month - but we should make it free from start as its for our internal use only
```

**Acceptance Criteria:**
- [ ] Cache hit rate >70% after week 1 (companies repeat across users)
- [ ] Graceful degradation when quota hit (show cached results, don't break UI)
- [ ] Cost alert at $20/month (approaching budget limit)

---

### **2. Google Returns Irrelevant Results**

**What breaks:**
- Query: `site:linkedin.com/in/ "Apple" intitle:"recruiter"`
- Returns: "Apple enthusiast", "Apple Store Manager", generic profiles mentioning "apple"
- User gets 50 irrelevant results, wastes time

**Mitigation:**
```yaml
Query optimization:
  - Use exact company name from job URL (scrape from <meta> tags)
  - Add negative keywords: -enthusiast -fan -store -retail
  - Filter by title keywords: "recruiter" OR "talent acquisition" OR "hiring manager" OR "HR"
  - Limit to first 20 results (Google ranks relevance-first)

Post-processing filter:
  - Regex check: Profile snippet must contain exact company name
  - Title validation: Must contain "recruit", "talent", "hiring", "HR", "people"
  - Confidence score: High (exact match) / Medium (partial) / Low (discard)
```

**Acceptance Criteria:**
- [ ] Precision >80% (8/10 results are actual employees at target company)
- [ ] User can report "bad result" to improve filters
- [ ] Show confidence score on each result (High/Medium)

---

### **3. Apollo.io Free Tier Limit Exceeded**

**What breaks:**
- 10 users × 50 job applications/month = 500 queries
- Each query finds 5 contacts × 500 = 2,500 enrichments
- Free tier = 10,000/month credits ✅ (safe for now)
- BUT: If 20 users × 100 applications = 10,000 enrichments → **quota exceeded mid-month**

**Mitigation:**
```yaml
Rate limiting:
  - Track usage per user in `apollo_usage` table
  - Soft limit: 400 enrichments/user/month (10K / 25 users with buffer)
  - Hard limit: Show warning at 350, block at 400
  
Fallback chain:
  1. Apollo.io API (primary)
  2. Hunter.io free tier (25/month, domain-based email guessing)
  3. Snov.io free tier (50/month, LinkedIn enrichment)
  4. Manual: "Email not found. Try LinkedIn connection request instead."

Cost ceiling:
  - Apollo paid tier = $49/month for 10K additional credits
  - Budget decision: Add paid tier only if >15 active users
```

**Acceptance Criteria:**
- [ ] Usage dashboard shows credits remaining (updated daily)
- [ ] Warn user at 80% of personal quota
- [ ] Fallback chain tested (Hunter → Snov → Manual)

---

### **4. LinkedIn Profile URLs Return 404**

**What breaks:**
- Google indexes profiles, but user deletes profile or sets to private
- User clicks "View Profile" → 404 error
- OR: Profile exists but requires login to view (privacy setting)

**Mitigation:**
```yaml
Validation:
  - HEAD request to LinkedIn URL before showing to user (check 200 vs 404)
  - If 404: Mark as "Profile unavailable" and hide from results
  - If 999 (LinkedIn's "login required" code): Show warning "Profile is private. Try sending connection request blind."

Cache invalidation:
  - Re-validate cached URLs every 30 days
  - Purge 404s from cache immediately
```

**Acceptance Criteria:**
- [ ] <5% dead links shown to user (validation catches most)
- [ ] Clear error message: "This profile is no longer public"

---

### **5. Company Name Extraction Fails**

**What breaks:**
- User pastes job URL: `https://jobs.lever.co/stripe/abc123`
- Scraper looks for company in `<title>` tag → Returns "Software Engineer - Lever Jobs"
- Google X-Ray searches for "Lever" instead of "Stripe" → wrong results

**Mitigation:**
```yaml
Multi-source extraction:
  1. Job URL domain: stripe.com, meta.com, etc. (first check)
  2. <meta property="og:site_name"> (most reliable)
  3. <title> tag parsing (remove "Jobs", "Careers", "Lever", "Greenhouse")
  4. Fallback: Ask user "Is this company correct? [Stripe ▼]"

Platform-specific parsers:
  - LinkedIn Jobs: Extract from `.job-details-jobs-unified-top-card__company-name`
  - Greenhouse: Parse from JSON-LD structured data
  - Lever: Extract from API endpoint (job JSON includes company)
```

**Acceptance Criteria:**
- [ ] Company extraction accuracy >95% (test on 100 diverse job URLs)
- [ ] User can edit company name before search (always show input field)
- [ ] Log failed extractions for manual parser improvements

---

### **6. Google API Returns Stale Data**

**What breaks:**
- Recruiter left company 6 months ago
- Google index hasn't refreshed
- User sends message to wrong person → awkward

**Mitigation:**
```yaml
Freshness indicators:
  - Show warning: "Last indexed by Google: [date from cache-control header]"
  - If >90 days old: "⚠️ This profile may be outdated. Verify on LinkedIn before reaching out."

Apollo.io cross-check:
  - Apollo API returns "current_employer" field
  - If mismatch: "Apollo shows this person at [Different Co]. Google may be outdated."
  
User education:
  - Tooltip: "Always verify current role on LinkedIn before sending message"
```

**Acceptance Criteria:**
- [ ] Show freshness warning if Google data >60 days old
- [ ] Cross-reference with Apollo when available

---

### **7. Rate Limiting / IP Blocks**

**What breaks:**
- Server makes 200 Google API calls in 10 minutes
- Google rate-limits IP → 429 errors
- (Note: This is separate from quota - this is requests/second)

**Mitigation:**
```yaml
Request throttling:
  - Max 10 queries/second (Google's undocumented limit)
  - Implement exponential backoff on 429 errors
  - Queue searches if multiple users search simultaneously

User-side queueing:
  - Show loading state: "Searching... (2 companies ahead of you in queue)"
  - Process searches FIFO (first-in-first-out)
```

**Acceptance Criteria:**
- [ ] Zero 429 errors in production logs
- [ ] Queue never exceeds 30 seconds wait time (add capacity if needed)

---

### **8. Message Generation Fails**

**What breaks:**
- User selects contact → Clicks "Generate Message"
- Claude API timeout (10+ seconds) or error
- User sees spinner forever → frustration

**Mitigation:**
```yaml
Timeout handling:
  - Set 15-second timeout on Claude API calls
  - If timeout: Retry once with exponential backoff
  - If second failure: Show generic template message
  
Fallback templates:
  - Casual: "Hi {name}, I'm applying for {job_title} at {company}. Would you be open to referring me?"
  - Professional: "Hello {name}, I noticed your role at {company}. I'm interested in {job_title} and would appreciate a referral if possible."
  
Cache successful messages:
  - If Claude generated message for "recruiter at Stripe", cache template
  - Reuse for similar queries (personalize name only)
```

**Acceptance Criteria:**
- [ ] Message generation <5 seconds p99
- [ ] Fallback templates tested and approved by 3 users
- [ ] Cache hit rate >50% for message generation

---

## 📊 **MONITORING & ALERTS**

**Critical metrics to track:**

```yaml
Daily:
  - Google API quota used / 100 (alert at 80)
  - Apollo.io credits used / 10,000 (alert at 8,000)
  - Profile validation success rate (alert if <90%)
  - Company name extraction accuracy (alert if <90%)

Weekly:
  - User-reported "bad results" count (>5/week = filter needs tuning)
  - Average results per search (should be 5-15, alert if <3)
  - 404 rate on LinkedIn URLs (alert if >10%)

Monthly:
  - Total cost (Google + Apollo paid tiers)
  - Cache hit rate (should improve over time to >70%)
  - User satisfaction: "Results were helpful" survey (target: >80% yes)
```

**Cost alerts:**
- Email at $15/month (approaching $30 budget)
- Block new searches at $30/month (manual approval to increase budget)

---

## 🛠️ **TECHNICAL CONSTRAINTS**

**API dependencies:**
- Google Custom Search API key stored in `GOOGLE_CSE_API_KEY` env var
- Google CSE ID stored in `GOOGLE_CSE_ID` env var
- Apollo.io API key in `APOLLO_API_KEY` env var (if using API vs browser extension)

**Database schema additions:**

```sql
-- Cache for Google X-Ray results
CREATE TABLE linkedin_search_cache (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  title_filter TEXT, -- "recruiter", "hiring manager", etc.
  results JSONB NOT NULL, -- Array of {name, url, title, snippet}
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(company_name, title_filter)
);

-- Track API usage per user (quota management)
CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  service TEXT NOT NULL, -- 'google', 'apollo', 'hunter'
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, service, date)
);

CREATE INDEX idx_cache_expiry ON linkedin_search_cache(expires_at);
CREATE INDEX idx_usage_date ON api_usage(user_id, service, date);
```

**API response times:**
- Google Custom Search API: 200-500ms typical
- Apollo.io API: 300-1000ms typical
- Total user-facing latency budget: <3 seconds (cache + API + processing)

---

## ✅ **ACCEPTANCE CRITERIA SUMMARY**

**Phase 2 (Referral Finder) is successful if:**

1. **Functional:**
   - [ ] User pastes job URL → Sees 5-15 relevant contacts within 3 seconds
   - [ ] Contacts are actual employees at target company (>80% accuracy)
   - [ ] Message generation works for 3 tone variants (casual, professional, direct)
   - [ ] User can copy message to clipboard with one click

2. **Reliability:**
   - [ ] Zero hard failures (always show results or clear error message)
   - [ ] Graceful quota degradation (show cached results when daily limit hit)
   - [ ] Cache hit rate >70% by week 2 (reduces API costs)

3. **Cost:**
   - [ ] Monthly cost <$30 for 10 active users
   - [ ] Alert system prevents surprise overages
   - [ ] Free tiers (Google 100/day, Apollo 10K/month) cover 90% of usage

4. **User satisfaction:**
   - [ ] >80% of users rate results "helpful" or "very helpful"
   - [ ] <5 "bad result" reports per week
   - [ ] Users actually send messages (>60% send rate, tracked via self-report)

---

## 🚫 **WHAT NOT TO BUILD (Out of Scope for Phase 2)**

- ❌ LinkedIn scraping with Playwright (legal risk, maintenance burden)
- ❌ Dummy account management system (violates LinkedIn ToS)
- ❌ Email sending automation (user copies manually to avoid spam flags)
- ❌ Response tracking (user self-reports if they got a reply)
- ❌ CRM features (we're not building a sales tool)

**Keep it simple:** Find contacts → Generate message → User sends manually.
