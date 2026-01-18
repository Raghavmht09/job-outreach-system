# Pre-Mortem Analysis: Resume Optimization Workflow
**Date:** January 5, 2026  
**Session:** Sprint 1 QA - Attempt #21+  
**Status:** Pre-deployment review

## Executive Summary
After 20+ manual QA attempts with multiple critical fixes, we're conducting a pre-mortem to identify remaining failure points before the next test.

## Changes Made This Session

### 1. Document Parsing Migration
- **From:** PDF parsing (tried 4 libraries: pdf-parse, pdf.js-extract, pdfjs-dist, pdf2json)
- **To:** DOCX parsing with `mammoth` library
- **Status:** ✅ Working (5,016 characters extracted successfully)
- **Risk:** LOW - DOCX parsing is stable and tested

### 2. AI Model Upgrade
- **From:** Claude 3 Haiku (4,096 max tokens)
- **To:** Claude Sonnet 4 (8,192 max tokens)
- **Reason:** Better quality, more token headroom
- **Status:** ✅ Implemented
- **Risk:** MEDIUM - New model, untested in production

### 3. Timeout Adjustments
- **From:** 15 seconds (all requests)
- **To:** 90 seconds (resume optimization), 30 seconds (other)
- **Reason:** Claude Sonnet 4 needs more time for complex tasks
- **Status:** ✅ Implemented
- **Risk:** LOW - Conservative timeout values

## Potential Failure Points (Pre-Mortem)

### 🔴 HIGH RISK

#### 1. Claude API Rate Limits
**What could go wrong:**
- Anthropic API has rate limits (requests per minute, tokens per minute)
- Multiple retries could trigger rate limiting
- Account could be rate-limited from previous tests

**Symptoms:**
- 429 Too Many Requests error
- "Rate limit exceeded" message

**Mitigation:**
- Check Anthropic dashboard for rate limit status
- Reduce retry attempts from 3 to 2
- Add exponential backoff between retries

**Likelihood:** MEDIUM (30%)

---

#### 2. Claude API Key Invalid/Expired
**What could go wrong:**
- API key could be invalid
- API key could have insufficient credits
- API key could be for wrong model tier

**Symptoms:**
- 401 Unauthorized error
- "Invalid API key" message

**Mitigation:**
- Test API key with simple curl request
- Check Anthropic dashboard for key status
- Verify model access (Sonnet 4 requires specific tier)

**Likelihood:** LOW (10%)

---

#### 3. Supabase Storage Issues
**What could go wrong:**
- Storage bucket doesn't exist
- RLS policies blocking access
- Service role key invalid
- Storage quota exceeded

**Symptoms:**
- "Bucket not found" error
- "Storage upload failed" error
- 403 Forbidden on storage operations

**Mitigation:**
- Verify buckets exist: `resumes`, `optimized-resumes`
- Check RLS policies are disabled for service role
- Verify storage quota

**Likelihood:** LOW (15%)

---

### 🟡 MEDIUM RISK

#### 4. Network Timeout (Despite 90s limit)
**What could go wrong:**
- Claude API genuinely takes >90 seconds
- Network issues causing slow responses
- Claude API experiencing degraded performance

**Symptoms:**
- "Request timeout" error after 90 seconds
- Intermittent failures

**Mitigation:**
- Monitor Claude API status page
- Add user-facing progress indicator
- Consider streaming responses (future enhancement)

**Likelihood:** MEDIUM (25%)

---

#### 5. DOCX File Compatibility
**What could go wrong:**
- User's DOCX has unsupported formatting
- DOCX is password-protected
- DOCX is corrupted
- DOCX is actually a renamed DOC file

**Symptoms:**
- "DOCX parsing failed" error
- Extracted text is garbled
- Empty text extraction

**Mitigation:**
- Add better error messages
- Validate DOCX structure before parsing
- Add file type detection (magic numbers)

**Likelihood:** LOW (10%)

---

#### 6. Claude Response Truncation
**What could go wrong:**
- Claude hits 8,192 token limit mid-response
- Optimized resume is incomplete
- Response is valid but truncated

