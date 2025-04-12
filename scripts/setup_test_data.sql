-- Setup test data for Alice Reader application

-- Insert test book
INSERT INTO books (id, title, author, description, total_pages)
VALUES (
  'alice-in-wonderland', 
  'Alice in Wonderland', 
  'Lewis Carroll', 
  'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
  100
) ON CONFLICT (id) DO NOTHING;

-- Insert test verification codes
INSERT INTO verification_codes (code, book_id, is_used)
VALUES 
  ('ALICE123', 'alice-in-wonderland', false),
  ('WONDERLAND', 'alice-in-wonderland', false),
  ('RABBIT', 'alice-in-wonderland', false),
  ('TEAPARTY', 'alice-in-wonderland', false),
  ('CHESHIRE', 'alice-in-wonderland', false)
ON CONFLICT (code) DO NOTHING;

-- Insert sample chapters
INSERT INTO chapters (id, book_id, title, number)
VALUES
  ('chapter-1', 'alice-in-wonderland', 'Down the Rabbit-Hole', 1),
  ('chapter-2', 'alice-in-wonderland', 'The Pool of Tears', 2),
  ('chapter-3', 'alice-in-wonderland', 'A Caucus-Race and a Long Tale', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample sections for Chapter 1
INSERT INTO sections (id, chapter_id, title, content, start_page, end_page, number)
VALUES
  ('chapter-1-section-1', 'chapter-1', 'Beginning', 
   'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, ''and what is the use of a book,'' thought Alice ''without pictures or conversations?''

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
   1, 3, 1),
  
  ('chapter-1-section-2', 'chapter-1', 'The Rabbit',
   'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, ''Oh dear! Oh dear! I shall be late!'' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.',
   4, 6, 2),
  
  ('chapter-1-section-3', 'chapter-1', 'Down the Hole',
   'In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled ''ORANGE MARMALADE'', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.',
   7, 10, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample sections for Chapter 2
INSERT INTO sections (id, chapter_id, title, content, start_page, end_page, number)
VALUES
  ('chapter-2-section-1', 'chapter-2', 'Curiouser and Curiouser',
   '''Curiouser and curiouser!'' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); ''now I''m opening out like the largest telescope that ever was! Good-bye, feet!'' (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). ''Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I''m sure I shan''t be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can; —but I must be kind to them,'' thought Alice, ''or perhaps they won''t walk the way I want to go! Let me see: I''ll give them a new pair of boots every Christmas.''',
   11, 14, 1),
  
  ('chapter-2-section-2', 'chapter-2', 'The White Rabbit Again',
   'And she went on planning to herself how she would manage it. ''They must go by the carrier,'' she thought; ''and how funny it''ll seem, sending presents to one''s own feet! And how odd the directions will look!

Alice''s Right Foot, Esq.
  Hearthrug,
    near the Fender,
      (with Alice''s love).

Oh dear, what nonsense I''m talking!''

Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.

Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.',
   15, 18, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample sections for Chapter 3
INSERT INTO sections (id, chapter_id, title, content, start_page, end_page, number)
VALUES
  ('chapter-3-section-1', 'chapter-3', 'The Mouse',
   '''O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!'' (Alice thought this must be the right way of speaking to a mouse: she had never done such a thing before, but she remembered having seen in her brother''s Latin Grammar, ''A mouse—of a mouse—to a mouse—a mouse—O mouse!''). The Mouse looked at her rather inquisitively, and seemed to her to wink with one of its little eyes, but it said nothing.

''Perhaps it doesn''t understand English,'' thought Alice; ''I daresay it''s a French mouse, come over with William the Conqueror.'' (For, with all her knowledge of history, Alice had no very clear notion how long ago anything had happened.) So she began again: ''Où est ma chatte?'' which was the first sentence in her French lesson-book. The Mouse gave a sudden leap out of the water, and seemed to quiver all over with fright. ''Oh, I beg your pardon!'' cried Alice hastily, afraid that she had hurt the poor animal''s feelings. ''I quite forgot you didn''t like cats.''',
   19, 22, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample dictionary terms
INSERT INTO dictionary (book_id, term, definition)
VALUES
  ('alice-in-wonderland', 'Alice', 'The curious and imaginative protagonist of the story.'),
  ('alice-in-wonderland', 'Rabbit', 'A white rabbit with pink eyes that Alice follows down the rabbit hole.'),
  ('alice-in-wonderland', 'Wonderland', 'The magical world that Alice discovers after falling down the rabbit hole.'),
  ('alice-in-wonderland', 'Cheshire', 'Relating to the Cheshire Cat, a mysterious feline known for its distinctive grin.')
ON CONFLICT (book_id, term, chapter_id, section_id) DO NOTHING;

-- Insert chapter-specific dictionary terms
INSERT INTO dictionary (book_id, chapter_id, term, definition)
VALUES
  ('alice-in-wonderland', 'chapter-1', 'rabbit-hole', 'The entrance to Wonderland, symbolizing the passage from the real world to a fantastical realm.'),
  ('alice-in-wonderland', 'chapter-2', 'telescope', 'Used as a metaphor for Alice growing taller, comparing her body to an extending telescope.')
ON CONFLICT (book_id, term, chapter_id, section_id) DO NOTHING;

-- Insert section-specific dictionary terms
INSERT INTO dictionary (book_id, chapter_id, section_id, term, definition)
VALUES
  ('alice-in-wonderland', 'chapter-1', 'chapter-1-section-3', 'ORANGE MARMALADE', 'A sweet preserve made from oranges that Alice finds in a jar during her fall.'),
  ('alice-in-wonderland', 'chapter-2', 'chapter-2-section-1', 'Curiouser', 'A made-up comparative form of "curious" that Alice uses, showing her confusion and wonder.')
ON CONFLICT (book_id, term, chapter_id, section_id) DO NOTHING;

-- Insert sample AI prompts
INSERT INTO ai_prompts (prompt_text, prompt_type, active)
VALUES
  ('How are you enjoying the story so far?', 'engagement', true),
  ('What do you think will happen next to Alice?', 'prediction', true),
  ('Which character do you find most interesting?', 'reflection', true),
  ('What would you do if you were in Alice''s situation?', 'personal', true)
ON CONFLICT DO NOTHING;
