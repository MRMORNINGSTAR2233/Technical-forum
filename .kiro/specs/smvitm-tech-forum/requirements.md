# Requirements Document

## Introduction

The SMVITM Technical Forum is a Stack Overflow-style question-and-answer platform designed specifically for SMVITM students. The system emphasizes anonymous identity through pseudonyms while building community knowledge. It features dual-mode moderation, AI-powered FAQ generation using Groq Cloud, and a classic three-column layout optimized for technical discussions with rich text editing and syntax highlighting.

## Glossary

- **Forum System**: The complete SMVITM Technical Forum web application
- **User**: An authenticated SMVITM student with a unique pseudonym
- **Pseudonym**: A unique display name that protects user privacy (e.g., "RedBird")
- **Moderator**: A user with elevated privileges to approve, reject, or manage content
- **Post**: A question or answer submitted by a user
- **Reputation Score**: A numerical value representing a user's contribution quality
- **Auto-Approve Mode**: A global setting that determines if posts are immediately visible or require moderation
- **Groq AI**: The AI service provider used for FAQ generation
- **FAQ Engine**: An automated system that generates FAQ entries from approved questions
- **RLS**: Row Level Security in Supabase PostgreSQL database
- **Rich Text Editor**: A text input component supporting markdown, code blocks, and syntax highlighting

## Requirements

### Requirement 1: User Authentication and Profile Management

**User Story:** As a student, I want to create an account with a unique pseudonym, so that I can participate in the forum while maintaining my privacy.

#### Acceptance Criteria

1. WHEN a student provides valid email and password credentials THEN the Forum System SHALL create an authenticated account using Supabase Auth
2. WHEN a new account is created THEN the Forum System SHALL trigger automatic profile creation in the public profiles table
3. WHEN a user completes registration THEN the Forum System SHALL require selection of a unique pseudonym before granting forum access
4. WHEN profile data is retrieved via API THEN the Forum System SHALL exclude email addresses from all response payloads
5. WHEN a user attempts to register with an existing pseudonym THEN the Forum System SHALL reject the registration and display an error message

### Requirement 2: Pseudonym-Based Identity Display

**User Story:** As a user, I want my pseudonym displayed instead of my real identity, so that I can maintain anonymity while building reputation.

#### Acceptance Criteria

1. WHEN a user posts content THEN the Forum System SHALL display only the author's pseudonym
2. WHEN a user profile is viewed THEN the Forum System SHALL show the pseudonym and reputation score without revealing personal information
3. WHEN the navigation sidebar renders THEN the Forum System SHALL display a user card showing the current user's pseudonym and reputation
4. WHEN any user-generated content is displayed THEN the Forum System SHALL associate it with the author's pseudonym only

### Requirement 3: Question Posting and Management

**User Story:** As a user, I want to post technical questions with rich formatting and code blocks, so that I can clearly communicate my problems to the community.

#### Acceptance Criteria

1. WHEN a user submits a question with title, content, and tags THEN the Forum System SHALL create a question record with the appropriate approval status
2. WHEN a question is created THEN the Forum System SHALL check the auto-approve setting to determine initial post status
3. WHEN auto-approve mode is enabled THEN the Forum System SHALL set question status to APPROVED immediately
4. WHEN auto-approve mode is disabled THEN the Forum System SHALL set question status to PENDING
5. WHEN a user writes question content THEN the Forum System SHALL provide a rich text editor supporting code blocks with syntax highlighting

### Requirement 4: Answer Submission and Acceptance

**User Story:** As a user, I want to answer questions and mark helpful answers as accepted, so that I can contribute knowledge and identify solutions.

#### Acceptance Criteria

