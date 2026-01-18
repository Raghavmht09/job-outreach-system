# BMAD Architect Agent - Resume Optimization System Reference

**Agent:** @bmm-architect
**Purpose:** Review existing resume generation logic and provide technical specifications for improvement
**Context:** User has a working resume generator but output quality needs improvement
**Load this when:** Reviewing or architecting resume generation features

---

## 🎯 Your Role: System Design Reviewer

You will:
1. ✅ Review the existing resume generation implementation
2. ✅ Identify gaps between current output and this specification
3. ✅ Provide technical architecture recommendations
4. ✅ Create detailed implementation plan for Dev Agent
5. ✅ Define data models and validation rules

**NOT your responsibility:**
- ❌ Writing actual code (Dev Agent does this)
- ❌ Deciding business logic (Product Owner/Scrum Master already did)
- ❌ Creating resume content (LLM does this)

---

## 📋 System Requirements Overview

### Critical Success Criteria

| Requirement | Current Output | Target Output | Priority |
|-------------|----------------|---------------|----------|
| **Page Length** | May be 1.5-2 pages | Exactly 1 page | CRITICAL |
| **Accuracy** | May include unverified metrics | Only verified metrics from base resume | CRITICAL |
| **ATS Compatibility** | Unknown parsing success | 95-98% keyword match, parseable by all ATS | HIGH |
| **Formatting Consistency** | Varies per generation | Identical formatting every time | HIGH |
| **Content Tailoring** | Generic resume | JD-specific customization | HIGH |

---

