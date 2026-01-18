# BMAD Architect Agent - Document Generation Specification

**Agent:** @bmm-architect
**Purpose:** Technical specification for resume document generation using proven JavaScript/docx-js patterns
**Context:** User has working JavaScript script - we automate content generation, keep proven formatting
**Load this with:** BMAD-ARCHITECT-RESUME-SYSTEM-REFERENCE.md

---

## 🎯 Architecture Context

### Current Working System (User's Proven Approach)

```
┌──────────────────────────────────────────────────────────┐
│              USER'S CURRENT WORKFLOW (MANUAL)            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. User optimizes resume with Claude (manual chat)     │
│  2. User copies optimized content to JavaScript         │
│  3. User runs: node resume_generator.js                 │
│  4. User converts: soffice --convert-to pdf             │
│                                                          │
│  Result: Perfect 1-page resume with exact formatting    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              TARGET SYSTEM (AUTOMATED)                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. LLM generates optimized content (automated)          │
│  2. Content → JavaScript template (automated)            │
│  3. Node script runs (automated)                         │
│  4. PDF conversion (automated)                           │
│                                                          │
│  Result: Same perfect output, but automated              │
└──────────────────────────────────────────────────────────┘
```

**Key Decision:** Keep user's JavaScript generator unchanged - it works perfectly. Our job: Automate the content feeding process.

---

## 📊 User's Proven JavaScript Architecture

### Technology Stack (Already Working)

| Component | Technology | Status |
|-----------|------------|--------|
| Document library | `docx` (npm package) | ✅ Proven |
| Working directory | `/home/claude/` | ✅ Configured |
| Output directory | `/mnt/user-data/outputs/` | ✅ Configured |
| PDF conversion | LibreOffice (`soffice`) | ✅ Installed |
| File format | .docx → .pdf | ✅ Working |

### Document Structure (User's Exact Implementation)

```javascript
// User's proven structure:
const doc = new Document({
  styles: documentStyles,       // Arial, exact font sizes
  numbering: numberingConfig,   // Bullet points
  sections: [{
    properties: {
      page: {
        margin: { top: 720, right: 720, bottom: 720, left: 720 }  // 0.5 inch
      }
    },
    children: [
      // Name paragraph
      // Contact info
      // Professional Summary section
      // Technical Skills section
      // Professional Experience section
      // Education section
      // Certifications section
    ]
  }]
})
```

---

## 🔧 Technical Specifications (From User's Script)

### 1. Font and Sizing (Exact Values)

**Critical:** docx library uses **half-points**, so multiply all sizes by 2

```javascript
// User's proven configuration:
const FONT_SIZES = {
  name: 28,           // 14pt actual (28 half-points)
  contact: 18,        // 9pt actual (18 half-points)
  section_header: 22, // 11pt actual (22 half-points)
  body: 20,           // 10pt actual (20 half-points)
  job_title: 20       // 10pt actual (20 half-points)
}

// All text: Arial font family
```

**Architecture Note:** These values are **non-negotiable** - changing them breaks 1-page constraint.

---

### 2. Spacing Configuration (User's Proven Values)

```javascript
// User's exact spacing (in points, not twips):
const SPACING = {
  sectionHeaderBefore: 70,  // Space before section headers
  sectionHeaderAfter: 35,   // Space after section headers
  jobTitleBefore: 60,       // Space before job titles (NO horizontal line here)
  jobTitleAfter: 20,        // Space after job titles
  bulletAfter: 25,          // Space after regular bullet
  bulletAfterLast: 35,      // Space after last bullet in section
  paragraphAfter: 40        // Space after paragraphs
}

// Conversion for docx library:
// points → twips: multiply by 20
// Example: 70pt = 1400 twips
```

**Architecture Note:** These spacing values are **tuned for 1 page** - deviating causes page overflow.

---

### 3. Text Alignment Rules

