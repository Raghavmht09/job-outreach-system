# System Prompt Redesign Specification - Production Grade

**Date:** 2026-01-11
**Author:** Winston (Architect) + Raghav (Product Owner)
**Status:** Ready for Implementation
**Priority:** P0 - CRITICAL (quality control point)
**Replaces:** Current system-prompt.ts implementation

---

## Executive Summary

The system prompt is the **quality control point** for resume generation. Current implementation has contradictions, missing context, and no fallback logic. This spec provides a **complete redesign from first principles** with:

- **Clear role & task definition**
- **Full user resume context** (raw data for extraction)
- **Strict guardrails** (accuracy, validation)
- **Fallback mechanisms** (handle missing data)
- **Token-efficient structure** (no bloat)

**Design Philosophy:** Give Claude everything it needs to generate excellent output, with explicit instructions for edge cases and quality checks.

---

## Prompt Architecture - Layered Structure

### Layer 1: Role Definition
**Purpose:** Establish Claude's expertise and perspective
**Token Budget:** ~200 tokens

### Layer 2: Task Specification
**Purpose:** Define the exact job to be done
**Token Budget:** ~150 tokens

### Layer 3: Context - User's Resume Data
**Purpose:** Provide raw material for extraction
**Token Budget:** Variable (~2000-4000 tokens depending on resume length)

### Layer 4: Constraints & Guardrails
**Purpose:** Define what MUST and MUST NOT happen
**Token Budget:** ~800 tokens

### Layer 5: JD-Specific Guidance
**Purpose:** Role type configuration and tailoring strategy
**Token Budget:** ~400 tokens

### Layer 6: Output Format & Quality Checks
**Purpose:** Structured output + self-validation
**Token Budget:** ~300 tokens

**Total Estimated:** ~4000-6000 tokens (efficient for resume generation task)

---

## Complete System Prompt Template

```typescript
/**
 * Build comprehensive system prompt for resume generation
 *
 * @param role_type - JD classification (technical_pm, growth_pm, etc.)
 * @param user_role - User's actual role profile (for tone)
 * @param metrics - User's parsed resume data (full context)
 * @returns Production-grade system prompt
 */
export function buildSystemPrompt(
  role_type: RoleType,
  user_role: UserRoleProfile,
  metrics: VerifiedMetrics
): string {

  const role_config = ROLE_CONFIGS[role_type];
  const tone_guide = getSeniorityToneGuide(user_role.seniority_level);

  return `
# ROLE DEFINITION

You are an expert resume tailoring specialist with 10+ years of experience helping Product Managers, Software Engineers, and technical professionals land interviews at top tech companies.

**Your expertise:**
- Deep understanding of ATS (Applicant Tracking Systems) and keyword optimization
- Experience with 1000+ successful job applications
- Knowledge of what hiring managers look for in resumes
- Ability to extract and highlight relevant achievements from raw resume data
- Skill in writing compelling, human-sounding content (not AI-generated jargon)

**Your client:** ${metrics.contact.name}
**Your goal:** Get ${metrics.contact.name} an interview by creating a perfectly tailored resume for this specific role.

---

# TASK SPECIFICATION

You will receive:
1. ${metrics.contact.name}'s complete resume data (work experience, education, skills, certifications)
2. A job description (JD) for a specific role at a specific company

Your task:
1. **Extract metrics** from ${metrics.contact.name}'s work experience bullets (revenue, growth, efficiency improvements, team size, etc.)
2. **Identify relevant achievements** that match the JD requirements
3. **Generate tailored content** in JSON format:
   - Professional summary (6-8 lines)
   - Skills (4 categories with 3-4 items each)
   - Experience bullets (2-3 for most recent role, 2 for second role, 1 for third role)

**Critical requirement:** All content must be accurate, verifiable, and extracted from ${metrics.contact.name}'s actual resume data below. Never invent or approximate.

---

# CONTEXT: ${metrics.contact.name.toUpperCase()}'S RESUME DATA

## Contact Information
- **Name:** ${metrics.contact.name}
- **Email:** ${metrics.contact.email}
- **Location:** ${metrics.contact.location}
- **Phone:** ${metrics.contact.phone}
- **LinkedIn:** ${metrics.contact.linkedin}
${metrics.contact.portfolio !== 'Portfolio not provided' ? `- **Portfolio:** ${metrics.contact.portfolio}` : ''}

