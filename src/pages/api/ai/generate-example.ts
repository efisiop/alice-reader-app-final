import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, definition, context, type = 'simple' } = req.body;

    let prompt;
    if (type === 'detailed') {
      prompt = `Analyze the word "${word}" (which means: ${definition}) in the context of Alice in Wonderland.
      Provide a detailed analysis that includes:
      1. How this word might be used in the story
      2. Its significance in Victorian English
      3. Any interesting connections to the story's themes
      4. A simple example of how a modern reader might use this word
      Keep the analysis friendly and engaging, as if explaining to a friend.`;
    } else {
      prompt = `Generate a simple, clear example sentence using the word "${word}" (which means: ${definition}). 
      The example should be easy to understand and show how the word is used in everyday language. 
      Keep it short and natural.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: type === 'detailed' 
            ? "You are a friendly and knowledgeable assistant that provides engaging analysis of words in the context of Alice in Wonderland."
            : "You are a helpful assistant that generates clear, simple example sentences for dictionary definitions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: type === 'detailed' ? 300 : 100,
      temperature: 0.7,
    });

    const example = completion.choices[0]?.message?.content?.trim() || null;

    if (!example) {
      throw new Error('Failed to generate response');
    }

    res.status(200).json({ example });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
} 