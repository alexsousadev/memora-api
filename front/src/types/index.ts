export interface ReminderData {
  name?: string;
  date?: string; // ISO YYYY-MM-DD
  dateRaw?: string;
  time?: string; // HH:mm
  repeat?: boolean;
  repeatDays?: string | string[];
}

// Formato exato do schema do banco de dados
export interface ReminderPayload {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  repeat: boolean;
  repeatDays: string | null; // "monday,friday" ou null
}

export type ConversationState = 
  | 'welcome'
  | 'listening'
  | 'create_reminder'
  | 'reminder_name'
  | 'reminder_date'
  | 'reminder_time'
  | 'reminder_repeat'
  | 'reminder_days'
  | 'edit_reminder'
  | 'edit_reminder_name'
  | 'delete_reminder'
  | 'delete_reminder_name'
  | 'list_reminders';

export interface AudioFileMap {
  [key: string]: string;
}

