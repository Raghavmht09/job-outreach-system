# User Creation Guide - Fix Authentication Issue

## Problem Identified

The SQL migration approach (`crypt()` with direct `auth.users` INSERT) is incompatible with Supabase Auth's authentication system. This is why login attempts are failing with "Invalid login credentials."

## Solution: Create Users via Supabase Dashboard

### Step 1: Access Supabase Dashboard

1. Open your browser and go to https://supabase.com/dashboard
2. Log in to your Supabase account
3. Select your project: **Job Outreach System**

### Step 2: Navigate to Authentication

1. In the left sidebar, click **Authentication**
2. Click **Users** tab

### Step 3: Delete Existing Test Users (Clean Slate)

1. You should see 2 users in the list (stub user and possibly testuser@example.com)
2. For each user:
   - Click the **three dots** (⋯) menu on the right
   - Select **Delete user**
   - Confirm deletion

### Step 4: Create User 1 (Raghav)

1. Click the **Add user** button (top right)
2. Select **Create new user**
3. Fill in the form:
   - **Email:** `raghavmht9@gmail.com`
   - **Password:** `secure_password_123`
   - **Auto Confirm User:** ✅ **ENABLE THIS** (important!)
4. Click **Create user**
5. **IMPORTANT:** Copy the generated UUID
   - We need to replace this with your existing UUID: `5544832a-6f3b-407d-8821-45054dc28761`
   - See "Step 6: Fix User 1 UUID" below

### Step 5: Create User 2 (Test User)

1. Click **Add user** button again
2. Select **Create new user**
3. Fill in the form:
   - **Email:** `testuser@example.com`
   - **Password:** `test_password_456`
   - **Auto Confirm User:** ✅ **ENABLE THIS**
4. Click **Create user**
5. User 2 can keep its auto-generated UUID

### Step 6: Fix User 1 UUID (For Data Continuity)

Since your existing resume data is linked to UUID `5544832a-6f3b-407d-8821-45054dc28761`, we need to update User 1's ID.

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste this SQL (replace `<NEW_UUID>` with the UUID from Step 4):

```sql
-- First, get the new UUID that was auto-generated for raghavmht9@gmail.com
-- You can find it in Authentication > Users
-- Then run this script:

BEGIN;

-- Store the old and new UUIDs
-- REPLACE <NEW_UUID_HERE> with the actual UUID shown in the dashboard
DO $$
DECLARE
  old_uuid uuid := '<NEW_UUID_HERE>'; -- The auto-generated UUID from Step 4
  target_uuid uuid := '5544832a-6f3b-407d-8821-45054dc28761'; -- Your existing UUID
BEGIN
  -- Update the user's ID in auth.users
  UPDATE auth.users
  SET id = target_uuid
  WHERE id = old_uuid;

  -- Update the identity record
  UPDATE auth.identities
  SET id = target_uuid, user_id = target_uuid
  WHERE user_id = old_uuid;

  -- Update any existing user data (if you have resume data already)
  UPDATE user_resume_data
  SET user_id = target_uuid
  WHERE user_id = old_uuid;

  UPDATE job_applications
  SET user_id = target_uuid
  WHERE user_id = old_uuid;

  UPDATE outreach_messages
  SET user_id = target_uuid
  WHERE user_id = old_uuid;
END $$;

COMMIT;
```

4. **Before running:** Replace `<NEW_UUID_HERE>` with the actual UUID from Step 4
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify: Go back to **Authentication > Users** and confirm raghavmht9@gmail.com now shows UUID `5544832a-...`

### Step 7: Verify User Creation

Go to **Authentication > Users** and confirm:

✅ **User 1:**
- Email: raghavmht9@gmail.com
- UUID: 5544832a-6f3b-407d-8821-45054dc28761
- Email Confirmed: ✅ (green checkmark)
- Provider: email

✅ **User 2:**
- Email: testuser@example.com
- UUID: (any auto-generated UUID is fine)
- Email Confirmed: ✅ (green checkmark)
- Provider: email

## Step 8: Test Login

Now you can test the authentication flow:

1. Open your browser to http://localhost:3000/login
2. Try logging in with **User 1** credentials:
   - Email: `raghavmht9@gmail.com`
   - Password: `secure_password_123`
3. You should be redirected to `/` (dashboard) with a logout button visible
4. Click **Logout**
5. Try logging in with **User 2** credentials:
   - Email: `testuser@example.com`
   - Password: `test_password_456`
6. You should successfully log in as the second user

## Credentials Summary

**User 1 (Raghav):**
- Email: `raghavmht9@gmail.com`
- Password: `secure_password_123`
- UUID: `5544832a-6f3b-407d-8821-45054dc28761` (your existing UUID)

**User 2 (Test User):**
- Email: `testuser@example.com`
- Password: `test_password_456`
- UUID: (auto-generated, doesn't matter for testing)

## Why This Works

- **Supabase Dashboard UI** uses the proper Supabase Auth APIs internally
- Passwords are hashed correctly using Supabase's internal bcrypt implementation
- All required fields (instance_id, identities, etc.) are set automatically
- Email confirmation is handled properly
- JWT tokens will work correctly with `auth.uid()` in RLS policies

## Alternative: Use the TypeScript Script (If Dashboard Doesn't Work)

If you prefer programmatic creation, you can try the script I created:

```bash
cd backend
npx tsx scripts/create-test-users.ts
```

However, if you see "Database error" messages, use the Dashboard UI method above instead (it's more reliable).

## Next Steps After User Creation

Once both users are created successfully:

1. ✅ Test login with User 1
2. ✅ Upload a resume as User 1
3. ✅ Generate optimized resume as User 1
4. ✅ Logout
5. ✅ Test login with User 2
6. ✅ Upload a different resume as User 2 (e.g., "Senior Software Engineer" role)
7. ✅ Verify RLS data isolation (User 1 can't see User 2's data and vice versa)

## Troubleshooting

**If login still fails after Dashboard creation:**
1. Check that "Auto Confirm User" was enabled (email must be confirmed)
2. Verify the password is exactly as shown (passwords are case-sensitive)
3. Check browser console for any errors
4. Verify Supabase environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**If UUID update fails:**
1. Make sure you replaced `<NEW_UUID_HERE>` with the actual UUID
2. Run the SQL query in the Supabase SQL Editor (not locally)
3. Check if there are any foreign key constraints preventing the update

---

**🎯 Created by Amelia (Dev Agent) - 2026-01-11**