## 🏗️ Technical Architecture Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Resume Generation System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Input      │───▶│  Processing  │───▶│   Output     │ │
│  │   Layer      │    │    Layer     │    │   Layer      │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│        │                    │                    │          │
│        │                    │                    │          │
│   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐    │
│   │ Base    │         │ LLM     │         │ .docx   │    │
│   │ Resume  │         │ Prompt  │         │ .pdf    │    │
│   │ Data    │         │ Engine  │         │ Preview │    │
│   └─────────┘         └─────────┘         └─────────┘    │
│        │                    │                              │
│   ┌────▼────┐         ┌────▼────┐                        │
│   │ Job     │         │ Content │                        │
│   │ JD      │         │ Validator│                       │
│   │ Data    │         └─────────┘                        │
│   └─────────┘                                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models & Schemas (From User's Working System)

### 1. Base Resume Data Model

**File:** `types/resume.ts`

**Source:** User's verified resume data from LinkedIn Referral Finder project

```typescript
interface BaseResume {
  // Contact Information (EXACT VALUES - DO NOT MODIFY)
  contact: {
    name: "Raghav Mehta"
    location: "Bangalore, India"
    phone: "+91 70152 79802"
    email: "raghavmht9@gmail.com"
    linkedin: "linkedin.com/in/raghav-mehta-product"
    portfolio: "Portfolio Website"
  }
  
  // User Context
  current_role: "Product Manager - 2 at Increff"
  years_experience: "4.5+ years"
  
  // Education (VERIFIED)
  education: {
    degree: "Bachelor of Technology - Information Technology"
    institution: "GGSIPU"
    period: "2016-2020"
    cgpa: "9.0"
  }
  
  // Key Platforms Built (VERIFIED)
  platforms: [
    {
      name: "Channel Connect (ICC)",
      description: "iPaaS platform",
      role: "PM-2"
    },
    {
      name: "WMS 2.0",
      description: "Warehouse Management System",
      role: "PM-2"
    },
    {
      name: "Store Fulfillment Solution",
      description: "0-to-1 product",
      role: "APM"
    },
    {
      name: "OMS features",
      description: "Order Management System",
      role: "APM"
    }
  ]
  
  // Certifications (VERIFIED)
  certifications: [
    {
      name: "Advanced Product Leadership - Maven",
      instructor: "Jennifer Liu, SVP at Google",
      achievement: "2nd Place among 70 teams",
      date: "Sept 2024"
    },
    {
      name: "AI Product Management - Product Faculty",
      date: "April 2024"
    },
    {
      name: "Best Mentor Award - Mastering PM Cohort",
      date: "Oct 2024"
    }
  ]
}

// ============================================
// VERIFIED METRICS (USE ONLY THESE)
// ============================================
// Source: User's actual experience at Increff
// Last verified: 2025-01-05

interface VerifiedMetrics {
  // Revenue metrics
  revenue: {
    pm2_mrr: "₹20M+ MRR"                    // From PM-2 role
    apm_expansion: "₹10M+ expansion"         // From APM role
    team_lead_portfolio: "$10M+ portfolio"   // From Team Lead role
  }
  
  // Client/user metrics
  clients: {
    enterprise_count: "30+ enterprise clients"
    notable_names: ["Adidas", "Puma", "Reliance"]
  }
  
  // Efficiency metrics (CRITICAL - USE EXACT WORDING)
  efficiency: {
    integration_delivery: "80-90% reduction in integration delivery time"
    uptime: "99.9% platform uptime"
    deployment_success: "95%+ deployment success rate"
    retention: "95% retention rate"
  }
  
  // Team metrics (CRITICAL - ALWAYS 20, NOT 15 OR OTHER)
  team: {
    size: 20  // VERIFIED: 20 engineers total
    composition: [
      "senior engineers",
      "developers", 
      "designers",
      "QAs"
    ]
  }
  
  // Product metrics
  product: {
    integrations: "50+ channel integrations"
    time_savings: "200+ engineering hours saved monthly"
    debug_time: "60% faster debug time"
    onboarding: "40% reduction in developer onboarding time"
    apis_documented: "100+ APIs"
    knowledge_bases: "20+ knowledge bases"
  }
}

// ============================================
// KEY TECHNOLOGIES (VERIFIED)
// ============================================

const verified_technologies = [
  "LLMs (Claude, OpenAI)",
  "Multi-agent orchestration",
  "iPaaS platforms",
  "Microservices architecture",
  "REST APIs",
  "PostgreSQL",
  "Cloud-based platforms"
]

---

### 2. Job Description Analysis Model

**File:** `types/job-description.ts`

```typescript
interface JobDescriptionAnalysis {
  // Raw JD text
  raw_text: string
  
  // Extracted requirements
  requirements: {
    minimum_qualifications: {
      years_experience: number
      degree_required: boolean
      technical_areas: string[]
    }
    preferred_qualifications: {
      specific_platforms: string[]
      domain_experience: string[]
      certifications: string[]
    }
    responsibilities: string[]
  }
  
  // Keywords for ATS optimization
  keywords: {
    high_priority: string[]      // Must appear in resume
    medium_priority: string[]    // Should appear if relevant
    technical_terms: string[]    // Technical stack mentioned
    soft_skills: string[]        // Leadership, collaboration, etc.
  }
  
  // Role classification
  role_type: RoleType
  
  // Company context
  company: {
    name: string
    values: string[]
    terminology: string[]  // Company-specific terms to mirror
  }
}

// ============================================
// ROLE TYPES (FROM USER'S WORKING SYSTEM)
// ============================================
// Source: User created 8 resumes across these 5 role types
// Verified: 2025-01-05

type RoleType = 
  | "technical_pm"           // System design, architecture, APIs
  | "growth_pm"              // A/B testing, experimentation, conversion
  | "ux_focused"             // User research, design collaboration
  | "business_platform"      // Q2C, finance, supply chain
  | "partner_ecosystem"      // Partner development, stakeholder influence

interface RoleTypeConfig {
  examples: string[]           // Companies/roles this applies to
  emphasis: string[]           // What to emphasize in resume
  skills_priority: string[]    // Order of skills categories
  summary_template: string     // How to structure summary
}

// ============================================
// ROLE-SPECIFIC CONFIGURATIONS
// ============================================

const ROLE_CONFIGS: Record<RoleType, RoleTypeConfig> = {
  technical_pm: {
    examples: [
      "Google Cloud Support Platform",
      "Uber KWM (Knowledge & Workflow Management)",
      "Tekion (Automotive retail)"
    ],
    emphasis: [
      "System design and architecture collaboration",
      "Technical depth with engineering teams",
      "Platform scalability and reliability",
      "API design and integration",
      "Support platform and escalation workflows"
    ],
    skills_priority: [
      "Platform & Technical Architecture",  // First (most relevant)
      "Cloud & AI/ML",                      // Second
      "Product Management",                 // Third (always present)
      "Key Metrics"                         // Last (always present)
    ],
    summary_template: "4.5+ years of Product Management experience building [PLATFORM TYPE]. Led [KEY PLATFORM] serving [REVENUE/SCALE]. Expertise in [TECHNICAL AREAS]. Currently driving [CURRENT FOCUS]."
  },
  
  growth_pm: {
    examples: [
      "Google Growth Initiatives",
      "Bloomreach (AI Search, E-commerce)"
    ],
    emphasis: [
      "Hypothesis-driven experimentation",
      "A/B testing and data analysis",
      "User research and insights",
      "Conversion optimization",
      "Data-driven decision making"
    ],
    skills_priority: [
      "Growth & Experimentation",           // First
      "User-Centered Design",               // Second
      "AI & Data Systems",                  // Third
      "Product Management",                 // Fourth
      "Key Metrics"                         // Last
    ],
    summary_template: "4.5+ years of Product Management experience with focus on [GROWTH AREA]. Led [KEY PLATFORM] serving [USER BASE]. Expertise in [EXPERIMENTATION/TESTING]. Currently driving [GROWTH INITIATIVES]."
  },
  
  ux_focused: {
    examples: [
      "Fello (Conversational AI, UX/UI design)"
    ],
    emphasis: [
      "User-centered design principles",
      "UX/UI collaboration",
      "User research and feedback loops",
      "Design system thinking",
      "Accessibility and usability"
    ],
    skills_priority: [
      "UX/UI & User-Centered Design",       // First
      "AI & Conversational Interfaces",     // Second
      "Product Management",                 // Third
      "Key Metrics"                         // Last
    ],
    summary_template: "4.5+ years of Product Management experience with strong UX/design focus. Led [KEY PRODUCT] serving [USERS]. Expertise in [UX AREAS]. Currently building [UX-FOCUSED PRODUCT]."
  },
  
  business_platform: {
    examples: [
      "Google Business Platform (Q2C, Finance, Supply chain)"
    ],
    emphasis: [
      "Quote-to-Cash (Q2C) workflows",
      "Finance operations and automation",
      "Supply chain and procurement",
      "Cross-functional collaboration with Finance/Sales",
      "Business process optimization"
    ],
    skills_priority: [
      "Business Platform & Finance",        // First
      "Enterprise SaaS & Integration",      // Second
      "Product Management",                 // Third
      "Key Metrics"                         // Last
    ],
    summary_template: "4.5+ years of Product Management experience in [BUSINESS DOMAIN]. Led [KEY PLATFORM] serving [ENTERPRISE CLIENTS]. Expertise in [BUSINESS PROCESSES]. Currently driving [BUSINESS AUTOMATION]."
  },
  
  partner_ecosystem: {
    examples: [
      "Google Platform Partner (Partner ecosystem development)"
    ],
    emphasis: [
      "Partner ecosystem development",
      "Stakeholder influence without authority",
      "Business applications (sales, ordering, billing)",
      "Market opportunity identification",
      "Partner enablement and success"
    ],
    skills_priority: [
      "Partner Ecosystem & Stakeholder Influence", // First
      "Cloud & Marketplace Platforms",             // Second
      "Product Management",                        // Third
      "Key Metrics"                                // Last
    ],
    summary_template: "4.5+ years of Product Management experience in [PARTNER/MARKETPLACE DOMAIN]. Led [KEY PLATFORM] serving [PARTNERS/ECOSYSTEM]. Expertise in [STAKEHOLDER INFLUENCE]. Currently driving [PARTNER INITIATIVES]."
  }
}
```

---

### 3. Resume Configuration Model

**File:** `types/resume-config.ts`

```typescript
interface ResumeConfig {
  // Formatting specifications
  formatting: {
    page_length: 1  // MUST be exactly 1
    font: {
      family: "Arial"
      sizes: {
        name: 28  // 14pt * 2 (docx uses half-points)
        contact: 18  // 9pt * 2
        section_header: 22  // 11pt * 2
        body: 20  // 10pt * 2
      }
    }
    margins: {
      top: 720  // 0.5 inch in twips (1440 twips = 1 inch)
      bottom: 720
      left: 720
      right: 720
    }
    spacing: {
      section_header_before: 70  // In points
      section_header_after: 35
      bullet_after: 25
      paragraph_after: 40
    }
    alignment: {
      name: "center"
      contact: "center"
      body: "both"  // Justified
    }
  }
  
  // Section order (fixed)
  sections: [
    "PROFESSIONAL SUMMARY",
    "TECHNICAL SKILLS & EXPERTISE",
    "PROFESSIONAL EXPERIENCE",
    "EDUCATION",
    "CERTIFICATIONS"
  ]
  
  // Bullet count per role (for 1-page constraint)
  bullet_counts: {
    pm2: 2 | 3  // 2-3 bullets, adjust based on content length
    apm: 2      // Always 2 bullets
    team_lead: 1  // Always 1 bullet
  }
  
  // ATS optimization rules
  ats_rules: {
    keyword_match_target: 95  // Percentage (95-98%)
    avoid: string[]  // ["tables", "text boxes", "images", "columns"]
    use: string[]    // ["standard fonts", "clear headers", "bullets", "simple formatting"]
  }
}
```

---

## 🔧 Processing Layer Architecture

### Component 1: JD Analyzer

**File:** `lib/resume/jd-analyzer.ts`

**Purpose:** Parse job description and extract requirements

**Input:** Raw JD text
**Output:** JobDescriptionAnalysis object

**Key Functions:**

```typescript
class JDAnalyzer {
  analyze(jd_text: string): JobDescriptionAnalysis {
    // 1. Extract minimum qualifications
    // 2. Extract preferred qualifications
    // 3. Identify role type
    // 4. Extract keywords (high/medium/low priority)
    // 5. Identify company-specific terminology
  }
  
  classifyRoleType(jd: string, requirements: any): RoleType {
    // Decision tree logic:
    // - If mentions "support" + "escalations" → technical_pm
    // - If mentions "A/B testing" + "experiments" → growth_pm
    // - If mentions "UX research" + "design collaboration" → ux_focused
    // - If mentions "Q2C" + "finance" → business_platform
    // - If mentions "partner ecosystem" → partner_ecosystem
  }
  
  extractKeywords(jd: string, role_type: RoleType): Keywords {
    // Use LLM to extract keywords
    // Categorize by priority
    // Remove generic keywords (e.g., "work", "team")
  }
}
```

---

### Component 2: Content Generator (LLM Orchestrator)

**File:** `lib/resume/content-generator.ts`

**Purpose:** Use LLM (Claude) to generate tailored resume content

**Input:** BaseResume + JobDescriptionAnalysis + RoleTypeConfig
**Output:** TailoredResumeContent

**Critical Requirements:**

```typescript
class ContentGenerator {
  // System prompt configuration
  private system_prompt = `
    You are a professional resume writer specializing in ATS-optimized resumes for Product Managers.
    
    CRITICAL RULES:
    1. ACCURACY: Only use metrics from the base resume. NEVER invent or approximate metrics.
    2. LENGTH: Content MUST fit on exactly 1 page when formatted.
    3. TAILORING: Mirror JD language naturally, not keyword stuffing.
    4. STRUCTURE: Follow the exact formatting specification provided.
    
    If a metric is not in the base resume, DO NOT include it.
    If you're unsure about a claim, DO NOT include it.
  `
  
  async generateSummary(
    base: BaseResume, 
    jd: JobDescriptionAnalysis, 
    role: RoleTypeConfig
  ): Promise<string> {
    // Prompt structure:
    // 1. Opening statement (years + key platforms)
    // 2. Core achievements (2-3 metrics)
    // 3. Technical expertise (aligned with JD)
    // 4. Closing (role-specific positioning)
    
    // Length constraint: 6-8 lines when rendered
  }
  
  async generateSkillsCategories(
    base: BaseResume,
    jd: JobDescriptionAnalysis,
    role: RoleTypeConfig
  ): Promise<{ [category: string]: string[] }> {
    // Category order based on role type:
    // 1. Most relevant category (from role_type.skills_priority[0])
    // 2. Secondary relevant category
    // 3. Product Management (always present)
    // 4. Key Metrics (always last)
    
    // Example for technical_pm:
    // {
    //   "Platform & Technical Architecture": [...],
    //   "Cloud & AI/ML": [...],
    //   "Product Management": [...],
    //   "Key Metrics": [...]
    // }
  }
  
  async reframeBullets(
    bullets: string[],
    role_context: { role: string, company: string },
    jd: JobDescriptionAnalysis,
    verified_metrics: VerifiedMetrics
  ): Promise<string[]> {
    // Reframing rules:
    // 1. Start with JD-relevant action verbs
    // 2. Include verified metrics only
    // 3. Adjust technical depth based on role type
    // 4. Use JD-specific terminology
    
    // Structure: Action verb + platform/feature + metric + methodology + outcome
  }
}
```

---

### Component 3: Content Validator

**File:** `lib/resume/content-validator.ts`

**Purpose:** Verify accuracy and completeness before document generation

**Input:** TailoredResumeContent + VerifiedMetrics
**Output:** ValidationReport + CleanedContent

**Validation Rules:**

```typescript
class ContentValidator {
  validate(content: TailoredResumeContent, verified: VerifiedMetrics): ValidationReport {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Rule 1: No unverified metrics
    for (const metric of extractMetrics(content)) {
      if (!isInVerifiedMetrics(metric, verified)) {
        errors.push({
          type: "unverified_metric",
          value: metric,
          location: findLocation(metric, content),
          action: "remove"
        })
      }
    }
    
    // Rule 2: No approximate percentages (e.g., "~25%")
    const approximateMetrics = findApproximateMetrics(content)
    if (approximateMetrics.length > 0) {
      errors.push({
        type: "approximate_metric",
        values: approximateMetrics,
        action: "remove_or_verify"
      })
    }
    
    // Rule 3: Team size must be 20 engineers
    if (content.includes("team") && !content.includes("20")) {
      warnings.push({
        type: "incorrect_team_size",
        expected: "20 engineers",
        action: "verify"
      })
    }
    
    // Rule 4: Platform names must be accurate
    const genericPlatforms = ["support platform", "customer platform"]
    for (const generic of genericPlatforms) {
      if (content.toLowerCase().includes(generic)) {
        errors.push({
          type: "generic_platform_name",
          value: generic,
          expected: "ICC (Channel Connect), WMS 2.0, OMS",
          action: "replace_with_specific"
        })
      }
    }
    
    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      cleaned_content: this.applyCorrections(content, errors)
    }
  }
  
  private applyCorrections(content: any, errors: ValidationError[]): any {
    // Automatically remove unverified metrics
    // Replace generic names with specific names
    // Return corrected content
  }
}
```

---

### Component 4: Document Generator

**File:** `lib/resume/document-generator.ts`

**Purpose:** Generate .docx file with exact formatting specifications

**Library:** `docx` (npm package)

**Critical Implementation Details:**

```typescript
import { Document, Paragraph, TextRun, BorderStyle } from 'docx'

