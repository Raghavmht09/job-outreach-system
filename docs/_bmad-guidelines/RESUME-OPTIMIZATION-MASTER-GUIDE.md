# BMAD Resume Optimization - Master Reference Guide

**Version:** 1.0  
**Created:** January 2025  
**Purpose:** Complete reference for improving resume generation system using proven methodologies

---

## 📚 Document Library

### 🏗️ For Architect Agent (@bmm-architect)

Load these files in this order:

| # | File | Purpose | Load Priority |
|---|------|---------|---------------|
| 1 | **BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md** | Core architecture, data models, LLM specs | CRITICAL |
| 2 | **BMAD-ARCHITECT-DOCUMENT-GENERATION-SPEC.md** | JavaScript integration spec, user's proven patterns | CRITICAL |
| 3 | **resume-generation-script.js** | User's actual working JavaScript (reference only) | HIGH |
| 4 | **resume-generator-readme.md** | User's documentation on formatting rules | HIGH |

**Architect's Job:**
- Review existing resume generator implementation
- Identify gaps (accuracy, validation, formatting)
- Define integration between LLM output → JavaScript input
- Create detailed implementation plan for Dev Agent
- Specify data models and validation rules

**Expected Output:**
- Gap analysis document
- Technical architecture recommendations
- Implementation plan (5 phases, estimated timeline)
- Risk assessment and mitigation strategies

---

### 💻 For Dev Agent (@bmm-dev)

Load these files in this order:

| # | File | Purpose | Load Priority |
|---|------|---------|---------------|
| 1 | **BMAD-DEV-RESUME-IMPLEMENTATION-GUIDE.md** | LLM content generation, system prompt, validation | CRITICAL |
| 2 | **BMAD-DEV-JAVASCRIPT-INTEGRATION-GUIDE.md** | JavaScript wrapper, ContentMapper, PDF conversion | CRITICAL |
| 3 | **resume-generation-script.js** | User's proven JavaScript template (use as-is) | CRITICAL |
| 4 | **resume-generator-readme.md** | Formatting specs, troubleshooting, examples | HIGH |
| 5 | **BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md** | Data models reference | MEDIUM |

