# SMVITM Technical Forum

A Stack Overflow-style Q&A platform for SMVITM students with anonymous identity through pseudonyms and AI-powered FAQ generation.

## Features

- **Anonymous Identity**: Users interact via unique pseudonyms
- **Q&A System**: Post questions, provide answers, vote, and accept solutions
- **Moderation**: Dual-mode moderation (auto-approve or manual review)
- **AI-Powered FAQs**: Automatic FAQ generation using Groq AI
- **Reputation System**: Earn reputation through quality contributions
- **Rich Text Editor**: Code blocks with syntax highlighting
- **Search**: Full-text search across questions and tags

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, React Server Components)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **ORM**: Prisma
- **AI**: Groq Cloud (llama3-70b-8192)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Rich Text**: Tiptap
- **Testing**: Vitest + fast-check (property-based testing)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Groq API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── actions/           # Server Actions
│   ├── api/               # API routes
│   └── (routes)/          # Page routes
├── components/            # React components
├── lib/                   # Utility functions and services
├── prisma/               # Database schema and migrations
└── tests/                # Test files
```

## Testing

Run unit tests:
```bash
npm test
```

Run property-based tests:
```bash
npm test -- --grep "Property"
```

## Deployment

This project is optimized for deployment on Vercel with Supabase as the database provider.

## License

MIT
