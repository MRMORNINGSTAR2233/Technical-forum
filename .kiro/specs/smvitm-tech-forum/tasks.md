# Implementation Plan

- [x] 1. Project initialization and setup
  - Initialize Next.js 15 project with TypeScript and App Router
  - Install dependencies: Prisma, Supabase client, Groq SDK, Tailwind CSS, Shadcn/UI, Tiptap, fast-check, Vitest
  - Configure TypeScript, ESLint, and Prettier
  - Set up environment variables structure
  - _Requirements: All_

- [x] 2. Database schema and Supabase configuration
  - Create Prisma schema with all models (Profile, Question, Answer, Vote, Tag, AI_FAQ, GlobalSettings)
  - Configure Supabase connection in Prisma
  - Run initial migration to create tables
  - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 8.4, 12.1, 17.1_

- [x] 3. Implement Row Level Security policies
  - Create RLS policies for profiles table (public read, owner update)
  - Create RLS policies for questions table (approved public, pending owner/moderator)
  - Create RLS policies for answers table (approved public, pending owner/moderator)
  - Create RLS policies for votes table (public read, owner create/update)
  - Create database trigger for automatic profile creation on user signup
  - _Requirements: 1.2, 18.1, 18.2, 18.3, 18.4_

- [x] 3.1 Write property test for RLS ownership verification
  - **Property 50: Ownership verification for modifications**
  - **Validates: Requirements 18.2**

- [x] 3.2 Write property test for moderator access
  - **Property 51: Moderator elevated access**
  - **Validates: Requirements 18.3**

- [x] 3.3 Write property test for anonymous read access
  - **Property 52: Anonymous read-only access**
  - **Validates: Requirements 18.4**

- [x] 4. Authentication system implementation
  - Create sign-up Server Action with Supabase Auth integration
  - Create sign-in Server Action
  - Create sign-out Server Action
  - Implement pseudonym selection and availability check Server Action
  - Create profile creation Server Action that enforces unique pseudonym
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 4.1 Write property test for account creation
  - **Property 1: Account creation succeeds with valid credentials**
  - **Validates: Requirements 1.1**

- [x] 4.2 Write property test for profile auto-creation
  - **Property 2: Profile auto-creation on signup**
  - **Validates: Requirements 1.2**

- [x] 4.3 Write property test for pseudonym requirement
  - **Property 3: Pseudonym required for forum access**
  - **Validates: Requirements 1.3**

- [x] 4.4 Write property test for email exclusion
  - **Property 4: Email exclusion from API responses**
  - **Validates: Requirements 1.4, 2.2, 15.3**

- [x] 5. Authentication UI components
  - Create SignUpForm client component with form validation
  - Create SignInForm client component
  - Create PseudonymSelector component for onboarding
  - Create authentication pages (/sign-up, /sign-in)
  - Implement middleware to protect routes requiring authentication
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 6. Layout system and navigation
  - Create RootLayout with three-column grid structure
  - Create LeftSidebar component with navigation links (Home, Questions, Tags, Users, Unanswered)
  - Create RightSidebar component container
  - Create UserCard component displaying pseudonym and reputation
  - Implement responsive layout that collapses to single column on mobile
  - _Requirements: 2.3, 9.1, 9.2, 19.1, 19.2, 19.3_

- [x] 6.1 Write unit tests for layout components
  - Test three-column layout structure
  - Test navigation links presence
  - Test responsive behavior

- [x] 7. Global settings management
  - Create GlobalSettings model initialization
  - Create Server Action to get auto-approve status
  - Create Server Action to set auto-approve status (admin only)
  - Create AutoApproveToggle component for admin settings page
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.1 Write property test for auto-approve setting consultation
  - **Property 21: Auto-approve setting consultation**
  - **Validates: Requirements 7.1**

- [x] 7.2 Write property test for setting changes
  - **Property 22: Setting changes affect future posts**
  - **Validates: Requirements 7.4**