class DocumentGenerator {
  generate(content: TailoredResumeContent, config: ResumeConfig): Document {
    return new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: config.formatting.margins.top,
              right: config.formatting.margins.right,
              bottom: config.formatting.margins.bottom,
              left: config.formatting.margins.left,
            }
          }
        },
        children: [
          this.createHeader(content.contact),
          this.createSection("PROFESSIONAL SUMMARY", content.summary),
          this.createSection("TECHNICAL SKILLS & EXPERTISE", content.skills),
          this.createSection("PROFESSIONAL EXPERIENCE", content.experience),
          this.createSection("EDUCATION", content.education),
          this.createSection("CERTIFICATIONS", content.certifications),
        ]
      }]
    })
  }
  
  private createSection(title: string, content: any): Paragraph[] {
    return [
      // Section header with bottom border
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 70,  // 70pt before section header
          after: 35,   // 35pt after section header
        },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "000000"
          }
        }
      }),
      
      // Section content
      ...this.formatContent(content)
    ]
  }
  
  private formatBullet(text: string, isLast: boolean): Paragraph {
    return new Paragraph({
      text: text,
      bullet: {
        level: 0
      },
      spacing: {
        after: isLast ? 40 : 25  // More space after last bullet
      },
      alignment: AlignmentType.BOTH  // Justified
    })
  }
}
```

---

## 📏 Page Length Optimization Algorithm

**Problem:** Resume content may exceed 1 page

**Solution:** Iterative compression algorithm

```typescript
class PageLengthOptimizer {
  optimizeForOnePage(content: TailoredResumeContent): TailoredResumeContent {
    let doc = this.generateDocument(content)
    let pageCount = this.calculatePageCount(doc)
    
    // Iteration 1: Reduce PM-2 bullets from 3 to 2
    if (pageCount > 1) {
      content.experience[0].bullets = content.experience[0].bullets.slice(0, 2)
      doc = this.generateDocument(content)
      pageCount = this.calculatePageCount(doc)
    }
    
    // Iteration 2: Reduce spacing slightly
    if (pageCount > 1) {
      content.config.spacing.bullet_after = 20  // Reduce from 25
      doc = this.generateDocument(content)
      pageCount = this.calculatePageCount(doc)
    }
    
    // Iteration 3: Shorten summary by 1 line
    if (pageCount > 1) {
      content.summary = this.shortenSummary(content.summary, lines: 6)
      doc = this.generateDocument(content)
      pageCount = this.calculatePageCount(doc)
    }
    
    // If still > 1 page, throw error (requires manual intervention)
    if (pageCount > 1) {
      throw new Error("Cannot fit content on 1 page with current constraints")
    }
    
    return content
  }
  
