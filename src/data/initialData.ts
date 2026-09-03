import { ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, EmergencyContact } from '../types';

export const DEPARTMENTS = ['내과', '비내과'] as const;
export type DepartmentType = typeof DEPARTMENTS[number];

export const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export const ROLES = {
  IM_1: '내과1 (인턴1)',
  IM_2: '내과2 (인턴2)',
  NON_IM_1: '비내과1 (당직인턴1)',
  NON_IM_2: '비내과2 (당직인턴2)',
  NON_IM_3: '비내과3 (당직인턴3)',
  COMMON_NURSE: '공통전담간호사',
  DUTY_NURSE: '당직 전담간호사',
  PATHOLOGIST: '임상병리사',
  INTERN: '해당과 인턴'
};

export const DUTY_PHONES: Record<string, string> = {
  [ROLES.NON_IM_1]: '010-7628-5803',
  [ROLES.NON_IM_2]: '010-7624-5803',
  [ROLES.NON_IM_3]: '010-5794-4170'
};

export const DUTY_UCAPS: Record<string, string> = {
  [ROLES.NON_IM_1]: '5-4080',
  [ROLES.NON_IM_2]: '5-4081',
  [ROLES.NON_IM_3]: '5-3499'
};

export const WARD_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': ['MICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동'],
  '비내과': ['SICU', '분만장', 'NICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동']
};

export const ALL_WARDS = Array.from(new Set([...WARD_OPTIONS['내과'], ...WARD_OPTIONS['비내과']]));

export const TASK_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': [
    '1. EKG(P), 수혈동의서, T-tube 교체, 사망선언', 
    '2. ABGA/Line 통한 채혈 및 Blood culture', 
    '3. 그외 술기 및 동의서', 
    '4. Primary Call'
  ],
  '비내과': [
    '1. EKG(P), 수혈동의서, T-tube 교체', 
    '2. ABGA/Line 통한 채혈 및 Blood culture', 
    '3. 통합의학과 사망선언', 
    '4. 주말 및 휴일_통합의학과 및 3단계 이상 sore Dx, 일요일_UR Op wx, Dressing, AN 마취동의서', 
    '5. 그외 술기 및 동의서'
  ]
};

export const initialContacts: ContactMap = {
  '정소영': { phone: '010-3948-1029', ucap: '52644' }, 
  '전지연': { phone: '010-4829-1920', ucap: '52642' },
  '이준재': { phone: '010-5829-4019', ucap: '52606' }, 
  '박신희': { phone: '010-9182-3847', ucap: '52634' },
  '박수현': { phone: '010-2938-4710', ucap: '52633' }, 
  '신정민': { phone: '010-5928-1039', ucap: '52637' },
  '신유경': { phone: '010-7281-9402', ucap: '52636' }, 
  '권민재': { phone: '010-1829-3049', ucap: '52632' },
  '이태겸': { phone: '010-9201-4829', ucap: '52641' }, 
  '배규리': { phone: '010-8273-1940', ucap: '52635' },
  '이상엽': { phone: '010-3819-2049', ucap: '52605' }, 
  '이창윤': { phone: '010-4729-1029', ucap: '52607' },
  '천지원': { phone: '010-1928-3049', ucap: '52608' }, 
  '최남석': { phone: '010-5829-1029', ucap: '52609' },
  '전하윤': { phone: '010-2938-1029', ucap: '52643' }, 
  '유성윤': { phone: '010-9281-0492', ucap: '52604' },
  [ROLES.DUTY_NURSE]: { phone: '근무표 참조', ucap: '근무표 참조' },
  [ROLES.PATHOLOGIST]: { phone: '010-9907-8298(황예진)', ucap: '5-9907' },
  [ROLES.INTERN]: { phone: '근무표 참조', ucap: '근무표 참조' }
};

export const initialSchedules: DateScheduleMap = {
  '2026-09-01': { [ROLES.IM_1]: '이준재', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '신정민', [ROLES.NON_IM_2]: '이창윤', [ROLES.NON_IM_3]: '배규리' },
  '2026-09-02': { [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '배규리', [ROLES.NON_IM_2]: '최남석', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-03': { [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '이창윤', [ROLES.NON_IM_2]: '전하윤', [ROLES.NON_IM_3]: '천지원' },
  '2026-09-04': { [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '권민재', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-05': { [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '이상엽', [ROLES.NON_IM_1]: '유성윤', [ROLES.NON_IM_2]: '신정민', [ROLES.NON_IM_3]: '최남석' },
  '2026-09-06': { [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '전하윤', [ROLES.NON_IM_2]: '이태겸', [ROLES.NON_IM_3]: '권민재' }
};

export const initialTimeSlots: TimeSlot[] = [
  { id: 'ts_day', name: 'Day (낮)', start: '06:30', end: '14:30' },
  { id: 'ts_eve', name: 'Evening (이브닝)', start: '14:30', end: '22:00' },
  { id: 'ts_night', name: 'Night (나이트)', start: '22:00', end: '06:30' } 
];

export const initialCNPosts: CNPost[] = Array.from({ length: 10 }, (_, i) => ({
  id: `CN${i + 1}`,
  name: `공통전담${i + 1}`,
  wards: i === 0 ? ['61병동', '62병동'] : (i === 1 ? ['71병동', '72병동'] : (i === 2 ? ['81병동', '82병동'] : [])),
  phone: `010-1000-200${i}`,
  ucap: `530${i < 9 ? '0' + (i + 1) : (i + 1)}`
}));

export const initialWeeklyCNSchedule: WeeklyCNScheduleMap = {};
for (let i = 0; i < 7; i++) {
  initialWeeklyCNSchedule[i] = {
    'ts_day': { 'CN1': '김데이', 'CN2': '박데이', 'CN3': '최데이' },
    'ts_eve': { 'CN1': '이이브', 'CN2': '최이브', 'CN3': '윤이브' },
    'ts_night': { 'CN1': '정나잇', 'CN2': '강나잇', 'CN3': '한나잇' }
  };
}

export const emergencyContacts: EmergencyContact[] = [
  { id: 'em-1', name: '응급의학과 메인', dept: '응급실', ucap: '5-1119', phone: '010-8888-1119', category: 'ER' },
  { id: 'em-2', name: '중환자실(MICU)', dept: '내과중환자실', ucap: '5-2200', phone: '010-8888-2200', category: 'ICU' },
  { id: 'em-3', name: '외과중환자실(SICU)', dept: '외과중환자실', ucap: '5-2300', phone: '010-8888-2300', category: 'ICU' },
  { id: 'em-4', name: '수술실 본원 데스크', dept: '수술실', ucap: '5-3300', phone: '010-8888-3300', category: 'OR' },
  { id: 'em-5', name: '진단검사의학과 야간', dept: '진단검사의학', ucap: '5-4400', phone: '010-8888-4400', category: 'LAB' },
  { id: 'em-6', name: '약제팀 야간 조제실', dept: '약제팀', ucap: '5-5500', phone: '010-8888-5500', category: 'ADMIN' },
];
