const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const sql = `
-- Enable Row Level Security on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AI_FAQ" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GlobalSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_QuestionTags" ENABLE ROW LEVEL SECURITY;

-- Profile Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON "Profile";
CREATE POLICY "Profiles are viewable by everyone" ON "Profile"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON "Profile";
CREATE POLICY "Users can update own profile" ON "Profile"
    FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own profile" ON "Profile";
CREATE POLICY "Users can insert own profile" ON "Profile"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Question Policies
DROP POLICY IF EXISTS "Approved questions are viewable by everyone" ON "Question";
CREATE POLICY "Approved questions are viewable by everyone" ON "Question"
    FOR SELECT USING (
        status = 'APPROVED' 
        OR "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
        OR EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = auth.uid()::text AND role = 'MODERATOR')
    );

DROP POLICY IF EXISTS "Authenticated users can create questions" ON "Question";
CREATE POLICY "Authenticated users can create questions" ON "Question"
    FOR INSERT WITH CHECK (
        "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Authors can update own questions" ON "Question";
CREATE POLICY "Authors can update own questions" ON "Question"
    FOR UPDATE USING (
        "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
        OR EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = auth.uid()::text AND role = 'MODERATOR')
    );

-- Answer Policies
DROP POLICY IF EXISTS "Approved answers are viewable by everyone" ON "Answer";
CREATE POLICY "Approved answers are viewable by everyone" ON "Answer"
    FOR SELECT USING (
        status = 'APPROVED' 
        OR "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
        OR EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = auth.uid()::text AND role = 'MODERATOR')
    );

DROP POLICY IF EXISTS "Authenticated users can create answers" ON "Answer";
CREATE POLICY "Authenticated users can create answers" ON "Answer"
    FOR INSERT WITH CHECK (
        "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Authors can update own answers" ON "Answer";
CREATE POLICY "Authors can update own answers" ON "Answer"
    FOR UPDATE USING (
        "authorId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
        OR EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = auth.uid()::text AND role = 'MODERATOR')
    );

-- Tag Policies
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON "Tag";
CREATE POLICY "Tags are viewable by everyone" ON "Tag"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON "Tag";
CREATE POLICY "Authenticated users can create tags" ON "Tag"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Vote Policies
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON "Vote";
CREATE POLICY "Votes are viewable by everyone" ON "Vote"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own votes" ON "Vote";
CREATE POLICY "Users can create own votes" ON "Vote"
    FOR INSERT WITH CHECK (
        "profileId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Users can update own votes" ON "Vote";
CREATE POLICY "Users can update own votes" ON "Vote"
    FOR UPDATE USING (
        "profileId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Users can delete own votes" ON "Vote";
CREATE POLICY "Users can delete own votes" ON "Vote"
    FOR DELETE USING (
        "profileId" IN (SELECT id FROM "Profile" WHERE "userId" = auth.uid()::text)
    );

-- AI_FAQ Policies
DROP POLICY IF EXISTS "FAQs are viewable by everyone" ON "AI_FAQ";
CREATE POLICY "FAQs are viewable by everyone" ON "AI_FAQ"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage FAQs" ON "AI_FAQ";
CREATE POLICY "Service role can manage FAQs" ON "AI_FAQ"
    FOR ALL USING (auth.uid() IS NULL);

-- GlobalSettings Policies
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON "GlobalSettings";
CREATE POLICY "Settings are viewable by everyone" ON "GlobalSettings"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moderators can update settings" ON "GlobalSettings";
CREATE POLICY "Moderators can update settings" ON "GlobalSettings"
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = auth.uid()::text AND role = 'MODERATOR')
    );

-- QuestionTags junction table
DROP POLICY IF EXISTS "QuestionTags are viewable by everyone" ON "_QuestionTags";
CREATE POLICY "QuestionTags are viewable by everyone" ON "_QuestionTags"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage QuestionTags" ON "_QuestionTags";
CREATE POLICY "Authenticated users can manage QuestionTags" ON "_QuestionTags"
    FOR ALL USING (auth.uid() IS NOT NULL);
`;

const verifyQuery = `
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Profile', 'Question', 'Answer', 'Tag', 'Vote', 'AI_FAQ', 'GlobalSettings', '_QuestionTags');
`;

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    await client.query(sql);
    console.log('✓ RLS policies applied successfully!');
    
    // Verify RLS is enabled
    const result = await client.query(verifyQuery);
    console.log('\n📊 RLS Status:');
    console.table(result.rows);
    
    // Count all enabled
    const enabledCount = result.rows.filter(r => r.rowsecurity === true).length;
    console.log(`\n✅ RLS enabled on ${enabledCount}/${result.rows.length} tables`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