  private calculatePageCount(doc: Document): number {
    // Use docx page calculation or estimate:
    // ~45 lines per page at 10pt font with 0.5" margins
    // Count total lines and divide by 45
  }
}
```

---

## 🎨 Formatting Specifications (Exact Implementation)

### Contact Information Block

```typescript
const contactInfo = [
  new Paragraph({
    text: "RAGHAV MEHTA",
    alignment: AlignmentType.CENTER,
    spacing: { after: 20 },
    children: [
      new TextRun({
        text: "RAGHAV MEHTA",
        font: "Arial",
        size: 28,  // 14pt * 2
        bold: true
      })
    ]
  }),
  new Paragraph({
    text: "Bangalore, India | +91 70152 79802 | raghavmht9@gmail.com | linkedin.com/in/raghav-mehta-product",
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: "Bangalore, India | +91 70152 79802 | raghavmht9@gmail.com | ",
        font: "Arial",
        size: 18  // 9pt * 2
      }),
      new TextRun({
        text: "linkedin.com/in/raghav-mehta-product",
        font: "Arial",
        size: 18,
        link: "https://linkedin.com/in/raghav-mehta-product"
      })
    ]
  })
]
```

### Section Header with Horizontal Line

```typescript
const sectionHeader = new Paragraph({
  text: "PROFESSIONAL SUMMARY",
  heading: HeadingLevel.HEADING_1,
  spacing: {
    before: 70,  // 70pt before header (except first section)
    after: 35    // 35pt after header
  },
  border: {
    bottom: {
      style: BorderStyle.SINGLE,
      size: 6,
      color: "000000"
    }
  },
  children: [
    new TextRun({
      text: "PROFESSIONAL SUMMARY",
      font: "Arial",
      size: 22,  // 11pt * 2
      bold: true,
      allCaps: true
    })
  ]
})
```

### Justified Body Text

```typescript
const bodyParagraph = new Paragraph({
  text: "4.5+ years of Product Management experience...",
  alignment: AlignmentType.BOTH,  // Justified
  spacing: { after: 40 },
  children: [
    new TextRun({
      text: "4.5+ years of Product Management experience...",
      font: "Arial",
      size: 20  // 10pt * 2
    })
  ]
})
```

### Bullet Points (Experience)

```typescript
const bulletPoint = new Paragraph({
  text: "Led Channel Connect (ICC) iPaaS platform...",
  bullet: {
    level: 0
  },
  alignment: AlignmentType.BOTH,  // Justified
  spacing: { after: 25 },
  children: [
    new TextRun({
      text: "Led Channel Connect (ICC) iPaaS platform serving ₹20M+ MRR...",
      font: "Arial",
      size: 20
    })
  ]
})
```

---

## ✅ Quality Control Checklist (For Architect to Define)

### Pre-Generation Checks

```typescript
interface PreGenerationChecklist {
  base_resume_loaded: boolean
  jd_analyzed: boolean
  verified_metrics_available: boolean
  role_type_classified: boolean
  skill_category_order_determined: boolean
}
```

### Post-Generation Checks

```typescript
interface PostGenerationChecklist {
  page_count: 1  // CRITICAL: Must be exactly 1
  contact_info_correct: boolean
  horizontal_lines_only_under_headers: boolean
  all_bullets_justified: boolean
  spacing_consistent: boolean
  no_unverified_metrics: boolean
  keyword_match_percentage: number  // Target: 95-98%
  pdf_renders_correctly: boolean
}
```

### Fact-Check Process

```typescript
interface FactCheckReport {
  metrics_checked: Array<{
    claim: string
    source: "verified" | "unverified"
    action: "keep" | "remove" | "verify_with_user"
  }>
  
