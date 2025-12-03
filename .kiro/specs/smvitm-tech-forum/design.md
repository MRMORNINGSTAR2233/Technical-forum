# Design Document: SMVITM Technical Forum

## Overview

The SMVITM Technical Forum is a full-stack web application built with Next.js 15 that provides a Stack Overflow-style Q&A platform for SMVITM students. The system prioritizes user privacy through pseudonym-based identity while fostering knowledge sharing. The architecture leverages modern React patterns (Server Components, Server Actions), Supabase for authentication and database with Row Level Security, Prisma as the ORM, and Groq AI for intelligent FAQ generation.

The application follows a three-tier architecture:
1. **Presentation Layer**: Next.js 15 App Router with React Server Components and Client Components
2. **Business Logic Layer**: Server Actions, API Routes, and service modules
3. **Data Layer**: Supabase PostgreSQL with Prisma ORM and RLS policies

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Next.js App Router (React Server Components)       │  │
│  │   - Pages & Layouts                                   │  │
│  │   - Client Components (Interactive UI)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Server                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Server Actions & API Routes                        │  │
│  │   - Authentication Actions                            │  │
│  │   - Question/Answer CRUD                             │  │
│  │   - Voting Logic                                      │  │
│  │   - Moderation Actions                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Service Layer                                       │  │
│  │   - Groq AI Service                                   │  │
│  │   - Reputation Calculator                            │  │
│  │   - Hot Questions Ranker                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Prisma ORM                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Supabase PostgreSQL + RLS                          │  │
│  │   - auth.users (Supabase Auth)                       │  │
│  │   - public.profiles                                   │  │
│  │   - Questions, Answers, Votes, Tags                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  - Groq Cloud API (llama3-70b-8192)                         │
│  - Vercel Cron (FAQ Generation)                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Rationale

- **Next.js 15 App Router**: Provides server-side rendering, React Server Components for optimal performance, and built-in API routes
- **Supabase**: Offers managed PostgreSQL with built-in authentication and Row Level Security for database-level access control
- **Prisma**: Type-safe ORM that generates TypeScript types from schema, simplifying database operations
- **Groq AI**: Ultra-fast inference for FAQ generation with llama3-70b-8192 model
- **Tailwind CSS + Shadcn/UI**: Utility-first styling with pre-built accessible components
- **Tiptap**: Headless rich text editor with excellent extensibility for code blocks and syntax highlighting

## Components and Interfaces

### 1. Authentication System

**Components:**
- `SignUpForm`: Client component for user registration
- `SignInForm`: Client component for login
- `PseudonymSelector`: Client component for unique pseudonym selection during onboarding

**Server Actions:**
```typescript
// app/actions/auth.ts
async function signUp(email: string, password: string): Promise<{ userId: string } | { error: string }>
async function signIn(email: string, password: string): Promise<{ success: boolean } | { error: string }>
async function signOut(): Promise<void>
async function createProfile(userId: string, pseudonym: string): Promise<{ success: boolean } | { error: string }>
async function checkPseudonymAvailability(pseudonym: string): Promise<boolean>
```

**Database Trigger:**
```sql
-- Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, pseudonym, reputation, role)
  VALUES (NEW.id, NULL, 0, 'STUDENT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Question Management System

**Components:**
- `QuestionFeed`: Server component displaying question list
- `QuestionCard`: Client component for question summary with stats
- `QuestionDetailView`: Server component for full question display
- `AskQuestionForm`: Client component with rich text editor
- `VotingControls`: Client component for upvote/downvote buttons

**Server Actions:**
```typescript
// app/actions/questions.ts
async function createQuestion(
  title: string,
  content: string,
  tagNames: string[],
  authorId: string
): Promise<{ questionId: string } | { error: string }>

async function getQuestions(
  filter?: 'all' | 'unanswered' | 'hot',
  page?: number
): Promise<Question[]>

async function getQuestionById(id: string): Promise<QuestionWithDetails | null>

async function incrementViewCount(questionId: string): Promise<void>