- [x] 8. Question creation system
  - Create Server Action for creating questions with auto-approve logic
  - Create Server Action for fetching questions with filters (all, unanswered, hot)
  - Create Server Action for fetching single question by ID with answers
  - Create Server Action for incrementing view count
  - Implement tag association logic (create new or reuse existing tags)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.1, 11.4, 12.1, 12.2, 12.3_

- [x] 8.1 Write property test for question creation with approval status
  - **Property 7: Question creation with approval status**
  - **Validates: Requirements 3.1, 3.2**

- [x] 8.2 Write property test for multiple tags per question
  - **Property 33: Multiple tags per question**
  - **Validates: Requirements 12.1**

- [x] 8.3 Write property test for new tag creation
  - **Property 34: New tag creation**
  - **Validates: Requirements 12.2**

- [x] 8.4 Write property test for tag reuse
  - **Property 35: Tag reuse**
  - **Validates: Requirements 12.3**

- [x] 8.5 Write property test for view count increment
  - **Property 30: View count increment**
  - **Validates: Requirements 11.1**

- [x] 8.6 Write property test for non-deduplicated view counting
  - **Property 31: Non-deduplicated view counting**
  - **Validates: Requirements 11.2**

- [x] 9. Rich text editor integration
  - Install and configure Tiptap with StarterKit extension
  - Configure CodeBlockLowlight extension with syntax highlighting
  - Create RichTextEditor client component with toolbar
  - Create EditorToolbar component with formatting buttons
  - Implement code block language selector
  - _Requirements: 3.5, 13.1, 13.2_

- [x] 9.1 Write property test for formatting preservation
  - **Property 38: Formatting preservation (Round-trip)**
  - **Validates: Requirements 13.3**

- [x] 9.2 Write property test for markdown rendering
  - **Property 39: Markdown rendering with syntax highlighting**
  - **Validates: Requirements 13.4**

- [x] 10. Question UI components
  - Create AskQuestionForm client component with RichTextEditor
  - Create QuestionFeed server component
  - Create QuestionCard client component with stats display
  - Create QuestionDetailView server component
  - Create question pages (/questions, /questions/[id], /questions/ask)
  - _Requirements: 3.1, 9.3, 10.1_

- [x] 10.1 Write property test for pseudonym-only content attribution
  - **Property 5: Pseudonym-only content attribution**
  - **Validates: Requirements 2.1, 2.4**

- [x] 10.2 Write property test for view count display
  - **Property 32: View count display**
  - **Validates: Requirements 11.3**

- [x] 11. Answer system implementation
  - Create Server Action for creating answers with auto-approve logic
  - Create Server Action for accepting answers (question author only)
  - Create Server Action for fetching answers for a question
  - Implement single accepted answer constraint logic
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 11.1 Write property test for answer creation with linkage
  - **Property 8: Answer creation with linkage**
  - **Validates: Requirements 4.1, 4.2**

- [x] 11.2 Write property test for accepted answer marking
  - **Property 10: Accepted answer marking**
  - **Validates: Requirements 4.3, 4.4, 10.3**

- [x] 11.3 Write property test for single accepted answer invariant
  - **Property 9: Single accepted answer invariant**
  - **Validates: Requirements 4.5**

- [x] 12. Answer UI components
  - Create AnswerForm client component with RichTextEditor
  - Create AnswerList server component
  - Create AnswerCard client component with accepted checkmark indicator
  - Create AcceptAnswerButton client component (visible only to question author)
  - Integrate answers into question detail page
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 12.1 Write property test for answer voting controls
  - **Property 27: Answer voting controls**
  - **Validates: Requirements 10.2**

- [x] 12.2 Write property test for code block syntax highlighting
  - **Property 28: Code block syntax highlighting**
  - **Validates: Requirements 10.4**

