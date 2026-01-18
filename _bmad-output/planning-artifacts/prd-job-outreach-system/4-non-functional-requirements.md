# 4. Non-Functional Requirements

## Performance
*   **Page Load:** <1.5s (FCP) on Dashboard.
*   **API Latency:** Internal routes <500ms (p95).
*   **AI Latency:** Claude generation <10s (Show skeleton loader).
*   **Scraping:** Extension capture <1s (Instant DOM read).

## Security
*   **Auth:** Supabase Auth (Email/Password).
*   **Data Isolation:** RLS enabled on ALL tables (`auth.uid() = user_id`).
*   **API Keys:** Stored in Vercel Env Vars, never exposed to client.

## Reliability
*   **Quota Management:** Cache hits target >70% to prevent Google API 429s.
*   **Fallbacks:** If AI fails, show "Manual Template" (fill-in-the-blanks).

## Scalability
*   **Users:** Support 50 concurrent users (Supabase Free Tier).
*   **Storage:** Auto-delete generated PDFs after 24h to save space.

---
