---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-job-outreach-system-2025-12-31.md
  - docs/discovery.md
  - docs/solutions.md
workflowType: 'prd'
lastStep: 2
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 2
---

# Product Requirements Document - job-outreach-system

**Author:** Raghav
**Date:** 2025-12-31

---

## Executive Summary

**Job Outreach System** is an internal productivity platform designed to eliminate the friction-motivation death spiral that kills job search momentum. Built for 10-20 friends and family actively job searching, it replaces $200-240/month in fragmented B2B SaaS subscriptions with a unified, AI-powered workflow that reduces application time from 30-45 minutes to under 5 minutes per job.

**The Opportunity:** 97.5% cost reduction ($2,000-2,800/year savings per user) while solving the core problem commercial tools ignore - **workflow context collapse and decision fatigue** that causes job seekers to procrastinate and apply to fewer roles with lower-quality materials.

**Success Metric:** Users apply to more jobs without avoiding it, leading to more applications submitted with higher quality (ATS-optimized resumes + personalized outreach).

### What Makes This Special

**User-Facing Differentiators:**

1. **Motivation-Aware Design** - Features sequenced by user energy levels (high-motivation tasks BEFORE applying, low-motivation tasks after). Intercepts the "I'm excited about this job" moment instead of the "I should track this" moment.

2. **Context Preservation** - End-to-end workflow in one tool. Single job URL → optimized resume + hiring manager connections + personalized messages in <5 minutes total. No context switching between Google Sheets, LinkedIn, Word, messaging apps.

3. **Quality Over Quantity** - ATS-optimized resumes with real match scoring (>70% vs <50% with generic resumes). Personalized messages that sound human, not keyword-stuffed AI slop. 3 message tone variants (casual, professional, direct) for authentic outreach.

4. **Internal Tool Economics** - $5/user/month vs $240/month commercial tools = 97.5% cost savings. Leverage free tiers (Supabase, Vercel), share Claude API costs across users. Built for cost savings, not monetization.

5. **Manual Fallbacks** - Every automated step has manual override. If LinkedIn scraping breaks, user can manually search. If AI generates poor copy, user edits before sending. Users always in control, AI is assistant not autopilot.

### Platform Architecture Foundation

The platform's effectiveness depends on a sophisticated **multi-layer backend architecture** that orchestrates AI, automation, and data persistence: Service Layer (7+ modular services), Memory Layer (session state management), AI Logic Layer (cost-optimized LLM orchestration with Haiku/Sonnet decision logic), and Storage Layer (Supabase Postgres with RLS and cascade deletes). This architecture ensures <30s resume optimization, <60s connection discovery, while maintaining <$10/user/month API costs. Detailed technical specifications will be documented in dedicated architecture sections for downstream Dev and Architect agents.

## Project Classification

**Technical Type:** Web Application (SaaS productivity tool)
**Domain:** General Software (productivity/automation)
**Domain Complexity:** Low (no regulatory requirements)
**Technical Complexity:** Medium
**Project Context:** Brownfield - extending existing discovery and solution documentation

**Complexity Drivers:**
1. AI Orchestration Workflow - Sequential multi-step pipeline with cost optimization logic
2. LinkedIn Scraping - Anti-detection patterns, rate limiting, DOM parsing resilience
3. Stateful Session Persistence - Relational data model with cascade deletes and RLS policies
4. Service Layer Coordination - 7+ services requiring error handling, retry logic, and manual fallbacks
5. Performance Requirements - <30s resume optimization, <60s connection discovery, <$10/user/month API budget

**Tech Stack:** Next.js 14, Supabase (Postgres, Auth, Storage), Claude Sonnet 4/Haiku 4, Playwright, Vercel
**Architecture Pattern:** Service layer architecture with memory persistence and AI orchestration logic
