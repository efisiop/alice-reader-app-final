import { supabase } from './supabaseClient';
import { Section } from '../types/section';

class ReaderService {
  async getSection(sectionId: string): Promise<Section> {
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
    return data;
  }

  async requestHelp(sectionId: string): Promise<void> {
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