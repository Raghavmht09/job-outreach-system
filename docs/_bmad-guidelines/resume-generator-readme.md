# Resume Generator - Complete Documentation

## 📋 Overview

This system generates ATS-optimized, professionally formatted resumes using Node.js and the `docx` library. All resumes are exactly 1 page, use justified text alignment, and include horizontal lines under section headers (Diksha Dubey formatting style).

---

## 🛠️ Prerequisites

### Required Software
```bash
# Node.js and npm (if not already installed)
sudo apt-get install nodejs npm

# Install docx library
npm install docx

# LibreOffice for PDF conversion
sudo apt-get install libreoffice
```

### Directory Structure
```
/home/claude/                    # Working directory for JavaScript files
/mnt/user-data/outputs/          # Output directory for generated files
```

---

## 🚀 Quick Start

### Step 1: Create Resume Generator Script

Create a file `resume_generator.js` in `/home/claude/`:

```javascript
const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, BorderStyle } = require('docx');
const fs = require('fs');

// Your resume content and configuration here
// (See template file for complete structure)

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/Resume.docx", buffer);
  console.log("Resume created successfully!");
});
```

### Step 2: Generate DOCX

```bash
cd /home/claude
node resume_generator.js
```

### Step 3: Convert to PDF

```bash
cd /mnt/user-data/outputs
soffice --headless --convert-to pdf Resume.docx
```

### Step 4: Verify Page Count

```bash
pdfinfo Resume.pdf | grep "Pages:"
# Should output: Pages: 1
```

---

## 📐 Formatting Specifications

### Font & Sizing
- **Font**: Arial throughout
- **Name**: 28pt (14pt actual)
- **Contact Info**: 18pt (9pt actual)  
- **Section Headers**: 22pt (11pt actual)
- **Body Text**: 20pt (10pt actual)

*Note: docx library uses half-points, so multiply by 2*

### Spacing (in points)
```javascript
spacing: {
  sectionHeaderBefore: 70,    // Space before section header
  sectionHeaderAfter: 35,     // Space after section header
  jobTitleBefore: 60,         // Space before job title
  jobTitleAfter: 20,          // Space after job title
  bulletAfter: 25,            // Space after regular bullet
  bulletAfterLast: 35,        // Space after last bullet in section
  paragraphAfter: 40          // Space after paragraph
}
```

### Margins
- **All sides**: 0.5 inch (720 twips)
- 1 inch = 1440 twips

### Text Alignment
- **Body text**: Justified (`AlignmentType.JUSTIFIED`)
- **Headers**: Left aligned
- **Name & Contact**: Center aligned

### Horizontal Lines
- **Location**: Under section headers ONLY (not under job titles)
- **Style**: Single line, 6pt size
- **Implementation**:
```javascript
border: {
  bottom: {
    color: "000000",
    space: 1,
    style: BorderStyle.SINGLE,
    size: 6
  }
}
```

---

## 🎯 Content Structure

### 1. Header Section
```javascript
// Name
new Paragraph({
  style: "Name",
  children: [
    new TextRun({ text: "RAGHAV MEHTA", bold: true, size: 28 })
  ]
}),

// Contact Info
new Paragraph({
  style: "ContactInfo",
  children: [
    new TextRun({ 
      text: "Bangalore, India | +91 70152 79802 | ...", 
      size: 18 
    })
  ]
})
```

### 2. Professional Summary
```javascript
new Paragraph({
  style: "SectionHeader",
  children: [new TextRun("PROFESSIONAL SUMMARY")]
}),
new Paragraph({
  style: "BodyJustified",
  children: [new TextRun("Product Manager with 4.5+ years...")]
})
```

### 3. Technical Skills
```javascript
// Category with bold title
new Paragraph({
  style: "SkillsText",
  spacing: { before: 0, after: 30 },
  children: [
    new TextRun({ text: "Category Name: ", bold: true }),
    new TextRun("Skill 1, Skill 2, Skill 3...")
  ]
})
```

### 4. Professional Experience
```javascript
// Company Header
new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 0, after: 0 },
  children: [
    new TextRun({ text: "Increff – Bengaluru, India", bold: true, size: 20 })
  ]
}),

// Job Title
new Paragraph({
  style: "JobTitle",
  spacing: { before: 20, after: 20 },
  children: [new TextRun("Product Manager - 2 | 2024 - Present")]
}),

// Bullet Points
new Paragraph({
  numbering: { reference: "bullet-list", level: 0 },
  spacing: { before: 0, after: 25 },
  alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun("Bullet point content...")]
})
```

---

## 🔧 Common Customizations

### Adding a New Skills Category
```javascript
new Paragraph({
  style: "SkillsText",
  spacing: { before: 0, after: 30 },
  children: [
    new TextRun({ text: "New Category: ", bold: true }),
    new TextRun("Skill A, Skill B, Skill C")
  ]
})
```

### Adding a New Bullet Point
```javascript
new Paragraph({
  numbering: { reference: "bullet-list", level: 0 },
  spacing: { before: 0, after: 25 },
  alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun("New bullet point text")]
})
```

### Changing Last Bullet Spacing
```javascript
// Last bullet in a section should have after: 35
spacing: { before: 0, after: 35 }
```

---

## 📊 Role-Specific Skill Categories