async function searchQuestions(query: string): Promise<Question[]>
```

### 3. Answer System

**Components:**
- `AnswerList`: Server component displaying all answers for a question
- `AnswerCard`: Client component for individual answer with voting
- `AnswerForm`: Client component with rich text editor
- `AcceptAnswerButton`: Client component (visible only to question author)

**Server Actions:**
```typescript
// app/actions/answers.ts
async function createAnswer(
  questionId: string,
  content: string,
  authorId: string
): Promise<{ answerId: string } | { error: string }>

async function acceptAnswer(
  answerId: string,
  questionId: string,
  userId: string
): Promise<{ success: boolean } | { error: string }>

async function getAnswersForQuestion(questionId: string): Promise<Answer[]>
```

### 4. Voting System

**Server Actions:**
```typescript
// app/actions/votes.ts
async function voteOnQuestion(
  questionId: string,
  userId: string,
  value: 1 | -1
): Promise<{ success: boolean; newScore: number } | { error: string }>

async function voteOnAnswer(
  answerId: string,
  userId: string,
  value: 1 | -1
): Promise<{ success: boolean; newScore: number } | { error: string }>

async function getUserVote(
  userId: string,
  targetId: string,
  targetType: 'question' | 'answer'
): Promise<{ value: number } | null>
```

**Reputation Update Logic:**
```typescript
// lib/reputation.ts
async function updateReputation(
  profileId: string,
  change: number
): Promise<void> {
  await prisma.profile.update({
    where: { id: profileId },
    data: { reputation: { increment: change } }
  });
}

// Reputation changes:
// Question upvote: +5
// Answer upvote: +10
// Any downvote: -2
// Answer accepted: +15
```

### 5. Moderation System

**Components:**
- `ModerationQueue`: Server component for moderators
- `PostReviewCard`: Client component with approve/reject actions
- `ModerationWidget`: Client component for sidebar (shows pending count)
- `AutoApproveToggle`: Client component for admin settings

**Server Actions:**
```typescript
// app/actions/moderation.ts
async function getPendingPosts(): Promise<PendingPost[]>

async function approvePost(
  postId: string,
  postType: 'question' | 'answer',
  moderatorId: string
): Promise<{ success: boolean } | { error: string }>

async function rejectPost(
  postId: string,
  postType: 'question' | 'answer',
  moderatorId: string
): Promise<{ success: boolean } | { error: string }>

async function getAutoApproveStatus(): Promise<boolean>

async function setAutoApproveStatus(enabled: boolean): Promise<void>
```

### 6. Groq AI FAQ Generation Service

**Service Module:**
```typescript
// lib/groq.ts
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

interface FAQInput {
  questionTitle: string;
  questionContent: string;
  answerContent: string;
  questionId: string;
}

interface FAQOutput {
  question: string;
  answer: string;
  tags: string[];
}

async function generateFAQ(input: FAQInput): Promise<FAQOutput> {
  const systemPrompt = `You are a technical documentation expert. Summarize the following User Question and Answer into a generic, clean FAQ format. Return strictly JSON: { question: string, answer: string, tags: string[] }.`;
  
  const userPrompt = `Question: ${input.questionTitle}\n\n${input.questionContent}\n\nAnswer: ${input.answerContent}`;
  
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama3-70b-8192',
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(completion.choices[0].message.content);
}
```

**Cron Job API Route:**
```typescript
// app/api/cron/generate-faq/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Fetch eligible questions (last 24h, approved, has answer with votes > 0)
  const eligibleQuestions = await prisma.question.findMany({
    where: {
      status: 'APPROVED',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      answers: {
        some: {
          votes: {
            some: { value: { gt: 0 } }
          }
        }
      }
    },
    include: {
      answers: {
        where: {
          votes: {
            some: { value: { gt: 0 } }
          }
        },
        orderBy: {
          votes: {
            _count: 'desc'
          }
        },
        take: 1
      }
    }
  });
  
  let generatedCount = 0;
  
  for (const question of eligibleQuestions) {
    const topAnswer = question.answers[0];
    if (!topAnswer) continue;
    
    const faqOutput = await generateFAQ({
      questionTitle: question.title,
      questionContent: question.content,
      answerContent: topAnswer.content,
      questionId: question.id
    });
    
    await prisma.aI_FAQ.create({
      data: {
        topic: faqOutput.tags.join(', '),
        question: faqOutput.question,
        answer: faqOutput.answer,
        sourceQuestionId: question.id
      }
    });
    
    generatedCount++;
  }
  
  return Response.json({ success: true, generated: generatedCount });
}
```

### 7. Layout System

**Components:**
- `RootLayout`: Main layout wrapper
- `LeftSidebar`: Navigation and user card
- `RightSidebar`: Hot questions, FAQ widget, moderation widget
- `ThreeColumnLayout`: Desktop grid layout container

**Layout Structure:**
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThreeColumnLayout>
          <LeftSidebar />
          <main>{children}</main>
          <RightSidebar />
        </ThreeColumnLayout>
      </body>
    </html>
  );
}
```

