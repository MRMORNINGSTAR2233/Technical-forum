# Database Setup Guide

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your database connection string from Project Settings > Database
3. Get your API keys from Project Settings > API

## Setup Steps

### 1. Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### 2. Push Database Schema

Push the Prisma schema to your Supabase database:

```bash
npm run db:push
```

This will create all tables, enums, and indexes.

### 3. Apply RLS Policies and Triggers

Go to your Supabase SQL Editor and run the contents of `prisma/migrations/00_init.sql`.

This will:
- Enable Row Level Security on all tables
- Create RLS policies for secure data access
- Create a trigger for automatic profile creation on user signup

### 4. Seed Initial Data

Run the seed script to create initial GlobalSettings:

```bash
npm run db:seed
```

### 5. Verify Setup

Open Prisma Studio to verify your database:

```bash
npm run db:studio
```

## Database Schema Overview

### Tables

- **GlobalSettings**: Forum-wide settings (auto-approve mode)
- **Profile**: User profiles with pseudonyms and reputation
- **Question**: Questions posted by users
- **Answer**: Answers to questions
- **Vote**: Upvotes/downvotes on questions and answers
- **Tag**: Tags for categorizing questions
- **AI_FAQ**: AI-generated FAQ entries

### Security

- Row Level Security (RLS) is enabled on all user-facing tables
- Users can only modify their own content
- Moderators have elevated access to pending content
- Anonymous users have read-only access to approved content

## Common Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Troubleshooting

### Connection Issues

If you can't connect to the database:
1. Check your DATABASE_URL is correct
2. Verify your IP is allowed in Supabase (Settings > Database > Connection Pooling)
3. Try using the connection pooler URL for better performance

### Migration Issues

If you need to reset the database:
1. Go to Supabase SQL Editor
2. Drop all tables
3. Run `npm run db:push` again
4. Re-apply RLS policies from `00_init.sql`
5. Run `npm run db:seed`
