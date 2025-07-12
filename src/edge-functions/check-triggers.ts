// src/edge-functions/check-triggers.ts
// This file is intended to be deployed as a Supabase Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TriggerCheckRequest {
  userId: string;
  bookId: string;
  sectionId?: string;
}

interface TriggerCheckResponse {
  hasTriggers: boolean;
  count: number;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the request body
    const { userId, bookId, sectionId } = await req.json() as TriggerCheckRequest;

    if (!userId || !bookId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for unprocessed triggers
    const { data, error, count } = await supabaseClient
      .from('consultant_triggers')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_processed', false);

    if (error) {
      console.error('Error checking for triggers:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to check for triggers' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the response
    const response: TriggerCheckResponse = {
      hasTriggers: (count ?? 0) > 0,
      count: count ?? 0
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