```javascript
// User's proven alignment rules:
const ALIGNMENT = {
  name: AlignmentType.CENTER,
  contact: AlignmentType.CENTER,
  section_headers: AlignmentType.LEFT,
  body_text: AlignmentType.JUSTIFIED,      // CRITICAL for professional look
  bullets: AlignmentType.JUSTIFIED,        // CRITICAL
  job_titles: AlignmentType.LEFT
}
```

**Architecture Note:** Justified alignment is **critical** for ATS and professional appearance.

---

### 4. Horizontal Lines (Under Section Headers ONLY)

```javascript
// User's proven implementation:
// Horizontal lines ONLY under these:
// - PROFESSIONAL SUMMARY
// - TECHNICAL SKILLS & EXPERTISE
// - PROFESSIONAL EXPERIENCE
// - EDUCATION
// - CERTIFICATIONS

// NOT under:
// - Company name (Increff)
// - Job titles (PM-2, APM, Team Lead)

// Implementation:
{
  id: "SectionHeader",
  paragraph: {
    border: {
      bottom: {
        color: "000000",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6
      }
    }
  }
}
```

**Architecture Note:** This is **Diksha Dubey formatting style** - critical for professional appearance.

---

## 🏗️ Integration Architecture

### Content Flow: LLM → JavaScript

```
┌─────────────────────────────────────────────────────────┐
│              INTEGRATION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐                                      │
│  │  LLM Content │  (Our new automation)                │
│  │  Generator   │                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         │ JSON Output:                                 │
│         │ {                                            │
│         │   "summary": "...",                          │
│         │   "skills": {...},                           │
│         │   "experience_bullets": {...}                │
│         │ }                                            │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                      │
│  │  Content     │  (Bridge component - NEW)            │
│  │  Mapper      │                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         │ Mapped to JavaScript CONTENT object          │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                      │
│  │  JavaScript  │  (User's proven script - UNCHANGED)  │
│  │  Generator   │                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                      │
│  │  .docx file  │                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                      │
│  │  .pdf file   │  (LibreOffice conversion)            │
│  └──────────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 Content Mapping Specification

### LLM Output → JavaScript CONTENT Object

```typescript
// LLM generates this:
interface LLMOutput {
  summary: string
  skills: {
    [category: string]: string[]
  }
  experience_bullets: {
    pm2: string[]
    apm: string[]
    team_lead: string[]
  }
}

// Must map to this (user's JavaScript structure):
const CONTENT = {
  summary: string,
  
  skills: {
    category1: { title: string, items: string },  // Comma-separated
    category2: { title: string, items: string },
    category3: { title: string, items: string },
    category4: { title: string, items: string },
    keyMetrics: string  // Special format with bullets
  },
  
  pm2: {
    title: string,
    bullets: string[]
  },
  
  apm: {
    title: string,
    bullets: string[]
  },
  
  teamLead: {
    title: string,
    bullets: string[]
  }
}
```

**Mapping Rules:**

```typescript
// 1. Summary: Direct copy (already validated)
CONTENT.summary = llm_output.summary

// 2. Skills: Transform array to comma-separated string
Object.entries(llm_output.skills).forEach(([category, skills_array], index) => {
  CONTENT.skills[`category${index + 1}`] = {
    title: category,
    items: skills_array.join(", ")
  }
})

// 3. Key Metrics: Special format with bullet symbols
CONTENT.skills.keyMetrics = "₹20M+ MRR • 30+ clients • 99.9% uptime • 95%+ deployment"

