import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, 
  EmergencyContact, TaskItem, CustomRule, InternDoctor, PathologistSchedule, 
  DutyPhoneItem, CNGroupSchedule, CNShiftCell, InternWardGroupSetting 
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
  GROUP_A: ['42병동', '61병동', '62병동', '82병동', '92병동', '102병동', 'MICU', 'AKU', '주사실', '한방'],
  GROUP_B: ['71병동', '72병동', '81병동', '101병동', '111병동', '112병동', '121병동'],
  // 비내과계
  GROUP_C: ['SICU', '분만장', 'DR', 'DSR', '42병동', '61병동', '62병동', 'NICU'],
  GROUP_D: ['71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동']
};

// 인턴 역할별 기본 담당 병동 그룹 설정 (내과1, 내과2, 비내과1, 비내과2, 비내과3)
export const initialInternWardGroups: InternWardGroupSetting[] = [
  {
    id: 'im_1',
    roleKey: ROLES.IM_1,
    roleName: '내과1 (인턴1)',
    shortName: '내과 1',
    dept: '내과',
    title: '내과계 병동 Group 1 (MICU 등)',
    wards: ['42병동', '61병동', '62병동', '82병동', '92병동', '102병동', 'MICU', 'AKU', '주사실', '한방'],
    defaultPhone: '근무표 참조',
    defaultUcap: '개인 UCAP',
    description: 'MICU 및 42, 61, 62, 82, 92, 102병동 등 내과계 전담'
  },
  {
    id: 'im_2',
    roleKey: ROLES.IM_2,
    roleName: '내과2 (인턴2)',
    shortName: '내과 2',
    dept: '내과',
    title: '내과계 병동 Group 2 (71, 72, 81W 등)',
    wards: ['71병동', '72병동', '81병동', '101병동', '111병동', '112병동', '121병동'],
    defaultPhone: '근무표 참조',
    defaultUcap: '개인 UCAP',
    description: '71, 72, 81, 101, 111, 112, 121병동 등 내과계 전담'
  },
  {
    id: 'non_im_1',
    roleKey: ROLES.NON_IM_1,
    roleName: '비내과1 (당직인턴1)',
    shortName: '비내과 1',
    dept: '비내과',
    title: '비내과계 응급수술/시술 및 지정 담당 병동',
    wards: ['응급실', '수술실', 'DR', 'DSR'],
    defaultPhone: '010-7628-5803',
    defaultUcap: '5-4080',
    description: '응급수술 Assist, 주말 sore 특수드레싱, 마취동의서 및 지정 병동'
  },
  {
    id: 'non_im_2',
    roleKey: ROLES.NON_IM_2,
    roleName: '비내과2 (당직인턴2)',
    shortName: '비내과 2',
    dept: '비내과',
    title: '비내과계 병동 Group C (SICU/외과계)',
    wards: ['SICU', '분만장', 'DR', 'DSR', '42병동', '61병동', '62병동', 'NICU'],
    defaultPhone: '010-7624-5803',
    defaultUcap: '5-4081',
    description: 'SICU, 분만장, 42, 61, 62, NICU 등 비내과계 전담'
  },
  {
    id: 'non_im_3',
    roleKey: ROLES.NON_IM_3,
    roleName: '비내과3 (당직인턴3)',
    shortName: '비내과 3',
    dept: '비내과',
    title: '비내과계 병동 Group D (71~121병동 등)',
    wards: ['71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동'],
    defaultPhone: '010-5794-4170',
    defaultUcap: '5-3499',
    description: '71, 72, 81, 82, 92, 101, 102, 111, 112, 121병동 등 비내과계 전담'
  }
];

export const WARD_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': [
    'MICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', 
    '92병동', '101병동', '102병동', '111병동', '112병동', '121병동',
    'AKU', '주사실', '한방'
  ],
  '비내과': [
    'SICU', '분만장', 'DR', 'DSR', 'NICU', '42병동', '61병동', '62병동', '71병동', '72병동', 
    '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동',
    'AKU', '주사실', '한방'
  ]
};

export const ALL_WARDS = [
  '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', 
  '92병동', '101병동', '102병동', '111병동', '112병동', '121병동',
  'AKU', 'DR', 'DSR', 'MICU', 'SICU', '주사실', '한방', '분만장', 'NICU'
];

