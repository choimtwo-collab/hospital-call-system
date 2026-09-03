import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, 
  EmergencyContact, TaskItem, CustomRule, InternDoctor, PathologistSchedule 
} from '../types';

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

// 병동 그룹화 정의 (명세서 기준)
export const WARD_GROUPS = {
  // 내과계
  GROUP_A: ['42병동', '61병동', '62병동', '82병동', '92병동', '102병동', 'MICU'],
  GROUP_B: ['71병동', '72병동', '81병동', '101병동', '111병동', '112병동'],
  // 비내과계
  GROUP_C: ['SICU', '분만장', '42병동', '61병동', '62병동', 'NICU'],
  GROUP_D: ['71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동']
};

export const WARD_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': ['MICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동'],
  '비내과': ['SICU', '분만장', 'NICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동']
};

export const ALL_WARDS = Array.from(new Set([...WARD_OPTIONS['내과'], ...WARD_OPTIONS['비내과']]));

// 초기 업무 마스터 정의
export const initialTasks: TaskItem[] = [
  // 내과계 업무
  { id: 'task-im-1', name: 'EKG(P), 수혈동의서, T-tube 교체, 사망선언', dept: '내과', category: '인턴 필수', description: '인턴 고유 업무' },
  { id: 'task-im-2', name: 'ABGA/Line 통한 채혈 및 Blood culture', dept: '내과', category: '인턴 필수', description: '채혈 및 배양 검사' },
  { id: 'task-im-3', name: '그외 술기 및 동의서', dept: '내과', category: '공통 전담 지원', description: '공통 전담간호사 지원 업무' },
  { id: 'task-im-4', name: 'Primary Call', dept: '내과', category: '진료과 전담 전용', description: '당직 전담간호사 우선' },

  // 비내과계 일반 업무
  { id: 'task-non-1', name: 'EKG(P), 수혈동의서, T-tube 교체', dept: '비내과', category: '인턴 필수', description: '비내과 일반 인턴 술기' },
  { id: 'task-non-2', name: 'ABGA/Line 통한 채혈 및 Blood culture', dept: '비내과', category: '인턴 필수', description: '비내과 채혈 업무' },
  { id: 'task-non-3', name: '그외 술기 및 동의서', dept: '비내과', category: '공통 전담 지원', description: '공통 전담간호사 지원' },

  // 비내과계 특수/예외 업무
  { id: 'task-ex-1', name: '통합의학과 사망선언', dept: '비내과', category: '특수 예외', description: '비내과2(5-4081) 고정' },
  { id: 'task-ex-2', name: '주말/휴일 통합의학과 3단계 이상 sore 드레싱', dept: '비내과', category: '특수 예외', description: '비내과1(5-4080) 고정' },
  { id: 'task-ex-3', name: '일요일 UR Op site dressing', dept: '비내과', category: '특수 예외', description: '일요일 비내과1(5-4080) 고정' },
  { id: 'task-ex-4', name: '일요일 AN 마취동의서', dept: '비내과', category: '특수 예외', description: '일요일 비내과1(5-4080) 고정' },
  { id: 'task-ex-5', name: '응급수술 Assist', dept: '비내과', category: '특수 예외', description: '1순위 비내과1, 2순위 비내과2' }
];

export const TASK_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': initialTasks.filter(t => t.dept === '내과' || t.dept === 'ALL').map(t => t.name),
  '비내과': initialTasks.filter(t => t.dept === '비내과' || t.dept === 'ALL').map(t => t.name)
};

