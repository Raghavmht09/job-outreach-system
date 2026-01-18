/**
 * RESUME GENERATOR TEMPLATE
 * ========================
 * Complete JavaScript template using docx-js library for generating ATS-optimized resumes
 * 
 * PREREQUISITES:
 * - Install docx: npm install docx
 * - Working directory: /home/claude/
 * - Output directory: /mnt/user-data/outputs/
 * 
 * USAGE:
 * 1. Customize the content in the sections below
 * 2. Run: node resume_generator.js
 * 3. Convert to PDF: soffice --headless --convert-to pdf [filename].docx
 * 
 * FORMATTING STANDARDS:
 * - Font: Arial
 * - Page length: Exactly 1 page
 * - Margins: 0.5 inch all sides
 * - Text alignment: Justified for body text
 * - Horizontal lines: Under section headers ONLY
 */

const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, BorderStyle } = require('docx');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Contact Information
  contact: {
    name: "RAGHAV MEHTA",
    location: "Bangalore, India",
    phone: "+91 70152 79802",
    email: "raghavmht9@gmail.com",
    linkedin: "linkedin.com/in/raghav-mehta-product",
    portfolio: "Portfolio Website"
  },
  
  // File output
  output: {
    filename: "Raghav_Mehta_Resume_[COMPANY_NAME]_2025.docx",
    directory: "/mnt/user-data/outputs/"
  },
  
  // Spacing configuration (in twips: 1pt = 20 twips)
  spacing: {
    sectionHeaderBefore: 70,  // 70pt = 1400 twips
    sectionHeaderAfter: 35,   // 35pt = 700 twips
    jobTitleBefore: 60,       // 60pt = 1200 twips
    jobTitleAfter: 20,        // 20pt = 400 twips
    bulletAfter: 25,          // 25pt = 500 twips
    bulletAfterLast: 35,      // 35pt = 700 twips
    paragraphAfter: 40        // 40pt = 800 twips
  }
};

// ============================================================================
// DOCUMENT STYLES
// ============================================================================

const documentStyles = {
  default: {
    document: {
      run: { font: "Arial", size: 20 } // 10pt for body text (size in half-points)
    }
  },
  paragraphStyles: [
    {
      id: "Name",
      name: "Name",
      basedOn: "Normal",
      run: { size: 28, bold: true, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 20 }, alignment: AlignmentType.CENTER }
    },
    {
      id: "ContactInfo",
      name: "Contact Info",
      basedOn: "Normal",
      run: { size: 18, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 70 }, alignment: AlignmentType.CENTER }
    },
    {
      id: "SectionHeader",
      name: "Section Header",
      basedOn: "Normal",
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
      basedOn: "Normal",
      run: { size: 20, bold: true, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 60, after: 20 } }
    },
    {
      id: "BodyJustified",
      name: "Body Justified",
      basedOn: "Normal",
      run: { size: 20, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 40 }, alignment: AlignmentType.JUSTIFIED }
    },
    {
      id: "SkillsText",
      name: "Skills Text",
      basedOn: "Normal",
      run: { size: 20, font: "Arial", color: "000000" },
      paragraph: { spacing: { before: 0, after: 50 }, alignment: AlignmentType.JUSTIFIED }
    }
  ]
};

// ============================================================================
// NUMBERING (BULLET POINTS)
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
// CONTENT - CUSTOMIZE THIS SECTION FOR EACH RESUME
// ============================================================================

