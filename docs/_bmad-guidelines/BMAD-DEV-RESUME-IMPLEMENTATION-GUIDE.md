# BMAD Dev Agent - Resume System Implementation Guide

**Agent:** @bmm-dev
**Purpose:** Implement fixes for resume generation system using user's proven system prompt
**Context:** Existing logic generates subpar output - needs improvement using this specification
**Load this when:** Fixing/improving resume generation features

---

## 🎯 Your Mission

You have an existing resume generation system that's producing poor quality output. Your job:

1. ✅ Integrate the user's proven system prompt (from 8 successful resumes)
2. ✅ Fix accuracy issues (unverified metrics being added)
3. ✅ Fix formatting issues (page length, spacing, borders)
4. ✅ Implement role-specific customization
5. ✅ Add validation layer to catch errors before generation

**Reference Materials:**
- `BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md` - Technical architecture
- This file - Implementation patterns and code

---

## 📋 Prerequisites Check

Before starting, verify these exist in the codebase:

```typescript
// Files that should exist:
types/resume.ts              // ✅ Base resume data model
types/job-description.ts     // ✅ JD analysis model
types/resume-config.ts       // ✅ Formatting configuration
lib/resume/jd-analyzer.ts    // ⚠️  May need fixes
lib/resume/content-generator.ts // ⚠️  May need fixes (main issue)
lib/resume/content-validator.ts // ❌ Probably missing (add this!)
lib/resume/document-generator.ts // ⚠️  May need fixes
```

**If files are missing:** Create them following the architecture spec.
**If files exist:** Review and fix using patterns below.

---

## 🔧 Implementation Phase 1: Data Foundation

### Step 1.1: Create Verified Metrics Store

**File:** `lib/resume/verified-metrics.ts`

```typescript
// verified-metrics.ts
// Purpose: Single source of truth for all verified claims
// CRITICAL: Never allow metrics outside this list

export const VERIFIED_METRICS = {
  // Contact Information (NEVER MODIFY)
  contact: {
    name: "Raghav Mehta",
    location: "Bangalore, India",
    phone: "+91 70152 79802",
    email: "raghavmht9@gmail.com",
    linkedin: "linkedin.com/in/raghav-mehta-product",
    portfolio: "Portfolio Website"
  },
  
  // Revenue metrics (PM-2, APM, Team Lead)
  revenue: {
    pm2_mrr: "₹20M+ MRR",
    apm_expansion: "₹10M+ expansion",
    team_lead_portfolio: "$10M+ portfolio"
  },
  
  // Client metrics
  clients: {
    count: "30+ enterprise clients",
    notable: ["Adidas", "Puma", "Reliance"]
  },
  
  // Efficiency metrics (EXACT WORDING REQUIRED)
  efficiency: {
    integration_delivery: "80-90% reduction in integration delivery time",
    uptime: "99.9% platform uptime",
    deployment_success: "95%+ deployment success rate",
    retention: "95% retention rate"
  },
  
  // Team metrics (CRITICAL: ALWAYS 20, NOT 15)
  team: {
    size: 20,
    composition: ["senior engineers", "developers", "designers", "QAs"]
  },
  
  // Product metrics
  product: {
    integrations: "50+ channel integrations",
    time_savings: "200+ engineering hours saved monthly",
    debug_time: "60% faster debug time",
    onboarding: "40% reduction in developer onboarding time",
    apis_documented: "100+ APIs",
    knowledge_bases: "20+ knowledge bases"
  },
  
  // Platform names (use these, not generic terms)
  platforms: {
    ipaas: "Channel Connect (ICC)",
    wms: "WMS 2.0",
    store_fulfillment: "Store Fulfillment Solution",
    oms: "OMS features"
  }
} as const

// Type-safe access
export type VerifiedMetrics = typeof VERIFIED_METRICS

// Validation helper
export function isVerifiedMetric(claim: string): boolean {
  const allMetrics = JSON.stringify(VERIFIED_METRICS).toLowerCase()
  return allMetrics.includes(claim.toLowerCase())
}

// Extract all numeric metrics for validation
export function getAllNumericMetrics(): string[] {
  return [
    "₹20M+", "₹10M+", "$10M+", "30+", "80-90%", "99.9%", 
    "95%", "50+", "200+", "60%", "40%", "100+", "20+", "20"
  ]
}
```

---

### Step 1.2: Create Role Configuration Store

**File:** `lib/resume/role-configs.ts`