**Dev's Job:**
- Implement 5 phases:
  1. Data foundation (verified metrics, role configs)
  2. LLM system prompt (from user's JSON)
  3. Content generation (Claude API)
  4. Content validation (prevent false claims)
  5. JavaScript integration (bridge to user's script)
- Create TypeScript wrappers around user's proven JavaScript
- Add validation layer to catch errors before generation
- Wire everything together in end-to-end workflow

**Expected Output:**
- 5 TypeScript files implemented
- Working integration (JD → .docx → .pdf)
- Test suite with sample JDs
- User acceptance ready

---

## 🎯 System Overview

### Current State (User's Manual Workflow)

```
┌────────────────────────────────────────────────────┐
│           USER'S CURRENT WORKFLOW (MANUAL)         │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Chat with Claude to optimize resume content   │
│     → User provides JD                             │
│     → Claude suggests tailored content             │
│     → User copies content                          │
│                                                    │
│  2. Paste content into resume_generator.js        │
│     → Update CONTENT object manually               │
│     → Adjust skills categories                     │
│     → Modify experience bullets                    │
│                                                    │
│  3. Run: node resume_generator.js                 │
│     → Generates .docx file                         │
│                                                    │
│  4. Convert: soffice --convert-to pdf              │
│     → Creates .pdf file                            │
│                                                    │
│  5. Verify: pdfinfo | grep "Pages:"                │
│     → Checks if exactly 1 page                     │
│                                                    │
│  Result: Perfect 1-page resume                     │
│  Time: 30-45 minutes per resume                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Target State (Automated Workflow)

```
┌────────────────────────────────────────────────────┐
│            TARGET WORKFLOW (AUTOMATED)             │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. User provides JD + company name                │
│     → Input via API or CLI                         │
│                                                    │
│  2. LLM generates optimized content (automated)    │
│     → Claude API with system prompt                │
│     → Uses verified metrics only                   │
│     → Role-specific customization                  │
│                                                    │
│  3. Content validation (automated)                 │
│     → Checks accuracy (no false claims)            │
│     → Checks team size (always 20)                 │
│     → Checks platform names (specific)             │
│                                                    │
│  4. Content mapping (automated)                    │
│     → LLM JSON → JavaScript CONTENT object         │
│                                                    │
│  5. Document generation (automated)                │
│     → User's proven JavaScript executes            │
│     → Generates .docx                              │
│     → Converts to .pdf                             │
│                                                    │
│  6. Verification (automated)                       │
│     → Page count check                             │
│     → File integrity check                         │
│                                                    │
│  Result: Perfect 1-page resume                     │
│  Time: 2-3 minutes per resume                      │
│  Improvement: 10-15x faster                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📊 What We're Building

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   RESUME GENERATION SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐                                          │
│  │   Input      │  JD text + company name                  │
│  └──────┬───────┘                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │  JD Analyzer │  Classify role type, extract keywords   │
│  └──────┬───────┘                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │   Content    │  Claude API + system prompt             │
│  │   Generator  │  (uses verified metrics only)           │
│  └──────┬───────┘                                          │
│         │                                                   │
│         │ JSON output                                       │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │   Content    │  Validate accuracy                       │
│  │   Validator  │  (no false claims, correct team size)   │
│  └──────┬───────┘                                          │
│         │                                                   │
│         │ Validated JSON                                    │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │   Content    │  Transform JSON → JavaScript CONTENT     │
│  │   Mapper     │                                          │
│  └──────┬───────┘                                          │
│         │                                                   │
│         │ JavaScript CONTENT object                         │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │  JavaScript  │  Execute user's proven script           │
│  │  Generator   │  (resume_generator.js wrapper)          │
│  └──────┬───────┘                                          │
│         │                                                   │
│         ├─────────┐                                         │
│         ▼         ▼                                         │
│  ┌─────────┐  ┌─────────┐                                │
│  │  .docx  │  │  .pdf   │  LibreOffice conversion         │
│  └─────────┘  └─────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Integration Points

### 1. User's Proven JavaScript (DO NOT MODIFY)

**Location:** `resume-generation-script.js`

**What it does:**
- Takes CONTENT object (JavaScript format)
- Generates .docx with exact formatting
- Uses docx library
- Writes to /mnt/user-data/outputs/

**Status:** ✅ WORKING PERFECTLY

**Our approach:** Wrap it, don't change it

---

### 2. LLM System Prompt (From User's JSON)

**Integrated in:** `lib/resume/system-prompt.ts`

**Key requirements:**
- NEVER include false claims
- ONLY use verified metrics
- Team size is ALWAYS 20 engineers
- Platform names: ICC, WMS 2.0 (not generic)
- Fit on exactly 1 page
- Mirror JD language naturally

**Status:** ✅ SPECIFIED IN GUIDES

**Our approach:** Build from user's proven template

---

### 3. Content Validation (CRITICAL NEW COMPONENT)

**Implemented in:** `lib/resume/content-validator.ts`

**Validates:**
- All metrics are in VERIFIED_METRICS
- Team size is 20 (not 15 or other)
- Platform names are specific (not generic)
- No approximations (no "~25%")
- Contact info is correct
- Summary length fits on 1 page

**Status:** 🔧 TO BE IMPLEMENTED

**Our approach:** Reject generation if validation fails

---

### 4. Content Mapping (BRIDGE COMPONENT)

**Implemented in:** `lib/resume/content-mapper.ts`

**Transforms:**
```typescript
// LLM Output (JSON)
{
  summary: string,
  skills: { [category]: string[] },
  experience_bullets: { pm2: string[], apm: string[], team_lead: string[] }
}

// ↓ Maps to ↓

// JavaScript Input (CONTENT object)
{
  summary: string,
  skills: {
    category1: { title: string, items: string },  // Array → comma-separated
    ...
    keyMetrics: string  // Special format with bullets
  },
  pm2: { title: string, bullets: string[] },
  apm: { title: string, bullets: string[] },
  teamLead: { title: string, bullets: string[] }
}
```

**Status:** 🔧 TO BE IMPLEMENTED

**Our approach:** TypeScript class with clear mapping rules

---

## 📋 Implementation Checklist

### Phase 1: Data Foundation (Day 1)
- [ ] Create `lib/resume/verified-metrics.ts`
- [ ] Create `lib/resume/role-configs.ts`
- [ ] Load user's verified metrics (₹20M+ MRR, etc.)
- [ ] Define 5 role types with configurations

### Phase 2: LLM System Prompt (Day 1-2)
- [ ] Create `lib/resume/system-prompt.ts`
- [ ] Build system prompt from user's JSON template
- [ ] Include VERIFIED_METRICS
- [ ] Include role-specific configs
- [ ] Add quality checklist

### Phase 3: Content Generation (Day 2-3)
- [ ] Create `lib/resume/content-generator.ts`
- [ ] Integrate Claude API
- [ ] Use system prompt builder
- [ ] Handle JSON parsing from LLM
- [ ] Add error handling

### Phase 4: Content Validation (Day 3-4)
- [ ] Create `lib/resume/content-validator.ts`
- [ ] Implement 6 validation rules
- [ ] Validate metrics against VERIFIED_METRICS
- [ ] Check team size (must be 20)
- [ ] Check platform names (must be specific)
- [ ] Reject if any rule violated

### Phase 5: Content Mapping (Day 4)
- [ ] Create `lib/resume/content-mapper.ts`
- [ ] Implement JSON → JavaScript transformation
- [ ] Handle skills array → comma-separated string
- [ ] Format Key Metrics with bullet symbols
- [ ] Validate content length (1 page constraint)

### Phase 6: JavaScript Integration (Day 4-5)
- [ ] Create `lib/resume/javascript-document-generator.ts`
- [ ] Wrap user's proven JavaScript script
- [ ] Inject CONTENT object dynamically
- [ ] Execute Node.js script
- [ ] Handle PDF conversion (soffice)

### Phase 7: End-to-End Orchestration (Day 5-6)
- [ ] Create `lib/resume/resume-generator.ts`
- [ ] Wire all components together
- [ ] Add comprehensive logging
- [ ] Add verification step (page count, file size)
- [ ] Create test script

### Phase 8: Testing & Validation (Day 6-7)
- [ ] Test with technical_pm JD
- [ ] Test with growth_pm JD
- [ ] Test with ux_focused JD
- [ ] Verify all outputs are exactly 1 page
- [ ] Verify accuracy (no false claims)
- [ ] User acceptance testing

---

## 🚨 Critical Success Factors

### 1. Accuracy (HIGHEST PRIORITY)

**Rule:** NEVER include unverified metrics

**Verification:**
```typescript
// Every metric must pass this check:
isVerifiedMetric(metric) → true

// Examples:
isVerifiedMetric("₹20M+ MRR") → true ✅
isVerifiedMetric("35-45% adoption") → false ❌ (reject generation)
```

---

### 2. Page Length (NON-NEGOTIABLE)

**Rule:** Resume must be exactly 1 page

**Verification:**
```bash
pdfinfo Resume.pdf | grep "Pages:"
# Must output: Pages: 1
```

**If exceeds 1 page:**
1. Reduce PM-2 bullets from 3 to 2
2. Shorten summary from 8 to 6 lines
3. Check spacing values unchanged

---

### 3. User's JavaScript Unchanged

**Rule:** Don't modify resume-generation-script.js

**Approach:**
- ✅ Wrap it in TypeScript class
- ✅ Inject CONTENT dynamically
- ❌ Don't change formatting logic
- ❌ Don't change styling
- ❌ Don't change spacing values

---

## 📊 Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page count accuracy | 100% (always 1 page) | `pdfinfo` check |
| Metric accuracy | 100% (all verified) | ContentValidator |
| ATS keyword match | 95-98% | Keyword analysis |
| Generation success rate | 95%+ | Error logs |
| Formatting consistency | 100% | Manual review |
| PDF conversion success | 100% | File existence check |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time per resume | < 3 minutes | Timestamp logs |
| User acceptance rate | 90%+ | User feedback |
| Rework rate | < 10% | Regeneration count |
| ATS pass-through | 95%+ | User reports |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| No false claims | 100% | Validation checks |
| Correct team sizes | 100% | Always 20 |
| Specific platform names | 100% | No "support platform" |
| Horizontal lines placement | 100% | Under headers only |
| Text justification | 100% | All bullets justified |

---

## 🎯 User Acceptance Criteria

Resume passes if:

- [ ] Generated from JD in < 3 minutes
- [ ] Exactly 1 page (pdfinfo confirms)
- [ ] All metrics verified (no false claims)
- [ ] Team size is 20 engineers
- [ ] Platform names specific (ICC, WMS 2.0)
- [ ] Horizontal lines under section headers only
- [ ] All body text justified
- [ ] Contact info correct (Bangalore, correct LinkedIn)
- [ ] Skills categories match role type
- [ ] Bullet structure follows template
- [ ] .docx and .pdf both generated
- [ ] Professional appearance in PDF viewer

---

## 🔄 Workflow Commands

### For Architect Agent (Review Phase)

```bash
@bmm-architect

Load context:
- BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md
- BMAD-ARCHITECT-DOCUMENT-GENERATION-SPEC.md
- resume-generation-script.js (reference)
- resume-generator-readme.md (reference)

Review the existing resume generation system. Current issues:
1. LLM generates unverified metrics
2. Team size sometimes wrong (15 vs 20)
3. Generic platform names
4. No validation layer
5. Manual content pasting

Provide:
- Gap analysis
- Technical architecture recommendations
- Integration design (LLM → JavaScript)
- Implementation plan for Dev Agent
```

---

### For Dev Agent (Implementation Phase)

```bash
@bmm-dev

Load context:
- BMAD-DEV-RESUME-IMPLEMENTATION-GUIDE.md
- BMAD-DEV-JAVASCRIPT-INTEGRATION-GUIDE.md
- BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md (data models)
- resume-generation-script.js (user's proven code)
- resume-generator-readme.md (formatting specs)

Implement automated resume generation:

Phase 1: Create verified-metrics.ts + role-configs.ts
Phase 2: Create system-prompt.ts
Phase 3: Create content-generator.ts (Claude API)
Phase 4: Create content-validator.ts (CRITICAL - prevent false claims)
Phase 5: Create content-mapper.ts (JSON → JavaScript)
Phase 6: Create javascript-document-generator.ts (wrap user's script)
Phase 7: Create resume-generator.ts (orchestrator)
Phase 8: Create test-resume-generator.ts

Start with Phase 1. Show code after each phase for review.
```

---

## 📁 File Organization

```
your-project/
├── docs/
│   └── _bmad-guidelines/
│       ├── BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md
│       ├── BMAD-ARCHITECT-DOCUMENT-GENERATION-SPEC.md
│       ├── BMAD-DEV-RESUME-IMPLEMENTATION-GUIDE.md
│       ├── BMAD-DEV-JAVASCRIPT-INTEGRATION-GUIDE.md
│       ├── RESUME-OPTIMIZATION-MASTER-GUIDE.md (this file)
│       ├── resume-generation-script.js (user's proven script)
│       └── resume-generator-readme.md (user's documentation)
│
├── lib/
│   └── resume/
│       ├── verified-metrics.ts          # ← Phase 1
│       ├── role-configs.ts              # ← Phase 1
│       ├── system-prompt.ts             # ← Phase 2
│       ├── content-generator.ts         # ← Phase 3
│       ├── content-validator.ts         # ← Phase 4 (CRITICAL)
│       ├── content-mapper.ts            # ← Phase 5
│       ├── javascript-document-generator.ts  # ← Phase 6
│       └── resume-generator.ts          # ← Phase 7
│
└── scripts/
    └── test-resume-generator.ts         # ← Phase 8
```

---

## 🚀 Quick Start (Choose Your Path)

### Option 1: With Architect Review (Recommended)

**Day 1:** Architect reviews system  
**Days 2-7:** Dev implements  
**Total:** ~1 week

**Best for:** Complex integrations, significant changes

---

### Option 2: Direct Implementation (Faster)

**Days 1-5:** Dev implements directly  
**Total:** ~5 days

**Best for:** Clear requirements, proven patterns

---

## 💡 Pro Tips

1. **Start with validation:** Even if you only implement one thing, make it ContentValidator. It prevents false claims even if LLM misbehaves.

2. **Keep user's JavaScript unchanged:** It works perfectly. Wrap it, don't modify it.

3. **Test after each phase:** Don't wait until the end. Test each component individually.

4. **Use user's exact formatting values:** Don't "improve" the spacing or fonts. User's values are tuned for 1 page.

5. **Log everything:** Add console.log at every step. Makes debugging 10x easier.

---

## 📞 Support

If implementation gets stuck:

1. Review the specific guide for that phase
2. Check user's proven script for patterns
3. Verify prerequisites (Node.js, docx, soffice)
4. Check file permissions
5. Review error logs

---

**This master guide ties together all documents. Load the appropriate guides for your role (Architect or Dev) and follow the phased approach.** 🚀