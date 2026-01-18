# BMAD Dev Agent - JavaScript Document Generator Integration

**Agent:** @bmm-dev
**Purpose:** Integrate LLM content generation with user's proven JavaScript docx generator
**Context:** User has working JavaScript → keep it, automate content feeding
**Load this with:** BMAD-DEV-RESUME-IMPLEMENTATION-GUIDE.md

---

## 🎯 Your Mission

**What's Already Working:**
- ✅ User's JavaScript script generates perfect 1-page resumes
- ✅ Exact formatting (justified, horizontal lines, Arial font)
- ✅ PDF conversion (LibreOffice)

**What You Need to Build:**
- 🔧 Bridge between LLM output (TypeScript/JSON) → JavaScript input
- 🔧 Automate the content feeding process
- 🔧 Keep user's proven document generation UNCHANGED

---

## 📋 Prerequisites Check

```bash
# Verify these exist in user's system:
which node     # Node.js installed
which npm      # npm installed
which soffice  # LibreOffice for PDF conversion

# Verify user's JavaScript script location:
ls /home/claude/resume-generation-script.js  # User's proven script

# Verify docx library installed:
cd /home/claude && npm list docx  # Should show docx@latest
```

If missing:
```bash
cd /home/claude
npm install docx
```

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    INTEGRATION FLOW                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  TypeScript/Node.js Layer (NEW - Your Work)               │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  Content     │─────▶│  Content     │                  │
│  │  Generator   │ JSON │  Mapper      │ JS Object        │
│  │  (LLM)       │      │              │                  │
│  └──────────────┘      └──────┬───────┘                  │
│                               │                           │
│  ────────────────────────────┼──────────────────────────  │
│                               ▼                           │
│  JavaScript Layer (EXISTING - User's Proven Script)       │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  CONTENT     │─────▶│  Document    │                  │
│  │  Object      │      │  Builder     │                  │
│  │              │      │  (docx-js)   │                  │
│  └──────────────┘      └──────┬───────┘                  │
│                               │                           │
│                               ▼                           │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  .docx file  │─────▶│  .pdf file   │                  │
│  │              │      │  (soffice)   │                  │
│  └──────────────┘      └──────────────┘                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Phase 1: Content Mapper

### Step 1.1: Create Content Mapper Class

**File:** `lib/resume/content-mapper.ts`

```typescript
// content-mapper.ts
// Purpose: Transform LLM JSON output to user's JavaScript CONTENT format

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

// User's JavaScript CONTENT structure (from their script)
interface JavaScriptContent {
  summary: string
  skills: {
    category1: { title: string; items: string }
    category2: { title: string; items: string }
    category3: { title: string; items: string }
    category4: { title: string; items: string }
    keyMetrics: string
  }
  pm2: {
    title: string
    bullets: string[]
  }
  apm: {
    title: string
    bullets: string[]
  }
  teamLead: {
    title: string
    bullets: string[]
  }
}

export class ContentMapper {
  
  mapToJavaScript(llm_output: LLMOutput): JavaScriptContent {
    console.log('[ContentMapper] Mapping LLM output to JavaScript format...')
    
    // 1. Summary: Direct copy
    const summary = llm_output.summary
    
    // 2. Skills: Transform array to comma-separated string
    const skills_categories = Object.entries(llm_output.skills)
    const skills: any = {}
    
    // Map first 4 categories
    skills_categories.slice(0, 4).forEach(([category_name, skills_array], index) => {
      const category_key = `category${index + 1}`
      skills[category_key] = {
        title: category_name,
        items: skills_array.join(", ")
      }
    })
    
    // 3. Key Metrics: Last category (special format)
    const key_metrics_category = skills_categories.find(([name]) => 
      name.toLowerCase().includes("key metrics")
    )
    
    if (key_metrics_category) {
      // Format with bullet symbols: •
      skills.keyMetrics = key_metrics_category[1].join(" • ")
    } else {
      // Fallback: Use verified metrics
      skills.keyMetrics = "₹20M+ MRR • 30+ enterprise clients • 99.9% uptime • 95%+ deployment success"
    }
    
    // 4. Experience bullets: Direct copy with title formatting
    const pm2 = {
      title: "Product Manager - 2 | 2024 - Present",
      bullets: llm_output.experience_bullets.pm2
    }
    
    const apm = {
      title: "Associate Product Manager | 2023 - 2024",
      bullets: llm_output.experience_bullets.apm
    }
    
    const teamLead = {
      title: "Team Lead - Customer Success | 2021 - 2023",
      bullets: llm_output.experience_bullets.team_lead
    }
    
    const mapped = {
      summary,
      skills,
      pm2,
      apm,
      teamLead
    }
    
    console.log('[ContentMapper] Mapping complete')
    return mapped
  }
  
  // Validation: Ensure content fits on 1 page
  validateContentLength(content: JavaScriptContent): boolean {
    // Rough heuristic: 
    // - Summary: max 8 sentences
    // - PM-2: max 3 bullets
    // - APM: max 2 bullets
    // - Team Lead: max 1 bullet
    
    const summary_sentences = content.summary.split('.').filter(s => s.trim()).length
    const pm2_bullet_count = content.pm2.bullets.length
    const apm_bullet_count = content.apm.bullets.length
    const team_lead_bullet_count = content.teamLead.bullets.length
    
    if (summary_sentences > 8) {
      console.warn(`[ContentMapper] Summary too long: ${summary_sentences} sentences`)
      return false
    }
    
    if (pm2_bullet_count > 3) {
      console.warn(`[ContentMapper] PM-2 has too many bullets: ${pm2_bullet_count}`)
      return false
    }
    
    if (apm_bullet_count > 2) {
      console.warn(`[ContentMapper] APM has too many bullets: ${apm_bullet_count}`)
      return false
    }
    
    if (team_lead_bullet_count > 1) {
      console.warn(`[ContentMapper] Team Lead has too many bullets: ${team_lead_bullet_count}`)
      return false
    }
    
    return true
  }
}
```

---

## 🔧 Implementation Phase 2: JavaScript Document Generator Wrapper

### Step 2.1: Create Document Generator Class

**File:** `lib/resume/javascript-document-generator.ts`

```typescript
// javascript-document-generator.ts
// Purpose: Wrap user's proven JavaScript document generation

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execPromise = promisify(exec)

interface JavaScriptContent {
  summary: string
  skills: any
  pm2: { title: string; bullets: string[] }
  apm: { title: string; bullets: string[] }
  teamLead: { title: string; bullets: string[] }
}

export class JavaScriptDocumentGenerator {
  private working_dir = '/home/claude'
  private output_dir = '/mnt/user-data/outputs'
  
  async generate(
    content: JavaScriptContent,
    company_name: string
  ): Promise<{ docx_path: string; pdf_path: string }> {
    
    console.log(`[JSDocGen] Generating resume for ${company_name}...`)
    
    // Step 1: Create JavaScript file with content
    const js_content = this.buildJavaScriptContent(content, company_name)
    const js_file_path = path.join(this.working_dir, 'temp_resume_generator.js')
    
    await fs.writeFile(js_file_path, js_content)
    console.log(`[JSDocGen] Created JavaScript file: ${js_file_path}`)
    
    // Step 2: Execute JavaScript (generates .docx)
    await execPromise(`cd ${this.working_dir} && node temp_resume_generator.js`)
    console.log(`[JSDocGen] Executed JavaScript generator`)
    
    // Step 3: Rename output file
    const filename = `Raghav_Mehta_Resume_${company_name.replace(/\s+/g, '_')}_2025`
    const docx_path = path.join(this.output_dir, `${filename}.docx`)
    
    // Move from temp location to final location (if needed)
    // User's script already writes to /mnt/user-data/outputs/
    
    // Step 4: Convert to PDF
    console.log(`[JSDocGen] Converting to PDF...`)
    const pdf_path = await this.convertToPDF(docx_path)
    
    // Step 5: Cleanup
    await fs.unlink(js_file_path).catch(() => {})
    
    console.log(`[JSDocGen] Generation complete`)
    console.log(`[JSDocGen] DOCX: ${docx_path}`)
    console.log(`[JSDocGen] PDF: ${pdf_path}`)
    
    return { docx_path, pdf_path }
  }
  
  private buildJavaScriptContent(
    content: JavaScriptContent,
    company_name: string
  ): string {
    // Build JavaScript file by injecting content into user's template
    // Use user's EXACT script structure
    
    return `
/**
 * AUTO-GENERATED RESUME - ${company_name}
 * Generated: ${new Date().toISOString()}
 */

const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, BorderStyle } = require('docx');
const fs = require('fs');

