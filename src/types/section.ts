export interface Chapter {
  id: string;
  title: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  chapter: Chapter;
} 