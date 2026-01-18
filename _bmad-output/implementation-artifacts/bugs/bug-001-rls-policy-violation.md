# Bug Report #001: RLS Policy Violation on Resume Upload

**Status:** ✅ FIXED  
**Date Found:** January 3, 2026  
**Tester:** Raghav  
**Severity:** P0 (Critical - Blocking)

---

## Description
Resume upload failed with error: "new row violates row-level security policy"

## Steps to Reproduce
1. Navigate to `/jobs` page
2. Upload a PDF/DOCX resume
3. Click "Optimize Resume"

## Expected Behavior
File should upload successfully to Supabase storage and create a record in `resumes` table.

## Actual Behavior
Upload fails with RLS policy violation error because:
- RLS policies check `auth.uid() = user_id`
- In auth bypass mode (MVP), `auth.uid()` is null
- Stub user ID is not recognized by RLS

## Root Cause
API routes were using standard Supabase client with anon key, which respects RLS policies. When using auth bypass with stub user, there's no authenticated session, so `auth.uid()` returns null.

## Fix Applied
1. Created `createServiceClient()` function in `lib/supabase/server.ts` that uses Service Role Key (bypasses RLS)
2. Updated all API routes to use Service Client when `NEXT_PUBLIC_BYPASS_AUTH === 'true'`
3. Routes fixed:
   - `/api/resume/upload`
   - `/api/resume/current`
   - `/api/job/optimize`
   - `/api/message/generate`

## Files Changed
- `frontend/lib/supabase/server.ts` - Added `createServiceClient()`
- `frontend/app/api/resume/upload/route.ts` - Use service client in bypass mode
- `frontend/app/api/resume/current/route.ts` - Use service client in bypass mode
- `frontend/app/api/job/optimize/route.ts` - Use service client in bypass mode
- `frontend/app/api/message/generate/route.ts` - Use service client in bypass mode

## Impact
Without this fix, the entire application is non-functional in MVP mode (auth bypass).

## Testing
- ✅ Automated smoke tests pass
- ⏳ Manual QA pending


