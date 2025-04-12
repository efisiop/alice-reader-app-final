// supabase/functions/ai-assistant/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  prompt: string;
  context?: string;
  bookId?: string;
  sectionId?: string;
  userId?: string;
  mode?: 'explain' | 'quiz' | 'simplify' | 'chat';
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ResponseBody {
  response: string;
  error?: string;
}

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo';

// Supabase client for database operations
const supabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  });
};

// Function to get book and section context
async function getContext(supabase: any, bookId?: string, sectionId?: string) {
  let context = '';
  
  if (bookId) {
    // Get book information
    const { data: book } = await supabase
      .from('books')
      .select('title, author')
      .eq('id', bookId)
      .single();
    
    if (book) {
      context += `Book: ${book.title} by ${book.author}\n`;
    }
    
    if (sectionId) {
      // Get section and chapter information
      const { data: section } = await supabase
        .from('sections')
        .select(`
          title,
          content,
          chapters!inner (
            title,
            number
          )
        `)
        .eq('id', sectionId)
        .single();
      
      if (section) {
        context += `Chapter ${section.chapters.number}: ${section.chapters.title}\n`;
        context += `Section: ${section.title}\n\n`;
        context += `Content: ${section.content.substring(0, 1000)}...\n`;
      }
    }
  }
  
  return context;
}

// Function to log AI interaction
async function logInteraction(
  supabase: any, 
  userId: string, 
  bookId: string, 
  prompt: string, 
  response: string, 
  sectionId?: string, 
  context?: string
) {
  try {
    await supabase
      .from('ai_interactions')
      .insert({
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        question: prompt,
        context: context || null,
        response
      });
  } catch (error) {
    console.error('Error logging AI interaction:', error);
  }
}

// Function to generate system prompt based on mode
function generateSystemPrompt(mode: string, context: string) {
  const basePrompt = `You are an AI reading assistant for the Alice Reader app. ${context ? 'Here is the context about what the user is reading:\n\n' + context + '\n\n' : ''}`;
  
  switch (mode) {
    case 'explain':
      return basePrompt + 'Explain the selected text in a clear, educational way. Focus on literary elements, themes, and historical context where relevant. Keep your explanation concise and accessible for a high school reading level.';
    
    case 'quiz':
      return basePrompt + 'Generate 3-5 quiz questions based on the text the user has selected. Include a mix of multiple-choice and short-answer questions. Provide the correct answers after each question.';
    
    case 'simplify':
      return basePrompt + 'Simplify the selected text to make it more accessible. Maintain the key ideas but use simpler vocabulary and sentence structure. Aim for a middle school reading level.';
    
    case 'chat':
    default:
      return basePrompt + 'Respond to the user\'s questions about the text in a helpful, educational manner. If you don\'t know the answer, say so clearly rather than making up information.';
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { prompt, context, bookId, sectionId, userId, mode = 'chat', history = [] } = body;
    
    // Validate required fields
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Initialize Supabase client
    const supabase = supabaseClient(req);
    
    // Get additional context if needed
    let fullContext = context || '';
    if (bookId && !fullContext) {
      const additionalContext = await getContext(supabase, bookId, sectionId);
      fullContext += additionalContext;
    }
    
    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: generateSystemPrompt(mode, fullContext) },
      ...history,
      { role: 'user', content: prompt }
    ];
    
    // Call OpenAI API
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });
    
    // Parse OpenAI response
    const openAIData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      throw new Error(openAIData.error?.message || 'Error calling OpenAI API');
    }
    
    const aiResponse = openAIData.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    
    // Log interaction if userId and bookId are provided
    if (userId && bookId) {
      await logInteraction(supabase, userId, bookId, prompt, aiResponse, sectionId, fullContext);
    }
    
    // Return response
    const responseBody: ResponseBody = { response: aiResponse };
    
    return new Response(
      JSON.stringify(responseBody),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in AI assistant function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