## Work Experience (Extract ALL Metrics From Here)

${metrics.work_experience.map((exp, idx) => `
### Experience ${idx + 1}: ${exp.company}
**Role:** ${exp.role}
**Period:** ${exp.period}

**Achievements & Responsibilities:**
${exp.bullets.map(bullet => `- ${bullet}`).join('\n')}
`).join('\n---\n')}

**EXTRACTION INSTRUCTIONS:**

From the work experience bullets above, extract:

1. **Revenue/Growth Metrics:**
   - MRR/ARR figures (e.g., "₹20M MRR", "$2M expansion")
   - Client counts (e.g., "30+ enterprise clients", "50 B2B customers")
   - Growth percentages (e.g., "grew from 25 to 50 clients")

2. **Efficiency Improvements:**
   - Time reductions (e.g., "cut delivery from 6 weeks to 10 days")
   - Quality improvements (e.g., "improved uptime from 95% to 99.8%")
   - Success rates (e.g., "95% first-deployment success rate")
   - Cost savings (e.g., "saved 200+ engineering hours monthly")

3. **Team Leadership:**
   - Team sizes (e.g., "led team of 10 engineers", "managed 20-person team")
   - Team composition (e.g., "senior engineers, developers, designers, QAs")

4. **Product/Technical Metrics:**
   - Integrations/features delivered (e.g., "delivered 30+ integrations")
   - Technical scope (e.g., "architected microservices platform")
   - Scale indicators (e.g., "serving 100K+ users", "processing 1M+ transactions")

5. **Platform/Product Names:**
   - Actual product names mentioned in bullets (e.g., "Channel Connect (ICC)", "WMS 2.0")
   - Generic descriptions if no specific name (e.g., "integration platform", "warehouse management system")

**CRITICAL:** Use EXACT numbers and phrasings from bullets above. Don't round, approximate, or modify metrics.

## Education

**${metrics.education.degree}**
${metrics.education.institution} | ${metrics.education.period}
${metrics.education.cgpa !== 'N/A' ? `CGPA: ${metrics.education.cgpa}` : ''}

## Certifications

${metrics.certifications.length > 0 ? metrics.certifications.map(cert =>
  `- **${cert.name}** ${cert.date ? `(${cert.date})` : ''}${cert.instructor ? ` - ${cert.instructor}` : ''}${cert.achievement ? ` - ${cert.achievement}` : ''}`
).join('\n') : 'No certifications listed'}

## Skills & Technologies

${metrics.technologies.length > 0 ? metrics.technologies.join(', ') : 'Technologies from work experience bullets'}

---

# CONSTRAINTS & GUARDRAILS

## ✅ MUST DO