```typescript
// role-configs.ts
// Purpose: Role-specific templates from user's 8 successful resumes
// Source: User's JSON system prompt

export type RoleType = 
  | "technical_pm"
  | "growth_pm"
  | "ux_focused"
  | "business_platform"
  | "partner_ecosystem"

interface RoleConfig {
  examples: string[]
  emphasis: string[]
  skills_priority: string[]
  summary_template: string
}

export const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  technical_pm: {
    examples: [
      "Google Cloud Support Platform",
      "Uber KWM",
      "Tekion"
    ],
    emphasis: [
      "System design and architecture collaboration",
      "Technical depth with engineering teams",
      "Platform scalability and reliability (99.9% uptime)",
      "API design and integration (100+ APIs documented)",
      "Support platform and escalation workflows"
    ],
    skills_priority: [
      "Platform & Technical Architecture",
      "Cloud & AI/ML",
      "Product Management",
      "Key Metrics"
    ],
    summary_template: 
      "4.5+ years of Product Management experience building mission-critical platforms. " +
      "Led Channel Connect (ICC) iPaaS platform serving ₹20M+ MRR across 30+ enterprise clients. " +
      "Expertise in system architecture, API design, and platform reliability. " +
      "Currently driving [ROLE-SPECIFIC FOCUS]."
  },
  
  growth_pm: {
    examples: ["Google Growth Initiatives", "Bloomreach"],
    emphasis: [
      "Hypothesis-driven experimentation",
      "A/B testing and data analysis",
      "User research and insights",
      "Conversion optimization"
    ],
    skills_priority: [
      "Growth & Experimentation",
      "User-Centered Design",
      "AI & Data Systems",
      "Product Management",
      "Key Metrics"
    ],
    summary_template:
      "4.5+ years of Product Management experience with focus on growth and experimentation. " +
      "Led Channel Connect (ICC) serving ₹20M+ MRR with data-driven optimization. " +
      "Expertise in A/B testing, user research, and conversion optimization. " +
      "Currently driving [GROWTH INITIATIVES]."
  },
  
  ux_focused: {
    examples: ["Fello"],
    emphasis: [
      "User-centered design principles",
      "UX/UI collaboration",
      "User research and feedback loops",
      "Design system thinking"
    ],
    skills_priority: [
      "UX/UI & User-Centered Design",
      "AI & Conversational Interfaces",
      "Product Management",
      "Key Metrics"
    ],
    summary_template:
      "4.5+ years of Product Management experience with strong UX/design focus. " +
      "Led user-centric platforms serving 30+ enterprise clients. " +
      "Expertise in UX research, design collaboration, and conversational AI. " +
      "Currently building [UX-FOCUSED INITIATIVES]."
  },
  
  business_platform: {
    examples: ["Google Business Platform"],
    emphasis: [
      "Quote-to-Cash (Q2C) workflows",
      "Finance operations and automation",
      "Supply chain and procurement",
      "Cross-functional collaboration with Finance/Sales"
    ],
    skills_priority: [
      "Business Platform & Finance",
      "Enterprise SaaS & Integration",
      "Product Management",
      "Key Metrics"
    ],
    summary_template:
      "4.5+ years of Product Management experience in enterprise business platforms. " +
      "Led Channel Connect (ICC) iPaaS serving ₹20M+ MRR for retail operations. " +
      "Expertise in Q2C workflows, finance automation, and supply chain integration. " +
      "Currently driving [BUSINESS PLATFORM INITIATIVES]."
  },
  
  partner_ecosystem: {
    examples: ["Google Platform Partner"],
    emphasis: [
      "Partner ecosystem development",
      "Stakeholder influence without authority",
      "Business applications (sales, ordering, billing)",
      "Market opportunity identification"
    ],
    skills_priority: [
      "Partner Ecosystem & Stakeholder Influence",
      "Cloud & Marketplace Platforms",
      "Product Management",
      "Key Metrics"
    ],
    summary_template:
      "4.5+ years of Product Management experience in partner ecosystems. " +
      "Led Channel Connect (ICC) iPaaS platform serving 30+ enterprise partners. " +
      "Expertise in stakeholder influence, partner enablement, and marketplace platforms. " +
      "Currently driving [PARTNER ECOSYSTEM INITIATIVES]."
  }
}

// Helper function to classify role type from JD
export function classifyRoleType(jd_text: string): RoleType {
  const jd = jd_text.toLowerCase()
  
  // Technical PM indicators
  if (jd.includes("support") && jd.includes("escalation")) return "technical_pm"
  if (jd.includes("platform architecture") || jd.includes("api design")) return "technical_pm"
  if (jd.includes("system design")) return "technical_pm"
  
  // Growth PM indicators
  if (jd.includes("a/b test") || jd.includes("experimentation")) return "growth_pm"
  if (jd.includes("conversion") && jd.includes("optimization")) return "growth_pm"
  if (jd.includes("growth initiatives")) return "growth_pm"
  
  // UX-focused indicators
  if (jd.includes("ux research") || jd.includes("user research")) return "ux_focused"
  if (jd.includes("design collaboration")) return "ux_focused"
  
  // Business platform indicators
  if (jd.includes("q2c") || jd.includes("quote-to-cash")) return "business_platform"
  if (jd.includes("finance operations") || jd.includes("supply chain")) return "business_platform"
  
  // Partner ecosystem indicators
  if (jd.includes("partner ecosystem")) return "partner_ecosystem"
  if (jd.includes("stakeholder influence")) return "partner_ecosystem"
  
  // Default: technical PM (most common)
  return "technical_pm"
}
```

