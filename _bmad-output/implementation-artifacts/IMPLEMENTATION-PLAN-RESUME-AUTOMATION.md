# Implementation Plan: Resume Automation System
**Date:** January 5, 2026  
**Architect:** Winston (BMAD Architect Agent)  
**Developer:** Amelia (BMAD Dev Agent)  
**Status:** READY FOR IMPLEMENTATION

---

## Executive Summary

Transform the current manual resume generation workflow into a fully automated system that generates ATS-optimized, 1-page DOCX/PDF resumes in < 3 minutes.

### Current State
- ✅ Resume optimization workflow working (Claude Sonnet 4)
- ✅ DOCX upload and text extraction working
- ❌ Output is raw Markdown with LLM preamble
- ❌ No DOCX/PDF output generation
- ❌ No content validation (unverified metrics slip through)
- ❌ No formatting consistency

### Target State
- JD text → Validated content → DOCX → PDF in < 3 minutes
- 100% accuracy (only verified metrics)
- Exactly 1 page (always)
- ATS-optimized formatting
- User's proven JavaScript template preserved

---

## Architecture Decision: Hybrid Approach

After reviewing all context files, I recommend a **hybrid approach**:

### Option Chosen: Server-Side DOCX Generation with `docx` Library

**Why:**
1. User's JavaScript template (`resume-generation-script.js`) uses `docx` library
2. Same library works in Node.js (Next.js API routes)
3. No need for external services
4. Formatting is exact and reproducible

**Trade-off:**
- PDF conversion requires LibreOffice (can defer to P1)
- For MVP: Output DOCX only, user converts to PDF manually

---

## Implementation Phases

### Phase 1: Data Foundation (2 hours)
**Files to Create:**
```
frontend/lib/resume/
├── verified-metrics.ts     # Verified metrics store
├── role-configs.ts         # Role-specific configurations
└── types.ts                # TypeScript interfaces
```

### Phase 2: LLM System Prompt (1 hour)
**Files to Create:**
```
frontend/lib/resume/
└── system-prompt.ts        # Build system prompt from configs
```

### Phase 3: Content Generator (2 hours)
**Files to Create:**
```
frontend/lib/resume/
└── content-generator.ts    # LLM orchestration
```

### Phase 4: Content Validator (2 hours) - CRITICAL
**Files to Create:**
```
frontend/lib/resume/
└── content-validator.ts    # Accuracy validation
```

### Phase 5: DOCX Generator (3 hours)
**Files to Create:**
```
frontend/lib/resume/
└── docx-generator.ts       # DOCX generation using docx library
```

### Phase 6: API Integration (2 hours)
**Files to Modify:**
```
frontend/app/api/job/optimize/route.ts  # Update to use new system
```

### Phase 7: Testing (2 hours)
**Files to Create:**
```
scripts/test-resume-generator.ts
```

### Phase 8: UI Updates (1 hour)
**Files to Modify:**
```
frontend/components/jobs/ResumeOptimizer.tsx
```

---

## Detailed Implementation Specifications

### Phase 1: Data Foundation

#### 1.1 Verified Metrics Store
**File:** `frontend/lib/resume/verified-metrics.ts`

```typescript
export const VERIFIED_METRICS = {
  contact: {
    name: "Raghav Mehta",
    location: "Bangalore, India",
    phone: "+91 70152 79802",
    email: "raghavmht9@gmail.com",
    linkedin: "linkedin.com/in/raghav-mehta-product",
    portfolio: "Portfolio Website"
  },
  revenue: {
    pm2_mrr: "₹20M+ MRR",
    apm_expansion: "₹10M+ expansion",
    team_lead_portfolio: "$10M+ portfolio"
  },
  clients: {
    count: "30+ enterprise clients",
    notable: ["Adidas", "Puma", "Reliance"]
  },
  efficiency: {
    integration_delivery: "80-90% reduction in integration delivery time",
    uptime: "99.9% platform uptime",
    deployment_success: "95%+ deployment success rate",
    retention: "95% retention rate"
  },
  team: {
    size: 20,  // CRITICAL: ALWAYS 20, NEVER 15
    composition: ["senior engineers", "developers", "designers", "QAs"]
  },
  product: {
    integrations: "50+ channel integrations",
    time_savings: "200+ engineering hours saved monthly",
    debug_time: "60% faster debug time",
    onboarding: "40% reduction in developer onboarding time",
    apis_documented: "100+ APIs",
    knowledge_bases: "20+ knowledge bases"
  },
  platforms: {
    ipaas: "Channel Connect (ICC)",
    wms: "WMS 2.0",
    store_fulfillment: "Store Fulfillment Solution",
    oms: "OMS features"
  }
} as const;
```

