export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  note_count: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'thought' | 'quote' | 'article' | 'question' | 'idea';
  source_url: string | null;
  tags: Tag[];
  folders: Folder[];
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  note_from: string;
  note_to: string;
  note_from_detail: { id: string; title: string };
  note_to_detail: { id: string; title: string };
  reason: string;
  strength: number;
  ai_generated: boolean;
  created_at: string;
}