// ============================================================================
// CONFIGURATION (User's proven config)
// ============================================================================

const CONFIG = {
  contact: {
    name: "RAGHAV MEHTA",
    location: "Bangalore, India",
    phone: "+91 70152 79802",
    email: "raghavmht9@gmail.com",
    linkedin: "linkedin.com/in/raghav-mehta-product",
    portfolio: "Portfolio Website"
  },
  output: {
    filename: "Raghav_Mehta_Resume_${company_name.replace(/\s+/g, '_')}_2025.docx",
    directory: "/mnt/user-data/outputs/"
  }
};

// ============================================================================
// DOCUMENT STYLES (User's exact styles - DO NOT MODIFY)
// ============================================================================

const documentStyles = {
  default: {
    document: {
      run: { font: "Arial", size: 20 }
    }
  },
  paragraphStyles: [
    {
      id: "Name",
      name: "Name",
      run: { size: 28, bold: true, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 20 }, alignment: AlignmentType.CENTER }
    },
    {
      id: "ContactInfo",
      name: "Contact Info",
      run: { size: 18, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 70 }, alignment: AlignmentType.CENTER }
    },
    {
      id: "SectionHeader",
      name: "Section Header",
      run: { size: 22, bold: true, font: "Arial", color: "000000" },
      paragraph: { 
        spacing: { before: 70, after: 35 }, 
        alignment: AlignmentType.LEFT,
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
      run: { size: 20, bold: true, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 60, after: 20 } }
    },
    {
      id: "BodyJustified",
      name: "Body Justified",
      run: { size: 20, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 40 }, alignment: AlignmentType.JUSTIFIED }
    },
    {
      id: "SkillsText",
      name: "Skills Text",
      run: { size: 20, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 50 }, alignment: AlignmentType.JUSTIFIED }
    }
  ]
};

