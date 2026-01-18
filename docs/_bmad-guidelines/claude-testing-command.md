# 🚀 PASTE THIS INTO CLAUDE CODE (Testing Phase)

Copy everything below and paste into Claude Code:

---

```
Load context from:
- docs/_bmad-guidelines/CLAUDE-CODE-TESTING-PROMPT.md
- docs/_bmad-guidelines/BMAD-DEV-JAVASCRIPT-INTEGRATION-GUIDE.md
- LLM-as-Judge report : _bmad-output/implementation-artifacts/LLM-JUDGE-FINAL-VALIDATION.md

# CONTEXT
✅ All 8 phases COMPLETE
✅ LLM-as-Judge score: 98/100
✅ Status: APPROVED FOR TESTING
✅ Implementation by Cursor agents finished

Current files:
frontend/lib/resume/
├── verified-metrics.ts              ✅ Complete
├── role-configs.ts                  ✅ Complete
├── system-prompt.ts                 ✅ Complete
├── content-generator.ts             ✅ Fixed
├── content-validator.ts             ✅ Fixed
├── content-mapper.ts                ✅ Complete
├── javascript-document-generator.ts ✅ Complete
├── resume-generator.ts              ✅ Complete
├── config.ts                        ✅ Complete
└── index.ts                         ✅ Complete

# YOUR MISSION: TESTING & VALIDATION

## Step 1: Validate Installation (START HERE)

Check docx package:
```bash
cd frontend
npm list docx
```

If missing:
```bash
npm install docx
```

Check environment:
```bash
cat .env.local | grep ANTHROPIC_API_KEY
cat .env.local | grep RESUME
```

Start server:
```bash
npm run dev
```

Expected: Server on http://localhost:3000

## Step 2: Run End-to-End Tests

Test 1: Technical PM Resume
- JD: "Product Manager - Cloud Support Platform. 4+ years experience with technical platforms, support escalation workflows, 99.9%+ uptime. Platform architecture, API design."
- Expected: Resume with Platform & Technical Architecture skills
- Validate: ₹20M+ MRR, 20 engineers, ICC/WMS 2.0, no "35-45%"

Test 2: Growth PM Resume  
- JD: "Growth Product Manager. A/B testing, experimentation, data-driven, user analytics (Mixpal, Amplitude)."
- Expected: Resume with Growth & Experimentation skills (different from Test 1)
- Validate: Same metrics, different emphasis

Test 3: UX PM Resume
- JD: "Product Manager - UX focus. User research, usability testing, design collaboration, user-centered products."
- Expected: Resume with UX/UI & Design skills (different from Tests 1-2)
- Validate: Same metrics, different emphasis

## Step 3: Critical Validations

For EACH test, verify:
✅ File size: 20-40KB
✅ Opens in Word/LibreOffice
✅ Exactly 1 page
✅ Metrics present: ₹20M+ MRR, 20 engineers, 99.9% uptime, 95%+ deployment, ICC, WMS 2.0
✅ NO false claims: No "35-45%", no "~25%", no "15 engineers", no "support platform"
✅ Contact: Bangalore, India
✅ Horizontal lines under section headers only
✅ Text justified

## Step 4: Bug Fixes (If Issues Found)

Issue: "Module not found: docx"
Fix: npm install docx && npm run dev

Issue: "ANTHROPIC_API_KEY not found"
Fix: echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local && npm run dev

Issue: Resume > 1 page
Fix: Check system-prompt.ts, ensure LLM instructed to fit on 1 page

Issue: Unverified metrics appear
Fix: Check content-validator.ts auto-correct enabled

Issue: Generic platform names
Fix: Check content-validator.ts GENERIC_PLATFORM_NAMES

## Step 5: Report Results

After all tests:
✅ All pass → System ready for production
❌ Issues found → Report with examples, fix, re-test

# SUCCESS CRITERIA

- [ ] All 3 test resumes generate successfully
- [ ] Each resume exactly 1 page
- [ ] All metrics verified
- [ ] Team size always 20
- [ ] Platform names specific
- [ ] No errors in console
- [ ] Generation time < 30 seconds

# START COMMAND

cd frontend && npm install docx && npm list docx && npm run dev

Then: Test with Technical PM JD first.
```

---

**COPY EVERYTHING ABOVE ☝️ AND PASTE INTO CLAUDE CODE**

**Then provide the LLM-as-Judge markdown file for full context**