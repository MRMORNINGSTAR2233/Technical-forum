import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface FAQInput {
  questionTitle: string;
  questionContent: string;
  answerContent: string;
  questionId: string;
}

export interface FAQOutput {
  question: string;
  answer: string;
  tags: string[];
}

/**
 * Generate FAQ from question and answer using Groq AI
 * Uses llama3-70b-8192 model with JSON response format
 */
export async function generateFAQ(input: FAQInput): Promise<FAQOutput | null> {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return null;
    }

    const systemPrompt = `You are a technical documentation expert. Your task is to summarize question-answer pairs into clean, generic FAQ entries.

Rules:
1. Rephrase the question to be more generic and broadly applicable
2. Summarize the answer concisely while preserving key technical details
3. Extract 2-4 relevant tags (lowercase, single words or hyphenated phrases)
4. Return ONLY valid JSON in this exact format: {"question": "...", "answer": "...", "tags": ["tag1", "tag2"]}
5. Keep the FAQ professional and technical`;

    const userPrompt = `Question: ${input.questionTitle}

${input.questionContent}

Answer: ${input.answerContent}

Generate a generic FAQ entry from this Q&A pair.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in Groq response');
      return null;
    }

    // Parse JSON response
    const faqOutput = JSON.parse(content) as FAQOutput;

    // Validate response structure
    if (!faqOutput.question || !faqOutput.answer || !Array.isArray(faqOutput.tags)) {
      console.error('Invalid FAQ output structure:', faqOutput);
      return null;
    }

    return faqOutput;
  } catch (error) {
    console.error('Error generating FAQ with Groq:', error);
    
    // Handle rate limiting
    if (error instanceof Error && error.message.includes('rate_limit')) {
      console.error('Groq API rate limit exceeded');
    }
    
    return null;
  }
}

/**
 * Test if Groq API is configured and working
 */
export async function testGroqConnection(): Promise<boolean> {
  try {
    if (!process.env.GROQ_API_KEY) {
      return false;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama3-70b-8192',
      max_tokens: 10,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('Groq connection test failed:', error);
    return false;
  }
}