---

## 🔧 Implementation Phase 2: LLM System Prompt

### Step 2.1: Create System Prompt Builder

**File:** `lib/resume/system-prompt.ts`

```typescript
// system-prompt.ts
// Purpose: Build LLM system prompt from user's proven template
// Source: User's JSON - 8 successful resumes created with this

import { VERIFIED_METRICS } from './verified-metrics'
import { ROLE_CONFIGS, type RoleType } from './role-configs'

export function buildSystemPrompt(role_type: RoleType): string {
  const role_config = ROLE_CONFIGS[role_type]
  
  return `
You are a professional resume writer specializing in ATS-optimized resumes for Product Managers.

You are helping create a resume for Raghav Mehta, a Product Manager with 4.5+ years of experience.

# CRITICAL RULES (NON-NEGOTIABLE)

## 1. ACCURACY - HIGHEST PRIORITY
- NEVER include false claims or unverified metrics
- ONLY use data points from the VERIFIED METRICS section below
- If a metric is not in VERIFIED METRICS, DO NOT include it
- If uncertain about a claim, REMOVE it entirely
- NO approximations (e.g., "~25%" is FORBIDDEN)
- Team size is ALWAYS 20 engineers, NOT 15 or any other number

## 2. LENGTH CONSTRAINT
- Content MUST fit on exactly 1 page when formatted
- Professional Summary: 6-8 lines maximum
- PM-2 Role: 2-3 bullets (adjust based on line length)
- APM Role: 2 bullets exactly
- Team Lead Role: 1 bullet exactly
- If content is too long, reduce PM-2 bullets to 2 and shorten summary

## 3. TAILORING TO JOB DESCRIPTION
- Mirror JD language naturally (not keyword stuffing)
- Use JD-specific terminology in context
- Emphasize most relevant platforms and achievements
- Lead with experiences that match JD requirements

## 4. PLATFORM NAMING
- Use "Channel Connect (ICC)" NOT "support platform"
- Use "WMS 2.0" NOT "warehouse platform"
- Use "Store Fulfillment Solution" NOT "fulfillment system"
- Be specific, never generic

## 5. STRUCTURE & FORMATTING
- Section order: Summary, Skills, Experience, Education, Certifications
- Skills categories: Use priority from ROLE-SPECIFIC CONFIG below
- Bullet structure: Action verb + platform/feature + metric + methodology + outcome
- All metrics must be from VERIFIED METRICS

---

# VERIFIED METRICS (USE ONLY THESE)

## Contact Information
- Name: ${VERIFIED_METRICS.contact.name}
- Location: ${VERIFIED_METRICS.contact.location}
- Phone: ${VERIFIED_METRICS.contact.phone}
- Email: ${VERIFIED_METRICS.contact.email}
- LinkedIn: ${VERIFIED_METRICS.contact.linkedin}

## Revenue Metrics
- PM-2 role: ${VERIFIED_METRICS.revenue.pm2_mrr}
- APM role: ${VERIFIED_METRICS.revenue.apm_expansion}
- Team Lead role: ${VERIFIED_METRICS.revenue.team_lead_portfolio}

## Client Metrics
- Total clients: ${VERIFIED_METRICS.clients.count}
- Notable clients: ${VERIFIED_METRICS.clients.notable.join(", ")}

