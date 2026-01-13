
export type LanguageCode = 'ko' | 'vi' | 'en' | 'zh' | 'ja';
export type UserRole = 'user' | 'admin';

export interface User {
  username: string;
  role: UserRole;
}

export interface Language {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  voice: string;
}

export interface TranscriptPair {
  id: string;
  original: string;
  translated: string;
  timestamp: Date;
  sender: 'user' | 'peer';
}

export interface ConversationLog {
  id: string;
  username: string;
  timestamp: string;
  sourceLang: string;
  targetLang: string;
  transcripts: TranscriptPair[];
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
}
