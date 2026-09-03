export interface ContactInfo {
  phone: string;
  ucap: string;
}

export type ContactMap = Record<string, ContactInfo>;

export type RoleScheduleMap = Record<string, string>; // e.g. { [ROLES.IM_1]: '정소영', ... }
export type DateScheduleMap = Record<string, RoleScheduleMap>; // e.g. { '2026-09-03': { ... } }

export interface TimeSlot {
  id: string;
  name: string;
  start: string; // '06:30'
  end: string;   // '14:30'
}

export interface CNPost {
  id: string;
  name: string;
  wards: string[];
  phone: string;
  ucap: string;
}

// weeklyCNSchedule[dayOfWeek 0..6][timeSlotId][cnPostId] = nurseName
export type WeeklyCNScheduleMap = Record<number, Record<string, Record<string, string>>>;

export interface SearchResult {
  isRegularHours: boolean;
  assignedRole: string;
  assignedPerson: string;
  contactInfo: ContactInfo;
  dutyPhone: string | null;
  dutyUcap: string | null;
  backupRole: string;
  notes: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  dept: string;
  ucap: string;
  phone: string;
  category: 'ER' | 'OR' | 'ICU' | 'LAB' | 'ADMIN';
}
