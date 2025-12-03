# Apply Row Level Security Policies

## Instructions

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from `prisma/migrations/00_init.sql`
5. Click **Run** to execute

## What this does:

- Enables Row Level Security on all tables
- Creates policies for secure data access:
  - **Profiles**: Public read, owner update
  - **Questions**: Approved visible to all, pending only to author/moderators
  - **Answers**: Same as questions
  - **Votes**: Public read, owner create/update/delete
- Creates a trigger for automatic profile creation when users sign up

## Verification

After running the SQL, you can verify by:

1. Go to **Database** > **Tables**
2. Click on any table (e.g., "Profile")
3. Go to the **Policies** tab
4. You should see the RLS policies listed

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push --db-url "postgresql://postgres:f3K0laInnnIhiC1F@db.xfnotnguuapeuiqbrguq.supabase.co:5432/postgres" --file prisma/migrations/00_init.sql
```