// 동적 규칙 (Rule Builder 기본 탑재 룰)
export const initialCustomRules: CustomRule[] = [
  {
    id: 'rule-ex-1',
    name: '통합의학과 사망선언 예외 매칭',
    enabled: true,
    priority: 1,
    condition: {
      department: '비내과',
      taskKeywords: ['통합의학과 사망선언']
    },
    action: {
      assignedRole: ROLES.NON_IM_2,
      dutyPhone: '010-7624-5803',
      dutyUcap: '5-4081',
      notes: '통합의학과 사망선언은 비내과 당직인턴 2(5-4081)로 고정 연결됩니다.'
    }
  },
  {
    id: 'rule-ex-2',
    name: '주말/휴일 통합의학과 3단계 이상 sore 드레싱',
    enabled: true,
    priority: 2,
    condition: {
      department: '비내과',
      dayCategory: 'WEEKEND_HOLIDAY',
      taskKeywords: ['3단계 이상 sore']
    },
    action: {
      assignedRole: ROLES.NON_IM_1,
      dutyPhone: '010-7628-5803',
      dutyUcap: '5-4080',
      notes: '주말/휴일 통합의학과 3단계 이상 sore 드레싱은 비내과 당직인턴 1(5-4080) 전담입니다.'
    }
  },
  {
    id: 'rule-ex-3',
    name: '일요일 UR Op site dressing',
    enabled: true,
    priority: 3,
    condition: {
      department: '비내과',
      dayCategory: 'SUNDAY_ONLY',
      taskKeywords: ['UR Op site dressing']
    },
    action: {
      assignedRole: ROLES.NON_IM_1,
      dutyPhone: '010-7628-5803',
      dutyUcap: '5-4080',
      notes: '일요일 UR Op site dressing은 비내과 당직인턴 1(5-4080)이 수행합니다.'
    }
  },
  {
    id: 'rule-ex-4',
    name: '일요일 AN 마취동의서',
    enabled: true,
    priority: 4,
    condition: {
      department: '비내과',
      dayCategory: 'SUNDAY_ONLY',
      taskKeywords: ['AN 마취동의서']
    },
    action: {
      assignedRole: ROLES.NON_IM_1,
      dutyPhone: '010-7628-5803',
      dutyUcap: '5-4080',
      notes: '일요일 AN 마취동의서는 비내과 당직인턴 1(5-4080)이 전담합니다.'
    }
  },
  {
    id: 'rule-ex-5',
    name: '응급수술 Assist (1순위 비내과1, 2순위 비내과2)',
    enabled: true,
    priority: 5,
    condition: {
      department: '비내과',
      taskKeywords: ['응급수술 Assist']
    },
    action: {
      assignedRole: ROLES.NON_IM_1,
      backupRole: '1순위 비내과1(5-4080) / 2순위 비내과2(5-4081)',
      dutyPhone: '010-7628-5803',
      dutyUcap: '5-4080',
      notes: '응급수술 Assist 1순위는 비내과1(5-4080), 부재 시 2순위 비내과2(5-4081)로 연락하세요.'
    }
  }
];

// 인턴 마스터
export const initialInterns: InternDoctor[] = [
  { id: 'int-1', name: '정소영', dept: 'IM', ucap: '52644', phone: '010-3948-1029' },
  { id: 'int-2', name: '전지연', dept: 'IM', ucap: '52642', phone: '010-4829-1920' },
  { id: 'int-3', name: '이준재', dept: 'IM', ucap: '52606', phone: '010-5829-4019' },
  { id: 'int-4', name: '박신희', dept: 'GS', ucap: '52634', phone: '010-9182-3847' },
  { id: 'int-5', name: '박수현', dept: 'OBGY', ucap: '52633', phone: '010-2938-4710' },
  { id: 'int-6', name: '신정민', dept: 'OS', ucap: '52637', phone: '010-5928-1039' },
  { id: 'int-7', name: '신유경', dept: 'PED', ucap: '52636', phone: '010-7281-9402' },
  { id: 'int-8', name: '권민재', dept: 'NS', ucap: '52632', phone: '010-1829-3049' },
  { id: 'int-9', name: '이태겸', dept: 'UR', ucap: '52641', phone: '010-9201-4829' },
  { id: 'int-10', name: '배규리', dept: 'ENT', ucap: '52635', phone: '010-8273-1940' },
  { id: 'int-11', name: '이상엽', dept: 'EYE', ucap: '52605', phone: '010-3819-2049' },
  { id: 'int-12', name: '이창윤', dept: 'DERM', ucap: '52607', phone: '010-4729-1029' },
  { id: 'int-13', name: '천지원', dept: 'PSY', ucap: '52608', phone: '010-1928-3049' },
  { id: 'int-14', name: '최남석', dept: 'NR', ucap: '52609', phone: '010-5829-1029' },
  { id: 'int-15', name: '전하윤', dept: 'RM', ucap: '52643', phone: '010-2938-1029' },
  { id: 'int-16', name: '유성윤', dept: 'CS', ucap: '52604', phone: '010-9281-0492' },
];