### Technical PM Roles
```javascript
skills: {
  category1: "Platform & Technical Architecture",
  category2: "Cloud & SaaS",
  category3: "AI & GenAI",
  category4: "Product Management"
}
```

### Growth PM Roles
```javascript
skills: {
  category1: "Growth & Experimentation",
  category2: "User-Centered Design",
  category3: "Product Management",
  category4: "Key Metrics"
}
```

### UX-Focused Roles
```javascript
skills: {
  category1: "UX/UI & Design",
  category2: "AI & Automation",
  category3: "Product Management",
  category4: "Technical Collaboration"
}
```

### Business Platform Roles
```javascript
skills: {
  category1: "Business Platform & Finance",
  category2: "Enterprise SaaS & Cloud",
  category3: "Product Management",
  category4: "Key Metrics"
}
```

---

## 🐛 Troubleshooting

### Resume is 2 Pages

**Problem**: Content exceeds 1 page

**Solutions**:
1. Reduce number of bullets (PM-2: 2-3, APM: 2, Team Lead: 1)
2. Condense bullet text (combine related achievements)
3. Reduce skills category count (max 5 including Key Metrics)
4. Check spacing values aren't too large

### Horizontal Lines Missing

**Problem**: Section headers don't have underlines

**Solution**: Ensure border styling is in "SectionHeader" style:
```javascript
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

### Text Not Justified

**Problem**: Body text appears left-aligned

**Solution**: Ensure paragraphs use `AlignmentType.JUSTIFIED`:
```javascript
new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun("Text here")]
})
```

### PDF Conversion Fails

**Problem**: `soffice: command not found`

**Solution**: Install LibreOffice:
```bash
sudo apt-get update
sudo apt-get install libreoffice
```

### Module Not Found

**Problem**: `Cannot find module 'docx'`

**Solution**: Install docx in working directory:
```bash
cd /home/claude
npm install docx
```

---

## ✅ Quality Checklist

Before finalizing any resume, verify:

- [ ] Exactly 1 page (check with `pdfinfo`)
- [ ] Contact info correct (Bangalore, correct LinkedIn)
- [ ] Horizontal lines under section headers only
- [ ] All body text is justified
- [ ] Spacing consistent throughout
- [ ] All metrics verified against base resume
- [ ] No false claims or unverified data
- [ ] Team sizes accurate (20 engineers)
- [ ] Platform names correct (ICC, WMS 2.0, not generic)
- [ ] Both .docx and .pdf files generated
- [ ] Professional appearance when viewed

---

## 📝 File Naming Convention

```
Raghav_Mehta_Resume_[COMPANY_NAME]_2025.docx
Raghav_Mehta_Resume_[COMPANY_NAME]_2025.pdf
```

Examples:
- `Raghav_Mehta_Resume_Google_Cloud_2025.docx`
- `Raghav_Mehta_Resume_Uber_KWM_2025.docx`
- `Raghav_Mehta_Resume_Fello_2025.docx`

---

## 🎨 Preview Generation (Optional)

To create a preview image:

```bash
cd /mnt/user-data/outputs
pdftoppm -jpeg -r 150 -singlefile Resume.pdf preview
```

This creates `preview.jpg` for visual verification.

---

## 📦 Complete Workflow Script

```bash
#!/bin/bash
# Complete resume generation workflow

# Step 1: Generate DOCX
cd /home/claude
node resume_generator.js

# Step 2: Convert to PDF
cd /mnt/user-data/outputs
soffice --headless --convert-to pdf Resume.docx

# Step 3: Verify
pdfinfo Resume.pdf | grep "Pages:"

# Step 4: Create preview (optional)
pdftoppm -jpeg -r 150 -singlefile Resume.pdf preview

echo "Resume generation complete!"
```

---

## 🔍 Debugging Tips

### Check Generated Content
```bash
# View docx structure (requires unzip)
unzip -l Resume.docx

# Check file size
ls -lh Resume.docx
# Should be 20-40KB typically
```

### Verify Styles
If formatting looks wrong, check:
1. Style IDs match paragraph references
2. Font names are correct ("Arial")
3. Size values are in half-points (20 = 10pt)
4. Spacing values are reasonable

### Test Individual Sections
Comment out sections to identify what's causing page overflow:
```javascript
// Comment out to test
// ...experience section...
```

---

## 📚 Additional Resources

### docx Library Documentation
- [Official Docs](https://docx.js.org/)
- [GitHub](https://github.com/dolanmiu/docx)

### LibreOffice CLI
- [Headless Conversion](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html)

---

## ⚠️ Important Notes

1. **Always verify metrics**: Every number must be from base resume
2. **Team size is 20 engineers**: Not 8, not 15 - exactly 20
3. **Platforms**: ICC iPaaS, WMS 2.0, OMS (not generic names)
4. **Location**: Bangalore, India (not Pimpri)
5. **LinkedIn**: linkedin.com/in/raghav-mehta-product
6. **One page only**: Non-negotiable requirement

---

## 🆘 Support

If you encounter issues:

1. Check this documentation first
2. Verify prerequisites are installed
3. Review troubleshooting section
4. Check file permissions in output directory
5. Verify Node.js version (should be 14+)

---

**Last Updated**: January 2025
**Version**: 1.0