// 초기 업무 마스터 정의 (새로운 마스터 테이블 필드 규격)
export const initialTasks: TaskItem[] = [
  // ① 검사 및 채혈 카테고리 (Category: 검사)
  {
    id: 'TSK_EKG_P',
    code: 'TSK_EKG_P',
    name: 'EKG(P) (추가 심전도)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '검사',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '특정 시간 예외형',
    description: `• 평일 06:00~08:00 (아침 정규): 일자별 지정된 임상병리사 연결.
• 평일 정규 (08:00~17:00):
  - 내과계: 인턴 개인 UCAP 연결.
  - 비내과계: 당직인턴2 (Group C 병동) 또는 당직인턴3 (Group D 병동) 연결.
• 정규 외 (야간/주말):
  - 내과계: 병동 Group 1 및 MICU는 내과계 당직인턴1 / 병동 Group 2는 내과계 당직인턴2 연결.
  - 비내과계: 당직인턴2 (Group C) 또는 당직인턴3 (Group D) 연결.`
  },
  {
    id: 'TSK_ABGA',
    code: 'TSK_ABGA',
    name: 'ABGA (동맥혈 가스분석)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '검사',
    isNurseSupport: 'N',
    nurseSupportNote: '정규 지원 불가',
    timeRuleType: '정규/당직 분리형',
    description: `• 평일 정규 (08:00~17:00):
  - 내과계: MICU는 인턴 / MICU 외 일반병동은 공통 전담간호사 연결.
  - 비내과계: 당직인턴2 (Group C) 또는 당직인턴3 (Group D).
• 정규 외 (야간/주말):
  - 내과계: MICU는 내과계 당직인턴1 / 일반병동 Group 1은 당직 전담간호사 / 일반병동 Group 2는 야간(22:00~08:00)에 내과계 당직인턴2 (그 외 당직 시간은 공통 전담간호사) 연결.
  - 비내과계: 당직인턴2 (Group C) 또는 당직인턴3 (Group D).`
  },
  {
    id: 'TSK_LINE_BLOOD',
    code: 'TSK_LINE_BLOOD',
    name: 'Line 채혈 (Blood culture 포함)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '검사',
    isNurseSupport: 'N',
    nurseSupportNote: '정규 지원 불가',
    timeRuleType: '정규/당직 분리형',
    description: `• C-line, PICC, Chemoport, A-line 등 기준 line을 통한 채혈 업무입니다.
• 매칭 및 라우팅 규칙은 위의 ABGA 규칙과 100% 동일하게 작동합니다 (시간대/병동별 내과계, 비내과계 분기 동일 적용).`
  },
  {
    id: 'TSK_PERIPH_BLOOD',
    code: 'TSK_PERIPH_BLOOD',
    name: 'Peripheral vein 채혈 (일반 정맥 채혈)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '검사',
    isNurseSupport: 'Y',
    nurseSupportNote: '상시 지원',
    timeRuleType: '시간대 무관 고정형',
    description: `• 진료과 및 시간대에 상관없이 언제나 공통 전담간호사 상시 지원 대상입니다.`
  },
  // ② 치료 및 처치 카테고리 (Category: 치료 및 처치)
  {
    id: 'TSK_TTUBE',
    code: 'TSK_TTUBE',
    name: 'T-tube 교체 (기관절개관 교체)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '정규/당직 분리형',
    description: `• 평일 정규 및 정규 외 상시: 인턴 담당 업무입니다.
• 내과계 야간/주말: MICU는 내과 당직인턴1 / 병동 Group 2는 내과 당직인턴2가 담당합니다 (일반병동 Group 1 야간 요청 시 내과 전공의 별도 콜 안내).
• 비내과계 야간/주말: 당직인턴2 (Group C) 또는 당직인턴3 (Group D) 연결.`
  },
  {
    id: 'TSK_SIMPLE_DRESS',
    code: 'TSK_SIMPLE_DRESS',
    name: '단순 드레싱',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'Y',
    nurseSupportNote: '야간 제외',
    timeRuleType: '정규/당직 분리형',
    description: `• 일반 드레싱, 시술 후 단순 드레싱, 상처 소독, 단순 욕창 소독 업무입니다.
• 22:00~08:00 야간 시간대를 제외하고 공통 전담간호사가 기본 담당합니다.`
  },
  {
    id: 'TSK_COMPLEX_DRESS',
    code: 'TSK_COMPLEX_DRESS',
    name: '복합 드레싱 (Catheter / Tube)',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'Y',
    nurseSupportNote: '야간 제외',
    timeRuleType: '정규/당직 분리형',
    description: `• 각종 카테터 삽입 부위 및 튜브 주변부 소독, Tracheostomy tube 드레싱 포함.
• 22:00~08:00 야간 시간대를 제외하고 공통 전담간호사가 기본 담당합니다.`
  },
  {
    id: 'TSK_SPECIAL_DRESS',
    code: 'TSK_SPECIAL_DRESS',
    name: '특수 드레싱 (통합의학과)',
    specialtyType: '비내과계',
    dept: '비내과',
    category: '치료 및 처치',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '특정 시간 예외형',
    description: `• 주말 및 공휴일에 발생하는 통합의학과 3단계 이상 Sore(욕창) 드레싱 업무입니다.
• 비내과 당직인턴1 (공용폰: 010-7628-5803)로 다이렉트 매칭됩니다.`
  },
  {
    id: 'TSK_UR_OP_DRESS',
    code: 'TSK_UR_OP_DRESS',
    name: '수술 부위 드레싱 (UR Op site)',
    specialtyType: '비내과계',
    dept: '비내과',
    category: '치료 및 처치',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '특정 시간 예외형',
    description: `• 일요일에 발생하는 UR(비뇨의학과) 수술 부위(Op site) 드레싱 업무입니다.
• 비내과 당직인턴1 (공용폰: 010-7628-5803)로 다이렉트 매칭됩니다.`
  },
  {
    id: 'TSK_FOLEY_NELATON',
    code: 'TSK_FOLEY_NELATON',
    name: '유치도뇨관(Foley) Nelaton 삽입 및 제거',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'Y',
    nurseSupportNote: '상시 지원',
    timeRuleType: '시간대 무관 고정형',
    description: `• 단순 도뇨 및 유치 도뇨관 삽입/제거 업무입니다.
• 외과 환자의 Foley 및 CIC(간헐적 자가도뇨) 업무를 포함하여 공통 전담간호사가 상시 담당합니다.`
  },
  {
    id: 'TSK_DRAIN_CATHETER',
    code: 'TSK_DRAIN_CATHETER',
    name: '배액관 및 카테터 관리',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'Y',
    nurseSupportNote: '상시 지원',
    timeRuleType: '시간대 무관 고정형',
    description: `• 배액주머니 교체 및 복강/흉강 배액관 제거, CVC/PICC 제거, Chemoport needling.
• 공통 전담간호사가 담당합니다.`
  },
  {
    id: 'TSK_LTUBE',
    code: 'TSK_LTUBE',
    name: 'L-tube 삽관 및 발관',
    specialtyType: '공통',
    dept: 'ALL',
    category: '치료 및 처치',
    isNurseSupport: 'Y',
    nurseSupportNote: '상시 지원',
    timeRuleType: '시간대 무관 고정형',
    description: `• 비위관(L-tube) 삽입 및 제거 업무입니다.
• 공통 전담간호사가 담당합니다.`
  },
  // ③ 동의서 카테고리 (Category: 동의서)
  {
    id: 'TSK_BLOOD_CONSENT',
    code: 'TSK_BLOOD_CONSENT',
    name: '수혈 동의서',
    specialtyType: '공통',
    dept: 'ALL',
    category: '동의서',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '정규/당직 분리형',
    description: `• 평일 정규 및 정규 외 상시: 인턴 담당 업무입니다 (공통 전담 지원 제외).
• 내과계 야간/주말: 병동 Group 1 및 MICU는 내과계 당직인턴1 / 병동 Group 2는 내과계 당직인턴2 연결.
• 비내과계 야간/주말: 당직인턴2 (Group C) 또는 당직인턴3 (Group D) 연결.`
  },
  {
    id: 'TSK_AN_CONSENT',
    code: 'TSK_AN_CONSENT',
    name: '마취 동의서 (일요일 예외)',
    specialtyType: '비내과계',
    dept: '비내과',
    category: '동의서',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '특정 시간 예외형',
    description: `• 일요일에 발행되는 AN(마취통증의학과) 마취 동의서 취득 업무입니다.
• 비내과 당직인턴1 (공용폰: 010-7628-5803)로 다이렉트 매칭됩니다.`
  },
  {
    id: 'TSK_NURSE_CONSENT',
    code: 'TSK_NURSE_CONSENT',
    name: '병동 전담간호사 동의서 (CT/MRI 조영제 등)',
    specialtyType: '내과계',
    dept: '내과',
    category: '동의서',
    isNurseSupport: 'Y',
    nurseSupportNote: '08:00~22:00',
    timeRuleType: '정규/당직 분리형',
    description: `• CT/MRI 조영제 사용 동의서, 중심정맥관 조영제 주입 동의서, MRI 진정 동의서 등.
• 병동 전담간호사 업무 지원 시간대(08:00~22:00) 내에 해당 병동 담당 공통 전담간호사가 취득합니다.`
  },
  // ④ 사망 선언 및 기타 (Category: 사망 및 기타)
  {
    id: 'TSK_DEATH_IM',
    code: 'TSK_DEATH_IM',
    name: '내과계 사망 선언',
    specialtyType: '내과계',
    dept: '내과',
    category: '사망 및 기타',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '정규/당직 분리형',
    description: `• 야간 및 주말/공휴일에 내과 환자 사망선언 발생 시 호출 대상입니다.
• 병동 Group 1 및 MICU는 내과 당직인턴1 / 병동 Group 2는 내과 당직인턴2 개인 UCAP로 다이렉트 매칭됩니다.`
  },
  {
    id: 'TSK_DEATH_INT',
    code: 'TSK_DEATH_INT',
    name: '비내과계 사망 선언 (통합의학과)',
    specialtyType: '비내과계',
    dept: '비내과',
    category: '사망 및 기타',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '시간대 무관 고정형',
    description: `• 통합의학과 입원 환자의 사망선언 호출 업무입니다.
• 비내과 당직인턴2 (공용폰: 010-7624-5803 / 내선 5-4081)로 매칭됩니다.`
  },
  {
    id: 'TSK_EMERG_OR',
    code: 'TSK_EMERG_OR',
    name: '응급수술 Assist',
    specialtyType: '비내과계',
    dept: '비내과',
    category: '사망 및 기타',
    isNurseSupport: 'N',
    nurseSupportNote: '지원 불가',
    timeRuleType: '시간대 무관 고정형',
    description: `• 비내과계 응급 수술 지원 호출입니다.
• 1순위 비내과 당직인턴1 (5-4080) 연결 후 연락 두절 시 2순위 비내과 당직인턴2 (5-4081)로 백업 흐름(Escalation)을 적용합니다.`
  },
  {
    id: 'TSK_EMERG_CPR',
    code: 'TSK_EMERG_CPR',
    name: '응급상황 CPR 및 응급약물 투여',
    specialtyType: '공통',
    dept: 'ALL',
    category: '사망 및 기타',
    isNurseSupport: 'Y',
    nurseSupportNote: '동시 호출',
    timeRuleType: '시간대 무관 고정형',
    description: `• 병동 내 응급상황 발생 시 CPR 보조 및 응급약물 주입 업무입니다.
• 공통 전담간호사와 당직 의료진이 동시에 자동 호출됩니다.`
  },
  {
    id: 'TSK_PRIM_CALL',
    code: 'TSK_PRIM_CALL',
    name: 'Primary Call',
    specialtyType: '내과계',
    dept: '내과',
    category: '사망 및 기타',
    isNurseSupport: 'Y',
    nurseSupportNote: '전담 우선',
    timeRuleType: '정규/당직 분리형',
    description: '전담간호사 우선 배정 (병동 그룹 A)'
  }
];