// 4. Experience: Direct copy (bullets already formatted)
CONTENT.pm2.bullets = llm_output.experience_bullets.pm2
CONTENT.apm.bullets = llm_output.experience_bullets.apm
CONTENT.teamLead.bullets = llm_output.experience_bullets.team_lead
```

---

## 🔧 Bullet Point Formatting Rules

### User's Proven Bullet Structure

```javascript
// Each bullet point in JavaScript:
new Paragraph({
  numbering: { reference: "bullet-list", level: 0 },
  spacing: { 
    before: 0, 
    after: 25  // or 35 for last bullet
  },
  alignment: AlignmentType.JUSTIFIED,  // CRITICAL
  children: [new TextRun("Bullet text here")]
})
```

**LLM Must Generate Bullets That:**
1. Fit on 1-2 lines when rendered (keep concise)
2. Are already justified text (no manual line breaks)
3. Include verified metrics inline
4. Follow structure: Action verb + platform + metric + methodology + outcome

---

## 📦 File Generation Workflow

### User's Proven Workflow (to be Automated)

```javascript
// Step 1: Generate document in memory
const doc = new Document({...})

// Step 2: Write to buffer
Packer.toBuffer(doc).then(buffer => {
  // Step 3: Write to file system
  fs.writeFileSync("/mnt/user-data/outputs/Resume.docx", buffer);
  console.log("Resume created successfully!");
})

// Step 4: Convert to PDF (separate process)
// Executed via bash: soffice --headless --convert-to pdf Resume.docx
```

**Architecture Recommendation:**

```typescript
class DocumentGenerator {
  async generate(content: MappedContent, company_name: string): Promise<Buffer> {
    // 1. Map LLM content to JavaScript CONTENT object
    const js_content = this.mapContent(content)
    
    // 2. Build docx Document (using user's proven structure)
    const doc = this.buildDocument(js_content)
    
    // 3. Convert to buffer
    const buffer = await Packer.toBuffer(doc)
    
    // 4. Write to file
    const filename = `Raghav_Mehta_Resume_${company_name}_2025.docx`
    fs.writeFileSync(`/mnt/user-data/outputs/${filename}`, buffer)
    
    // 5. Convert to PDF
    await this.convertToPDF(filename)
    
    return buffer
  }
  
  private async convertToPDF(docx_filename: string): Promise<void> {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execPromise = promisify(exec)
    
    await execPromise(
      `cd /mnt/user-data/outputs && ` +
      `soffice --headless --convert-to pdf "${docx_filename}"`
    )
  }
}
```

---

## 🎨 Style Configuration (User's Proven Styles)

### Document Styles Object (DO NOT MODIFY)

```javascript
// User's proven styles - these create perfect 1-page output
const documentStyles = {
  default: {
    document: {
      run: { font: "Arial", size: 20 }  // 10pt body text
    }
  },
  paragraphStyles: [
    {
      id: "Name",
      name: "Name",
      run: { size: 28, bold: true, font: "Arial" },
      paragraph: { 
        spacing: { before: 0, after: 20 }, 
        alignment: AlignmentType.CENTER 
      }
    },
    {
      id: "ContactInfo",
      name: "Contact Info",
      run: { size: 18, font: "Arial" },
      paragraph: { 
        spacing: { before: 0, after: 70 }, 
        alignment: AlignmentType.CENTER 
      }
    },
    {
      id: "SectionHeader",
      name: "Section Header",
      run: { size: 22, bold: true, font: "Arial" },
      paragraph: { 
        spacing: { before: 70, after: 35 },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6
          }
        }
      }
    },
    {
      id: "JobTitle",
      name: "Job Title",
      run: { size: 20, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 60, after: 20 } }
    },
    {
      id: "BodyJustified",
      name: "Body Justified",
      run: { size: 20, font: "Arial" },
      paragraph: { 
        spacing: { before: 0, after: 40 }, 
        alignment: AlignmentType.JUSTIFIED 
      }
    }
  ]
}
```

**Architecture Note:** These styles are **perfectly tuned** - use them exactly as-is.

---

## 🚨 Critical Integration Requirements

### 1. Preserve Exact Formatting

**Requirement:** Generated .docx must be **pixel-perfect** match to user's manual output

**Verification:**
```bash
# Generated resume must pass these checks:
pdfinfo Resume.pdf | grep "Pages:"  # Output: Pages: 1
ls -lh Resume.docx  # Size: 20-40KB typical
```

### 2. Working Directory Structure

```
/home/claude/
├── resume_generator.js           # User's proven script (reference)
├── lib/
│   └── resume/
│       ├── document-generator.ts  # NEW: TypeScript wrapper
│       └── content-mapper.ts      # NEW: LLM → JS mapping
└── node_modules/
    └── docx/                      # npm install docx

