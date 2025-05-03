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
    console.log(`readerService: Fetching section with ID: ${sectionId}`);

    try {
      const supabase = await getSupabaseClient();

      // First attempt - using standard query
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

      if (error) {
        console.error(`readerService: Error fetching section ${sectionId}:`, error);
        throw error;
      }

      if (!data) {
        console.error(`readerService: No data returned for section ${sectionId}`);
        throw new Error(`Section ${sectionId} not found`);
      }

      console.log(`readerService: Raw section data:`, data);

      // Transform the data to match the Section interface
      // Handle different possible structures of the chapter data
      let chapterData: Chapter;

      if (data.chapter) {
        if (Array.isArray(data.chapter)) {
          // If chapter is an array, use the first item
          chapterData = data.chapter.length > 0 ? data.chapter[0] : { id: '', title: '' };
        } else {
          // If chapter is already an object, use it directly
          chapterData = data.chapter;
        }
      } else {
        // If no chapter data, use empty object
        chapterData = { id: '', title: '' };
      }

      const section: Section = {
        id: data.id,
        title: data.title || '',
        content: data.content || '',
        chapter: chapterData
      };

      console.log(`readerService: Processed section data:`, section);
      return section;
    } catch (error) {
      console.error(`readerService: Failed to fetch section ${sectionId}:`, error);

      // Try alternative approach - direct RPC call if available
      try {
        console.log(`readerService: Attempting alternative fetch for section ${sectionId}`);
        const supabase = await getSupabaseClient();

        const { data, error } = await supabase
          .rpc('get_section_by_id', { section_id_param: sectionId });

        if (error) {
          console.error(`readerService: Alternative fetch also failed:`, error);
          throw error;
        }

        if (!data) {
          throw new Error(`Section ${sectionId} not found (alternative method)`);
        }

        console.log(`readerService: Alternative fetch successful:`, data);

        // Transform the data to match the Section interface
        const section: Section = {
          id: data.id,
          title: data.title || '',
          content: data.content || '',
          chapter: {
            id: data.chapter_id || '',
            title: data.chapter_title || ''
          }
        };

        return section;
      } catch (fallbackError) {
        console.error(`readerService: All section fetch methods failed:`, fallbackError);
        throw fallbackError;
      }
    }
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