#### 1.2 Role Configurations
**File:** `frontend/lib/resume/role-configs.ts`

```typescript
export type RoleType = 
  | "technical_pm"
  | "growth_pm"
  | "ux_focused"
  | "business_platform"
  | "partner_ecosystem";

export const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  technical_pm: {
    examples: ["Google Cloud Support Platform", "Uber KWM", "Tekion"],
    emphasis: [
      "System design and architecture collaboration",
      "Technical depth with engineering teams",
      "Platform scalability and reliability",
      "API design and integration",
      "Support platform and escalation workflows"
    ],
    skills_priority: [
      "Platform & Technical Architecture",
      "Cloud & AI/ML",
      "Product Management",
      "Key Metrics"
    ]
  },
  // ... other role types
};

export function classifyRoleType(jd_text: string): RoleType {
  // Classification logic based on JD keywords
}
```

---

### Phase 4: Content Validator (CRITICAL)

**File:** `frontend/lib/resume/content-validator.ts`

```typescript
interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  cleaned_content: ResumeContent;
}

export class ContentValidator {
  validate(content: ResumeContent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Rule 1: No unverified metrics
    this.checkMetrics(content, errors);
    
    // Rule 2: Team size must be 20
    this.checkTeamSize(content, errors);
    
    // Rule 3: Platform names must be specific
    this.checkPlatformNames(content, errors);
    
    // Rule 4: No approximations (~25%)
    this.checkApproximations(content, errors);
    
    // Rule 5: Contact info correct
    this.checkContactInfo(content, errors);
    
    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      cleaned_content: this.cleanContent(content, errors)
    };
  }
  
  private checkTeamSize(content: ResumeContent, errors: ValidationError[]) {
    const text = JSON.stringify(content).toLowerCase();
    
    // Check for wrong team sizes
    if (text.includes("15 engineers") || text.includes("team of 15")) {
      errors.push({
        type: "incorrect_team_size",
        found: "15 engineers",
        expected: "20 engineers",
        action: "replace"
      });
    }
    
    // Check team size is mentioned correctly
    if (text.includes("team") && !text.includes("20")) {
      warnings.push({
        type: "team_size_not_specified",
        message: "Team size should be explicitly mentioned as 20 engineers"
      });
    }
  }
  
  private checkPlatformNames(content: ResumeContent, errors: ValidationError[]) {
    const genericNames = [
      "support platform",
      "customer platform",
      "warehouse platform",
      "fulfillment system"
    ];
    
    const text = JSON.stringify(content).toLowerCase();
    
    for (const generic of genericNames) {
      if (text.includes(generic)) {
        errors.push({
          type: "generic_platform_name",
          found: generic,
          expected: "Use specific name: ICC, WMS 2.0, etc.",
          action: "replace_with_specific"
        });
      }
    }
  }
}
```

---

### Phase 5: DOCX Generator

**File:** `frontend/lib/resume/docx-generator.ts`

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { VERIFIED_METRICS } from './verified-metrics';

export class DOCXGenerator {
  async generate(content: ValidatedContent): Promise<Buffer> {
    const doc = new Document({
      styles: this.getStyles(),
      numbering: this.getNumberingConfig(),
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }
          }
        },
        children: [
          ...this.createHeader(),
          ...this.createSummary(content.summary),
          ...this.createSkills(content.skills),
          ...this.createExperience(content.experience),
          ...this.createEducation(),
          ...this.createCertifications()
        ]
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
  
  private getStyles() {
    return {
      default: {
        document: {
          run: { font: "Arial", size: 20 }
        }
      },
      paragraphStyles: [
        {
          id: "Name",
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { after: 20 }, alignment: AlignmentType.CENTER }
        },
        {
          id: "SectionHeader",
          run: { size: 22, bold: true, font: "Arial" },
          paragraph: {
            spacing: { before: 70, after: 35 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }
            }
          }
        },
        // ... other styles from user's template
      ]
    };
  }
}
```

---

### Phase 6: API Integration

**File:** `frontend/app/api/job/optimize/route.ts`

Update the existing optimize endpoint to use the new system:

```typescript
import { ContentGenerator } from '@/lib/resume/content-generator';
import { ContentValidator } from '@/lib/resume/content-validator';
import { DOCXGenerator } from '@/lib/resume/docx-generator';