1. WHEN a user submits an answer to a question THEN the Forum System SHALL create an answer record linked to that question
2. WHEN an answer is created THEN the Forum System SHALL apply the same approval logic as questions based on the auto-approve setting
3. WHEN a question author marks an answer as accepted THEN the Forum System SHALL set the isAccepted flag to true for that answer
4. WHEN an accepted answer exists THEN the Forum System SHALL display a green checkmark indicator next to that answer
5. WHEN multiple answers exist for a question THEN the Forum System SHALL allow only one answer to be marked as accepted at a time

### Requirement 5: Voting System

**User Story:** As a user, I want to upvote or downvote questions and answers, so that I can indicate content quality and help surface the best contributions.

#### Acceptance Criteria

1. WHEN a user clicks an upvote button on a post THEN the Forum System SHALL record a vote with value of positive one
2. WHEN a user clicks a downvote button on a post THEN the Forum System SHALL record a vote with value of negative one
3. WHEN a user has already voted on a post THEN the Forum System SHALL prevent duplicate votes from the same user
4. WHEN vote counts are displayed THEN the Forum System SHALL calculate the sum of all vote values for that post
5. WHEN a post receives votes THEN the Forum System SHALL update the author's reputation score accordingly

### Requirement 6: Moderation Queue and Approval Workflow

**User Story:** As a moderator, I want to review pending posts in a dedicated queue, so that I can approve or reject content before it becomes visible to the community.

#### Acceptance Criteria

1. WHEN a moderator accesses the moderation queue route THEN the Forum System SHALL display all posts with PENDING status
2. WHEN a moderator approves a pending post THEN the Forum System SHALL update the post status to APPROVED
3. WHEN a moderator rejects a pending post THEN the Forum System SHALL update the post status to REJECTED
4. WHEN a post has been pending for more than two hours THEN the Forum System SHALL highlight that post in red color
5. WHEN the moderation queue is displayed THEN the Forum System SHALL show post count, author pseudonym, and submission timestamp

### Requirement 7: Global Auto-Approve Configuration

**User Story:** As a system administrator, I want to toggle auto-approve mode globally, so that I can control whether posts require moderation or appear immediately.

#### Acceptance Criteria

1. WHEN the Forum System creates a new post THEN the Forum System SHALL fetch the current auto-approve setting from the global settings table
2. WHEN auto-approve is enabled globally THEN the Forum System SHALL bypass moderation for all new posts
3. WHEN auto-approve is disabled globally THEN the Forum System SHALL route all new posts through the moderation queue
4. WHEN the auto-approve setting changes THEN the Forum System SHALL apply the new setting to all subsequent post submissions
5. WHERE the global settings table is empty THEN the Forum System SHALL default auto-approve to false

### Requirement 8: AI-Powered FAQ Generation

**User Story:** As a system, I want to automatically generate FAQ entries from high-quality answered questions, so that common solutions are easily discoverable.

#### Acceptance Criteria

1. WHEN the scheduled cron job executes THEN the Forum System SHALL fetch all approved questions from the last twenty-four hours that have at least one answer with positive vote count
2. WHEN eligible questions are identified THEN the Forum System SHALL send each question-answer pair to Groq AI for summarization
3. WHEN calling Groq AI THEN the Forum System SHALL use the llama3-70b-8192 model with a system prompt requesting JSON output containing question, answer, and tags fields
4. WHEN Groq AI returns a summarized FAQ THEN the Forum System SHALL store the result in the AI_FAQ table with the source question reference
5. WHEN the FAQ generation process completes THEN the Forum System SHALL log the number of FAQs created

### Requirement 9: Three-Column Layout and Navigation

**User Story:** As a user, I want a familiar Stack Overflow-style interface with clear navigation, so that I can efficiently browse and interact with content.

#### Acceptance Criteria

1. WHEN the application renders on desktop THEN the Forum System SHALL display a three-column layout with left sidebar, center content, and right sidebar
2. WHEN the left sidebar renders THEN the Forum System SHALL display navigation links for Home, Questions, Tags, Users, and Unanswered sections
3. WHEN the center column displays a question feed THEN the Forum System SHALL show question summary cards with vote count, answer count, and view count on the left side
4. WHEN the right sidebar renders THEN the Forum System SHALL display widgets for Hot Network Questions and AI FAQ Corner
5. WHERE the current user has moderator role THEN the Forum System SHALL display a Moderation Queue widget in the right sidebar

