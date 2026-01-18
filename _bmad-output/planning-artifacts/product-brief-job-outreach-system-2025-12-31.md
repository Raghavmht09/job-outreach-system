
## Implementation Strategy: People Data (Referral Finder)

### Approved Architecture
*   **Primary Source:** Google Custom Search JSON API (X-Ray Search)
    *   *Query Pattern:* `site:linkedin.com/in/ "Company Name" AND ("Recruiter" OR "Talent Acquisition" OR "Hiring Manager")`
    *   *Quota:* 100 free queries/day (Hard cap).
*   **Secondary Source:** Apollo.io API (Free Tier)
    *   *Quota:* 10,000 credits/month (Soft cap).
*   **Forbidden:** Direct LinkedIn Scraping (Dummy Accounts).

### Critical Failure Mitigations

1.  **Quota Exhaustion (Google API)**
    *   **Strategy:** Cache-First Architecture.
    *   **Implementation:** Store results in Supabase `linkedin_search_cache` table (Company + Role Key).
    *   **TTL:** 7 Days (Hiring staff doesn't rotate weekly).
    *   **Fallback:** If quota hit + cache miss → Show "Daily limit reached. Try manual search."

2.  **Irrelevant Results (Data Quality)**
    *   **Strategy:** Post-Processing Filter.
    *   **Implementation:** Regex check on snippet text. Must contain exact "Company Name" AND ("Recruiter" OR "HR" OR "Talent").
    *   **UI:** Show "Confidence Score" (High/Medium) based on keyword density.

3.  **Dead Links (404s)**
    *   **Strategy:** Lazy Validation.
    *   **Implementation:** When user clicks "Profile", perform HEAD request. If 404, flag in DB and hide from future results.

4.  **Company Name Mismatch**
    *   **Strategy:** Multi-Source Extraction.
    *   **Priority:** `og:site_name` > `<meta>` tags > URL Domain.
    *   **Fallback:** User editable field "Searching for contacts at: [Acme Corp] ✎".

### Monitoring & Alerts (Internal Admin)
*   **Daily:** Google API Quota tracking (Alert at 80%).
*   **Weekly:** Cache Hit Rate (Target >70%).
*   **Quality:** User "Bad Result" reports count.

### Database Schema Additions

```sql
-- Cache for Google X-Ray results
CREATE TABLE linkedin_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  results JSONB NOT NULL, -- Array of {name, title, url, snippet}
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(company_name, search_query)
);

-- Track API usage per user
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  service TEXT NOT NULL, -- 'google', 'apollo'
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, service, date)
);
```