export async function POST(request: NextRequest) {
  // ... existing validation code ...
  
  // 1. Generate content with LLM
  const contentGenerator = new ContentGenerator();
  const llmContent = await contentGenerator.generate({
    jd_text: job_description,
    role_type: classifyRoleType(job_description)
  });
  
  // 2. Validate content (CRITICAL)
  const validator = new ContentValidator();
  const validation = validator.validate(llmContent);
  
  if (!validation.is_valid) {
    logger.warn('Content validation failed', validation.errors);
    // Auto-correct or regenerate
    // For MVP: Return errors to user
  }
  
  // 3. Generate DOCX
  const docxGenerator = new DOCXGenerator();
  const docxBuffer = await docxGenerator.generate(validation.cleaned_content);
  
  // 4. Upload to storage
  const fileName = `Raghav_Mehta_Resume_${companyName}_2025.docx`;
  // ... upload code ...
  
  return NextResponse.json({
    success: true,
    downloadUrl: signedUrl,
    format: 'docx',
    validation: {
      is_valid: validation.is_valid,
      warnings: validation.warnings
    }
  });
}
```

---

## Success Criteria

### Must Have (P0)
- [ ] DOCX output (not Markdown)
- [ ] No LLM preamble in output
- [ ] All metrics from VERIFIED_METRICS only
- [ ] Team size always 20 (never 15)
- [ ] Platform names specific (ICC, WMS 2.0, not generic)
- [ ] Contact info correct (Bangalore, correct LinkedIn)
- [ ] Exactly 1 page

### Should Have (P1)
- [ ] PDF conversion
- [ ] Role-specific skill category ordering
- [ ] ATS keyword match score
- [ ] Page length optimization algorithm

### Nice to Have (P2)
- [ ] Preview image generation
- [ ] Multiple format download options
- [ ] Resume versioning

---

## Risk Mitigation

### Risk 1: DOCX Library Compatibility
**Mitigation:** Use `docx` library (same as user's proven template)
**Fallback:** Generate HTML and convert with Puppeteer

### Risk 2: Page Length Exceeds 1 Page
**Mitigation:** Implement PageLengthOptimizer
**Fallback:** Reduce PM-2 bullets from 3 to 2

### Risk 3: LLM Still Generates Unverified Metrics
**Mitigation:** ContentValidator catches and removes them
**Fallback:** Regenerate with stricter prompt

---

## Timeline

| Phase | Duration | Dependency |
|-------|----------|------------|
| Phase 1: Data Foundation | 2 hours | None |
| Phase 2: System Prompt | 1 hour | Phase 1 |
| Phase 3: Content Generator | 2 hours | Phase 2 |
| Phase 4: Content Validator | 2 hours | Phase 1 |
| Phase 5: DOCX Generator | 3 hours | Phase 1 |
| Phase 6: API Integration | 2 hours | Phase 3, 4, 5 |
| Phase 7: Testing | 2 hours | Phase 6 |
| Phase 8: UI Updates | 1 hour | Phase 6 |
| **Total** | **15 hours** | **2-3 days** |

---

## Decision Required

**Raghav, please confirm:**

1. **Output Format Priority:**
   - [ ] DOCX only (faster, user converts to PDF)
   - [ ] DOCX + PDF (requires LibreOffice or external service)

2. **Validation Strictness:**
   - [ ] Strict: Reject if any unverified metric found
   - [ ] Auto-correct: Remove unverified metrics automatically

3. **Start Phase:**
   - [ ] Start with Phase 1 (Data Foundation)
   - [ ] Start with Phase 4 (Validator) - fix current issues first

**Once confirmed, I'll begin implementation immediately.**

---

## Appendix: Files Reference

### Existing Files (Do Not Modify)
- `docs/_bmad-guidelines/resume-generation-script.js` - User's proven template

### Files to Create
```
frontend/lib/resume/
├── verified-metrics.ts
├── role-configs.ts
├── types.ts
├── system-prompt.ts
├── content-generator.ts
├── content-validator.ts
├── docx-generator.ts
└── page-length-optimizer.ts
```

### Files to Modify
```
frontend/app/api/job/optimize/route.ts
frontend/components/jobs/ResumeOptimizer.tsx
```

---

**Status:** READY FOR IMPLEMENTATION  
**Next Step:** Await user confirmation on decisions above

