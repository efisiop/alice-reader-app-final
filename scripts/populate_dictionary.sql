-- Populate Dictionary Table with Sample Data for Alice in Wonderland
-- This script adds contextual definitions for terms in Alice in Wonderland

-- First, ensure we have the book ID
DO $$
DECLARE
  v_book_id UUID;
  v_chapter1_id UUID;
  v_chapter2_id UUID;
  v_chapter3_id UUID;
  v_section1_1_id UUID;
  v_section1_2_id UUID;
  v_section2_1_id UUID;
BEGIN
  -- Get the book ID
  SELECT id INTO v_book_id FROM books WHERE title = 'Alice in Wonderland';
  
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book "Alice in Wonderland" not found';
  END IF;
  
  -- Get chapter IDs
  SELECT id INTO v_chapter1_id FROM chapters WHERE book_id = v_book_id AND number = 1;
  SELECT id INTO v_chapter2_id FROM chapters WHERE book_id = v_book_id AND number = 2;
  SELECT id INTO v_chapter3_id FROM chapters WHERE book_id = v_book_id AND number = 3;
  
  -- Get section IDs
  SELECT id INTO v_section1_1_id FROM sections WHERE chapter_id = v_chapter1_id AND number = 1;
  SELECT id INTO v_section1_2_id FROM sections WHERE chapter_id = v_chapter1_id AND number = 2;
  SELECT id INTO v_section2_1_id FROM sections WHERE chapter_id = v_chapter2_id AND number = 1;
  
  -- Insert book-level definitions (general terms)
  INSERT INTO dictionary (book_id, term, definition)
  VALUES
    (v_book_id, 'Alice', 'The curious and imaginative protagonist of the story.'),
    (v_book_id, 'Wonderland', 'The magical world that Alice discovers after falling down the rabbit hole.'),
    (v_book_id, 'Rabbit', 'A white rabbit with pink eyes that Alice follows down the rabbit hole.'),
    (v_book_id, 'Cheshire Cat', 'A mysterious feline known for its distinctive grin that can appear and disappear independently of the rest of its body.'),
    (v_book_id, 'Mad Hatter', 'An eccentric character who is trapped in a perpetual tea party.'),
    (v_book_id, 'Queen of Hearts', 'The primary antagonist of the story, known for her frequent orders for beheadings.'),
    (v_book_id, 'Dormouse', 'A sleepy rodent who attends the Mad Hatter''s tea party.'),
    (v_book_id, 'Caterpillar', 'A wise but cryptic insect who sits on a mushroom and smokes a hookah.'),
    (v_book_id, 'Duchess', 'An ill-tempered noblewoman with an extremely ugly baby that turns into a pig.'),
    (v_book_id, 'Mock Turtle', 'A melancholy creature who was once a real turtle.')
  ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
  SET definition = EXCLUDED.definition;
  
  -- Insert chapter-specific definitions (terms that have special meaning in specific chapters)
  IF v_chapter1_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, term, definition)
    VALUES
      (v_book_id, v_chapter1_id, 'rabbit-hole', 'The entrance to Wonderland, symbolizing the passage from the real world to a fantastical realm.'),
      (v_book_id, v_chapter1_id, 'curious', 'In Chapter 1, this refers to Alice''s inquisitive nature that leads her to follow the White Rabbit.'),
      (v_book_id, v_chapter1_id, 'falling', 'Alice''s extended descent down the rabbit hole, representing her transition into Wonderland.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  IF v_chapter2_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, term, definition)
    VALUES
      (v_book_id, v_chapter2_id, 'telescope', 'Used as a metaphor for Alice growing taller, comparing her body to an extending telescope.'),
      (v_book_id, v_chapter2_id, 'pool of tears', 'A body of water created by Alice''s crying when she was nine feet tall.'),
      (v_book_id, v_chapter2_id, 'key', 'A small golden key that Alice finds, which unlocks the door to the beautiful garden.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  IF v_chapter3_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, term, definition)
    VALUES
      (v_book_id, v_chapter3_id, 'caucus race', 'A chaotic race organized by the Dodo to get dry, where everyone runs in patterns with no clear start or finish.'),
      (v_book_id, v_chapter3_id, 'comfits', 'Small sugar-coated candies or sweets given as prizes after the caucus race.'),
      (v_book_id, v_chapter3_id, 'Dodo', 'A character who organizes the caucus race, possibly representing Lewis Carroll himself.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  -- Insert section-specific definitions (terms that have very specific context in certain sections)
  IF v_section1_1_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, section_id, term, definition)
    VALUES
      (v_book_id, v_chapter1_id, v_section1_1_id, 'waistcoat-pocket', 'The pocket of the White Rabbit''s waistcoat where he keeps his watch.'),
      (v_book_id, v_chapter1_id, v_section1_1_id, 'burning with curiosity', 'Alice''s intense desire to know why the Rabbit was in a hurry, which led her to follow him.'),
      (v_book_id, v_chapter1_id, v_section1_1_id, 'remarkable', 'In this section, refers to Alice''s realization that seeing a rabbit with a watch was unusual.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  IF v_section1_2_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, section_id, term, definition)
    VALUES
      (v_book_id, v_chapter1_id, v_section1_2_id, 'ORANGE MARMALADE', 'A sweet preserve made from oranges that Alice finds in a jar during her fall.'),
      (v_book_id, v_chapter1_id, v_section1_2_id, 'latitude', 'A geographical term Alice uses while falling, showing her attempt to apply school knowledge to her strange situation.'),
      (v_book_id, v_chapter1_id, v_section1_2_id, 'longitude', 'Another geographical term Alice uses, paired with latitude, as she tries to sound knowledgeable during her fall.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  IF v_section2_1_id IS NOT NULL THEN
    INSERT INTO dictionary (book_id, chapter_id, section_id, term, definition)
    VALUES
      (v_book_id, v_chapter2_id, v_section2_1_id, 'Curiouser', 'A made-up comparative form of "curious" that Alice uses, showing her confusion and wonder.'),
      (v_book_id, v_chapter2_id, v_section2_1_id, 'EAT ME', 'Instructions written on a cake that Alice finds, which causes her to grow when eaten.'),
      (v_book_id, v_chapter2_id, v_section2_1_id, 'DRINK ME', 'Instructions on a bottle that Alice finds, which causes her to shrink when consumed.')
    ON CONFLICT (book_id, term, chapter_id, section_id) DO UPDATE
    SET definition = EXCLUDED.definition;
  END IF;
  
  RAISE NOTICE 'Dictionary populated successfully with contextual definitions for Alice in Wonderland';
END $$;
