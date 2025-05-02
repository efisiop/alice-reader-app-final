import { getSupabaseClient } from './supabaseClient';
import { Section, Chapter } from '../types/section';

// Interface for section snippets
export interface SectionSnippet {
  id: string;
  number: number;
  preview: string;
}

class ReaderService {
  async getSection(sectionId: string): Promise<Section> {
    console.log('ReaderService: Getting section with ID:', sectionId);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('sections')
      .select(`
        id,
        title,
        content,
        chapter:chapter_id (
          id,
          title,
          number
        )
      `)
      .eq('id', sectionId)
      .single();

    if (error) {
      console.error('ReaderService: Error fetching section:', error);
      throw error;
    }

    console.log('ReaderService: Section data received:', data);

    // Transform the data to match the Section interface
    // The chapter comes back as an object from the join
    const section: Section = {
      id: data.id,
      title: data.title,
      content: data.content,
      chapter: data.chapter || {} as Chapter
    };

    console.log('ReaderService: Transformed section:', section);
    return section;
  }

  async getSectionSnippetsForPage(bookId: string, pageNumber: number): Promise<SectionSnippet[]> {
    console.log('ReaderService: Getting section snippets for book:', bookId, 'page:', pageNumber);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .rpc('get_section_snippets_for_page', {
        book_id_param: bookId,
        page_number_param: pageNumber
      });

    if (error) {
      console.error('ReaderService: Error fetching section snippets:', error);
      throw error;
    }

    console.log('ReaderService: Section snippets received:', data);

    // Return empty array if no data
    return data || [];
  }

  async requestHelp(sectionId: string): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('help_requests')
      .insert({
        section_id: sectionId,
        status: 'PENDING',
      });

    if (error) throw error;
  }
}

export const readerService = new ReaderService();