import { getSupabaseClient } from './supabaseClient';
import { Section, Chapter } from '../types/section';
import { fixAliceText } from '../utils/textUtils';

// Interface for section snippets
export interface SectionSnippet {
  id: string;
  number: number;
  preview: string;
}

class ReaderService {
  async getSection(sectionId: string): Promise<Section> {
    console.log('ReaderService: Getting section with ID:', sectionId);

    try {
      const supabase = await getSupabaseClient();

      // First attempt: Try to get the section with the chapter join
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
        console.error('ReaderService: Error fetching section with join:', error);
        throw error;
      }

      console.log('ReaderService: Section data received:', data);

      // Validate content
      if (!data || !data.content || data.content.trim() === '') {
        console.warn('ReaderService: Section content is empty or missing, trying direct content query');

        // Second attempt: Try to get just the content directly
        const { data: contentData, error: contentError } = await supabase
          .from('sections')
          .select('content')
          .eq('id', sectionId)
          .single();

        if (contentError) {
          console.error('ReaderService: Error fetching section content directly:', contentError);
          throw contentError;
        }

        if (!contentData || !contentData.content || contentData.content.trim() === '') {
          console.error('ReaderService: Section content is still empty after direct query');
          throw new Error('Section content is empty');
        }

        console.log('ReaderService: Retrieved content directly, length:', contentData.content.length);
        console.log('ReaderService: Content preview:', contentData.content.substring(0, 100));

        // Update the content in the original data
        data.content = contentData.content;
      }

      // Clean the text content to fix encoding issues
      const originalContent = data.content;
      const cleanedContent = fixAliceText(data.content);
      
      if (originalContent !== cleanedContent) {
        console.log('ReaderService: Text cleaning applied. Original length:', originalContent.length, 'Cleaned length:', cleanedContent.length);
      }
      
      data.content = cleanedContent;

      // Log content length for debugging
      console.log('ReaderService: Content length:', data.content.length);
      console.log('ReaderService: Content preview:', data.content.substring(0, 100));

      // Transform the data to match the Section interface
      const section: Section = {
        id: data.id,
        title: data.title,
        content: data.content,
        chapter: (data.chapter as any) || { id: '', title: '', number: 0 }
      };

      console.log('ReaderService: Transformed section:', section);
      return section;
    } catch (error) {
      console.error('ReaderService: Failed to get section:', error);
      throw error;
    }
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

    // Clean preview text in snippets
    const cleanedData = data?.map((snippet: any) => ({
      ...snippet,
      preview: fixAliceText(snippet.preview || '')
    })) || [];

    // Return empty array if no data
    return cleanedData;
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