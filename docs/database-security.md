# Database Security Implementation

## Row Level Security (RLS) Overview

Row Level Security has been implemented for all user-facing tables to ensure data privacy and security at the database level.

## Security Policies

### Profile Table

**Read Access:**
- ✅ Anyone can view all profiles (pseudonyms are public)
- ❌ Email addresses are never exposed in queries

**Write Access:**
- ✅ Users can update their own profile
- ✅ Users can insert their own profile (via trigger)
- ❌ Users cannot modify other profiles

### Question Table

**Read Access:**
- ✅ Everyone can view APPROVED questions
- ✅ Authors can view their own PENDING questions
- ✅ Moderators can view all PENDING questions
- ❌ Regular users cannot see other users' pending questions

**Write Access:**
- ✅ Authenticated users can create questions
- ✅ Authors can update their own questions
- ❌ Users cannot modify others' questions

### Answer Table

**Read Access:**
- ✅ Everyone can view APPROVED answers
- ✅ Authors can view their own PENDING answers
- ✅ Moderators can view all PENDING answers
- ❌ Regular users cannot see other users' pending answers

**Write Access:**
- ✅ Authenticated users can create answers
- ✅ Authors can update their own answers
- ❌ Users cannot modify others' answers

### Vote Table

**Read Access:**
- ✅ Everyone can view all votes (for calculating scores)

**Write Access:**
- ✅ Users can create votes on any post
- ✅ Users can update their own votes
- ✅ Users can delete their own votes
- ❌ Users cannot modify others' votes

## Database Triggers

### Automatic Profile Creation

When a new user signs up via Supabase Auth:
1. A trigger automatically fires
2. A new Profile record is created
3. Initial values are set:
   - `userId`: Linked to auth.users
   - `pseudonym`: NULL (must be set during onboarding)
   - `reputation`: 0
   - `role`: STUDENT

## Security Benefits

1. **Defense in Depth**: Even if application code has bugs, database enforces security
2. **No Data Leaks**: Impossible to query data you don't have access to
3. **Automatic Enforcement**: No need to remember to check permissions in every query
4. **Audit Trail**: Database logs all access attempts

## Testing RLS Policies

RLS policies should be tested with different user contexts:

```sql
-- Test as anonymous user
SET ROLE anon;
SELECT * FROM "Question" WHERE status = 'PENDING';
-- Should return 0 rows

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM "Question" WHERE status = 'PENDING' AND "authorId" = 'profile-id-here';
-- Should return only user's own pending questions
```

## Applying RLS Policies

See `scripts/apply-rls.md` for instructions on applying these policies to your Supabase database.

## Maintenance

When adding new tables:
1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create appropriate policies for SELECT, INSERT, UPDATE, DELETE
3. Test policies with different user roles
4. Document the policies in this file