  platform_names_checked: Array<{
    claim: string
    correct: boolean
    correction?: string
  }>
  
  team_sizes_checked: Array<{
    claim: string
    correct: boolean
    correction?: string
  }>
  
  dates_checked: Array<{
    claim: string
    correct: boolean
    correction?: string
  }>
}
```

---

## 🚨 Common Pitfalls (Architecture Review Focus Areas)

### 1. Accuracy Issues (CRITICAL)

| Issue | Detection Method | Fix |
|-------|------------------|-----|
| Unverified metrics added | Regex match metrics against verified list | Remove metric or flag for user verification |
| Approximate percentages (e.g., "~25%") | Regex: `/~\d+%/` | Remove or request user verification |
| Generic platform names ("support platform") | String match against blocklist | Replace with specific names (ICC, WMS 2.0) |
| Inflated team sizes (15 → 20) | Hard-coded verification | Always use 20 engineers |

**Architecture Recommendation:**
- Create `VerifiedMetricsValidator` class
- Load verified metrics from JSON/database
- Reject any generation with unverified metrics

---

### 2. Formatting Issues

| Issue | Detection Method | Fix |
|-------|------------------|-----|
| Resume > 1 page | Page count calculation | Run PageLengthOptimizer |
| Horizontal lines under job titles | AST traversal of document structure | Only apply borders to section headers |
| Inconsistent spacing | Spacing audit function | Apply ResumeConfig spacing values |
| Wrong contact info | Hard-coded validation | Enforce contact data from BaseResume |

**Architecture Recommendation:**
- Create `FormattingValidator` class
- Run on every generation
- Fail if any formatting rules violated

---

### 3. Content Quality Issues

| Issue | Detection Method | Fix |
|-------|------------------|-----|
| Generic, not tailored to JD | Keyword match percentage < 95% | Regenerate with stricter JD adherence |
| Keyword stuffing | Unnatural language detection (LLM-based) | Regenerate with "natural integration" emphasis |
| Overemphasis on less relevant experience | Manual review (Product Owner/user) | Adjust bullet priorities in content generation |

**Architecture Recommendation:**
- Create `ContentQualityScorer` class
- Score on: JD match, naturalness, relevance
- Regenerate if score < threshold

---

## 🔄 Iteration Protocol (For Dev Agent Implementation)

### When User Flags Issues

```typescript
class IssueHandler {
  async handleUserFeedback(
    issue_type: "accuracy" | "formatting" | "content",
    details: string,
    current_resume: Document
  ): Promise<Document> {
    
    if (issue_type === "accuracy") {
      // 1. Acknowledge immediately
      console.log("Accuracy issue identified:", details)
      
      // 2. Identify the claim
      const claim = extractClaimFromFeedback(details)
      
      // 3. Check against verified metrics
      const is_verified = verifyAgainstBase(claim)
      
      // 4. Remove or correct
      if (!is_verified) {
        content = removeClaim(content, claim)
      } else {
        content = correctClaim(content, claim, verified_value)
      }
      
      // 5. Regenerate
      return this.regenerateResume(content)
    }
    
    // Similar logic for formatting and content issues
  }
}
```

---

## 📄 Deliverables (Architecture Definition)

### Output Files Per Resume Generation

```typescript
interface ResumeDeliverables {
  files: {
    docx: string  // "Raghav_Mehta_Resume_[Company]_2025.docx"
    pdf: string   // "Raghav_Mehta_Resume_[Company]_2025.pdf"
    preview_jpg?: string  // Optional preview image
  }
  