- [x] 13. Voting system implementation
  - Create Server Action for voting on questions
  - Create Server Action for voting on answers
  - Create Server Action for getting user's existing vote
  - Implement vote uniqueness constraint (one vote per user per post)
  - Implement vote count calculation logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 13.1 Write property test for upvote creates positive vote
  - **Property 11: Upvote creates positive vote**
  - **Validates: Requirements 5.1**

- [x] 13.2 Write property test for downvote creates negative vote
  - **Property 12: Downvote creates negative vote**
  - **Validates: Requirements 5.2**

- [x] 13.3 Write property test for vote uniqueness
  - **Property 13: Vote uniqueness per user**
  - **Validates: Requirements 5.3**

- [x] 13.4 Write property test for vote count calculation
  - **Property 14: Vote count calculation**
  - **Validates: Requirements 5.4**

- [x] 14. Reputation system implementation
  - Create reputation update utility function
  - Integrate reputation updates into voting Server Actions (+5 question upvote, +10 answer upvote, -2 downvote)
  - Integrate reputation update into accept answer Server Action (+15)
  - Ensure reputation updates are immediate and transactional
  - _Requirements: 5.5, 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 14.1 Write property test for reputation updates on voting
  - **Property 15: Reputation updates on voting**
  - **Validates: Requirements 5.5, 17.1, 17.2, 17.3, 17.4, 17.5**

- [x] 15. Voting UI components
  - Create VotingControls client component with upvote/downvote buttons
  - Implement optimistic UI updates for vote counts
  - Add voting controls to QuestionDetailView
  - Add voting controls to AnswerCard
  - Disable voting for unauthenticated users and on own posts
  - _Requirements: 5.1, 5.2, 10.1, 10.5_

- [x] 15.1 Write property test for real-time vote count updates
  - **Property 29: Real-time vote count updates**
  - **Validates: Requirements 10.5**

- [x] 16. Moderation system implementation
  - Create Server Action to fetch pending posts
  - Create Server Action to approve posts (moderator only)
  - Create Server Action to reject posts (moderator only)
  - Implement stale post detection (pending > 2 hours)
  - Create middleware to verify moderator role
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 16.1 Write property test for pending posts in queue
  - **Property 16: Pending posts in moderation queue**
  - **Validates: Requirements 6.1**

- [x] 16.2 Write property test for approval changes status
  - **Property 17: Approval changes status**
  - **Validates: Requirements 6.2**

- [x] 16.3 Write property test for rejection changes status
  - **Property 18: Rejection changes status**
  - **Validates: Requirements 6.3**

- [x] 16.4 Write property test for stale post highlighting
  - **Property 19: Stale post highlighting**
  - **Validates: Requirements 6.4**

- [x] 17. Moderation UI components
  - Create ModerationQueue server component for /mod/queue page
  - Create PostReviewCard client component with approve/reject buttons
  - Implement stale post highlighting (red color for > 2 hours)
  - Create ModerationWidget client component for right sidebar
  - Display pending post count in widget
  - _Requirements: 6.1, 6.4, 6.5, 9.5_

- [x] 17.1 Write property test for moderation queue information display
  - **Property 20: Moderation queue information display**
  - **Validates: Requirements 6.5**

- [x] 17.2 Write property test for moderator widget conditional display
  - **Property 26: Moderator widget conditional display**
  - **Validates: Requirements 9.5**

- [x] 18. Tag system implementation
  - Create Server Action to fetch all tags with question counts
  - Create Server Action to fetch questions by tag
  - Implement tag filtering logic
  - _Requirements: 12.4, 12.5_

- [x] 18.1 Write property test for tag page display
  - **Property 36: Tag page display**
  - **Validates: Requirements 12.4**

- [x] 18.2 Write property test for tag-based filtering
  - **Property 37: Tag-based filtering**
  - **Validates: Requirements 12.5**