**Symptoms:**
- Incomplete markdown in output
- Missing sections in optimized resume
- "stop_reason": "max_tokens" in logs

**Mitigation:**
- Monitor stop_reason in logs
- Add warning if truncated
- Consider splitting large resumes

**Likelihood:** MEDIUM (20%)

---

### 🟢 LOW RISK

#### 7. Database Connection Issues
**What could go wrong:**
- Supabase connection pool exhausted
- Database timeout
- RLS policy issues

**Symptoms:**
- "Connection timeout" error
- "Too many connections" error

**Mitigation:**
- Connection pooling is handled by Supabase client
- Service role bypasses RLS

**Likelihood:** VERY LOW (5%)

---

#### 8. Memory Issues (Large Files)
**What could go wrong:**
- Very large DOCX files (>10MB)
- Memory exhaustion during parsing
- Next.js serverless function memory limit

**Symptoms:**
- "Out of memory" error
- Function timeout
- Server crash

**Mitigation:**
- File size limit: 5MB (already implemented)
- Streaming for large files (future)

**Likelihood:** VERY LOW (5%)

---

## Recommended Pre-Test Validation

### 1. Test Claude API Key Directly
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 2. Verify Supabase Storage Access
```bash
# Check if buckets exist
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://[project-ref].supabase.co/storage/v1/bucket
```

### 3. Test DOCX Parsing Independently
```bash
# Create a test script to parse the DOCX file
node -e "
const mammoth = require('mammoth');
const fs = require('fs');
mammoth.extractRawText({path: 'path/to/resume.docx'})
  .then(result => console.log('Extracted:', result.value.length, 'chars'))
  .catch(err => console.error('Error:', err));
"
```

---

## Test Plan for Next Attempt

### Phase 1: Component Testing (5 mins)
1. ✅ Test DOCX upload → Should return 200 with file path
2. ✅ Test job URL extraction → Should return job description
3. ✅ Test Claude API directly → Should return response

### Phase 2: Integration Testing (10 mins)
1. ✅ Upload DOCX resume
2. ✅ Extract job description from URL
3. ✅ Click "Optimize Resume"
4. ⏱️ Wait up to 90 seconds
5. ✅ Verify optimized resume downloads

### Phase 3: Error Scenarios (5 mins)
1. ❌ Upload invalid file type → Should show error
2. ❌ Upload file >5MB → Should show error
3. ❌ Submit without resume → Should show error

---

## Success Criteria

**Workflow is considered successful if:**
1. ✅ DOCX file uploads successfully
2. ✅ Job description extracts correctly
3. ✅ Claude API responds within 90 seconds
4. ✅ Optimized resume is generated (>1000 characters)
5. ✅ Download link works
6. ✅ No server errors in logs

**Acceptable failure modes:**
- ⚠️ Slow response (60-90 seconds) - acceptable for MVP
- ⚠️ Minor formatting issues in output - can be fixed post-MVP

**Unacceptable failures:**
- ❌ Timeout after 90 seconds
- ❌ API key errors
- ❌ Storage errors
- ❌ Empty or truncated output

---

## Rollback Plan

**If test fails again:**
1. **Option A:** Revert to Claude Haiku with 4K tokens (proven to work, lower quality)
2. **Option B:** Implement streaming responses (complex, time-consuming)
3. **Option C:** Add "Paste Resume Text" fallback (quick, bypasses parsing)

**Recommendation:** If this test fails, implement Option C (text paste fallback) to unblock MVP, then fix Sonnet 4 integration in parallel.

---

## Monitoring Checklist

During the next test, monitor:
- [ ] Browser console for client errors
- [ ] Server logs for API errors
- [ ] Network tab for request/response times
- [ ] Claude API dashboard for rate limits
- [ ] Supabase dashboard for storage operations

---

## Confidence Level

**Overall Success Probability:** 75%

**Breakdown:**
- DOCX parsing: 95% (proven working)
- Claude API call: 70% (new model, untested)
- Storage operations: 90% (working previously)
- End-to-end flow: 75% (multiple moving parts)

**Recommendation:** Proceed with test. If it fails, implement text paste fallback immediately.