  metadata: {
    company_name: string
    role_type: RoleType
    generation_timestamp: string
    keyword_match_percentage: number
    page_count: 1  // Always 1
  }
  
  documentation: {
    optimization_summary: string  // "Key optimizations: Emphasized platform architecture experience..."
    skills_categories: string[]   // ["Platform & Technical Architecture", ...]
    jd_requirements_coverage: number  // Percentage of JD requirements addressed
    corrections_made: Array<{
      issue: string
      action: string
    }>
  }
  
  fact_check_report?: FactCheckReport  // Optional, for critical applications
}
```

---

## 🎯 Success Metrics (For Architect to Define)

### Technical Metrics

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| **Page length accuracy** | 100% (always 1 page) | TBD | ? |
| **ATS keyword match** | 95-98% | TBD | ? |
| **Metric accuracy rate** | 100% (all verified) | TBD | ? |
| **Generation success rate** | 95%+ (first attempt) | TBD | ? |
| **Formatting consistency** | 100% (identical every time) | TBD | ? |

### Business Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Interview callback rate** | Baseline + improvement | Track user reports |
| **ATS pass-through rate** | 95%+ | User feedback on ATS rejections |
| **Time to generate resume** | < 3 minutes | System performance monitoring |
| **User satisfaction** | 4.5+ / 5.0 | User feedback surveys |

---

## 📚 Reference: System Prompt Template (For LLM)

```
You are a professional resume writer specializing in ATS-optimized resumes for Product Managers.

