import type { Language } from './i18n';

// Types
export interface School {
  id: string;
  name_ko: string;
  name_en: string;
  name_ja: string;
  country: string;
  logo_url: string;
  created_at: string;
}

export interface Box {
  id: string;
  title: string;
  title_en?: string;
  title_ja?: string;
  description: string;
  description_en?: string;
  description_ja?: string;
  from_school_id: string;
  to_school_id: string;
  status: 'draft' | 'packed' | 'sent' | 'arrived' | 'opened';
  cover_image_url?: string;
  created_by: string;
  created_at: string;
  sent_at?: string;
  opened_at?: string;
}

export interface Item {
  id: string;
  box_id: string;
  type: 'text' | 'image' | 'video' | 'youtube' | 'link' | 'pdf';
  title: string;
  title_en?: string;
  title_ja?: string;
  content: string;
  file_url?: string;
  order: number;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  box_id: string;
  user_id: string;
  user_name: string;
  user_school: string;
  content: string;
  media_url?: string;
  parent_id?: string;
  status: 'approved' | 'pending' | 'hidden';
  created_at: string;
}

export interface Reaction {
  id: string;
  target_type: string;
  target_id: string;
  user_id: string;
  type: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  school_id: string;
  role: 'student' | 'teacher';
  lang_pref: Language;
}

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzFjDT3WUncXROqm2-SJ01Lg1L1K17b9Yvgx9W7BJEbmfCzultQxL0Er5zTkZgx8LI-/exec';

async function fetchGAS(action: string, params: Record<string, any> = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (err) {
    console.error(`API error (${action}):`, err);
    throw err;
  }
}

export const API = {
  getSchools: (): Promise<School[]> => fetchGAS('getSchools'),
  getBoxes: (filters: { status?: string; search?: string; school_id?: string } = {}): Promise<Box[]> => fetchGAS('getBoxes', filters),
  getBox: (id: string): Promise<Box> => fetchGAS('getBox', { id }),
  getItems: (boxId: string): Promise<Item[]> => fetchGAS('getItems', { box_id: boxId }),
  getMessages: (boxId: string): Promise<Message[]> => fetchGAS('getMessages', { box_id: boxId }),
  getStats: (): Promise<{ schools: number; boxes: number; items: number }> => fetchGAS('getStats'),
  createBox: (data: Partial<Box>): Promise<Box> => fetchGAS('createBox', data),
  updateBox: (data: Partial<Box> & { id: string }): Promise<Box> => fetchGAS('updateBox', data),
  addItem: (data: Partial<Item>): Promise<Item> => fetchGAS('addItem', data),
  removeItem: (id: string): Promise<boolean> => fetchGAS('removeItem', { id }),
  addMessage: (data: Partial<Message>): Promise<Message> => fetchGAS('addMessage', data),
  sendBox: (id: string): Promise<Box> => fetchGAS('sendBox', { id }),
  openBox: (id: string): Promise<Box> => fetchGAS('openBox', { id }),
  deleteBox: (id: string): Promise<boolean> => fetchGAS('deleteBox', { id }),
  deleteMessage: (id: string): Promise<boolean> => fetchGAS('deleteMessage', { id }),
  getUsers: (): Promise<any[]> => fetchGAS('getUsers'),
  createUser: (data: any): Promise<any> => fetchGAS('createUser', data),
  deleteUser: (id: string): Promise<boolean> => fetchGAS('deleteUser', { id }),
  createSchool: (data: Partial<School>): Promise<School> => fetchGAS('createSchool', data),
  deleteSchool: (id: string): Promise<boolean> => fetchGAS('deleteSchool', { id }),
};

// Helper functions
export function getSchoolName(school: School | undefined, lang: Language): string {
  if (!school) return '?';
  if (lang === 'ja') return school.name_ja || school.name_ko;
  if (lang === 'en') return school.name_en || school.name_ko;
  return school.name_ko;
}

export function getBoxTitle(box: Box, lang: Language): string {
  if (lang === 'ja' && box.title_ja) return box.title_ja;
  if (lang === 'en' && box.title_en) return box.title_en;
  return box.title || box.title_en || '';
}

export function getBoxDesc(box: Box, lang: Language): string {
  if (lang === 'ja' && box.description_ja) return box.description_ja;
  if (lang === 'en' && box.description_en) return box.description_en;
  return box.description || box.description_en || '';
}

export function getItemTitle(item: Item, lang: Language): string {
  if (lang === 'ja' && item.title_ja) return item.title_ja;
  if (lang === 'en' && item.title_en) return item.title_en;
  return item.title || item.title_en || '';
}

export const ACCESS_CODES = {
  student: ['CULTURE2026', 'BOX2026', 'HELLO2026'],
  teacher: ['TEACHER2026', 'EDU2026'],
};

export const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export function getBoxGradient(boxId: string): string {
  const idx = Math.abs(boxId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[idx];
}

export function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}