## Efficiency Metrics (USE EXACT WORDING)
- Integration delivery: ${VERIFIED_METRICS.efficiency.integration_delivery}
- Uptime: ${VERIFIED_METRICS.efficiency.uptime}
- Deployment success: ${VERIFIED_METRICS.efficiency.deployment_success}
- Retention: ${VERIFIED_METRICS.efficiency.retention}

## Team Metrics (CRITICAL)
- Team size: ${VERIFIED_METRICS.team.size} engineers (ALWAYS use 20, never 15!)
- Composition: ${VERIFIED_METRICS.team.composition.join(", ")}

## Product Metrics
- Integrations: ${VERIFIED_METRICS.product.integrations}
- Time savings: ${VERIFIED_METRICS.product.time_savings}
- Debug time improvement: ${VERIFIED_METRICS.product.debug_time}
- Onboarding improvement: ${VERIFIED_METRICS.product.onboarding}
- APIs documented: ${VERIFIED_METRICS.product.apis_documented}
- Knowledge bases: ${VERIFIED_METRICS.product.knowledge_bases}

## Platform Names (Use These Exact Names)
- iPaaS platform: ${VERIFIED_METRICS.platforms.ipaas}
- WMS: ${VERIFIED_METRICS.platforms.wms}
- Store fulfillment: ${VERIFIED_METRICS.platforms.store_fulfillment}
- OMS: ${VERIFIED_METRICS.platforms.oms}

---

# ROLE-SPECIFIC CONFIGURATION

Role Type: ${role_type}

Examples of this role type:
${role_config.examples.map(ex => `- ${ex}`).join('\n')}

Emphasis areas for this role:
${role_config.emphasis.map(em => `- ${em}`).join('\n')}