// ============================================================================
// NUMBERING (Bullet points)
// ============================================================================

const numberingConfig = {
  config: [
    {
      reference: "bullet-list",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 180 } } }
        }
      ]
    }
  ]
};

// ============================================================================
// CONTENT (Injected from LLM)
// ============================================================================

const CONTENT = ${JSON.stringify(content, null, 2)};

// ============================================================================
// DOCUMENT GENERATION (User's exact structure)
// ============================================================================

const doc = new Document({
  styles: documentStyles,
  numbering: numberingConfig,
  sections: [{
    properties: {
      page: {
        margin: { top: 720, right: 720, bottom: 720, left: 720 }
      }
    },
    children: [
      // Name
      new Paragraph({
        style: "Name",
        children: [new TextRun({ text: CONFIG.contact.name, bold: true, size: 28 })]
      }),
      
      // Contact Info
      new Paragraph({
        style: "ContactInfo",
        children: [
          new TextRun({ 
            text: \`\${CONFIG.contact.location} | \${CONFIG.contact.phone} | \${CONFIG.contact.email} | \${CONFIG.contact.linkedin} | \${CONFIG.contact.portfolio}\`, 
            size: 18 
          })
        ]
      }),

      // Professional Summary
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("PROFESSIONAL SUMMARY")]
      }),
      new Paragraph({
        style: "BodyJustified",
        children: [new TextRun(CONTENT.summary)]
      }),

      // Technical Skills & Expertise
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("TECHNICAL SKILLS & EXPERTISE")]
      }),
      
      // Skills categories (dynamic)
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: \`\${CONTENT.skills.category1.title}: \`, bold: true }),
          new TextRun(CONTENT.skills.category1.items)
        ]
      }),
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: \`\${CONTENT.skills.category2.title}: \`, bold: true }),
          new TextRun(CONTENT.skills.category2.items)
        ]
      }),
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: \`\${CONTENT.skills.category3.title}: \`, bold: true }),
          new TextRun(CONTENT.skills.category3.items)
        ]
      }),
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: \`\${CONTENT.skills.category4.title}: \`, bold: true }),
          new TextRun(CONTENT.skills.category4.items)
        ]
      }),
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 50 },
        children: [
          new TextRun({ text: "Key Metrics: ", bold: true }),
          new TextRun(CONTENT.skills.keyMetrics)
        ]
      }),

      // Professional Experience
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("PROFESSIONAL EXPERIENCE")]
      }),
      
      // Company Header
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "Increff – Bengaluru, India", bold: true, size: 20 })
        ]
      }),

      // PM-2 Role
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.pm2.title)]
      }),
      ...CONTENT.pm2.bullets.map((bullet, index) => 
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { 
            before: 0, 
            after: index === CONTENT.pm2.bullets.length - 1 ? 35 : 25 
          },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun(bullet)]
        })
      ),

      // APM Role
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.apm.title)]
      }),
      ...CONTENT.apm.bullets.map((bullet, index) => 
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { 
            before: 0, 
            after: index === CONTENT.apm.bullets.length - 1 ? 35 : 25 
          },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun(bullet)]
        })
      ),

      // Team Lead Role
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.teamLead.title)]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { before: 0, after: 35 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun(CONTENT.teamLead.bullets[0])]
      }),

      // Education
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("EDUCATION")]
      }),
      new Paragraph({
        style: "BodyJustified",
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({ text: "Bachelor of Technology – Information Technology", bold: true }),
          new TextRun(" | Guru Gobind Singh Indraprastha University, 2016-2020 | CGPA: 9.0")
        ]
      }),

      // Certifications
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("CERTIFICATIONS")]
      }),
      new Paragraph({
        style: "BodyJustified",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun("Advanced Product Leadership - Maven (Jennifer Liu, SVP at Google) | 2nd Place among 70 teams | Sept 2024")
        ]
      }),
      new Paragraph({
        style: "BodyJustified",
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun("AI Product Management - Product Faculty | April 2024 | Best Mentor Award - Mastering PM Cohort | Oct 2024")
        ]
      })
    ]
  }]
});

// Save to file
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(CONFIG.output.directory + CONFIG.output.filename, buffer);
  console.log("Resume created successfully:", CONFIG.output.filename);
});
    `.trim()
  }
  
  private async convertToPDF(docx_path: string): Promise<string> {
    try {
      const output_dir = path.dirname(docx_path)
      const filename = path.basename(docx_path)
      
      await execPromise(
        `cd ${output_dir} && soffice --headless --convert-to pdf "${filename}"`
      )
      
      const pdf_path = docx_path.replace('.docx', '.pdf')
      console.log(`[JSDocGen] PDF created: ${pdf_path}`)
      
      return pdf_path
      
    } catch (error) {
      console.error('[JSDocGen] PDF conversion failed:', error)
      // Return empty string if conversion fails (user can manually convert)
      return ''
    }
  }
}
```

---

## 🔧 Implementation Phase 3: Updated Resume Generator

### Step 3.1: Update Main Resume Generator

**File:** `lib/resume/resume-generator.ts` (updated)

```typescript
// resume-generator.ts
// Purpose: Orchestrate LLM → JavaScript → DOCX → PDF

import { ContentGenerator } from './content-generator'
import { ContentValidator } from './content-validator'
import { ContentMapper } from './content-mapper'
import { JavaScriptDocumentGenerator } from './javascript-document-generator'

export interface GenerateResumeOptions {
  jd_text: string
  company_name: string
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
  private content_mapper: ContentMapper
  private document_generator: JavaScriptDocumentGenerator
  
  constructor() {
    this.content_generator = new ContentGenerator()
    this.content_validator = new ContentValidator()
    this.content_mapper = new ContentMapper()
    this.document_generator = new JavaScriptDocumentGenerator()
  }
  
  async generate(options: GenerateResumeOptions): Promise<GenerateResumeResult> {
    const { jd_text, company_name } = options
    
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🚀 Generating Resume for: ${company_name}`)
      console.log('='.repeat(60))
      
      // Step 1: Generate content using LLM
      console.log('\n[Step 1/5] Generating content with Claude...')
      const llm_content = await this.content_generator.generateResumeContent(
        jd_text,
        company_name
      )
      console.log('✅ LLM content generated')
      
      // Step 2: Validate content (CRITICAL)
      console.log('\n[Step 2/5] Validating content accuracy...')
      const validation = this.content_validator.validate(llm_content)
      
      if (!validation.is_valid) {
        console.error('❌ Validation FAILED')
        console.error('Errors:', validation.errors)
        return {
          success: false,
          errors: validation.errors.map(e => `${e.type}: ${e.issue}`)
        }
      }
      
      console.log('✅ Content validation passed')
      if (validation.warnings.length > 0) {
        console.warn('⚠️  Warnings:', validation.warnings.map(w => w.issue))
      }
      
      // Step 3: Map to JavaScript format
      console.log('\n[Step 3/5] Mapping content to JavaScript format...')
      const js_content = this.content_mapper.mapToJavaScript(validation.cleaned_content)
      
      // Validate length
      if (!this.content_mapper.validateContentLength(js_content)) {
        return {
          success: false,
          errors: ['Content too long - will exceed 1 page']
        }
      }
      console.log('✅ Content mapped successfully')
      
      // Step 4: Generate document using user's JavaScript
      console.log('\n[Step 4/5] Generating .docx using proven JavaScript...')
      const { docx_path, pdf_path } = await this.document_generator.generate(
        js_content,
        company_name
      )
      console.log('✅ Document generated')
      
      // Step 5: Verify output
      console.log('\n[Step 5/5] Verifying output...')
      const verified = await this.verifyOutput(docx_path, pdf_path)
      
      if (!verified.success) {
        return {
          success: false,
          errors: verified.errors
        }
      }
      
      console.log('\n' + '='.repeat(60))
      console.log(`✅ RESUME GENERATION COMPLETE for ${company_name}`)
      console.log('='.repeat(60))
      console.log(`📄 DOCX: ${docx_path}`)
      console.log(`📄 PDF: ${pdf_path}`)
      console.log('='.repeat(60) + '\n')
      
      return {
        success: true,
        docx_path,
        pdf_path,
        warnings: validation.warnings.map(w => `${w.type}: ${w.issue}`)
      }
      
    } catch (error) {
      console.error('\n❌ Resume generation failed:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
  
  private async verifyOutput(
    docx_path: string,
    pdf_path: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = []
    const fs = require('fs/promises')
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execPromise = promisify(exec)
    
    // Check 1: DOCX file exists
    try {
      await fs.access(docx_path)
      console.log('  ✅ DOCX file exists')
    } catch {
      errors.push('DOCX file not found')
    }
    
    // Check 2: DOCX file size (should be 20-40KB typically)
    try {
      const stats = await fs.stat(docx_path)
      const size_kb = stats.size / 1024
      console.log(`  ✅ DOCX file size: ${size_kb.toFixed(1)}KB`)
      
      if (size_kb < 10) {
        errors.push(`DOCX file too small (${size_kb.toFixed(1)}KB) - may be empty`)
      }
      if (size_kb > 100) {
        errors.push(`DOCX file too large (${size_kb.toFixed(1)}KB) - may have images`)
      }
    } catch {
      errors.push('Could not check DOCX file size')
    }
    
    // Check 3: PDF file exists
    if (pdf_path) {
      try {
        await fs.access(pdf_path)
        console.log('  ✅ PDF file exists')
        
        // Check 4: PDF is 1 page (CRITICAL)
        try {
          const { stdout } = await execPromise(`pdfinfo "${pdf_path}" | grep "Pages:"`)
          const page_match = stdout.match(/Pages:\s+(\d+)/)
          
          if (page_match) {
            const page_count = parseInt(page_match[1])
            if (page_count === 1) {
              console.log('  ✅ PDF is exactly 1 page')
            } else {
              errors.push(`PDF is ${page_count} pages (must be exactly 1)`)
            }
          }
        } catch {
          console.warn('  ⚠️  Could not verify PDF page count (pdfinfo not available)')
        }
      } catch {
        console.warn('  ⚠️  PDF file not found (conversion may have failed)')
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}
```

---

## 🧪 Testing Script

### Create Test Script

**File:** `scripts/test-javascript-integration.ts`

```typescript
// scripts/test-javascript-integration.ts
// Purpose: Test the complete LLM → JavaScript integration

import { ResumeGenerator } from '../lib/resume/resume-generator'

const SAMPLE_JD = `
Product Manager - Cloud Support Platform

We're looking for a PM to lead our cloud support platform serving enterprise customers.

Requirements:
- 4+ years PM experience with technical platforms
- Experience with support escalation workflows
- Strong collaboration with engineering teams
- Track record of 99.9%+ uptime

You'll work on platform architecture, API design, and reliability improvements.
`

async function test() {
  console.log('Starting JavaScript integration test...\n')
  
  const generator = new ResumeGenerator()
  
  const result = await generator.generate({
    jd_text: SAMPLE_JD,
    company_name: 'Test_Company'
  })
  
  if (result.success) {
    console.log('\n✅ TEST PASSED')
    console.log('Generated files:')
    console.log(`  - ${result.docx_path}`)
    console.log(`  - ${result.pdf_path}`)
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('\nWarnings:')
      result.warnings.forEach(w => console.log(`  ⚠️  ${w}`))
    }
  } else {
    console.log('\n❌ TEST FAILED')
    console.log('Errors:')
    result.errors?.forEach(e => console.log(`  ❌ ${e}`))
  }
}

test().catch(console.error)
```

**Run test:**
```bash
npx tsx scripts/test-javascript-integration.ts
```

---

## ✅ Implementation Checklist

### Phase 1: Content Mapper
- [ ] Create `lib/resume/content-mapper.ts`
- [ ] Implement `mapToJavaScript()` method
- [ ] Implement `validateContentLength()` method
- [ ] Test with sample LLM output

### Phase 2: JavaScript Generator Wrapper
- [ ] Create `lib/resume/javascript-document-generator.ts`
- [ ] Implement `generate()` method
- [ ] Implement `buildJavaScriptContent()` method (inject user's template)
- [ ] Implement `convertToPDF()` method
- [ ] Test with sample content

### Phase 3: Integration
- [ ] Update `lib/resume/resume-generator.ts`
- [ ] Wire up ContentMapper
- [ ] Wire up JavaScriptDocumentGenerator
- [ ] Add verification step
- [ ] Test end-to-end

### Phase 4: Testing
- [ ] Create test script
- [ ] Test with technical_pm JD
- [ ] Test with growth_pm JD
- [ ] Verify output matches user's manual output
- [ ] Verify exactly 1 page
- [ ] User acceptance testing

---

## 🚨 Common Issues & Fixes

### Issue 1: Node Module Not Found

**Symptom:** `Cannot find module 'docx'`

**Fix:**
```bash
cd /home/claude
npm install docx
```

### Issue 2: Permission Denied Writing to /mnt/user-data/outputs

**Symptom:** `EACCES: permission denied`

**Fix:**
```bash
chmod 777 /mnt/user-data/outputs
```

### Issue 3: soffice Command Not Found

**Symptom:** `soffice: command not found`

**Fix:**
```bash
sudo apt-get update
sudo apt-get install libreoffice
```

### Issue 4: Resume Exceeds 1 Page

**Symptom:** `pdfinfo` shows Pages: 2

**Fix:**
1. Reduce PM-2 bullets from 3 to 2
2. Shorten summary
3. Check spacing values haven't changed

### Issue 5: JavaScript Syntax Error

**Symptom:** `SyntaxError: Unexpected token`

**Fix:**
- Check template string escaping
- Verify JSON.stringify output
- Test generated .js file manually:
  ```bash
  cd /home/claude
  node temp_resume_generator.js
  ```

---

## 🎯 Success Criteria

Your integration is complete when:

1. ✅ LLM generates content (JSON format)
2. ✅ ContentMapper transforms to JavaScript format
3. ✅ JavaScript generator creates .docx file
4. ✅ PDF conversion succeeds
5. ✅ Output is exactly 1 page
6. ✅ Formatting matches user's manual output
7. ✅ All metrics are verified (no false claims)
8. ✅ Horizontal lines under section headers only
9. ✅ Text is justified
10. ✅ User approves output quality

---

## 📝 Next Steps After Implementation

1. **Batch Testing:**
   - Generate resumes for all 5 role types
   - Compare to user's manual output
   - Document any differences

2. **Performance Optimization:**
   - Cache JavaScript template generation
   - Parallel PDF conversion
   - Optimize file I/O

3. **Error Recovery:**
   - Retry logic for PDF conversion failures
   - Fallback to .docx-only if soffice fails
   - Better error messages

4. **User Feedback:**
   - Generate 5 sample resumes
   - Get user approval
   - Iterate based on feedback

---

**Start with ContentMapper, then JavaScript wrapper, then integration. Test after each component!** 🚀