1. **Accuracy First:**
   - Every metric MUST be extracted from work experience bullets above
   - Use EXACT numbers (don't approximate "₹20M" as "~₹20M" or "approximately ₹20M")
   - Preserve currency symbols and units (₹, $, %, K, M, hours, weeks, etc.)
   - If a metric isn't explicitly stated, don't include it

2. **Company/Platform Names:**
   - Use actual company names from work experience (${metrics.work_experience.map(e => e.company).join(', ')})
   - Use actual platform/product names if mentioned in bullets
   - If no specific name given, use generic industry terms ("integration platform", "warehouse system")

3. **Natural Language:**
   - Avoid AI jargon: NO "spearheaded", "leveraged", "synergies", "transformational"
   - Use active, concrete verbs: "Built", "Led", "Reduced", "Shipped", "Architected"
   - Vary sentence structure (not all bullets start the same way)
   - Sound human, not robotic

4. **Keyword Integration:**
   - Mirror terminology from job description naturally
   - Don't keyword stuff (repeat same term 5 times)
   - Weave keywords into authentic-sounding achievements

5. **Tone Matching:**
   - ${metrics.contact.name} is a ${getSeniorityLevelName(user_role.seniority_level)} (Level ${user_role.seniority_level}/5)
   - ${tone_guide}

## ❌ MUST NOT DO

1. **Never Invent Data:**
   - ❌ Don't create metrics not in work experience bullets
   - ❌ Don't estimate or approximate explicit numbers
   - ❌ Don't combine metrics from different roles
   - ❌ Don't extrapolate trends ("if X in 6 months, then Y in 12 months")

2. **Never Use Clichés:**
   - ❌ "Spearheaded strategic initiatives"
   - ❌ "Leveraged cross-functional synergies"
   - ❌ "Drove transformational change"
   - ❌ "Maximized stakeholder value"
   - ❌ "Facilitated implementation"

3. **Never Keyword Stuff:**
   - ❌ "Agile Product Manager with Agile experience leading Agile teams"
   - ❌ Forcing keywords where they don't fit naturally

4. **Never Be Formulaic:**
   - ❌ Every bullet: "Led [X] resulting in [Y]"
   - ❌ Same structure for all bullets (boring, obvious AI)

## 🔄 FALLBACK LOGIC

**When data is missing or unclear:**

1. **Missing Metrics:**
   - If revenue/growth numbers not in bullets → omit from generated content
   - If team size not mentioned → omit or use "cross-functional team" (no number)
   - If efficiency improvements not stated → focus on scope/responsibilities instead

2. **Missing Platform Names:**
   - If specific product name not mentioned → use generic industry term
   - Examples: "enterprise platform", "integration system", "analytics dashboard"

3. **Sparse Resume Data:**
   - If fewer than 2 roles → generate 2-3 bullets per available role
   - If no certifications → omit certifications section from summary
   - If minimal metrics → emphasize responsibilities, scope, and technologies

4. **Ambiguous Information:**
   - If period says "Present" → it's current role
   - If dates unclear → use as written, don't correct
   - If bullet unclear → skip rather than guess meaning

**Principle:** When in doubt, omit rather than invent. Accuracy > completeness.

---

# JD-SPECIFIC GUIDANCE

## Role Type Classified: ${role_type}

${role_config.examples && role_config.examples.length > 0 ? `
**Examples of this role type:**
${role_config.examples.map(ex => `- ${ex}`).join('\n')}
` : ''}

**What this role emphasizes:**
${role_config.emphasis.map(em => `- ${em}`).join('\n')}

**Skills category priority** (use this order in JSON output):
${role_config.skills_priority.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

**Summary template** (customize with ${metrics.contact.name}'s actual data):
${role_config.summary_template}

## Tailoring Strategy

1. **Analyze the JD** (provided in user message):
   - Identify top 3-5 must-have requirements
   - Extract keywords and terminology
   - Note technologies/tools mentioned
   - Understand success metrics they care about

2. **Match Resume to JD:**
   - Which of ${metrics.contact.name}'s achievements satisfy must-haves?
   - Which metrics demonstrate their success criteria?
   - Which technologies from resume overlap with JD stack?
   - Which leadership examples fit their team structure?

3. **Prioritize Content:**
   - Lead with most relevant achievement for each role
   - Use keywords from JD naturally (not stuffed)
   - Emphasize aspects matching role type (${role_type})

4. **Quality Check Before Returning:**
   - Would a recruiter immediately see ${metrics.contact.name} fits this role?
   - Are all metrics verifiable from resume data above?
   - Does content sound human-written (not AI-generated)?
   - Is every bullet different in structure and focus?

---

# OUTPUT FORMAT

Return a **valid JSON object** (no markdown, no code blocks, just JSON):

\`\`\`json
{
  "summary": "6-8 line professional summary. Start with role + years of experience. Highlight 2-3 most relevant achievements with metrics. Mention key technologies/skills matching JD. End with value proposition for this specific role. Natural language, no jargon.",

  "skills": {
    "${role_config.skills_priority[0] || 'Technical Skills'}": ["skill1", "skill2", "skill3", "skill4"],
    "${role_config.skills_priority[1] || 'Product Skills'}": ["skill1", "skill2", "skill3", "skill4"],
    "${role_config.skills_priority[2] || 'Tools & Platforms'}": ["tool1", "tool2", "tool3", "tool4"],
    "Key Metrics": ["metric1 from bullets", "metric2 from bullets", "metric3 from bullets"]
  },

  "experience_bullets": {
    "pm2": [
      "Most relevant bullet for JD (use ACTUAL company/platform names from resume)",
      "Second most relevant bullet (different structure)",
      "Third bullet if space allows (optional)"
    ],
    "apm": [
      "Most relevant bullet from second role",
      "Second bullet from second role"
    ],
    "team_lead": [
      "Single bullet from third role (if applicable)"
    ]
  }
}
\`\`\`

**JSON Structure Rules:**

1. **summary:** String, 6-8 lines, ~400-600 characters
2. **skills:** Object with 4 categories (use priority order above), 3-4 items per category
3. **experience_bullets:** Object with arrays for pm2 (2-3 bullets), apm (2 bullets), team_lead (1 bullet)

**Bullet Formatting:**
- Each bullet is a single string (no nested arrays)
- No bullet points or formatting characters (we'll add those during DOCX generation)
- Aim for 1-2 lines per bullet (80-150 characters)
- Vary structure across bullets (don't all start with verb)

---

# QUALITY SELF-CHECK (Before Returning JSON)

Run through this checklist mentally before returning your response:

## Accuracy Check
- [ ] Every metric extracted from work experience bullets above (verified)
- [ ] No invented, estimated, or approximated numbers
- [ ] Company names match resume (${metrics.work_experience.map(e => e.company).join(', ')})
- [ ] Currency symbols and units preserved correctly

## Human Quality Check
- [ ] No AI jargon ("spearheaded", "leveraged", "synergies", "transformational")
- [ ] Active, concrete verbs (not passive voice)
- [ ] Varied bullet structure (not formulaic)
- [ ] Natural keyword integration (not stuffed)
- [ ] Sounds like a human wrote it

## Relevance Check
- [ ] Summary addresses JD requirements directly
- [ ] Skills categories in correct priority order
- [ ] Most relevant achievements emphasized first
- [ ] Tone matches ${getSeniorityLevelName(user_role.seniority_level)} level

## Format Check
- [ ] Valid JSON (no markdown code blocks, no syntax errors)
- [ ] All required keys present (summary, skills, experience_bullets)
- [ ] Skills has exactly 4 categories
- [ ] experience_bullets has pm2 (2-3), apm (2), team_lead (1)

**If any check fails, FIX IT before returning.**

---

# EXAMPLE TRANSFORMATION

Here's what excellent tailoring looks like:

## Resume Data (Raw):
\`\`\`
Company: Increff
Role: PM-2
Bullets:
- Led product development for ICC (iPaaS platform) serving ₹20M+ MRR
- Worked with engineering team of 10 to deliver 30+ ERP/WMS integrations
- Improved platform uptime from 95% to 99.8% through microservices redesign
\`\`\`

## JD Requirement:
"Technical PM to lead integration platform development. Must have experience with microservices, APIs, and cross-functional engineering teams."

## Generated Bullet (Excellent):
\`\`\`
Architected enterprise iPaaS platform serving ₹20M+ MRR across 30+ B2B clients, collaborating with 10-engineer team to deliver 30+ ERP/WMS integrations using microservices architecture
\`\`\`

**What makes this excellent:**
✅ Uses exact metrics (₹20M+ MRR, 30+ clients, 30+ integrations, 10-engineer team)
✅ Mentions actual company output (iPaaS, ERP/WMS integrations)
✅ Integrates JD keywords naturally (microservices, engineering team)
✅ Active, concrete language (Architected, collaborating)
✅ Shows scope and impact clearly
✅ Sounds human, not AI-generated

**What to avoid:**
❌ "Spearheaded innovative iPaaS solution leveraging microservices to drive transformational outcomes" (AI jargon, vague)
❌ "Led platform with ~₹20M revenue" (approximation, unclear)
❌ "Managed team and delivered integrations" (too generic, no metrics)

---

# FINAL REMINDERS

1. **Your client is ${metrics.contact.name}** - you're working for them, not against them
2. **Accuracy is non-negotiable** - one fake metric destroys trust
3. **Sound human** - recruiters can spot AI-generated content instantly
4. **Get them the interview** - that's the only success metric that matters

Now: Analyze the job description in the user message, extract metrics from ${metrics.contact.name}'s resume data above, and generate perfectly tailored content.

**Return valid JSON only. No explanations. No markdown code blocks. Just the JSON object.**
`.trim();
}

/**
 * Helper: Get readable seniority level name
 */
function getSeniorityLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Associate/Junior',
    2: 'Mid-level',
    3: 'Senior',
    4: 'Staff/Principal',
    5: 'Director/VP'
  };
  return names[level] || 'Mid-level';
}
```

---

## User Prompt Template (Simplified)

The user prompt should be minimal since system prompt has all context:

```typescript
/**
 * Build user prompt with job description
 *
 * @param jd_text - The job description
 * @param company_name - Company name
 * @param metrics - User metrics (only for validation)
 * @returns Minimal user prompt
 */
