#!/bin/bash

# Deploy Edge Function to Supabase
# This script deploys the ask-ai Edge Function to Supabase

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    echo "You can install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
if ! supabase functions list &> /dev/null; then
    echo "You are not logged in to Supabase. Please login first."
    echo "You can login with: supabase login"
    exit 1
fi

# Deploy the Edge Function
echo "Deploying ask-ai Edge Function to Supabase..."
supabase functions deploy ask-ai

# Set secrets for the Edge Function
echo "Setting secrets for the Edge Function..."
echo "Please enter your OpenAI API key:"
read -s OPENAI_API_KEY

if [ -z "$OPENAI_API_KEY" ]; then
    echo "OpenAI API key is required. Aborting."
    exit 1
fi

supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"

echo "Edge Function deployed successfully!"
echo "You can test it with: supabase functions serve ask-ai"