- [x] 19. Tag UI components
  - Create TagList server component for /tags page
  - Create TagBadge client component for displaying tags
  - Create TagFilter component for filtering questions by tag
  - Add tag display to QuestionCard and QuestionDetailView
  - _Requirements: 12.4, 12.5_

- [x] 20. Unanswered questions feature
  - Create Server Action to fetch unanswered questions (zero answers, approved only)
  - Implement sort by most recent
  - Create dynamic filter that updates when answers are added
  - Create Server Action to get unanswered count
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 20.1 Write property test for unanswered filter accuracy
  - **Property 45: Unanswered filter accuracy**
  - **Validates: Requirements 16.1**

- [x] 20.2 Write property test for unanswered sort order
  - **Property 46: Unanswered sort order**
  - **Validates: Requirements 16.2**

- [x] 20.3 Write property test for dynamic unanswered list updates
  - **Property 47: Dynamic unanswered list updates**
  - **Validates: Requirements 16.3**

- [x] 20.4 Write property test for unanswered status filter
  - **Property 48: Unanswered status filter**
  - **Validates: Requirements 16.4**

- [x] 20.5 Write property test for unanswered count accuracy
  - **Property 49: Unanswered count accuracy**
  - **Validates: Requirements 16.5**

- [x] 21. Unanswered questions UI
  - Create UnansweredQuestions page at /questions/unanswered
  - Display unanswered count in navigation
  - Reuse QuestionFeed component with unanswered filter
  - _Requirements: 16.1, 16.5_

- [x] 22. User directory implementation
  - Create Server Action to fetch users sorted by reputation
  - Implement pagination for user list
  - Create Server Action to fetch user profile with questions and answers
  - Ensure email exclusion from all user data responses
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 22.1 Write property test for users sorted by reputation
  - **Property 42: Users sorted by reputation**
  - **Validates: Requirements 15.1**

- [x] 22.2 Write property test for profile privacy preservation
  - **Property 6: Profile privacy preservation**
  - **Validates: Requirements 2.2, 15.2**

- [x] 22.3 Write property test for user profile page content
  - **Property 43: User profile page content**
  - **Validates: Requirements 15.4**

- [x] 22.4 Write property test for user list pagination
  - **Property 44: User list pagination**
  - **Validates: Requirements 15.5**

- [x] 23. User directory UI
  - Create UserList server component for /users page
  - Create UserProfileCard client component
  - Create UserProfilePage server component for /users/[pseudonym]
  - Implement pagination controls
  - Display user's questions and answers on profile page
  - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [x] 24. Hot questions algorithm
  - Create hot questions ranking utility function (combine views, votes, answers, recency)
  - Create Server Action to fetch top 5 hot questions (approved only)
  - Implement caching strategy for hot questions (refresh every 5 minutes)
  - _Requirements: 14.2, 14.3, 14.5_

- [x] 24.1 Write property test for hot questions ranking
  - **Property 40: Hot questions ranking**
  - **Validates: Requirements 14.2**

- [x] 24.2 Write property test for hot questions status filter
  - **Property 41: Hot questions status filter**
  - **Validates: Requirements 14.5**

- [x] 25. Hot questions widget
  - Create HotQuestionsWidget client component for right sidebar
  - Display top 5 hot questions with links
  - Add widget to RightSidebar
  - _Requirements: 14.1, 14.3, 14.4_

- [x] 26. Search functionality implementation
  - Create Server Action for searching questions by title and content
  - Implement tag-based search inclusion
  - Implement relevance ranking algorithm
  - Filter results to approved questions only
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 26.1 Write property test for search term matching
  - **Property 53: Search term matching**
  - **Validates: Requirements 20.1**

- [x] 26.2 Write property test for search relevance ranking
  - **Property 54: Search relevance ranking**
  - **Validates: Requirements 20.2**

- [x] 26.3 Write property test for search status filter
  - **Property 55: Search status filter**
  - **Validates: Requirements 20.3**