### Requirement 10: Question Detail View with Voting Interface

**User Story:** As a user, I want to view question details with prominent voting controls, so that I can read content and easily vote on quality.

#### Acceptance Criteria

1. WHEN a question detail page renders THEN the Forum System SHALL display large upvote and downvote arrow buttons on the left side
2. WHEN the question has answers THEN the Forum System SHALL display each answer with its own voting controls on the left side
3. WHEN an answer is marked as accepted THEN the Forum System SHALL display a green checkmark icon next to that answer
4. WHEN code blocks are present in content THEN the Forum System SHALL apply syntax highlighting using Shiki or Prism
5. WHEN a user interacts with voting arrows THEN the Forum System SHALL update vote counts in real-time

### Requirement 11: View Counter

**User Story:** As a user, I want to see how many times a question has been viewed, so that I can gauge community interest.

#### Acceptance Criteria

1. WHEN a user navigates to a question detail page THEN the Forum System SHALL increment the view count for that question by one
2. WHEN the same user views a question multiple times THEN the Forum System SHALL increment the view count on each visit
3. WHEN question summary cards are displayed THEN the Forum System SHALL show the current view count for each question
4. WHEN a question is newly created THEN the Forum System SHALL initialize the view count to zero

### Requirement 12: Tag System

**User Story:** As a user, I want to categorize questions with tags, so that I can find related content and filter by topic.

#### Acceptance Criteria

1. WHEN a user creates a question THEN the Forum System SHALL allow association of multiple tags with that question
2. WHEN a tag name is entered that does not exist THEN the Forum System SHALL create a new tag record
3. WHEN a tag name is entered that already exists THEN the Forum System SHALL reuse the existing tag record
4. WHEN the tags page is accessed THEN the Forum System SHALL display all unique tags with question counts
5. WHEN a tag is clicked THEN the Forum System SHALL filter questions to show only those associated with that tag

### Requirement 13: Rich Text Editing with Code Support

**User Story:** As a user, I want to format my posts with markdown and include syntax-highlighted code blocks, so that I can clearly present technical information.

#### Acceptance Criteria

1. WHEN a user writes question or answer content THEN the Forum System SHALL provide a Tiptap or MDXEditor rich text editor
2. WHEN a user inserts a code block THEN the Forum System SHALL allow specification of programming language for syntax highlighting
3. WHEN content is saved THEN the Forum System SHALL preserve all formatting including code blocks, bold, italic, and lists
4. WHEN content is displayed THEN the Forum System SHALL render markdown formatting and apply syntax highlighting to code blocks
5. WHEN a user previews content THEN the Forum System SHALL show the rendered output before submission

### Requirement 14: Hot Network Questions Widget

**User Story:** As a user, I want to see trending questions in the sidebar, so that I can discover popular discussions.

#### Acceptance Criteria

1. WHEN the right sidebar renders THEN the Forum System SHALL display a Hot Network Questions widget
2. WHEN calculating hot questions THEN the Forum System SHALL rank questions by a combination of recent views, votes, and answers
3. WHEN the widget displays THEN the Forum System SHALL show the top five trending questions
4. WHEN a hot question is clicked THEN the Forum System SHALL navigate to that question's detail page
5. WHEN hot questions are calculated THEN the Forum System SHALL only include questions with APPROVED status

### Requirement 15: Users Directory

**User Story:** As a user, I want to browse other users by pseudonym and reputation, so that I can discover knowledgeable community members.

#### Acceptance Criteria