CRITICAL RULES (NON-NEGOTIABLE):

1. ACCURACY
   - Only use metrics from the base resume provided
   - NEVER invent or approximate metrics
   - If a metric is not in the base resume, DO NOT include it
   - If you're unsure about a claim, DO NOT include it
   
2. LENGTH
   - Content MUST fit on exactly 1 page when formatted
   - Professional Summary: 6-8 lines maximum
   - PM-2 Role: 2-3 bullets (adjust based on content length)
   - APM Role: 2 bullets exactly
   - Team Lead Role: 1 bullet exactly
   
3. TAILORING
   - Mirror JD language naturally (not keyword stuffing)
   - Use JD-specific terminology in context
   - Emphasize most relevant experience for the role
   
4. STRUCTURE
   - Section order: Summary, Skills, Experience, Education, Certifications
   - Skills categories: Prioritized based on role type
   - Bullets: Action verb + platform/feature + metric + methodology + outcome

BASE RESUME DATA:
[Inject BaseResume JSON here]

JOB DESCRIPTION ANALYSIS:
[Inject JobDescriptionAnalysis JSON here]

VERIFIED METRICS (USE ONLY THESE):
[Inject VerifiedMetrics JSON here]

ROLE TYPE CONFIGURATION:
[Inject RoleTypeConfig JSON here]