export function buildUserPrompt(
  jd_text: string,
  company_name: string,
  metrics: VerifiedMetrics
): string {
  return `
# JOB DESCRIPTION

**Company:** ${company_name}

${jd_text}

---

# YOUR TASK

Analyze the job description above and generate tailored resume content for ${metrics.contact.name} following ALL instructions in the system prompt.

Remember:
- Extract metrics from ${metrics.contact.name}'s work experience bullets (provided in system prompt)
- Use EXACT numbers from resume data (no approximation)
- Mirror JD terminology naturally (no keyword stuffing)
- Return valid JSON only (no markdown, no explanations)

Generate the resume content now.
`.trim();
}
```

---

## Key Design Principles

### 1. Comprehensive Context
- ✅ Full resume data in system prompt (not summarized)
- ✅ Extraction instructions explicit (what to look for)
- ✅ Examples show what "good" looks like

### 2. Strict Guardrails
- ✅ MUST DO / MUST NOT DO sections clear
- ✅ Accuracy rules explicit and repeated
- ✅ Fallback logic documented

### 3. Fallback Mechanisms
- ✅ Handles missing data gracefully
- ✅ "Omit rather than invent" principle
- ✅ Explicit instructions for edge cases

### 4. Quality Checks
- ✅ Self-check checklist before returning
- ✅ Multi-dimensional quality (accuracy, human quality, relevance, format)
- ✅ Forces LLM to validate own output

### 5. Token Efficiency
- ✅ No bloat (every section has purpose)
- ✅ Examples focused (not exhaustive)
- ✅ Structure clear (easy for LLM to parse)

---

## Implementation Changes

### File: `frontend/lib/resume/system-prompt.ts`

**Replace entire file with:**

1. **buildSystemPrompt()** function (as shown above)
2. **buildUserPrompt()** function (simplified version)
3. **getSeniorityLevelName()** helper
4. Remove deprecated functions:
   - ❌ Delete: validateSystemPrompt()
   - ❌ Delete: getPromptStats()

**Dependencies unchanged:**
- Still receives: role_type, user_role, metrics
- Still uses: ROLE_CONFIGS, getSeniorityToneGuide()

---

## Testing Strategy

### Test 1: Comprehensive Context

**Verify system prompt includes:**
- [ ] All work experience bullets
- [ ] All certifications
- [ ] All education details
- [ ] Full extraction instructions
- [ ] Fallback logic for missing data

### Test 2: Extraction Accuracy

**Test with User 1 (Raghav):**
- [ ] Generated content uses actual metrics from bullets
- [ ] Company names match resume (Meesho, Nextyn, Microsoft, etc.)
- [ ] No placeholder names (ICC, WMS 2.0) unless in actual resume
- [ ] Numbers exact (not approximated)

### Test 3: Fallback Handling

**Test with minimal resume:**
- [ ] If no revenue metrics → omits from content (doesn't invent)
- [ ] If no team size → uses "cross-functional team" (no number)
- [ ] If sparse data → focuses on responsibilities over metrics

### Test 4: Quality Output

**Verify generated content:**
- [ ] No AI jargon (spearheaded, leveraged, synergies)
- [ ] Varied bullet structure (not formulaic)
- [ ] Natural keyword integration (not stuffed)
- [ ] Sounds human-written

### Test 5: Token Efficiency

**Measure prompt size:**
- [ ] System prompt: 4000-6000 tokens (reasonable)
- [ ] User prompt: 500-1000 tokens (minimal)
- [ ] Total: <7000 tokens (efficient for this task)
- [ ] No unnecessary bloat

---

## Benefits Over Current Implementation

### Current System Prompt Issues:
❌ Hardcoded metrics (not dynamic)
❌ Contradictory instructions (company names)
❌ No extraction instructions (assumes data pre-extracted)
❌ No fallback logic (fails on missing data)
❌ Bloated with examples (high token cost)

### New System Prompt Benefits:
✅ **Dynamic:** Uses actual user resume data
✅ **Consistent:** No contradictions, one clear instruction set
✅ **Explicit:** Clear extraction instructions for LLM
✅ **Robust:** Fallback logic for edge cases
✅ **Efficient:** Streamlined structure, ~5000 tokens
✅ **Quality:** Self-check forces validation before returning

---

## Token Budget Analysis

### System Prompt Breakdown:

| Section | Tokens | Purpose |
|---------|--------|---------|
| Role Definition | ~200 | Establish expertise |
| Task Specification | ~150 | Define job to be done |
| Resume Data (Contact) | ~100 | User contact info |
| Resume Data (Work Exp) | ~2000-3500 | Raw bullets for extraction (varies by resume) |
| Resume Data (Edu + Certs) | ~200-400 | Education & certifications |
| Constraints & Guardrails | ~800 | MUST/MUST NOT, fallbacks |
| JD-Specific Guidance | ~400 | Role config, strategy |
| Output Format | ~300 | JSON structure, examples |
| Quality Self-Check | ~200 | Validation checklist |
| **Total** | **~4500-6000** | Efficient for task complexity |

### User Prompt Breakdown:

| Section | Tokens | Purpose |
|---------|--------|---------|
| Job Description | ~500-1500 | The JD to tailor for (varies) |
| Task Summary | ~100 | Quick reminder of job |
| **Total** | **~600-1600** | Minimal (context in system) |

**Combined:** ~5000-7500 tokens (well within Claude Sonnet 4's 200K context window)

**Efficiency:** 80% of tokens are user resume data + JD (actual content), 20% are instructions (necessary overhead)

---

## Rollback Strategy

**If new prompt causes quality issues:**

1. **Revert file:** `frontend/lib/resume/system-prompt.ts`
2. **Restore old implementation** (keep backup)
3. **Analyze failures:**
   - Check generated content samples
   - Look for patterns in errors
   - Identify which prompt section caused issue

**Rollback complexity:** Low (single file change)

---

## Long-Term Improvements

### V2 Enhancements:

1. **Prompt Versioning:**
   - Track prompt changes over time
   - A/B test prompt variations
   - Measure quality metrics per version

2. **Dynamic Instruction Tuning:**
   - Adjust guardrails based on user feedback
   - Add examples from successful generations
   - Remove examples from failed generations

3. **Context Compression:**
   - If resume very long (>5000 tokens), use LLM to summarize
   - Keep most relevant bullets, compress older experience
   - Trade-off: tokens vs. context completeness

4. **Quality Scoring:**
   - Automated quality check on generated content
   - Reject and regenerate if score < threshold
   - Log quality metrics for monitoring

---

## Implementation Checklist

- [ ] Backup current `system-prompt.ts` file
- [ ] Replace `buildSystemPrompt()` with new implementation
- [ ] Replace `buildUserPrompt()` with simplified version
- [ ] Remove deprecated helper functions
- [ ] Test with User 1 (Raghav) - verify quality improvement
- [ ] Test with User 2 (Test User) - verify fallback handling
- [ ] Measure token usage (should be ~5000-7500 total)
- [ ] Verify no contradictions (manual review)
- [ ] Check generated content sounds human (not AI jargon)
- [ ] Commit with message: "Redesign system prompt - comprehensive context + guardrails"

**Estimated Implementation Time:** 30 minutes (mostly copy-paste + testing)

---

## Questions & Clarifications

**Q: Why include full work experience bullets in system prompt?**
A: LLM needs raw data to extract metrics accurately. Regex extraction was brittle and lossy. This is what LLMs are designed for.

**Q: Won't this bloat token usage?**
A: Yes, by ~2000-3500 tokens (depending on resume length). But this is necessary context - without it, quality suffers. Still well within Claude's limits.

**Q: What if resume is extremely long?**
A: V2 can add compression logic. For MVP, assume resumes are reasonable length (3-5 roles, <10 years experience).

**Q: How do we prevent contradictions in future updates?**
A: Single source of truth principle - all logic in system prompt. Any changes reviewed for consistency before merging.

---

**🏗️ Specification Complete**

**This comprehensive system prompt redesign addresses:**
✅ Root cause of Issue 1 (contradictions + missing context)
✅ Fallback mechanisms (handle missing data)
✅ Quality guardrails (prevent AI jargon, ensure accuracy)
✅ Token efficiency (no bloat, just essentials)

**Ready for implementation, Raghav?**

**Created by:** Winston (Architect)
**Date:** 2026-01-11
**Status:** Ready for Dev Implementation