1. WHEN the users page is accessed THEN the Forum System SHALL display a list of all user profiles sorted by reputation score
2. WHEN user profiles are displayed THEN the Forum System SHALL show pseudonym, reputation score, and join date
3. WHEN user profiles are displayed THEN the Forum System SHALL exclude email addresses and real identities
4. WHEN a user profile is clicked THEN the Forum System SHALL navigate to that user's profile page showing their questions and answers
5. WHEN the users list renders THEN the Forum System SHALL support pagination for large user counts

### Requirement 16: Unanswered Questions Filter

**User Story:** As a user, I want to view questions that have no answers, so that I can contribute to unanswered discussions.

#### Acceptance Criteria

1. WHEN the unanswered questions page is accessed THEN the Forum System SHALL display only questions with zero answers
2. WHEN unanswered questions are displayed THEN the Forum System SHALL sort by most recent first
3. WHEN a question receives its first answer THEN the Forum System SHALL remove it from the unanswered questions list
4. WHEN unanswered questions are filtered THEN the Forum System SHALL only include questions with APPROVED status
5. WHEN the unanswered count is displayed THEN the Forum System SHALL show the total number of unanswered questions

### Requirement 17: Reputation System

**User Story:** As a user, I want to earn reputation points for quality contributions, so that I can build credibility in the community.

#### Acceptance Criteria

1. WHEN a user's question receives an upvote THEN the Forum System SHALL increase the user's reputation by five points
2. WHEN a user's answer receives an upvote THEN the Forum System SHALL increase the user's reputation by ten points
3. WHEN a user's post receives a downvote THEN the Forum System SHALL decrease the user's reputation by two points
4. WHEN a user's answer is marked as accepted THEN the Forum System SHALL increase the user's reputation by fifteen points
5. WHEN reputation changes occur THEN the Forum System SHALL update the user's profile reputation score immediately

### Requirement 18: Database Security with Row Level Security

**User Story:** As a system architect, I want database-level security policies, so that users can only access and modify their own content appropriately.

#### Acceptance Criteria

1. WHEN Supabase RLS policies are configured THEN the Forum System SHALL enforce read access rules at the database level
2. WHEN a user attempts to modify a post THEN the Forum System SHALL verify ownership through RLS policies before allowing updates
3. WHEN a moderator accesses content THEN the Forum System SHALL grant elevated permissions through RLS role-based policies
4. WHEN anonymous users access the forum THEN the Forum System SHALL allow read-only access to approved content through RLS policies
5. WHEN RLS policies are evaluated THEN the Forum System SHALL prevent unauthorized data access regardless of application-level code

### Requirement 19: Responsive Design

**User Story:** As a mobile user, I want the forum to work well on my device, so that I can participate from anywhere.

#### Acceptance Criteria

1. WHEN the application is accessed on mobile devices THEN the Forum System SHALL adapt the three-column layout to a single-column responsive design
2. WHEN the viewport width is below tablet breakpoint THEN the Forum System SHALL collapse the left sidebar into a hamburger menu
3. WHEN the viewport width is below tablet breakpoint THEN the Forum System SHALL hide the right sidebar widgets or move them below main content
4. WHEN touch interactions occur on mobile THEN the Forum System SHALL provide appropriately sized touch targets for buttons and links
5. WHEN the rich text editor is used on mobile THEN the Forum System SHALL provide a mobile-optimized editing interface

### Requirement 20: Search Functionality

**User Story:** As a user, I want to search for questions by keywords, so that I can find relevant existing discussions before posting.

#### Acceptance Criteria

1. WHEN a user enters search terms THEN the Forum System SHALL query questions by title and content matching those terms
2. WHEN search results are displayed THEN the Forum System SHALL rank results by relevance score
3. WHEN search results are displayed THEN the Forum System SHALL only include questions with APPROVED status
4. WHEN search terms match tags THEN the Forum System SHALL include questions with matching tags in results
5. WHEN no results are found THEN the Forum System SHALL display a message suggesting the user post a new question