Skills category priority (MUST use this order):
${role_config.skills_priority.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Summary template (customize with JD details):
${role_config.summary_template}

---

# COMMON MISTAKES TO AVOID

1. ❌ Adding "35-45% adoption improvement" → NOT in verified metrics, REMOVE
2. ❌ Using "~25% faster go-lives" → Approximate, NOT verified, REMOVE
3. ❌ Saying "15 engineers" → WRONG, always use "20 engineers"
4. ❌ Calling ICC a "support platform" → WRONG, call it "Channel Connect (ICC) iPaaS platform"
5. ❌ Generic platform names → WRONG, use specific names (ICC, WMS 2.0)

---

# OUTPUT FORMAT

Return a JSON object with the following structure:

{
  "summary": "6-8 line professional summary tailored to JD...",
  "skills": {
    "[Category 1 from skills_priority]": ["skill1", "skill2", ...],
    "[Category 2 from skills_priority]": ["skill1", "skill2", ...],
    "[Category 3 from skills_priority]": ["skill1", "skill2", ...],
    "Key Metrics": ["metric1", "metric2", ...]
  },
  "experience_bullets": {
    "pm2": [
      "Led Channel Connect (ICC) iPaaS platform serving ₹20M+ MRR...",
      "Drove WMS 2.0 architecture..."
    ],
    "apm": [
      "Launched Store Fulfillment Solution generating ₹10M+ expansion...",
      "Delivered OMS features..."
    ],
    "team_lead": [
      "Led customer success for $10M+ portfolio..."
    ]
  }
}

---

# QUALITY CHECKLIST (Self-verify before returning)

Before you return your response, verify:
- [ ] All metrics are from VERIFIED METRICS section
- [ ] Team size is 20 engineers (not 15 or other)
- [ ] Platform names are specific (ICC, WMS 2.0, not generic)
- [ ] No approximations (no "~" symbol)
- [ ] Skills categories match role-specific priority order
- [ ] Summary is 6-8 lines when rendered
- [ ] PM-2 has 2-3 bullets, APM has 2, Team Lead has 1
- [ ] Every claim can be traced back to VERIFIED METRICS

If any checklist item fails, CORRECT it before returning.
`.trim()
}
```

---

## 🔧 Implementation Phase 3: Content Generator (LLM Integration)

### Step 3.1: Update Content Generator

**File:** `lib/resume/content-generator.ts`

```typescript
// content-generator.ts
// Purpose: Generate resume content using Claude API with system prompt

import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './system-prompt'
import { classifyRoleType, type RoleType } from './role-configs'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Expected output schema from LLM
const ResumeContentSchema = z.object({
  summary: z.string(),
  skills: z.record(z.array(z.string())),
  experience_bullets: z.object({
    pm2: z.array(z.string()),
    apm: z.array(z.string()),
    team_lead: z.array(z.string())
  })
})

type ResumeContent = z.infer<typeof ResumeContentSchema>

export class ContentGenerator {
  
  async generateResumeContent(
    jd_text: string,
    company_name: string
  ): Promise<ResumeContent> {
    
    // Step 1: Classify role type from JD
    const role_type = classifyRoleType(jd_text)
    console.log(`[ContentGenerator] Classified role type: ${role_type}`)
    
    // Step 2: Build system prompt with role-specific config
    const system_prompt = buildSystemPrompt(role_type)
    
    // Step 3: Build user prompt with JD
    const user_prompt = this.buildUserPrompt(jd_text, company_name)
    
    // Step 4: Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: system_prompt,
      messages: [{
        role: "user",
        content: user_prompt
      }]
    })
    
    // Step 5: Parse response
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }
    
    // Step 6: Extract JSON from response (Claude may wrap in markdown)
    const json_text = this.extractJSON(content.text)
    const parsed = JSON.parse(json_text)
    
    // Step 7: Validate schema
    const validated = ResumeContentSchema.parse(parsed)
    
    console.log(`[ContentGenerator] Generated content for ${company_name}`)
    return validated
  }
  
  private buildUserPrompt(jd_text: string, company_name: string): string {
    return `
I need you to create a tailored resume for a Product Manager role at ${company_name}.

# JOB DESCRIPTION

${jd_text}

# YOUR TASK

1. Analyze the job description above
2. Identify the role type (technical_pm, growth_pm, ux_focused, business_platform, or partner_ecosystem)
3. Generate a tailored resume using the VERIFIED METRICS from the system prompt
4. Follow all CRITICAL RULES in the system prompt (especially accuracy!)
5. Return the JSON format specified in the system prompt

Remember:
- ONLY use metrics from VERIFIED METRICS section
- Team size is ALWAYS 20 engineers
- Use specific platform names (ICC, WMS 2.0, not generic names)
- Mirror JD language naturally
- Fit on exactly 1 page (6-8 line summary, 2-3 PM-2 bullets, 2 APM bullets, 1 Team Lead bullet)

Generate the resume content now.
`.trim()
  }
  
  private extractJSON(text: string): string {
    // Claude may wrap JSON in markdown code blocks
    const json_match = text.match(/```json\n([\s\S]*?)\n```/)
    if (json_match) {
      return json_match[1]
    }
    
    // Or just return raw text if already JSON
    return text.trim()
  }
}
```

---

## 🔧 Implementation Phase 4: Content Validator (CRITICAL)

### Step 4.1: Create Content Validator

**File:** `lib/resume/content-validator.ts`

```typescript
// content-validator.ts
// Purpose: Validate resume content for accuracy BEFORE document generation
// CRITICAL: This prevents false claims from reaching the user

import { VERIFIED_METRICS, getAllNumericMetrics } from './verified-metrics'

interface ValidationError {
  type: string
  issue: string
  location: string
  action: string
}

interface ValidationReport {
  is_valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  cleaned_content: any
}

export class ContentValidator {
  
  validate(content: any): ValidationReport {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    console.log('[ContentValidator] Starting validation...')
    
    // Rule 1: Check contact information
    this.validateContactInfo(content, errors)
    
    // Rule 2: Check for unverified metrics
    this.validateMetrics(content, errors)
    
    // Rule 3: Check team size
    this.validateTeamSize(content, errors)
    
    // Rule 4: Check platform names
    this.validatePlatformNames(content, errors)
    
    // Rule 5: Check for approximations
    this.validateNoApproximations(content, errors)
    
    // Rule 6: Check summary length
    this.validateSummaryLength(content, warnings)
    
    const is_valid = errors.length === 0
    
    console.log(`[ContentValidator] Validation complete: ${is_valid ? 'PASSED' : 'FAILED'}`)
    console.log(`[ContentValidator] Errors: ${errors.length}, Warnings: ${warnings.length}`)
    
    return {
      is_valid,
      errors,
      warnings,
      cleaned_content: is_valid ? content : this.applyFixes(content, errors)
    }
  }
  
  private validateContactInfo(content: any, errors: ValidationError[]): void {
    const content_str = JSON.stringify(content)
    
    // Check location
    if (!content_str.includes(VERIFIED_METRICS.contact.location)) {
      errors.push({
        type: "incorrect_location",
        issue: `Location must be "${VERIFIED_METRICS.contact.location}"`,
        location: "contact",
        action: "replace"
      })
    }
    
    // Check email
    if (!content_str.includes(VERIFIED_METRICS.contact.email)) {
      errors.push({
        type: "incorrect_email",
        issue: `Email must be "${VERIFIED_METRICS.contact.email}"`,
        location: "contact",
        action: "replace"
      })
    }
  }
  
  private validateMetrics(content: any, errors: ValidationError[]): void {
    const content_str = JSON.stringify(content).toLowerCase()
    const verified_metrics = getAllNumericMetrics().map(m => m.toLowerCase())
    
    // Extract all numbers with % or + symbols
    const metric_regex = /(\d+[\d\-]*%|\d+\+|₹\d+M\+|\$\d+M\+)/g
    const found_metrics = content_str.match(metric_regex) || []
    
    for (const metric of found_metrics) {
      const is_verified = verified_metrics.some(vm => 
        vm.includes(metric.toLowerCase()) || metric.toLowerCase().includes(vm)
      )
      
      if (!is_verified) {
        errors.push({
          type: "unverified_metric",
          issue: `Metric "${metric}" not in VERIFIED_METRICS`,
          location: "unknown",
          action: "remove"
        })
      }
    }
  }
  
  private validateTeamSize(content: any, errors: ValidationError[]): void {
    const content_str = JSON.stringify(content).toLowerCase()
    
    // Check for wrong team sizes
    const wrong_sizes = ["15 engineer", "10 engineer", "25 engineer"]
    for (const wrong of wrong_sizes) {
      if (content_str.includes(wrong)) {
        errors.push({
          type: "incorrect_team_size",
          issue: `Found "${wrong}" but team size must be "20 engineers"`,
          location: "experience_bullets",
          action: "replace"
        })
      }
    }
    
    // Check if 20 engineers is mentioned (should be present)
    if (content_str.includes("engineer") && !content_str.includes("20 engineer")) {
      errors.push({
        type: "missing_correct_team_size",
        issue: "Team size mentioned but not using verified '20 engineers'",
        location: "experience_bullets",
        action: "verify"
      })
    }
  }
  
  private validatePlatformNames(content: any, errors: ValidationError[]): void {
    const content_str = JSON.stringify(content).toLowerCase()
    
    // Check for generic platform names (these are WRONG)
    const generic_terms = [
      "support platform",
      "customer platform",
      "warehouse platform",
      "fulfillment system"
    ]
    
    for (const generic of generic_terms) {
      if (content_str.includes(generic)) {
        errors.push({
          type: "generic_platform_name",
          issue: `Found generic term "${generic}" - must use specific name (ICC, WMS 2.0, etc.)`,
          location: "experience_bullets",
          action: "replace"
        })
      }
    }
  }
  
  private validateNoApproximations(content: any, errors: ValidationError[]): void {
    const content_str = JSON.stringify(content)
    
    // Check for ~ symbol (approximations NOT allowed)
    if (content_str.includes("~")) {
      errors.push({
        type: "approximation_found",
        issue: "Found '~' symbol - approximations not allowed",
        location: "unknown",
        action: "remove"
      })
    }
    
    // Check for phrases like "approximately", "around", "roughly"
    const approx_words = ["approximately", "around", "roughly", "about"]
    for (const word of approx_words) {
      if (content_str.toLowerCase().includes(word + " ")) {
        errors.push({
          type: "approximation_word",
          issue: `Found approximation word "${word}"`,
          location: "unknown",
          action: "remove"
        })
      }
    }
  }
  
  private validateSummaryLength(content: any, warnings: ValidationError[]): void {
    if (!content.summary) return
    
    const line_count = content.summary.split('.').length
    if (line_count > 8) {
      warnings.push({
        type: "summary_too_long",
        issue: `Summary has ~${line_count} sentences, target is 6-8 lines`,
        location: "summary",
        action: "shorten"
      })
    }
  }
  
  private applyFixes(content: any, errors: ValidationError[]): any {
    // For now, just return original content with errors logged
    // In production, you'd apply automatic fixes here
    console.error('[ContentValidator] Validation failed, errors:', errors)
    return content
  }
}
```

---

## 🔧 Implementation Phase 5: Main Resume Generator (Orchestrator)

### Step 5.1: Create Main Generator Class

**File:** `lib/resume/resume-generator.ts`

```typescript
// resume-generator.ts
// Purpose: Orchestrate the entire resume generation process

import { ContentGenerator } from './content-generator'
import { ContentValidator } from './content-validator'
import { DocumentGenerator } from './document-generator'
import fs from 'fs/promises'
import path from 'path'

export interface GenerateResumeOptions {
  jd_text: string
  company_name: string
  output_dir?: string
}

export interface GenerateResumeResult {
  success: boolean
  docx_path?: string
  pdf_path?: string
  errors?: string[]
  warnings?: string[]
}

export class ResumeGenerator {
  private content_generator: ContentGenerator
  private content_validator: ContentValidator
  private document_generator: DocumentGenerator
  
  constructor() {
    this.content_generator = new ContentGenerator()
    this.content_validator = new ContentValidator()
    this.document_generator = new DocumentGenerator()
  }
  
  async generate(options: GenerateResumeOptions): Promise<GenerateResumeResult> {
    const { jd_text, company_name, output_dir = '/mnt/user-data/outputs' } = options
    
    try {
      console.log(`[ResumeGenerator] Starting generation for ${company_name}...`)
      
      // Step 1: Generate content using LLM
      console.log('[ResumeGenerator] Step 1: Generating content with LLM...')
      const content = await this.content_generator.generateResumeContent(
        jd_text,
        company_name
      )
      
      // Step 2: Validate content (CRITICAL STEP)
      console.log('[ResumeGenerator] Step 2: Validating content...')
      const validation = this.content_validator.validate(content)
      
      if (!validation.is_valid) {
        console.error('[ResumeGenerator] Validation FAILED')
        return {
          success: false,
          errors: validation.errors.map(e => `${e.type}: ${e.issue}`)
        }
      }
      
      if (validation.warnings.length > 0) {
        console.warn('[ResumeGenerator] Warnings:', validation.warnings)
      }
      
      // Step 3: Generate .docx document
      console.log('[ResumeGenerator] Step 3: Generating .docx document...')
      const docx_buffer = await this.document_generator.generate(
        validation.cleaned_content,
        company_name
      )
      
      // Step 4: Save .docx file
      const file_name = `Raghav_Mehta_Resume_${company_name.replace(/\s+/g, '_')}_2025`
      const docx_path = path.join(output_dir, `${file_name}.docx`)
      
      await fs.writeFile(docx_path, docx_buffer)
      console.log(`[ResumeGenerator] Saved .docx: ${docx_path}`)
      
      // Step 5: Convert to PDF (using libreoffice or similar)
      console.log('[ResumeGenerator] Step 4: Converting to PDF...')
      const pdf_path = await this.convertToPDF(docx_path, output_dir)
      
      console.log(`[ResumeGenerator] ✅ Generation complete for ${company_name}`)
      
      return {
        success: true,
        docx_path,
        pdf_path,
        warnings: validation.warnings.map(w => `${w.type}: ${w.issue}`)
      }
      
    } catch (error) {
      console.error('[ResumeGenerator] Generation failed:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
  
  private async convertToPDF(docx_path: string, output_dir: string): Promise<string> {
    // Use libreoffice for conversion (must be installed in container)
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execPromise = promisify(exec)
    
    try {
      await execPromise(
        `libreoffice --headless --convert-to pdf --outdir "${output_dir}" "${docx_path}"`
      )
      
      const pdf_path = docx_path.replace('.docx', '.pdf')
      return pdf_path
    } catch (error) {
      console.error('[ResumeGenerator] PDF conversion failed:', error)
      // Return empty string if conversion fails (user still has .docx)
      return ''
    }
  }
}
```

---

## 🧪 Testing & Verification

### Test Script

Create `scripts/test-resume-generator.ts`:

```typescript
// scripts/test-resume-generator.ts
// Purpose: Test resume generation with sample JDs

import { ResumeGenerator } from '../lib/resume/resume-generator'

const SAMPLE_JDS = {
  technical_pm: `
    Product Manager - Cloud Support Platform
    
    We're looking for a PM to lead our cloud support platform serving enterprise customers.
    
    Requirements:
    - 4+ years PM experience with technical platforms
    - Experience with support escalation workflows
    - Strong collaboration with engineering teams
    - Track record of 99.9%+ uptime
    
    You'll work on platform architecture, API design, and reliability improvements.
  `,
  
  growth_pm: `
    Growth Product Manager
    
    Drive growth through experimentation and data-driven optimization.
    
    Requirements:
    - Experience with A/B testing and experimentation
    - User research and conversion optimization
    - Data analysis and hypothesis-driven development
    
    You'll run experiments, analyze results, and drive user growth.
  `
}

async function test() {
  const generator = new ResumeGenerator()
  
  for (const [role_type, jd_text] of Object.entries(SAMPLE_JDS)) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${role_type}`)
    console.log('='.repeat(60))
    
    const result = await generator.generate({
      jd_text,
      company_name: `Test_${role_type}`
    })
    
    if (result.success) {
      console.log('✅ Generation successful')
      console.log(`   DOCX: ${result.docx_path}`)
      console.log(`   PDF: ${result.pdf_path}`)
      if (result.warnings && result.warnings.length > 0) {
        console.log('   Warnings:', result.warnings)
      }
    } else {
      console.log('❌ Generation failed')
      console.log('   Errors:', result.errors)
    }
  }
}