- [x] 26.4 Write property test for tag-based search inclusion
  - **Property 56: Tag-based search inclusion**
  - **Validates: Requirements 20.4**

- [x] 27. Search UI components
  - Create SearchBar client component with debounced input
  - Create SearchResults server component
  - Create search page at /search
  - Display "no results" message with suggestion to post new question
  - Add search bar to navigation header
  - _Requirements: 20.1, 20.5_

- [x] 28. Groq AI service implementation
  - Install and configure Groq SDK with API key
  - Create Groq service module with generateFAQ function
  - Implement system prompt for FAQ summarization
  - Configure llama3-70b-8192 model with JSON response format
  - Add error handling for API failures and rate limiting
  - _Requirements: 8.2, 8.3_

- [x] 28.1 Write property test for AI summarization
  - **Property 24: AI summarization for eligible questions**
  - **Validates: Requirements 8.2**

- [x] 28.2 Write property test for FAQ storage
  - **Property 25: FAQ storage with source reference**
  - **Validates: Requirements 8.4**

- [x] 29. FAQ generation cron job
  - Create API route at /api/cron/generate-faq
  - Implement authentication with CRON_SECRET
  - Implement query for eligible questions (last 24h, approved, has answer with votes > 0)
  - Iterate through questions and call Groq AI service
  - Store generated FAQs in AI_FAQ table with source question reference
  - Return success response with count of generated FAQs
  - _Requirements: 8.1, 8.4, 8.5_

- [x] 29.1 Write property test for eligible question selection
  - **Property 23: Eligible question selection**
  - **Validates: Requirements 8.1**

- [x] 30. Configure Vercel cron job
  - Create vercel.json with cron configuration
  - Set cron schedule to daily at midnight (0 0 * * *)
  - Configure CRON_SECRET environment variable
  - Test cron job execution
  - _Requirements: 8.1_

- [ ] 31. AI FAQ widget
  - Create AIFAQWidget client component for right sidebar
  - Create Server Action to fetch recent FAQs
  - Display latest 3-5 FAQ entries
  - Add widget to RightSidebar
  - _Requirements: 9.4_

- [ ] 32. Styling with Tailwind and Shadcn/UI
  - Configure Tailwind CSS with custom theme (Stack Overflow color scheme)
  - Install Shadcn/UI components (Button, Card, Input, Textarea, Badge, etc.)
  - Create custom component variants matching Stack Overflow aesthetic
  - Implement responsive breakpoints
  - Add Lucide React icons
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 19.1_

- [ ] 33. Error handling and validation
  - Implement Zod schemas for all Server Action inputs
  - Add client-side form validation
  - Create error boundary components
  - Implement toast notifications for user feedback
  - Add loading states for async operations
  - _Requirements: All_

- [ ] 34. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 35. Performance optimization
  - Add database indexes for frequently queried fields
  - Implement cursor-based pagination for large lists
  - Add Redis caching for hot questions and user reputation
  - Optimize images with Next.js Image component
  - Implement lazy loading for rich text editor
  - _Requirements: All_

- [ ] 36. Accessibility improvements
  - Add ARIA labels to interactive elements
  - Ensure keyboard navigation works throughout the app
  - Add focus indicators for all interactive elements
  - Test with screen readers
  - Ensure color contrast meets WCAG standards
  - _Requirements: All_

- [ ] 37. Final integration testing
  - Test complete user registration and onboarding flow
  - Test question posting with auto-approve enabled and disabled
  - Test answer posting and acceptance flow
  - Test voting and reputation updates
  - Test moderation queue workflow
  - Test search functionality
  - Test FAQ generation cron job
  - _Requirements: All_

- [ ] 38. Documentation
  - Create README with setup instructions
  - Document environment variables
  - Document database schema and migrations
  - Document API routes and Server Actions
  - Create deployment guide
  - _Requirements: All_