/mnt/user-data/outputs/
├── Raghav_Mehta_Resume_[Company]_2025.docx
└── Raghav_Mehta_Resume_[Company]_2025.pdf
```

### 3. PDF Conversion Requirements

```bash
# Must have LibreOffice installed
which soffice  # Should output: /usr/bin/soffice

# Conversion command (user's proven approach)
soffice --headless --convert-to pdf --outdir /mnt/user-data/outputs Resume.docx
```

---

## 📊 Quality Assurance Metrics

### Document Generation Success Criteria

| Metric | Target | Verification Method |
|--------|--------|-------------------|
| **Page count** | Exactly 1 | `pdfinfo Resume.pdf \| grep Pages` |
| **File size** | 20-40KB | `ls -lh Resume.docx` |
| **Font** | Arial throughout | Manual inspection |
| **Alignment** | Justified body text | Manual inspection |
| **Horizontal lines** | Under section headers only | Manual inspection |
| **Spacing** | Consistent per spec | Manual inspection |
| **PDF renders** | No errors | Open in PDF viewer |

---

## 🔄 Migration Path (Manual → Automated)

### Phase 1: Content Mapping (Week 1)

1. LLM generates content in JSON format
2. Create ContentMapper class
3. Map JSON → JavaScript CONTENT object
4. Verify mapping accuracy

### Phase 2: Document Generation (Week 1-2)

1. Wrap user's JavaScript in TypeScript class
2. Import docx library
3. Use exact styles from user's script
4. Test with sample content

### Phase 3: PDF Conversion (Week 2)

1. Automate soffice command execution
2. Add error handling for conversion failures
3. Verify PDF output matches manual output

### Phase 4: End-to-End Testing (Week 2-3)

1. Generate resume for each role type
2. Compare to user's manual output
3. Verify 1-page constraint
4. User acceptance testing

---

## 📚 Technical References

### User's Proven Implementation Files

1. **resume-generation-script.js** - Complete working implementation
2. **resume-generator-readme.md** - User's documentation

**These files are THE reference** - do not deviate from their patterns.

### External Dependencies

1. **docx library** - [Documentation](https://docx.js.org/)
   - Version: Latest stable
   - Installation: `npm install docx`

2. **LibreOffice** - PDF conversion
   - Command: `soffice --headless --convert-to pdf`
   - Fallback: User can manually convert if automation fails

---

## ✅ Architect Review Checklist

Before passing to Dev Agent:

- [ ] Content mapping specification complete
- [ ] User's JavaScript patterns documented
- [ ] Integration architecture defined
- [ ] File system paths verified
- [ ] Style configuration documented (user's exact values)
- [ ] Spacing configuration documented (user's exact values)
- [ ] PDF conversion process defined
- [ ] Quality assurance metrics defined
- [ ] Migration path broken into phases

**Critical:** Dev Agent must use user's proven JavaScript patterns exactly as documented here.

---

## 🚀 Next Step: Dev Agent Implementation

Create implementation plan for Dev Agent with:

1. ContentMapper class (LLM JSON → JavaScript CONTENT)
2. DocumentGenerator class (wrapper around user's proven script)
3. PDF converter (automate soffice command)
4. Integration tests (verify output matches manual)
5. End-to-end workflow (JD → .docx → .pdf)

**Remember:** Keep user's document generation logic UNCHANGED - it works perfectly.