export const initialContacts: ContactMap = {
  '정소영': { phone: '010-3948-1029', ucap: '52644', dumcTalk: '정소영(인턴)' }, 
  '전지연': { phone: '010-4829-1920', ucap: '52642', dumcTalk: '전지연(인턴)' },
  '이준재': { phone: '010-5829-4019', ucap: '52606', dumcTalk: '이준재(인턴)' }, 
  '박신희': { phone: '010-9182-3847', ucap: '52634', dumcTalk: '박신희(인턴)' },
  '박수현': { phone: '010-2938-4710', ucap: '52633', dumcTalk: '박수현(인턴)' }, 
  '신정민': { phone: '010-5928-1039', ucap: '52637', dumcTalk: '신정민(인턴)' },
  '신유경': { phone: '010-7281-9402', ucap: '52636', dumcTalk: '신유경(인턴)' }, 
  '권민재': { phone: '010-1829-3049', ucap: '52632', dumcTalk: '권민재(인턴)' },
  '이태겸': { phone: '010-9201-4829', ucap: '52641', dumcTalk: '이태겸(인턴)' }, 
  '배규리': { phone: '010-8273-1940', ucap: '52635', dumcTalk: '배규리(인턴)' },
  '이상엽': { phone: '010-3819-2049', ucap: '52605', dumcTalk: '이상엽(인턴)' }, 
  '이창윤': { phone: '010-4729-1029', ucap: '52607', dumcTalk: '이창윤(인턴)' },
  '천지원': { phone: '010-1928-3049', ucap: '52608', dumcTalk: '천지원(인턴)' }, 
  '최남석': { phone: '010-5829-1029', ucap: '52609', dumcTalk: '최남석(인턴)' },
  '전하윤': { phone: '010-2938-1029', ucap: '52643', dumcTalk: '전하윤(인턴)' }, 
  '유성윤': { phone: '010-9281-0492', ucap: '52604', dumcTalk: '유성윤(인턴)' },
  [ROLES.DUTY_NURSE]: { phone: '010-8888-0001', ucap: '5-4001', dumcTalk: '당직전담실' },
  [ROLES.PATHOLOGIST]: { phone: '010-9907-8298(황예진)', ucap: '5-9907', dumcTalk: '임상병리사_황예진' },
  [ROLES.INTERN]: { phone: '근무표 참조', ucap: '근무표 참조', dumcTalk: '해당과인턴' }
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
  wards: i === 0 ? ['61병동', '62병동'] : (i === 1 ? ['71병동', '72병동'] : (i === 2 ? ['81병동', '82병동'] : (i === 3 ? ['MICU', '42병동'] : (i === 4 ? ['SICU', '분만장'] : [])))),
  phone: `010-1000-200${i}`,
  ucap: `530${i < 9 ? '0' + (i + 1) : (i + 1)}`,
  dumcTalk: `공통전담${i + 1}조`
}));

export const initialWeeklyCNSchedule: WeeklyCNScheduleMap = {};
for (let i = 0; i < 7; i++) {
  initialWeeklyCNSchedule[i] = {
    'ts_day': { 'CN1': '김데이', 'CN2': '박데이', 'CN3': '최데이', 'CN4': '윤데이', 'CN5': '정데이' },
    'ts_eve': { 'CN1': '이이브', 'CN2': '최이브', 'CN3': '윤이브', 'CN4': '강이브', 'CN5': '신이브' },
    'ts_night': { 'CN1': '정나잇', 'CN2': '강나잇', 'CN3': '한나잇', 'CN4': '오나잇', 'CN5': '서나잇' }
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

export const initialPathologistSchedules: PathologistSchedule[] = [
  { id: 'path-1', startDate: '2026-09-01', endDate: '2026-09-15', name: '황예진', phone: '010-9907-8298', ucap: '5-9907' },
  { id: 'path-2', startDate: '2026-09-16', endDate: '2026-09-30', name: '윤은솔', phone: '010-8821-4928', ucap: '5-9908' }
];