GENERATE:
1. Professional Summary (6-8 lines, tailored to JD)
2. Technical Skills Categories (4-5 categories, prioritized by role)
3. Reframed Experience Bullets (matching verified metrics, JD-aligned)

OUTPUT FORMAT: JSON
{
  "summary": "...",
  "skills": { "category1": ["skill1", ...], ... },
  "experience_bullets": {
    "pm2": ["bullet1", "bullet2"],
    "apm": ["bullet1", "bullet2"],
    "team_lead": ["bullet1"]
  }
}
```

---

## 🚀 Implementation Plan for Dev Agent

**When Architect completes review, provide this to Dev Agent:**

### Phase 1: Data Model Setup (Day 1)

1. Create TypeScript types:
   - `types/resume.ts` (BaseResume, VerifiedMetrics)
   - `types/job-description.ts` (JobDescriptionAnalysis, RoleType)
   - `types/resume-config.ts` (ResumeConfig, formatting specs)

2. Load base resume data:
   - Store verified metrics in database or JSON file
   - Validate schema on load

### Phase 2: Processing Layer (Day 2-3)

1. Implement `JDAnalyzer` class
2. Implement `ContentGenerator` class (LLM integration)
3. Implement `ContentValidator` class (critical for accuracy)

### Phase 3: Document Generation (Day 3-4)

1. Implement `DocumentGenerator` class using `docx` library
2. Implement exact formatting specifications
3. Implement `PageLengthOptimizer` algorithm

### Phase 4: Quality Control (Day 4-5)

1. Implement `FormattingValidator` class
2. Implement `FactCheckReport` generation
3. Implement PDF conversion

### Phase 5: Testing & Iteration (Day 5-7)

1. Test with 5-10 sample JDs
2. Validate page length = 1 in all cases
3. Validate no unverified metrics slip through
4. User acceptance testing

---

## ✅ Architect's Review Checklist

Before passing to Dev Agent, verify:

- [ ] All data models defined with TypeScript types
- [ ] Validation rules clearly specified
- [ ] Formatting specifications exact (point sizes, spacing)
- [ ] Verified metrics list complete and accurate
- [ ] LLM system prompt template created
- [ ] Success metrics defined
- [ ] Common pitfalls documented
- [ ] Implementation plan broken down by phase

**Once complete, create:** `RESUME-SYSTEM-IMPLEMENTATION-PLAN.md` for Dev Agent