// src/data/fallbackBookData.ts

import { BookWithChapters } from '../types/supabase';

export const ALICE_BOOK_ID = 'alice-in-wonderland';
export const ALICE_MOCK_ID = '550e8400-e29b-41d4-a716-446655440000';

export const fallbackBookData: BookWithChapters = {
  id: ALICE_BOOK_ID,
  title: 'Alice in Wonderland',
  author: 'Lewis Carroll',
  description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
  cover_image_url: null,
  total_pages: 100,
  created_at: new Date().toISOString(),
  chapters: [
    {
      id: '1',
      book_id: ALICE_BOOK_ID,
      title: 'Down the Rabbit-Hole',
      number: 1,
      created_at: new Date().toISOString(),
      sections: [
        {
          id: '1-1',
          chapter_id: '1',
          title: 'Beginning',
          content: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
          start_page: 1,
          end_page: 3,
          number: 1,
          created_at: new Date().toISOString()
        },
        {
          id: '1-2',
          chapter_id: '1',
          title: 'The Rabbit',
          content: 'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.',
          start_page: 4,
          end_page: 6,
          number: 2,
          created_at: new Date().toISOString()
        },
        {
          id: '1-3',
          chapter_id: '1',
          title: 'Down the Hole',
          content: 'In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.',
          start_page: 7,
          end_page: 10,
          number: 3,
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      id: '2',
      book_id: ALICE_BOOK_ID,
      title: 'The Pool of Tears',
      number: 2,
      created_at: new Date().toISOString(),
      sections: [
        {
          id: '2-1',
          chapter_id: '2',
          title: 'Curiouser and Curiouser',
          content: '"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); "now I\'m opening out like the largest telescope that ever was! Good-bye, feet!"',
          start_page: 11,
          end_page: 14,
          number: 1,
          created_at: new Date().toISOString()
        },
        {
          id: '2-2',
          chapter_id: '2',
          title: 'The White Rabbit Again',
          content: 'And she went on planning to herself how she would manage it. "They must go by the carrier," she thought; "and how funny it\'ll seem, sending presents to one\'s own feet!"',
          start_page: 15,
          end_page: 18,
          number: 2,
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      id: '3',
      book_id: ALICE_BOOK_ID,
      title: 'A Caucus-Race and a Long Tale',
      number: 3,
      created_at: new Date().toISOString(),
      sections: [
        {
          id: '3-1',
          chapter_id: '3',
          title: 'The Mouse',
          content: '"O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!" Alice thought this must be the right way of speaking to a mouse.',
          start_page: 19,
          end_page: 22,
          number: 1,
          created_at: new Date().toISOString()
        },
        {
          id: '3-2',
          chapter_id: '3',
          title: 'The Caucus-Race',
          content: 'They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.',
          start_page: 23,
          end_page: 26,
          number: 2,
          created_at: new Date().toISOString()
        }
      ]
    }
  ]
};

// Use this in bookService.ts as fallback
export function getFallbackBook(): BookWithChapters {
  return JSON.parse(JSON.stringify(fallbackBookData));
}
