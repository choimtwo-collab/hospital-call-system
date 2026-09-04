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

export interface CNShiftCell {
  role: string;    // e.g. '공통전담2 4' or '공통전담 1'
  ucap: string;    // e.g. '5-4011'
  phone?: string;
  nurseName?: string;
  notes?: string;
}

export interface CNGroupSchedule {
  id: string;
  title: string;
  wards: string[];
  dayTypes?: Record<number, string>; // e.g. { 1: '공휴일-정상진료', ..., 6: '공휴일', 0: '공휴일' }
  schedule: Record<string, Record<number, CNShiftCell>>;
}

export interface InternWardGroupSetting {
  id: string; // 'im_1' | 'im_2' | 'non_im_1' | 'non_im_2' | 'non_im_3'
  roleKey: string; // e.g. ROLES.IM_1
  roleName: string; // e.g. '내과1 (인턴1)'
  shortName: string; // e.g. '내과 1'
  dept: '내과' | '비내과';
  title: string; // e.g. '내과계 병동 Group 1 (MICU 등)'
  wards: string[];
  defaultPhone?: string;
  defaultUcap?: string;
  description?: string;
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
  matchedRuleName?: string;
  matchedTaskItem?: TaskItem;
  matchedWardGroup?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  dept: string;
  ucap: string;
  phone: string;
  category: 'ER' | 'OR' | 'ICU' | 'LAB' | 'ADMIN';
}

export type SpecialtyType = '내과계' | '비내과계' | '공통';
export type TaskCategory = '검사' | '치료 및 처치' | '동의서' | '사망 및 기타';
export type TimeRuleType = '정규/당직 분리형' | '시간대 무관 고정형' | '특정 시간 예외형';

export interface TaskItem {
  id: string; // 업무 코드 (Task_Code, 예: TSK_EKG_P)
  code?: string; // 업무 식별 고유 코드 (Task_Code)
  name: string; // 업무명 (Task_Name)
  specialtyType: SpecialtyType; // 진료계열 구분 (Specialty_Type: 내과계 / 비내과계 / 공통)
  dept?: '내과' | '비내과' | 'ALL'; // 하위 호환 진료계열
  category: TaskCategory; // 업무 분류 카테고리 (Category: 검사 / 치료 및 처치 / 동의서 / 사망 및 기타)
  isNurseSupport: 'Y' | 'N' | boolean; // 전담간호사 지원 가능 여부 (Is_Nurse_Support: Y / N)
  nurseSupportNote?: string; // 전담 지원 상세 설명 (예: '지원 불가', '정규 지원 불가')
  timeRuleType: TimeRuleType; // 시간대별 매칭 룰 (Time_Rule_Type: 정규/당직 분리형 / 시간대 무관 고정형 / 특정 시간 예외형)
  description?: string; // 상세 설명 및 매칭 가이드 (Description)
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

// ─── 사용자 인증 및 화면별 권한 관리 (RBAC) ───
export type AdminTabId = 
  | 'schedules'    // 당직표 관리 & 엑셀 업로드
  | 'sheets'       // 구글 시트 실시간 연동
  | 'tasks'        // 업무 마스터 설정
  | 'rules'        // 규칙 빌더
  | 'contacts'     // 의료진 & 임상병리사 연락망
  | 'common_nurse' // 공통전담간호 근무 매트릭스
  | 'hotlines'     // 주요 핫라인 관리
  | 'users'        // 사용자 및 권한 관리 (최고 관리자 전용)
  | 'data';        // 데이터 백업 & 복원

export interface AdminTabInfo {
  id: AdminTabId;
  name: string;
  description: string;
  iconName?: string;
}

export const ALL_ADMIN_TABS: AdminTabInfo[] = [
  { id: 'schedules', name: '당직표 관리 & 엑셀 업로드', description: '월간 인턴 당직표 편집 및 엑셀 업로드' },
  { id: 'sheets', name: '구글 시트 실시간 연동', description: '구글 스프레드시트 당직표 자동 동기화' },
  { id: 'tasks', name: '업무 마스터 설정', description: '20종 표준 업무 및 의사/전담간호사 매칭 규격' },
  { id: 'rules', name: '규칙 빌더 (Rule Builder)', description: '우선순위 기반 동적 당직 라우팅 규칙' },
  { id: 'contacts', name: '의료진 & 임상병리사 연락망', description: '인턴/전공의 연락망 및 EKG 임상병리사 관리' },
  { id: 'common_nurse', name: '공통전담간호 근무 매트릭스', description: '3교대 근무표 및 포스트별 공용폰/UCAP 관리' },
  { id: 'hotlines', name: '주요 핫라인 관리', description: '원내 비상 핫라인 및 긴급 연락망 관리' },
  { id: 'data', name: '데이터 백업 & 복원', description: '전체 설정 JSON 백업 및 복원' },
  { id: 'users', name: '사용자 및 권한 관리', description: '회원 승인 및 화면별 세부 권한 부여 (최고 관리자)' }
];

export interface AppUser {
  id: string;
  username: string; // 로그인 아이디
  name: string;     // 사용자 성명
  department: string; // 소속 병동 / 부서 (예: 61병동, 간호부, 수련교육팀)
  position?: string;  // 직급 (예: 수간호사, 주임, 인턴의국장)
  passwordHash: string; // SHA-256 해시 비밀번호
  role: 'SUPER_ADMIN' | 'MANAGER' | 'USER';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  permissions: AdminTabId[]; // 권한이 부여된 관리자 탭 ID 목록
  createdAt: string;
  lastLoginAt?: string;
}

