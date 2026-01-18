# Starter Template Evaluation

## Selected Template: Vercel Supabase Starter (Option B)

**Initialization Command:**
```bash
npx create-next-app@latest job-outreach-system \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase
cd job-outreach-system
npm install
```

**Rationale for Selection:**

**Option A: Clean Slate (create-next-app)** was evaluated but rejected:
- Requires 4-6 hours of manual Supabase configuration
- Need to implement cookie-based auth from scratch (complex in App Router)
- Higher risk of security mistakes in auth implementation
- Does not align with 4-week MVP timeline

**Option B: Vercel Supabase Starter (SELECTED)** provides:
- ✅ **Pre-configured Supabase Auth** with cookie-based session management
- ✅ **Working middleware** for route protection
- ✅ **Server Components auth patterns** already implemented
- ✅ **Official template** maintained by Vercel team
- ✅ **Saves 4-6 hours** of boilerplate setup
- ✅ **Production-ready security** (PKCE flow, secure cookie handling)

**Version Details (as of 2026-01-02):**
- Next.js: 15.x (App Router)
- Supabase JS: Latest v2
- TypeScript: Pre-configured
- ESLint: Pre-configured

**Architectural Decisions Provided by Starter:**

1. **Authentication Pattern:**
   - Cookie-based sessions (not localStorage tokens)
   - Server-side auth validation via middleware
   - PKCE flow for OAuth security

2. **File Structure:**
   - `/app` directory for routes
   - `/components` for UI components
   - `/utils/supabase` for client creation (server/client/middleware variants)

3. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

**Post-Initialization Setup:**

Following the detailed setup orchestration from `bmad-architect-ux-setup.md`, the Dev Agent will:

1. **Add shadcn/ui:**
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button input textarea card
   ```

2. **Install Additional Dependencies:**
   ```bash
   npm install pdf-parse mammoth zod
   npm install --save-dev @types/pdf-parse
   ```

3. **Configure Environment Variables:**
   - Claude API: `ANTHROPIC_API_KEY`
   - Google Custom Search: `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`
   - Apollo.io: `APOLLO_API_KEY` (optional for MVP)

4. **Implement Auth Bypass Pattern (MVP Development):**
   - Create `STUB_USER_ID` environment variable for development
   - Modify auth middleware to use stub user when `NODE_ENV=development`
   - This allows frontend/backend work before Supabase auth is fully configured

5. **Database Setup:**
   - Initialize Supabase project
   - Run migration scripts (to be created in Step 4)
   - Enable RLS on all tables

**Trade-offs Accepted:**

- **Opinionated structure:** Starter has specific patterns we must follow (acceptable for MVP)
- **Some unused code:** Auth examples we'll need to clean up (minor cost)
- **Dependency on Vercel patterns:** If we migrate off Vercel, may need auth refactor (unlikely for internal tool)

**Alternative Considered:**

Razikus Supabase Starter was evaluated but not selected:
- More feature-rich (Stripe, analytics, multi-tenancy)
- Over-engineered for our 10-20 user internal tool
- Higher learning curve
- Not officially maintained by Vercel

**Next Steps (Step 4):**

With starter template selected, we'll now design:
1. Database schema (5-6 tables with RLS policies)
2. API endpoint architecture (Supabase-first approach)
3. External service integration patterns (Claude, Google, Apollo)
4. Error handling and fallback strategies

---
