# AI Assistant Integration Guide

This guide explains how to use the AI Assistant in the Alice Reader app, including how to deploy the Edge Function, set up the OpenAI API key, and use the AI Assistant in the frontend.

## Overview

The AI Assistant provides contextual help for readers, allowing them to ask questions about the text they're reading and receive intelligent responses. The assistant uses OpenAI's GPT models through a secure Supabase Edge Function, ensuring that API keys are never exposed to the client.

## Architecture

The AI Assistant integration consists of the following components:

1. **Frontend Components**: 
   - AIChat.tsx: The main chat interface
   - AIDrawer.tsx: The drawer that contains the chat interface
   - AIButton.tsx: The button that opens the drawer

2. **Backend Services**:
   - aiService.ts: The service that handles AI interactions
   - ask-ai Edge Function: The Supabase Edge Function that calls the OpenAI API

3. **Database Tables**:
   - ai_interactions: Stores all AI interactions for analytics and personalization

## Deploying the Edge Function

### Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Get an OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Deployment

1. Deploy the Edge Function:
   ```bash
   npm run edge:deploy
   ```

2. When prompted, enter your OpenAI API key.

3. Verify the deployment:
   ```bash
   supabase functions list
   ```

## Using the AI Assistant in the Frontend

### Basic Usage

```typescript
import { createConversation, sendMessageToAI } from '../services/aiService';
import { AIModes } from '../constants';

// Create a new conversation
const conversation = await createConversation(userId, bookId, sectionId);

// Send a message to the AI
const { response, conversation: updatedConversation } = await sendMessageToAI(
  conversation,
  "What is the main theme of this chapter?",
  selectedText, // Optional context
  AIModes.CHAT // Mode: CHAT, EXPLAIN, QUIZ, SIMPLIFY, DEFINITION
);

// The response contains the AI's answer
console.log(response);

// The updatedConversation contains the full conversation history
console.log(updatedConversation.messages);
```

### AI Modes

The AI Assistant supports different modes for different types of assistance:

1. **CHAT**: General conversation about the text
2. **EXPLAIN**: Detailed explanation of a selected passage
3. **QUIZ**: Generate quiz questions based on the text
4. **SIMPLIFY**: Simplify complex text for easier understanding
5. **DEFINITION**: Define a word or phrase in context

Example:

```typescript
// Explain a selected passage
const { response } = await sendMessageToAI(
  conversation,
  "Please explain this passage",
  selectedText,
  AIModes.EXPLAIN
);
```

### Getting Word Definitions

The AI Assistant can also provide contextual word definitions:

```typescript
import { getWordDefinition } from '../services/aiService';

// Get a definition for a word in context
const definition = await getWordDefinition(
  word,
  context, // Surrounding text for context
  userId,
  bookId,
  sectionId
);
```

## Analytics and Personalization

The AI Assistant logs all interactions to the `ai_interactions` table, which can be used for analytics and personalization.

### Getting AI Interaction Stats

```typescript
import { getAIInteractionStats } from '../services/aiService';

// Get stats for a user's interactions with a book
const stats = await getAIInteractionStats(userId, bookId);

// stats.stats contains aggregated statistics
console.log(stats.stats);

// stats.recentInteractions contains the most recent interactions
console.log(stats.recentInteractions);
```

### Checking if a User Needs Help

The AI Assistant can also detect if a user might need additional help:

```typescript
import { checkIfUserNeedsHelp } from '../services/aiService';

// Check if the user needs help
const { needsHelp, reason } = await checkIfUserNeedsHelp(userId, bookId, sectionId);

if (needsHelp) {
  // Offer to connect the user with a consultant
  console.log(reason);
}
```

## Security Considerations

1. **API Key Protection**: The OpenAI API key is stored as a secret in the Supabase Edge Function and is never exposed to the client.

2. **Rate Limiting**: The Edge Function includes rate limiting to prevent abuse.

3. **Input Validation**: All user input is validated before being sent to the OpenAI API.

4. **Error Handling**: Comprehensive error handling ensures that errors are properly logged and user-friendly error messages are displayed.

## Troubleshooting

If the AI Assistant is not working correctly, check the following:

1. **Edge Function Deployment**: Verify that the Edge Function is deployed correctly:
   ```bash
   supabase functions list
   ```

2. **OpenAI API Key**: Verify that the OpenAI API key is set correctly:
   ```bash
   supabase secrets list
   ```

3. **Network Issues**: Check if there are any network issues preventing the Edge Function from calling the OpenAI API.

4. **Logs**: Check the Edge Function logs for any errors:
   ```bash
   supabase functions logs ask-ai
   ```

## Extending the AI Assistant

To extend the AI Assistant:

1. **Add New Modes**: Add new modes to the `AIModes` constant in `constants/index.ts` and update the `generateSystemPrompt` function in the Edge Function.

2. **Enhance Context**: Improve the context provided to the AI by adding more information from the database.

3. **Personalization**: Use the user's interaction history to personalize the AI's responses.

4. **Integration with Other Services**: Integrate the AI Assistant with other services, such as the Dictionary Service, to provide more comprehensive assistance.
