// src/services/supabaseClientRobust.js
import { ENV, createSupabaseClient } from '../config/env';

// Placeholder client until real one is initialized
let supabaseClient = null;

// Initialization promise
let initializationPromise = null;

// Initialize the Supabase client
export function initializeSupabase() {
  if (!initializationPromise) {
    initializationPromise = createSupabaseClient().then(client => {
      supabaseClient = client;
      return client;
    });
  }
  
  return initializationPromise;
}

// Safely get the Supabase client, initializing if needed
export async function getSupabase() {
  if (!supabaseClient) {
    return await initializeSupabase();
  }
  return supabaseClient;
}

// Use this for component initialization
export function useSupabaseClient() {
  if (!supabaseClient && typeof window !== 'undefined') {
    // Start initialization in background
    initializeSupabase();
  }
  
  return {
    // Safe wrapper around Supabase client methods
    async from(table) {
      const client = await getSupabase();
      if (!client) throw new Error('Failed to initialize Supabase client');
      return client.from(table);
    },
    
    async auth() {
      const client = await getSupabase();
      if (!client) throw new Error('Failed to initialize Supabase client');
      return client.auth;
    },
    
    // Add other methods as needed
  };
}

// Initialize Supabase immediately in the background
if (ENV.isConfigured()) {
  initializeSupabase();
}