export const TASK_OPTIONS: Record<DepartmentType, string[]> = {
  '내과': initialTasks
    .filter(t => t.specialtyType === '내과계' || t.specialtyType === '공통' || t.dept === '내과' || t.dept === 'ALL')
    .map(t => t.name),
  '비내과': initialTasks
    .filter(t => t.specialtyType === '비내과계' || t.specialtyType === '공통' || t.dept === '비내과' || t.dept === 'ALL')
    .map(t => t.name)
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

// 인턴 마스터 (대구분: 내과/비내과, 중구분: 개인폰/개인 UCAP)
export const initialInterns: InternDoctor[] = [
  // 내과계 전공의
  { id: 'int-im-1', name: '이준재', dept: 'IM', category: '내과', ucap: '52606', phone: '010-5829-4019' },
  { id: 'int-im-2', name: '박신희', dept: 'IM', category: '내과', ucap: '52634', phone: '010-9182-3847' },
  { id: 'int-im-3', name: '전지연', dept: 'IM', category: '내과', ucap: '52642', phone: '010-4829-1920' },
  { id: 'int-im-4', name: '정소영', dept: 'IM', category: '내과', ucap: '52644', phone: '010-3948-1029' },
  { id: 'int-im-5', name: '박수현', dept: 'IM(분)', category: '내과', ucap: '52633', phone: '010-2938-4710' },
  { id: 'int-im-6', name: '신정민', dept: 'IM(분)', category: '내과', ucap: '52637', phone: '010-5928-1039' },
  { id: 'int-im-7', name: '유성윤', dept: 'PED/NP', category: '내과', ucap: '52604', phone: '010-9281-0492' },
  { id: 'int-im-8', name: '전하윤', dept: 'NP/PED', category: '내과', ucap: '52643', phone: '010-2938-1029' },

  // 비내과계 전공의
  { id: 'int-non-1', name: '이상엽', dept: 'OBGY', category: '비내과', ucap: '52605', phone: '010-3819-2049' },
  { id: 'int-non-2', name: '신유경', dept: 'OBGY', category: '비내과', ucap: '52636', phone: '010-7281-9402' },
  { id: 'int-non-3', name: '이창윤', dept: 'GS', category: '비내과', ucap: '52607', phone: '010-4729-1029' },
  { id: 'int-non-4', name: '이태겸', dept: 'GS', category: '비내과', ucap: '52641', phone: '010-9201-4829' },
  { id: 'int-non-5', name: '천지원', dept: 'OT', category: '비내과', ucap: '52608', phone: '010-1928-3049' },
  { id: 'int-non-6', name: '최남석', dept: 'RM', category: '비내과', ucap: '52609', phone: '010-5829-1029' },
  { id: 'int-non-7', name: '권민재', dept: 'CS', category: '비내과', ucap: '52632', phone: '010-1829-3049' },
  { id: 'int-non-8', name: '배규리', dept: 'AN', category: '비내과', ucap: '52635', phone: '010-8273-1940' }
];

// 당직폰 마스터 (대구분: 내과/비내과, 중구분: 당직폰 UCAP / 당직 핸드폰번호)
export const initialDutyPhones: DutyPhoneItem[] = [
  // 내과계 당직폰
  {
    id: 'dp-im-1',
    deptCategory: '내과',
    roleName: '내과 1',
    phone: '',
    ucap: '',
    notes: '개인폰(UCAP) 기본 사용'
  },
  {
    id: 'dp-im-2',
    deptCategory: '내과',
    roleName: '내과 2',
    phone: '',
    ucap: '',
    notes: '개인폰(UCAP) 기본 사용'
  },
  // 비내과계 당직폰
  {
    id: 'dp-non-1',
    deptCategory: '비내과',
    roleName: '비내과 1',
    phone: '010-7628-5803',
    ucap: '5-4080',
    notes: '정규 당직폰'
  },
  {
    id: 'dp-non-2',
    deptCategory: '비내과',
    roleName: '비내과 2',
    phone: '010-7624-5803',
    ucap: '5-4081',
    notes: '정규 당직폰'
  },
  {
    id: 'dp-non-3',
    deptCategory: '비내과',
    roleName: '비내과 3',
    phone: '010-5794-4170',
    ucap: '5-3499',
    notes: '(임시)'
  }
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

export const initialDutyRoles: string[] = ['내과 1', '내과 2', '비내과 1', '비내과 2', '비내과 3', '연차'];

export const initialSchedules: DateScheduleMap = {
  '2026-09-01': { '내과 1': '', '내과 2': '이준재', '비내과 1': '신유경', '비내과 2': '전하윤', '비내과 3': '권민재', [ROLES.IM_1]: '', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '전하윤', [ROLES.NON_IM_3]: '권민재' },
  '2026-09-02': { '내과 1': '정소영', '내과 2': '박신희', '비내과 1': '배규리', '비내과 2': '최남석', '비내과 3': '이태겸', [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '배규리', [ROLES.NON_IM_2]: '최남석', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-03': { '내과 1': '전지연', '내과 2': '이준재', '비내과 1': '이창윤', '비내과 2': '전하윤', '비내과 3': '천지원', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '이창윤', [ROLES.NON_IM_2]: '전하윤', [ROLES.NON_IM_3]: '천지원' },
  '2026-09-04': { '내과 1': '정소영', '내과 2': '박수현', '비내과 1': '신유경', '비내과 2': '권민재', '비내과 3': '이태겸', [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '권민재', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-05': { '내과 1': '이준재', '내과 2': '신정민', '비내과 1': '최남석', '비내과 2': '이상엽', '비내과 3': '이창윤', [ROLES.IM_1]: '이준재', [ROLES.IM_2]: '신정민', [ROLES.NON_IM_1]: '최남석', [ROLES.NON_IM_2]: '이상엽', [ROLES.NON_IM_3]: '이창윤' },
  '2026-09-06': { '내과 1': '전지연', '내과 2': '박수현', '비내과 1': '전하윤', '비내과 2': '배규리', '비내과 3': '천지원', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '전하윤', [ROLES.NON_IM_2]: '배규리', [ROLES.NON_IM_3]: '천지원' },
  '2026-09-07': { '내과 1': '정소영', '내과 2': '신정민', '비내과 1': '권민재', '비내과 2': '이상엽', '비내과 3': '최남석', [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '신정민', [ROLES.NON_IM_1]: '권민재', [ROLES.NON_IM_2]: '이상엽', [ROLES.NON_IM_3]: '최남석' },
  '2026-09-08': { '내과 1': '박신희', '내과 2': '이준재', '비내과 1': '이창윤', '비내과 2': '천지원', '비내과 3': '신유경', [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '이창윤', [ROLES.NON_IM_2]: '천지원', [ROLES.NON_IM_3]: '신유경' },
  '2026-09-09': { '내과 1': '전지연', '내과 2': '정소영', '비내과 1': '이상엽', '비내과 2': '배규리', '비내과 3': '이태겸', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '이상엽', [ROLES.NON_IM_2]: '배규리', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-10': { '내과 1': '박신희', '내과 2': '박수현', '비내과 1': '전하윤', '비내과 2': '신유경', '비내과 3': '권민재', [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '전하윤', [ROLES.NON_IM_2]: '신유경', [ROLES.NON_IM_3]: '권민재' },
  '2026-09-11': { '내과 1': '전지연', '내과 2': '신정민', '비내과 1': '최남석', '비내과 2': '배규리', '비내과 3': '이태겸', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '신정민', [ROLES.NON_IM_1]: '최남석', [ROLES.NON_IM_2]: '배규리', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-12': { '내과 1': '박수현', '내과 2': '정소영', '비내과 1': '신유경', '비내과 2': '이창윤', '비내과 3': '이상엽', [ROLES.IM_1]: '박수현', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '이창윤', [ROLES.NON_IM_3]: '이상엽' },
  '2026-09-13': { '내과 1': '신정민', '내과 2': '이준재', '비내과 1': '전하윤', '비내과 2': '천지원', '비내과 3': '권민재', [ROLES.IM_1]: '신정민', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '전하윤', [ROLES.NON_IM_2]: '천지원', [ROLES.NON_IM_3]: '권민재' },
  '2026-09-14': { '내과 1': '전지연', '내과 2': '박신희', '비내과 1': '배규리', '비내과 2': '이상엽', '비내과 3': '이창윤', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '배규리', [ROLES.NON_IM_2]: '이상엽', [ROLES.NON_IM_3]: '이창윤' },
  '2026-09-15': { '내과 1': '정소영', '내과 2': '이준재', '비내과 1': '최남석', '비내과 2': '이태겸', '비내과 3': '전하윤', [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '최남석', [ROLES.NON_IM_2]: '이태겸', [ROLES.NON_IM_3]: '전하윤' },
  '2026-09-16': { '내과 1': '박수현', '내과 2': '박신희', '비내과 1': '천지원', '비내과 2': '권민재', '비내과 3': '신유경', [ROLES.IM_1]: '박수현', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '천지원', [ROLES.NON_IM_2]: '권민재', [ROLES.NON_IM_3]: '신유경' },
  '2026-09-17': { '내과 1': '신정민', '내과 2': '전지연', '비내과 1': '이태겸', '비내과 2': '최남석', '비내과 3': '배규리', [ROLES.IM_1]: '신정민', [ROLES.IM_2]: '전지연', [ROLES.NON_IM_1]: '이태겸', [ROLES.NON_IM_2]: '최남석', [ROLES.NON_IM_3]: '배규리' },
  '2026-09-18': { '내과 1': '이준재', '내과 2': '박수현', '비내과 1': '이상엽', '비내과 2': '이창윤', '비내과 3': '유성윤', [ROLES.IM_1]: '이준재', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '이상엽', [ROLES.NON_IM_2]: '이창윤', [ROLES.NON_IM_3]: '유성윤' },
  '2026-09-19': { '내과 1': '박신희', '내과 2': '신정민', '비내과 1': '권민재', '비내과 2': '신유경', '비내과 3': '배규리', [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '신정민', [ROLES.NON_IM_1]: '권민재', [ROLES.NON_IM_2]: '신유경', [ROLES.NON_IM_3]: '배규리' },
  '2026-09-20': { '내과 1': '정소영', '내과 2': '전지연', '비내과 1': '이창윤', '비내과 2': '천지원', '비내과 3': '이상엽', [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '전지연', [ROLES.NON_IM_1]: '이창윤', [ROLES.NON_IM_2]: '천지원', [ROLES.NON_IM_3]: '이상엽' },
  '2026-09-21': { '내과 1': '박수현', '내과 2': '이준재', '비내과 1': '이태겸', '비내과 2': '유성윤', '비내과 3': '최남석', [ROLES.IM_1]: '박수현', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '이태겸', [ROLES.NON_IM_2]: '유성윤', [ROLES.NON_IM_3]: '최남석' },
  '2026-09-22': { '내과 1': '박신희', '내과 2': '전지연', '비내과 1': '천지원', '비내과 2': '배규리', '비내과 3': '권민재', [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '전지연', [ROLES.NON_IM_1]: '천지원', [ROLES.NON_IM_2]: '배규리', [ROLES.NON_IM_3]: '권민재' },
  '2026-09-23': { '내과 1': '신정민', '내과 2': '박수현', '비내과 1': '신유경', '비내과 2': '이상엽', '비내과 3': '이창윤', [ROLES.IM_1]: '신정민', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '이상엽', [ROLES.NON_IM_3]: '이창윤' },
  '2026-09-24': { '내과 1': '이준재', '내과 2': '정소영', '비내과 1': '최남석', '비내과 2': '이태겸', '비내과 3': '유성윤', [ROLES.IM_1]: '이준재', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '최남석', [ROLES.NON_IM_2]: '이태겸', [ROLES.NON_IM_3]: '유성윤' },
  '2026-09-25': { '내과 1': '신정민', '내과 2': '박신희', '비내과 1': '권민재', '비내과 2': '천지원', '비내과 3': '배규리', [ROLES.IM_1]: '신정민', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '권민재', [ROLES.NON_IM_2]: '천지원', [ROLES.NON_IM_3]: '배규리' },
  '2026-09-26': { '내과 1': '박수현', '내과 2': '전지연', '비내과 1': '이상엽', '비내과 2': '이창윤', '비내과 3': '신유경', [ROLES.IM_1]: '박수현', [ROLES.IM_2]: '전지연', [ROLES.NON_IM_1]: '이상엽', [ROLES.NON_IM_2]: '이창윤', [ROLES.NON_IM_3]: '신유경' },
  '2026-09-27': { '내과 1': '박신희', '내과 2': '정소영', '비내과 1': '천지원', '비내과 2': '최남석', '비내과 3': '유성윤', [ROLES.IM_1]: '박신희', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '천지원', [ROLES.NON_IM_2]: '최남석', [ROLES.NON_IM_3]: '유성윤' },
  '2026-09-28': { '내과 1': '이준재', '내과 2': '전지연', '비내과 1': '배규리', '비내과 2': '권민재', '비내과 3': '이태겸', [ROLES.IM_1]: '이준재', [ROLES.IM_2]: '전지연', [ROLES.NON_IM_1]: '배규리', [ROLES.NON_IM_2]: '권민재', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-29': { '내과 1': '신정민', '내과 2': '정소영', '비내과 1': '천지원', '비내과 2': '신유경', '비내과 3': '최남석', [ROLES.IM_1]: '신정민', [ROLES.IM_2]: '정소영', [ROLES.NON_IM_1]: '천지원', [ROLES.NON_IM_2]: '신유경', [ROLES.NON_IM_3]: '최남석' },
  '2026-09-30': { '내과 1': '전지연', '내과 2': '박신희', '비내과 1': '이태겸', '비내과 2': '이창윤', '비내과 3': '이상엽', [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '이태겸', [ROLES.NON_IM_2]: '이창윤', [ROLES.NON_IM_3]: '이상엽' }
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

export const areWardsEqual = (w1?: string, w2?: string): boolean => {
  if (!w1 || !w2) return false;
  const clean1 = w1.replace(/\s+/g, '').replace('병동', '').replace(/W$/i, '').toLowerCase();
  const clean2 = w2.replace(/\s+/g, '').replace('병동', '').replace(/W$/i, '').toLowerCase();
  return clean1 === clean2;
};

export const getCNPostContact = (roleName: string, cnPosts: CNPost[]): { ucap: string; phone: string } => {
  if (!roleName || !cnPosts || cnPosts.length === 0) return { ucap: '', phone: '' };
  const clean = roleName.replace(/\s+/g, '').toLowerCase();
  
  // 1. 포스트 명칭 전체 매칭 (예: '공통전담1' vs '공통전담 1')
  const found = cnPosts.find(p => {
    const pClean = p.name.replace(/\s+/g, '').toLowerCase();
    return pClean === clean || clean.includes(pClean) || pClean.includes(clean);
  });
  if (found) {
    return { ucap: (found.ucap || '').trim(), phone: (found.phone || '').trim() };
  }

  // 2. 번호 기반 매칭 (예: '공통전담 2' -> 2 추출 후 'CN2' 또는 '공통전담2' 검색)
  const matchNum = roleName.match(/\d+/);
  if (matchNum) {
    const num = matchNum[0];
    const foundByNum = cnPosts.find(p => {
      const pClean = p.name.replace(/\s+/g, '').toLowerCase();
      return pClean.includes(num) || p.id.toLowerCase() === `cn${num}`;
    });
    if (foundByNum) return { ucap: (foundByNum.ucap || '').trim(), phone: (foundByNum.phone || '').trim() };
  }
  return { ucap: '', phone: '' };
};

// 공통전담간호사 시간대별/요일별 근무표 (이미지 1 공식 엑셀 양식 6개 병동 그룹 완벽 반영)
export const initialCNGroupSchedules: CNGroupSchedule[] = [
  {
    id: 'cng-1',
    title: 'MICU, 81, 82W',
    wards: ['MICU', '81', '82', '81W', '82W', '81병동', '82병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
        4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
      },
      'ts_eve': {
        1: { role: '공통전담 3', ucap: '53003' }, 2: { role: '공통전담 3', ucap: '53003' }, 3: { role: '공통전담 3', ucap: '53003' },
        4: { role: '공통전담 3', ucap: '53003' }, 5: { role: '공통전담 3', ucap: '53003' }, 6: { role: '공통전담 4', ucap: '53004' }, 0: { role: '공통전담 4', ucap: '53004' }
      },
      'ts_night': {
        1: { role: '공통전담 3', ucap: '53003' }, 2: { role: '공통전담 3', ucap: '53003' }, 3: { role: '공통전담 3', ucap: '53003' },
        4: { role: '공통전담 3', ucap: '53003' }, 5: { role: '공통전담 3', ucap: '53003' }, 6: { role: '공통전담 4', ucap: '53004' }, 0: { role: '공통전담 4', ucap: '53004' }
      }
    }
  },
  {
    id: 'cng-2',
    title: '한방, 71W',
    wards: ['한방', '71', '71W', '71병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 1', ucap: '53001' }, 2: { role: '공통전담 1', ucap: '53001' }, 3: { role: '공통전담 1', ucap: '53001' },
        4: { role: '공통전담 1', ucap: '53001' }, 5: { role: '공통전담 1', ucap: '53001' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
      },
      'ts_eve': {
        1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
        4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 2', ucap: '53002' }, 0: { role: '공통전담 2', ucap: '53002' }
      },
      'ts_night': {
        1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
        4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 2', ucap: '53002' }, 0: { role: '공통전담 2', ucap: '53002' }
      }
    }
  },
  {
    id: 'cng-3',
    title: 'SICU, 61, 62W',
    wards: ['SICU', '61', '62', '61W', '62W', '61병동', '62병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 3', ucap: '53003' }, 2: { role: '공통전담 3', ucap: '53003' }, 3: { role: '공통전담 3', ucap: '53003' },
        4: { role: '공통전담 3', ucap: '53003' }, 5: { role: '공통전담 3', ucap: '53003' }, 6: { role: '공통전담 2', ucap: '53002' }, 0: { role: '공통전담 2', ucap: '53002' }
      },
      'ts_eve': {
        1: { role: '공통전담 1', ucap: '53001' }, 2: { role: '공통전담 1', ucap: '53001' }, 3: { role: '공통전담 1', ucap: '53001' },
        4: { role: '공통전담 1', ucap: '53001' }, 5: { role: '공통전담 1', ucap: '53001' }, 6: { role: '공통전담 3', ucap: '53003' }, 0: { role: '공통전담 3', ucap: '53003' }
      },
      'ts_night': {
        1: { role: '공통전담 1', ucap: '53001' }, 2: { role: '공통전담 1', ucap: '53001' }, 3: { role: '공통전담 1', ucap: '53001' },
        4: { role: '공통전담 1', ucap: '53001' }, 5: { role: '공통전담 1', ucap: '53001' }, 6: { role: '공통전담 3', ucap: '53003' }, 0: { role: '공통전담 3', ucap: '53003' }
      }
    }
  },
  {
    id: 'cng-4',
    title: '42, 72, 121W, AKU, DR, DSR',
    wards: ['42', '72', '121W', 'AKU', 'DR', 'DSR', '42병동', '72병동', '121병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
        4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
      },
      'ts_eve': {
        1: { role: '공통전담 3', ucap: '53003' }, 2: { role: '공통전담 3', ucap: '53003' }, 3: { role: '공통전담 3', ucap: '53003' },
        4: { role: '공통전담 3', ucap: '53003' }, 5: { role: '공통전담 3', ucap: '53003' }, 6: { role: '공통전담 4', ucap: '53004' }, 0: { role: '공통전담 4', ucap: '53004' }
      },
      'ts_night': {
        1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
        4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 2', ucap: '53002' }, 0: { role: '공통전담 2', ucap: '53002' }
      }
    }
  },
  {
    id: 'cng-5',
    title: '102, 111, 112W',
    wards: ['102', '111', '112', '102W', '111W', '112W', '102병동', '111병동', '112병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 4', ucap: '53004' }, 2: { role: '공통전담 4', ucap: '53004' }, 3: { role: '공통전담 4', ucap: '53004' },
        4: { role: '공통전담 4', ucap: '53004' }, 5: { role: '공통전담 4', ucap: '53004' }, 6: { role: '공통전담 3', ucap: '53003' }, 0: { role: '공통전담 3', ucap: '53003' }
      },
      'ts_eve': {
        1: { role: '공통전담 5', ucap: '53005' }, 2: { role: '공통전담 5', ucap: '53005' }, 3: { role: '공통전담 5', ucap: '53005' },
        4: { role: '공통전담 5', ucap: '53005' }, 5: { role: '공통전담 5', ucap: '53005' }, 6: { role: '공통전담 5', ucap: '53005' }, 0: { role: '공통전담 5', ucap: '53005' }
      },
      'ts_night': {
        1: { role: '공통전담 5', ucap: '53005' }, 2: { role: '공통전담 5', ucap: '53005' }, 3: { role: '공통전담 5', ucap: '53005' },
        4: { role: '공통전담 5', ucap: '53005' }, 5: { role: '공통전담 5', ucap: '53005' }, 6: { role: '공통전담 5', ucap: '53005' }, 0: { role: '공통전담 5', ucap: '53005' }
      }
    }
  },
  {
    id: 'cng-6',
    title: '주사실, ,92,101W',
    wards: ['주사실', '92', '101', '92W', '101W', '92병동', '101병동'],
    schedule: {
      'ts_day': {
        1: { role: '공통전담 5', ucap: '53005' }, 2: { role: '공통전담 5', ucap: '53005' }, 3: { role: '공통전담 5', ucap: '53005' },
        4: { role: '공통전담 5', ucap: '53005' }, 5: { role: '공통전담 5', ucap: '53005' }, 6: { role: '공통전담 4', ucap: '53004' }, 0: { role: '공통전담 4', ucap: '53004' }
      },
      'ts_eve': {
        1: { role: '공통전담 4', ucap: '53004' }, 2: { role: '공통전담 4', ucap: '53004' }, 3: { role: '공통전담 4', ucap: '53004' },
        4: { role: '공통전담 4', ucap: '53004' }, 5: { role: '공통전담 4', ucap: '53004' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
      },
      'ts_night': {
        1: { role: '공통전담 4', ucap: '53004' }, 2: { role: '공통전담 4', ucap: '53004' }, 3: { role: '공통전담 4', ucap: '53004' },
        4: { role: '공통전담 4', ucap: '53004' }, 5: { role: '공통전담 4', ucap: '53004' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
      }
    }
  }
];

export const emergencyContacts: EmergencyContact[] = [
  { id: 'em-1', name: '응급의학과 메인', dept: '응급실', ucap: '5-1119', phone: '010-8888-1119', category: 'ER' },
  { id: 'em-2', name: '중환자실(MICU)', dept: '내과중환자실', ucap: '5-2200', phone: '010-8888-2200', category: 'ICU' },
  { id: 'em-3', name: '외과중환자실(SICU)', dept: '외과중환자실', ucap: '5-2300', phone: '010-8888-2300', category: 'ICU' },
  { id: 'em-4', name: '수술실 본원 데스크', dept: '수술실', ucap: '5-3300', phone: '010-8888-3300', category: 'OR' },
  { id: 'em-5', name: '진단검사의학과 야간', dept: '진단검사의학', ucap: '5-4400', phone: '010-8888-4400', category: 'LAB' },
  { id: 'em-6', name: '약제팀 야간 조제실', dept: '약제팀', ucap: '5-5500', phone: '010-8888-5500', category: 'ADMIN' },
];

export const initialPathologistSchedules: PathologistSchedule[] = [
  { 
    id: 'path-1', 
    startDate: '2026-09-01', 
    endDate: '2026-09-15', 
    dayType: 'WEEKDAY', 
    startTime: '06:00', 
    endTime: '08:00', 
    name: '황예진', 
    phone: '010-9907-8298', 
    ucap: '5-9907' 
  },
  { 
    id: 'path-2', 
    startDate: '2026-09-16', 
    endDate: '2026-09-30', 
    dayType: 'WEEKDAY', 
    startTime: '06:00', 
    endTime: '08:00', 
    name: '윤은솔', 
    phone: '010-8821-4928', 
    ucap: '5-9908' 
  }
];
