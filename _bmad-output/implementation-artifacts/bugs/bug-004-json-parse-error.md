# Bug Report #004: JSON Parse Error (Unexpected token '<')

**Status:** 🔴 OPEN  
**Date Found:** January 3, 2026  
**Tester:** Raghav  
**Severity:** P1 (High - Causes crashes but not blocking all workflows)

---

## Description
Console error during resume optimization: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## Steps to Reproduce
1. Navigate to `/jobs` page
2. Upload resume
3. Enter job description
4. Click "Optimize Resume"

## Expected Behavior
- If API returns JSON: Parse and display result
- If API returns error: Show user-friendly error message

## Actual Behavior
- API returns HTML error page (likely 500/404)
- Client tries to parse HTML as JSON
- JavaScript crashes with SyntaxError
- User sees cryptic error message

## Root Cause
**File:** `frontend/components/jobs/ResumeOptimizer.tsx`

**Problem:** The code calls `.json()` without checking response content-type:

```typescript
// Line 65
const errorData = await uploadResponse.json();

// Line 69
const { data: uploadResult } = await uploadResponse.json();

// Line 88
const errData = await response.json();

// Line 92
const data = await response.json();
```

**What happens:**
1. API route throws unhandled exception
2. Next.js returns HTML error page (500 Internal Server Error)
3. Client tries to parse HTML as JSON → crashes

## Proposed Fix
Add content-type checking before parsing:

```typescript
if (!uploadResponse.ok) {
  const contentType = uploadResponse.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const errorData = await uploadResponse.json();
    throw new Error(errorData.error || 'Upload failed');
  } else {
    // HTML error page returned
    const errorText = await uploadResponse.text();
    console.error('API returned HTML error:', errorText);
    throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }
}
```

## Impact
- Users see confusing "Unexpected token" errors
- Hard to debug which API endpoint is failing
- Crashes the UI component state

## Files to Change
1. `frontend/components/jobs/ResumeOptimizer.tsx` - Add robust error handling
2. All API routes - Ensure consistent JSON error responses

## Related
- May be caused by server-side errors in API routes
- Need to check server logs to see underlying error


