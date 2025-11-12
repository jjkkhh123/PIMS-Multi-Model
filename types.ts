export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  group?: string;
}

export interface ScheduleItem {
  id:string;
  title: string;
  date: string;
  time?: string;
  location?: string;
}

export interface Expense {
  id: string;
  date: string;
  item: string;
  amount: number;
  type: 'expense' | 'income';
  category?: string;
  imageUrl?: string | null;
}

export interface DiaryEntry {
  id: string;
  date: string;
  entry: string;
  group?: string;
}

// Type for the different views in the app
export type View = 'ALL' | 'CALENDAR' | 'EXPENSES_DASHBOARD' | 'EXPENSES_INCOME' | 'EXPENSES_EXPENSE' | 'EXPENSES_STATS' | 'CONTACTS' | 'DIARY' | 'HISTORY';

// Type returned by the Gemini API service, before adding IDs
export interface ProcessedData {
  contacts: Omit<Contact, 'id'>[];
  schedule: Omit<ScheduleItem, 'id'>[];
  expenses: Omit<Expense, 'id' | 'imageUrl'>[];
  diary: Omit<DiaryEntry, 'id'>[];
}

export interface CategorizedData {
  contacts: Contact[];
  schedule: ScheduleItem[];
  expenses: Expense[];
  diary: DiaryEntry[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  input: {
    text: string;
    imageName: string | null;
    imageUrl: string | null;
  };
  output: CategorizedData;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string | null;
  clarificationOptions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ConversationalResponse {
  answer: string;
  dataExtraction: ProcessedData;
  clarificationNeeded?: boolean;
  clarificationOptions?: string[];
}