### 8. Rich Text Editor Integration

**Component:**
```typescript
// components/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript'
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });
  
  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  MODERATOR
}

enum PostStatus {
  PENDING
  APPROVED
  REJECTED
}

model GlobalSettings {
  id                   Int     @id @default(1)
  autoApproveEnabled   Boolean @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Profile {
  id          String     @id @default(uuid())
  userId      String     @unique
  pseudonym   String?    @unique
  reputation  Int        @default(0)
  role        Role       @default(STUDENT)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  questions   Question[]
  answers     Answer[]
  votes       Vote[]
  
  @@index([reputation])
  @@index([pseudonym])
}

model Question {
  id          String      @id @default(cuid())
  title       String
  content     String      @db.Text
  views       Int         @default(0)
  status      PostStatus  @default(PENDING)
  authorId    String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  author      Profile     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags        Tag[]       @relation("QuestionTags")
  answers     Answer[]
  votes       Vote[]
  
  @@index([status])
  @@index([createdAt])
  @@index([authorId])
}

model Answer {
  id          String      @id @default(cuid())
  content     String      @db.Text
  isAccepted  Boolean     @default(false)
  status      PostStatus  @default(PENDING)
  questionId  String
  authorId    String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  question    Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)
  author      Profile     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  votes       Vote[]
  
  @@index([questionId])
  @@index([authorId])
  @@index([status])
}

model Tag {
  id          String      @id @default(cuid())
  name        String      @unique
  createdAt   DateTime    @default(now())
  
  questions   Question[]  @relation("QuestionTags")
  
  @@index([name])
}

model Vote {
  id          String    @id @default(cuid())
  value       Int       // 1 or -1
  profileId   String
  questionId  String?
  answerId    String?
  createdAt   DateTime  @default(now())
  
  profile     Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  question    Question? @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answer      Answer?   @relation(fields: [answerId], references: [id], onDelete: Cascade)
  
  @@unique([profileId, questionId])
  @@unique([profileId, answerId])
  @@index([questionId])
  @@index([answerId])
}

model AI_FAQ {
  id               String   @id @default(cuid())
  topic            String
  question         String
  answer           String   @db.Text
  sourceQuestionId String?
  generatedAt      DateTime @default(now())
  
  @@index([generatedAt])
}
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Questions: Approved visible to all, pending only to author and moderators
CREATE POLICY "Approved questions are viewable by everyone"
  ON questions FOR SELECT
  USING (status = 'APPROVED' OR author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'MODERATOR'
  ));

CREATE POLICY "Users can create questions"
  ON questions FOR INSERT
  WITH CHECK (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own questions"
  ON questions FOR UPDATE
  USING (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Answers: Similar to questions
CREATE POLICY "Approved answers are viewable by everyone"
  ON answers FOR SELECT
  USING (status = 'APPROVED' OR author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'MODERATOR'
  ));

CREATE POLICY "Users can create answers"
  ON answers FOR INSERT
  WITH CHECK (author_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Votes: Users can read all, create/update their own
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create votes"
  ON votes FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundant properties were identified and consolidated:
- Requirements 7.2 and 7.3 are covered by the auto-approve logic tested in 3.3, 3.4, and 4.2
- Requirement 10.3 duplicates 4.4 (accepted answer checkmark display)
- Requirement 15.3 duplicates 1.4 and 2.2 (email exclusion from profiles)

The following properties represent the unique, non-redundant correctness guarantees:

### Authentication and Profile Properties

**Property 1: Account creation succeeds with valid credentials**
*For any* valid email and password combination, the authentication system should successfully create an account in Supabase Auth.
**Validates: Requirements 1.1**

**Property 2: Profile auto-creation on signup**
*For any* newly created user account, a corresponding profile record should be automatically created in the public profiles table.
**Validates: Requirements 1.2**

**Property 3: Pseudonym required for forum access**
*For any* user without a pseudonym, attempts to access forum features should be blocked until a pseudonym is set.
**Validates: Requirements 1.3**

**Property 4: Email exclusion from API responses**
*For any* profile data retrieved via API, the response payload should never contain email addresses.
**Validates: Requirements 1.4, 2.2, 15.3**

### Identity and Privacy Properties

**Property 5: Pseudonym-only content attribution**
*For any* user-generated content (questions, answers, comments), only the author's pseudonym should be displayed, never real identity.
**Validates: Requirements 2.1, 2.4**

**Property 6: Profile privacy preservation**
*For any* user profile view, the displayed data should include pseudonym and reputation but exclude email and personal information.
**Validates: Requirements 2.2, 15.2**

### Content Creation Properties

**Property 7: Question creation with approval status**
*For any* valid question submission with title, content, and tags, the system should create a question record with status determined by the auto-approve setting.
**Validates: Requirements 3.1, 3.2**

**Property 8: Answer creation with linkage**
*For any* valid answer submission, the system should create an answer record correctly linked to the target question with status determined by the auto-approve setting.
**Validates: Requirements 4.1, 4.2**

**Property 9: Single accepted answer invariant**
*For any* question with multiple answers, at most one answer should have isAccepted set to true at any given time.
**Validates: Requirements 4.5**

**Property 10: Accepted answer marking**
*For any* answer, when the question author marks it as accepted, the isAccepted flag should be set to true and a green checkmark should be displayed.
**Validates: Requirements 4.3, 4.4, 10.3**

### Voting System Properties

**Property 11: Upvote creates positive vote**
*For any* post, when a user upvotes it, a vote record with value +1 should be created.
**Validates: Requirements 5.1**

**Property 12: Downvote creates negative vote**
*For any* post, when a user downvotes it, a vote record with value -1 should be created.
**Validates: Requirements 5.2**

**Property 13: Vote uniqueness per user**
*For any* post and user combination, attempting to vote multiple times should not create duplicate vote records.
**Validates: Requirements 5.3**

**Property 14: Vote count calculation**
*For any* post with votes, the displayed vote count should equal the sum of all vote values for that post.
**Validates: Requirements 5.4**

**Property 15: Reputation updates on voting**
*For any* vote on a post, the author's reputation should change by the correct amount: +5 for question upvote, +10 for answer upvote, -2 for any downvote, +15 for accepted answer.
**Validates: Requirements 5.5, 17.1, 17.2, 17.3, 17.4, 17.5**

### Moderation Properties

**Property 16: Pending posts in moderation queue**
*For any* posts with PENDING status, they should appear in the moderation queue accessible to moderators.
**Validates: Requirements 6.1**

**Property 17: Approval changes status**
*For any* pending post, when a moderator approves it, the status should change to APPROVED.
**Validates: Requirements 6.2**

**Property 18: Rejection changes status**
*For any* pending post, when a moderator rejects it, the status should change to REJECTED.
**Validates: Requirements 6.3**

**Property 19: Stale post highlighting**
*For any* post that has been pending for more than 2 hours, it should be highlighted in red in the moderation queue.
**Validates: Requirements 6.4**

**Property 20: Moderation queue information display**
*For any* post in the moderation queue, the display should include post count, author pseudonym, and submission timestamp.
**Validates: Requirements 6.5**

### Global Settings Properties

**Property 21: Auto-approve setting consultation**
*For any* new post creation, the system should fetch and apply the current auto-approve setting from the global settings table.
**Validates: Requirements 7.1**

**Property 22: Setting changes affect future posts**
*For any* change to the auto-approve setting, all subsequently created posts should use the new setting value.
**Validates: Requirements 7.4**

### AI FAQ Generation Properties

**Property 23: Eligible question selection**
*For any* cron job execution, the system should fetch only approved questions from the last 24 hours that have at least one answer with positive vote count.
**Validates: Requirements 8.1**

**Property 24: AI summarization for eligible questions**
*For any* eligible question identified, the system should send the question-answer pair to Groq AI for summarization.
**Validates: Requirements 8.2**

**Property 25: FAQ storage with source reference**
*For any* AI-generated FAQ response, the system should store it in the AI_FAQ table with the source question ID.
**Validates: Requirements 8.4**

### Layout and UI Properties

**Property 26: Moderator widget conditional display**
*For any* user with moderator role, the right sidebar should display the Moderation Queue widget; for non-moderators, it should not.
**Validates: Requirements 9.5**

**Property 27: Answer voting controls**
*For any* question with answers, each answer should have its own voting controls displayed on the left side.
**Validates: Requirements 10.2**

**Property 28: Code block syntax highlighting**
*For any* content containing code blocks, syntax highlighting should be applied using Shiki or Prism.
**Validates: Requirements 10.4**

**Property 29: Real-time vote count updates**
*For any* voting interaction, the displayed vote count should update immediately without page refresh.
**Validates: Requirements 10.5**

### View Counter Properties

**Property 30: View count increment**
*For any* question detail page navigation, the view count for that question should increment by one.
**Validates: Requirements 11.1**

**Property 31: Non-deduplicated view counting**
*For any* user viewing the same question multiple times, each view should increment the count.
**Validates: Requirements 11.2**

**Property 32: View count display**
*For any* question in summary cards, the current view count should be displayed.
**Validates: Requirements 11.3**

### Tag System Properties

**Property 33: Multiple tags per question**
*For any* question creation, the system should allow association of multiple tags with that question.
**Validates: Requirements 12.1**

**Property 34: New tag creation**
*For any* tag name that doesn't exist in the database, the system should create a new tag record.
**Validates: Requirements 12.2**

**Property 35: Tag reuse**
*For any* tag name that already exists, the system should reuse the existing tag record rather than creating a duplicate.
**Validates: Requirements 12.3**

**Property 36: Tag page display**
*For any* tags page access, all unique tags should be displayed with their associated question counts.
**Validates: Requirements 12.4**

**Property 37: Tag-based filtering**
*For any* tag clicked, the question list should filter to show only questions associated with that tag.
**Validates: Requirements 12.5**

### Rich Text Properties

**Property 38: Formatting preservation (Round-trip)**
*For any* content with formatting (code blocks, bold, italic, lists), saving and then loading should preserve all formatting.
**Validates: Requirements 13.3**

**Property 39: Markdown rendering with syntax highlighting**
*For any* content displayed, markdown formatting should be rendered and code blocks should have syntax highlighting applied.
**Validates: Requirements 13.4**

### Hot Questions Properties

**Property 40: Hot questions ranking**
*For any* set of questions, the hot questions widget should rank them by a combination of recent views, votes, and answers.
**Validates: Requirements 14.2**

**Property 41: Hot questions status filter**
*For any* hot questions list, all included questions should have APPROVED status.
**Validates: Requirements 14.5**

### User Directory Properties

**Property 42: Users sorted by reputation**
*For any* users page access, user profiles should be displayed sorted by reputation score in descending order.
**Validates: Requirements 15.1**

**Property 43: User profile page content**
*For any* user profile page, it should display that user's questions and answers.
**Validates: Requirements 15.4**

**Property 44: User list pagination**
*For any* users list with more than the page size limit, pagination controls should be available and functional.
**Validates: Requirements 15.5**

### Unanswered Questions Properties

**Property 45: Unanswered filter accuracy**
*For any* unanswered questions page, all displayed questions should have exactly zero answers.
**Validates: Requirements 16.1**

**Property 46: Unanswered sort order**
*For any* unanswered questions list, questions should be sorted by creation date with most recent first.
**Validates: Requirements 16.2**

**Property 47: Dynamic unanswered list updates**
*For any* question that receives its first answer, it should be removed from the unanswered questions list.
**Validates: Requirements 16.3**

**Property 48: Unanswered status filter**
*For any* unanswered questions list, all included questions should have APPROVED status.
**Validates: Requirements 16.4**

**Property 49: Unanswered count accuracy**
*For any* display of the unanswered count, it should equal the actual number of approved questions with zero answers.
**Validates: Requirements 16.5**

### Security Properties

**Property 50: Ownership verification for modifications**
*For any* post modification attempt, only the post owner should be able to update it (enforced by RLS).
**Validates: Requirements 18.2**

**Property 51: Moderator elevated access**
*For any* moderator user, they should have access to pending content that regular users cannot see.
**Validates: Requirements 18.3**

**Property 52: Anonymous read-only access**
*For any* unauthenticated user, they should have read access to approved content but no write permissions.
**Validates: Requirements 18.4**

### Search Properties

**Property 53: Search term matching**
*For any* search query, results should include questions whose title or content match the search terms.
**Validates: Requirements 20.1**

**Property 54: Search relevance ranking**
*For any* search results, they should be ordered by relevance score.
**Validates: Requirements 20.2**

**Property 55: Search status filter**
*For any* search results, all included questions should have APPROVED status.
**Validates: Requirements 20.3**

**Property 56: Tag-based search inclusion**
*For any* search terms that match tag names, questions with those tags should be included in results.
**Validates: Requirements 20.4**

## Error Handling

### Authentication Errors
- **Invalid Credentials**: Return clear error message without revealing whether email exists
- **Duplicate Pseudonym**: Return specific error indicating pseudonym is taken
- **Session Expiry**: Redirect to login with message, preserve intended destination

### Content Creation Errors
- **Missing Required Fields**: Validate on client and server, return field-specific errors
- **Invalid Tags**: Sanitize tag input, reject tags with special characters
- **Content Too Long**: Enforce limits (title: 300 chars, content: 30,000 chars)

### Voting Errors
- **Duplicate Vote**: Silently ignore or allow vote change (toggle behavior)
- **Self-Voting**: Prevent users from voting on their own posts
- **Unauthorized Voting**: Require authentication before voting

### Moderation Errors
- **Non-Moderator Access**: Return 403 Forbidden for moderation routes
- **Invalid Status Transition**: Validate state machine (PENDING → APPROVED/REJECTED only)
- **Concurrent Moderation**: Use optimistic locking to prevent race conditions

### AI Service Errors
- **Groq API Failure**: Log error, skip that FAQ, continue with next question
- **Rate Limiting**: Implement exponential backoff, queue failed requests
- **Invalid JSON Response**: Validate response schema, discard malformed FAQs

### Database Errors
- **Connection Failure**: Retry with exponential backoff, show maintenance page
- **Constraint Violations**: Catch unique constraint errors, return user-friendly messages
- **RLS Policy Violations**: Log security event, return generic "Access Denied" message

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests. Unit tests will focus on:

- **Service Functions**: Test individual functions in isolation (reputation calculator, hot questions ranker, etc.)
- **Server Actions**: Test CRUD operations with mocked database
- **Utility Functions**: Test helpers for text sanitization, date formatting, etc.
- **Component Logic**: Test React component behavior with React Testing Library

Example unit tests:
- Test that `calculateReputation()` returns correct values for different vote types
- Test that `sanitizePseudonym()` rejects invalid characters
- Test that `formatTimestamp()` handles various date formats
- Test that `VotingControls` component disables buttons for unauthenticated users

### Property-Based Testing

The application will use **fast-check** as the property-based testing library. Each property-based test will run a minimum of 100 iterations.

Property-based tests will verify universal properties across randomly generated inputs:

- **Authentication Properties**: Generate random credentials, verify account creation and profile linking
- **Voting Properties**: Generate random vote sequences, verify count calculations and reputation updates
- **Content Properties**: Generate random questions/answers, verify approval status logic
- **Tag Properties**: Generate random tag combinations, verify deduplication and association
- **Search Properties**: Generate random queries and content, verify matching and filtering

Each property-based test MUST be tagged with a comment referencing the design document property:
```typescript
// Feature: smvitm-tech-forum, Property 14: Vote count calculation
test.prop([fc.array(fc.integer({ min: -1, max: 1 }))])('vote count equals sum of values', async (votes) => {
  // Test implementation
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- **User Registration Flow**: Sign up → Create profile → Set pseudonym → Access forum
- **Question Posting Flow**: Create question → Auto-approve/moderation → Display in feed
- **Answer and Accept Flow**: Post answer → Vote → Accept → Reputation update
- **Moderation Flow**: Submit post → Appears in queue → Approve → Visible to all

### Database Testing

- Use Supabase local development environment for testing
- Test RLS policies with different user roles
- Verify triggers (profile creation on signup)
- Test concurrent operations (voting, moderation)

### API Testing

- Test all Server Actions with various inputs
- Verify error handling for invalid data
- Test rate limiting and authentication
- Verify Groq AI integration with mock responses

### End-to-End Testing

Use **Playwright** for E2E tests:

- Test complete user journeys from signup to posting
- Verify responsive layout on different screen sizes
- Test rich text editor functionality
- Verify real-time updates (voting, view counts)

## Performance Considerations

### Database Optimization

- **Indexes**: Add indexes on frequently queried fields (status, createdAt, authorId, reputation)
- **Pagination**: Implement cursor-based pagination for large lists
- **Eager Loading**: Use Prisma's `include` to avoid N+1 queries
- **Caching**: Cache hot questions, user reputation, tag counts with Redis

### Server-Side Rendering

- Use React Server Components for initial page loads
- Implement streaming for large question lists
- Cache rendered pages with Next.js ISR (Incremental Static Regeneration)

### Client-Side Optimization

- Lazy load rich text editor components
- Implement virtual scrolling for long lists
- Debounce search input
- Optimize images with Next.js Image component

### AI Service Optimization

- Batch FAQ generation requests
- Implement request queuing to avoid rate limits
- Cache AI responses to avoid redundant calls
- Use streaming responses for real-time feedback

## Deployment Strategy

### Environment Setup

- **Development**: Local Supabase + Next.js dev server
- **Staging**: Vercel preview deployment + Supabase staging project
- **Production**: Vercel production + Supabase production project

### Environment Variables

```env
# Supabase
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq AI
GROQ_API_KEY=

# Cron
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

### Database Migrations

- Use Prisma Migrate for schema changes
- Run migrations in CI/CD pipeline before deployment
- Maintain migration rollback scripts

### Cron Job Setup

Configure Vercel Cron in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/generate-faq",
    "schedule": "0 0 * * *"
  }]
}
```

### Monitoring

- Set up Vercel Analytics for performance monitoring
- Configure Sentry for error tracking
- Monitor Groq API usage and rate limits
- Set up database query performance monitoring in Supabase

## Security Considerations

### Authentication Security

- Use Supabase Auth with secure session management
- Implement CSRF protection with Next.js built-in features
- Use HTTP-only cookies for session tokens
- Implement rate limiting on auth endpoints

### Data Privacy

- Never expose email addresses in API responses
- Implement proper RLS policies for all tables
- Sanitize user input to prevent XSS attacks
- Use parameterized queries to prevent SQL injection

### Content Security

- Implement content moderation queue
- Sanitize rich text content before rendering
- Use DOMPurify for HTML sanitization
- Implement rate limiting on post creation

### API Security

- Validate all Server Action inputs with Zod
- Implement proper authorization checks
- Use environment variables for secrets
- Secure cron endpoints with secret tokens

## Future Enhancements

- **Real-time Notifications**: WebSocket integration for instant updates
- **Advanced Search**: Full-text search with Elasticsearch
- **Gamification**: Badges, achievements, leaderboards
- **Email Notifications**: Digest emails for new answers
- **Mobile App**: React Native app using same backend
- **AI-Powered Suggestions**: Question similarity detection
- **Analytics Dashboard**: Moderator insights and metrics
