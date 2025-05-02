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
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('sections')
      .select(`
        id,
        title,
        content,
        chapter:chapter_id (
          id,
          title
        )
      `)
      .eq('id', sectionId)
      .single();

    if (error) throw error;

    // Transform the data to match the Section interface
    // The chapter comes back as an object from the join
    const section: Section = {
      id: data.id,
      title: data.title,
      content: data.content,
      chapter: data.chapter || {} as Chapter
    };

    return section;
  }

  async getSectionSnippetsForPage(bookId: string, pageNumber: number): Promise<SectionSnippet[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .rpc('get_section_snippets_for_page', {
        book_id_param: bookId,
        page_number_param: pageNumber
      });

    if (error) throw error;

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