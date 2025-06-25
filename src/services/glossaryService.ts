import { createClient } from '@supabase/supabase-js';
import { appLog } from '../components/LogViewer';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials for glossary service');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  source_sentence?: string;
  example?: string;
  chapter_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface GlossaryServiceInterface {
  getAllGlossaryTerms: () => Promise<Set<string>>;
  getGlossaryTerms: () => Promise<GlossaryTerm[]>;
  getGlossaryDefinition: (term: string) => Promise<GlossaryTerm | null>;
  searchGlossaryTerms: (searchTerm: string, limit?: number) => Promise<GlossaryTerm[]>;
  getTermCount: () => Promise<number>;
}

class GlossaryService implements GlossaryServiceInterface {
  private termsCache: Set<string> | null = null;
  private termsDataCache: GlossaryTerm[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all glossary terms as a Set for fast lookup
   */
  async getAllGlossaryTerms(): Promise<Set<string>> {
    // Check cache first
    if (this.termsCache && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      appLog('GlossaryService', 'Returning cached glossary terms', 'debug', { 
        count: this.termsCache.size 
      });
      return this.termsCache;
    }

    try {
      appLog('GlossaryService', 'Fetching glossary terms from Supabase', 'info');
      
      const { data, error, count } = await supabase
        .from('alice_glossary')
        .select('term')
        .order('term');

      if (error) {
        appLog('GlossaryService', 'Error fetching glossary terms', 'error', error);
        throw new Error(`Failed to fetch glossary terms: ${error.message}`);
      }

      // Create a Set with all terms in various case forms
      const termsSet = new Set<string>();
      
      if (data && data.length > 0) {
        data.forEach(item => {
          const term = item.term;
          if (term) {
            // Add the original term
            termsSet.add(term);
            
            // Add lowercase version
            termsSet.add(term.toLowerCase());
            
            // Add capitalized version
            termsSet.add(term.charAt(0).toUpperCase() + term.slice(1));
            
            // Add title case version for multi-word terms
            if (term.includes(' ')) {
              const titleCase = term.split(' ').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              termsSet.add(titleCase);
            }
          }
        });
      }

      // Update cache
      this.termsCache = termsSet;
      this.lastFetchTime = Date.now();

      appLog('GlossaryService', `Successfully loaded ${termsSet.size} glossary terms`, 'success', {
        originalCount: data?.length || 0,
        totalVariations: termsSet.size
      });

      return termsSet;
    } catch (error) {
      appLog('GlossaryService', 'Failed to fetch glossary terms', 'error', error);
      // Return empty set on error
      return new Set<string>();
    }
  }

  /**
   * Get all glossary terms with full data
   */
  async getGlossaryTerms(): Promise<GlossaryTerm[]> {
    // Check cache first
    if (this.termsDataCache && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return this.termsDataCache;
    }

    try {
      appLog('GlossaryService', 'Fetching full glossary data from Supabase', 'info');
      
      const { data, error } = await supabase
        .from('alice_glossary')
        .select('*')
        .order('term');

      if (error) {
        appLog('GlossaryService', 'Error fetching glossary data', 'error', error);
        throw new Error(`Failed to fetch glossary data: ${error.message}`);
      }

      // Update cache
      this.termsDataCache = data || [];
      this.lastFetchTime = Date.now();

      appLog('GlossaryService', `Successfully loaded ${data?.length || 0} glossary entries`, 'success');
      return data || [];
    } catch (error) {
      appLog('GlossaryService', 'Failed to fetch glossary data', 'error', error);
      return [];
    }
  }

  /**
   * Get a specific glossary definition
   */
  async getGlossaryDefinition(term: string): Promise<GlossaryTerm | null> {
    try {
      const { data, error } = await supabase
        .from('alice_glossary')
        .select('*')
        .or(`term.eq.${term},term.eq.${term.toLowerCase()},term.eq.${term.charAt(0).toUpperCase() + term.slice(1)}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        appLog('GlossaryService', 'Error fetching glossary definition', 'error', error);
        throw new Error(`Failed to fetch glossary definition: ${error.message}`);
      }

      return data;
    } catch (error) {
      appLog('GlossaryService', 'Failed to fetch glossary definition', 'error', error);
      return null;
    }
  }

  /**
   * Search glossary terms
   */
  async searchGlossaryTerms(searchTerm: string, limit: number = 10): Promise<GlossaryTerm[]> {
    try {
      const { data, error } = await supabase
        .from('alice_glossary')
        .select('*')
        .or(`term.ilike.%${searchTerm}%,definition.ilike.%${searchTerm}%`)
        .order('term')
        .limit(limit);

      if (error) {
        appLog('GlossaryService', 'Error searching glossary terms', 'error', error);
        throw new Error(`Failed to search glossary terms: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      appLog('GlossaryService', 'Failed to search glossary terms', 'error', error);
      return [];
    }
  }

  /**
   * Get the total count of glossary terms
   */
  async getTermCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('alice_glossary')
        .select('*', { count: 'exact', head: true });

      if (error) {
        appLog('GlossaryService', 'Error getting term count', 'error', error);
        throw new Error(`Failed to get term count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      appLog('GlossaryService', 'Failed to get term count', 'error', error);
      return 0;
    }
  }

  /**
   * Clear the cache (useful for testing or when data changes)
   */
  clearCache(): void {
    this.termsCache = null;
    this.termsDataCache = null;
    this.lastFetchTime = 0;
    appLog('GlossaryService', 'Cache cleared', 'info');
  }
}

// Create and export a singleton instance
export const glossaryService = new GlossaryService();

// Export convenience functions
export const getAllGlossaryTerms = () => glossaryService.getAllGlossaryTerms();
export const getGlossaryTerms = () => glossaryService.getGlossaryTerms();
export const getGlossaryDefinition = (term: string) => glossaryService.getGlossaryDefinition(term);
export const searchGlossaryTerms = (searchTerm: string, limit?: number) => glossaryService.searchGlossaryTerms(searchTerm, limit);
export const getTermCount = () => glossaryService.getTermCount();
export const clearGlossaryCache = () => glossaryService.clearCache(); 