test().catch(console.error)
```

Run test:
```bash
npx tsx scripts/test-resume-generator.ts
```

---

## ✅ Implementation Checklist

### Phase 1: Data Foundation
- [ ] Create `lib/resume/verified-metrics.ts`
- [ ] Create `lib/resume/role-configs.ts`
- [ ] Verify all 5 role types configured
- [ ] Test role classification function

### Phase 2: System Prompt
- [ ] Create `lib/resume/system-prompt.ts`
- [ ] Verify system prompt includes all critical rules
- [ ] Test prompt building for each role type

### Phase 3: Content Generation
- [ ] Update `lib/resume/content-generator.ts`
- [ ] Integrate Anthropic API
- [ ] Add JSON parsing from LLM response
- [ ] Add error handling

### Phase 4: Validation (CRITICAL)
- [ ] Create `lib/resume/content-validator.ts`
- [ ] Implement all 6 validation rules
- [ ] Test with intentionally bad data
- [ ] Verify errors are caught

### Phase 5: Orchestration
- [ ] Create `lib/resume/resume-generator.ts`
- [ ] Wire up all components
- [ ] Add PDF conversion
- [ ] Add comprehensive logging

### Phase 6: Testing
- [ ] Create test script with sample JDs
- [ ] Test all 5 role types
- [ ] Verify accuracy (no false claims)
- [ ] Verify formatting (1 page, correct spacing)
- [ ] Verify ATS compatibility

---

## 🚨 Common Issues & Fixes

### Issue 1: LLM Still Adding Unverified Metrics

**Symptom:** ContentValidator catches metrics not in VERIFIED_METRICS

**Fix:**
1. Check system prompt is being used (log it)
2. Verify VERIFIED_METRICS is complete
3. Make system prompt stricter:
   ```typescript
   // Add this to system prompt:
   "If you include ANY metric not explicitly listed in VERIFIED METRICS, 
   the resume will be REJECTED. Double-check every number."
   ```

### Issue 2: Resume Exceeds 1 Page

**Symptom:** Generated .docx is 1.5-2 pages

**Fix:**
1. Reduce PM-2 bullets from 3 to 2
2. Shorten summary from 8 to 6 lines
3. Add page length optimizer:
   ```typescript
   if (page_count > 1) {
     content.experience_bullets.pm2 = content.experience_bullets.pm2.slice(0, 2)
     // Regenerate document
   }
   ```

### Issue 3: Generic Platform Names Still Appearing

**Symptom:** ContentValidator flags "support platform" instead of "ICC"

**Fix:**
1. Add post-processing replacement:
   ```typescript
   function replaceGenericNames(text: string): string {
     return text
       .replace(/support platform/gi, "Channel Connect (ICC) iPaaS platform")
       .replace(/warehouse platform/gi, "WMS 2.0")
       .replace(/fulfillment system/gi, "Store Fulfillment Solution")
   }
   ```

---

## 🎯 Success Criteria

**Your implementation is complete when:**

1. ✅ All 5 role types generate correctly
2. ✅ ContentValidator passes (0 errors)
3. ✅ Generated resume is exactly 1 page
4. ✅ All metrics are verified (no false claims)
5. ✅ Platform names are specific (no generic terms)
6. ✅ Team size is always 20 engineers
7. ✅ Contact info is always correct
8. ✅ .docx and .pdf files generated successfully

---

## 📝 Next Steps After Implementation

1. **User Testing:**
   - Generate resumes for 3-5 sample JDs
   - Ask user to review for accuracy
   - Iterate based on feedback

2. **Performance Optimization:**
   - Add caching for role classification
   - Add retry logic for LLM failures
   - Optimize document generation speed

3. **Additional Features:**
   - Add resume versioning (save all generated resumes)
   - Add comparison view (before/after)
   - Add batch generation (multiple JDs at once)

---

**Start with Phase 1 and work through sequentially. Test after each phase!** 🚀