const CONTENT = {
  // Professional Summary
  summary: `Product Manager with 4.5+ years [CUSTOMIZE: add role-specific context]. Deep expertise in [CUSTOMIZE: key areas]. Successfully [CUSTOMIZE: major achievements]. Seeking to leverage expertise in [CUSTOMIZE: relevant skills] to [CUSTOMIZE: role-specific goal].`,
  
  // Technical Skills - Customize categories based on role
  skills: {
    category1: {
      title: "Category Name 1",
      items: "Skill 1, Skill 2, Skill 3, Skill 4, Skill 5"
    },
    category2: {
      title: "Category Name 2", 
      items: "Skill 1, Skill 2, Skill 3, Skill 4, Skill 5"
    },
    category3: {
      title: "Category Name 3",
      items: "Skill 1, Skill 2, Skill 3, Skill 4, Skill 5"
    },
    category4: {
      title: "Product Management",
      items: "Product strategy & roadmap execution, Stakeholder management, Cross-functional team leadership"
    },
    keyMetrics: "₹20M+ MRR • 30+ enterprise clients • 99.9% uptime • 95%+ deployment success"
  },
  
  // Experience - PM-2 Role
  pm2: {
    title: "Product Manager - 2 | 2024 - Present",
    bullets: [
      "First bullet point with metrics and impact...",
      "Second bullet point with technical details...",
      // Add third bullet if needed
    ]
  },
  
  // Experience - APM Role
  apm: {
    title: "Associate Product Manager | 2023 - 2024",
    bullets: [
      "First bullet point about 0-to-1 launch...",
      "Second bullet point about technical implementation..."
    ]
  },
  
  // Experience - Team Lead Role
  teamLead: {
    title: "Team Lead - Customer Success | 2021 - 2023",
    bullets: [
      "Achievement with retention rate, accounts managed, and portfolio value..."
    ]
  }
};

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

const doc = new Document({
  styles: documentStyles,
  numbering: numberingConfig,
  sections: [{
    properties: {
      page: {
        margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch = 720 twips
      }
    },
    children: [
      // =================================================================
      // HEADER - NAME
      // =================================================================
      new Paragraph({
        style: "Name",
        children: [
          new TextRun({ text: CONFIG.contact.name, bold: true, size: 28 })
        ]
      }),
      
      // =================================================================
      // CONTACT INFORMATION
      // =================================================================
      new Paragraph({
        style: "ContactInfo",
        children: [
          new TextRun({ 
            text: `${CONFIG.contact.location} | ${CONFIG.contact.phone} | ${CONFIG.contact.email} | ${CONFIG.contact.linkedin} | ${CONFIG.contact.portfolio}`, 
            size: 18 
          })
        ]
      }),

      // =================================================================
      // PROFESSIONAL SUMMARY
      // =================================================================
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("PROFESSIONAL SUMMARY")]
      }),
      new Paragraph({
        style: "BodyJustified",
        children: [new TextRun(CONTENT.summary)]
      }),

      // =================================================================
      // TECHNICAL SKILLS & EXPERTISE
      // =================================================================
      new Paragraph({
        style: "SectionHeader",
        children: [new TextRun("TECHNICAL SKILLS & EXPERTISE")]
      }),
      
      // Category 1
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: `${CONTENT.skills.category1.title}: `, bold: true }),
          new TextRun(CONTENT.skills.category1.items)
        ]
      }),
      
      // Category 2
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: `${CONTENT.skills.category2.title}: `, bold: true }),
          new TextRun(CONTENT.skills.category2.items)
        ]
      }),
      
      // Category 3
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: `${CONTENT.skills.category3.title}: `, bold: true }),
          new TextRun(CONTENT.skills.category3.items)
        ]
      }),
      
      // Category 4
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: `${CONTENT.skills.category4.title}: `, bold: true }),
          new TextRun(CONTENT.skills.category4.items)
        ]
      }),
      
      // Key Metrics
      new Paragraph({
        style: "SkillsText",
        spacing: { before: 0, after: 50 },
        children: [
          new TextRun({ text: "Key Metrics: ", bold: true }),
          new TextRun(CONTENT.skills.keyMetrics)
        ]
      }),

      // =================================================================
      // PROFESSIONAL EXPERIENCE
      // =================================================================
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

      // PM-2 Role Title
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.pm2.title)]
      }),

      // PM-2 Bullets
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

      // APM Role Title
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.apm.title)]
      }),

      // APM Bullets
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

      // Team Lead Role Title
      new Paragraph({
        style: "JobTitle",
        spacing: { before: 20, after: 20 },
        children: [new TextRun(CONTENT.teamLead.title)]
      }),

      // Team Lead Bullet
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { before: 0, after: 35 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun(CONTENT.teamLead.bullets[0])]
      }),

      // =================================================================
      // EDUCATION
      // =================================================================
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

      // =================================================================
      // CERTIFICATIONS
      // =================================================================
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