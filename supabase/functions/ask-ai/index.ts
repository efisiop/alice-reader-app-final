// supabase/functions/ask-ai/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Request body interface
interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: string;
  bookId?: string;
  sectionId?: string;
  userId?: string;
  mode?: 'chat' | 'explain' | 'quiz' | 'simplify' | 'definition';
}

// Response body interface
interface ResponseBody {
  response: string;
  error?: string;
}

// Create Supabase client
const supabaseClient = (req: Request) => {
  // Get auth token from request headers
  const authHeader = req.headers.get('Authorization');
  const supabaseKey = authHeader ? authHeader.replace('Bearer ', '') : SUPABASE_SERVICE_ROLE_KEY;
  
  return createClient(SUPABASE_URL, supabaseKey);
};

// Get additional context from the database
async function getContext(supabase: any, bookId: string, sectionId?: string): Promise<string> {
  try {
    let context = '';
    
    // Get book details
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('title, author, description')
      .eq('id', bookId)
      .single();
    
    if (!bookError && bookData) {
      context += `Book: ${bookData.title} by ${bookData.author}\n`;
      context += `Description: ${bookData.description}\n\n`;
    }
    
    // Get section content if provided
    if (sectionId) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('title, content, chapters(title, number)')
        .eq('id', sectionId)
        .single();
      
      if (!sectionError && sectionData) {
        context += `Chapter: ${sectionData.chapters?.title || 'Unknown'}\n`;
        context += `Section: ${sectionData.title || 'Unknown'}\n`;
        context += `Content: ${sectionData.content?.substring(0, 1000) || 'No content available'}...\n`;
      }
    }
    
    return context;
  } catch (error) {
    console.error('Error getting context:', error);
    return '';
  }
}

// Log AI interaction to the database
async function logInteraction(
  supabase: any, 
  userId: string, 
  bookId: string, 
  prompt: string, 
  response: string, 
  sectionId?: string, 
  context?: string,
  interactionType: string = 'chat'
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
        response,
        interaction_type: interactionType,
        created_at: new Date().toISOString()
      });
    
    console.log('AI interaction logged successfully');
  } catch (error) {
    console.error('Error logging AI interaction:', error);
  }
}

// Generate system prompt based on mode
function generateSystemPrompt(mode: string, context: string): string {
  const basePrompt = `You are an AI reading assistant for the Alice Reader app. ${context ? 'Here is the context about what the user is reading:\n\n' + context + '\n\n' : ''}`;
  
  switch (mode) {
    case 'explain':
      return basePrompt + 'Explain the selected text in a clear, educational way. Focus on literary elements, themes, and historical context where relevant. Keep your explanation concise and accessible for a high school reading level.';
    
    case 'quiz':
      return basePrompt + 'Generate 3-5 quiz questions based on the text the user has selected. Include a mix of multiple-choice and short-answer questions. Provide the correct answers after each question.';
    
    case 'simplify':
      return basePrompt + 'Simplify the selected text to make it more accessible. Maintain the key ideas but use simpler vocabulary and sentence structure. Aim for a middle school reading level.';
    
    case 'definition':
      return basePrompt + 'Define the word or phrase the user is asking about. Provide a clear, concise definition that is appropriate to the context of the book. Include an example of usage if possible.';
    
    case 'chat':
    default:
      return basePrompt + 'Respond to the user\'s questions about the text in a helpful, educational manner. If you don\'t know the answer, say so clearly rather than making up information.';
  }
}

// Main handler function
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    
    // Parse request body
    const body: RequestBody = await req.json();
    const { messages, context, bookId, sectionId, userId, mode = 'chat' } = body;
    
    // Validate required fields
    if (!messages || !messages.length) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
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
    
    // Extract the user's prompt from the messages
    const userPrompt = messages.find(m => m.role === 'user')?.content || '';
    
    // Prepare messages for OpenAI
    const systemPrompt = generateSystemPrompt(mode, fullContext);
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    console.log(`Sending request to OpenAI API (${mode} mode)`);
    
    // Call OpenAI API
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: openAIMessages,
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
      console.error('OpenAI API error:', openAIData);
      throw new Error(openAIData.error?.message || 'Error calling OpenAI API');
    }
    
    const aiResponse = openAIData.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    
    // Log interaction if userId and bookId are provided
    if (userId && bookId) {
      await logInteraction(supabase, userId, bookId, userPrompt, aiResponse, sectionId, fullContext, mode);
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
    console.error('Error in ask-ai function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
