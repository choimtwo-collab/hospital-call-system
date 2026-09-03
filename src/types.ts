export interface ContactInfo {
  phone: string;
  ucap: string;
  dumcTalk?: string;
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
  dumcTalk?: string;
}

// weeklyCNSchedule[dayOfWeek 0..6][timeSlotId][cnPostId] = nurseName
export type WeeklyCNScheduleMap = Record<number, Record<string, Record<string, string>>>;

export interface SearchResult {
  isRegularHours: boolean;
  isHolidayOrWeekend: boolean;
  holidayName?: string;
  assignedRole: string;
  assignedPerson: string;
  contactInfo: ContactInfo;
  dutyPhone: string | null;
  dutyUcap: string | null;
  backupRole: string;
  backupContact1?: ContactInfo & { roleName: string };
  backupContact2?: ContactInfo & { roleName: string };
  notes: string;
  ruleSource?: 'DYNAMIC_RULE' | 'SYSTEM_DEFAULT';
}

export interface EmergencyContact {
  id: string;
  name: string;
  dept: string;
  ucap: string;
  phone: string;
  category: 'ER' | 'OR' | 'ICU' | 'LAB' | 'ADMIN';
}

export type TaskCategory = '인턴 필수' | '공통 전담 지원' | '진료과 전담 전용' | '특수 예외';

export interface TaskItem {
  id: string;
  name: string;
  dept: '내과' | '비내과' | 'ALL';
  category: TaskCategory;
  description?: string;
}

export interface RuleCondition {
  department?: '내과' | '비내과' | 'ALL';
  wardGroup?: 'GROUP_A' | 'GROUP_B' | 'GROUP_C' | 'GROUP_D' | 'ALL' | string;
  specificWards?: string[];
  taskKeywords?: string[];
  timeCategory?: 'REGULAR' | 'NON_REGULAR' | 'NIGHT_22_08' | 'EVENING_17_22' | 'MORNING_06_08' | 'ALL';
  dayCategory?: 'WEEKDAY' | 'WEEKEND_HOLIDAY' | 'SUNDAY_ONLY' | 'ALL';
}

export interface RuleAction {
  assignedRole: string;
  backupRole?: string;
  dutyPhone?: string;
  dutyUcap?: string;
  notes?: string;
}

export interface CustomRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
}

export interface DutyPhoneItem {
  id: string;
  deptCategory: '내과' | '비내과';
  roleName: string; // '내과 1', '내과 2', '비내과 1', '비내과 2', '비내과 3' 등
  phone: string;
  ucap: string;
  notes?: string;
}

export interface InternDoctor {
  id: string;
  name: string;
  dept: string;
  category: '내과' | '비내과';
  ucap: string;
  phone: string;
}

export interface PathologistSchedule {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dayType: 'WEEKDAY' | 'WEEKEND_HOLIDAY' | 'ALL';
  startTime: string; // HH:mm (e.g. 06:00)
  endTime: string;   // HH:mm (e.g. 08:00)
  name: string;
  phone: string;
  ucap: string;
  notes?: string;
}
