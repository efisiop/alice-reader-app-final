export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Chapter {
  id: string;
  title: string;
}

export interface Section {
  id: string;
  title: string;
  chapter: Chapter;
}

export type HelpRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface HelpRequest {
  id: string;
  user_id: string;
  section_id: string | null;
  content: string;
  status: HelpRequestStatus;
  created_at: string;
  assigned_to: string | null;
  user?: User;
  consultant?: User;
  section?: Section;
} 