import { 
  DepartmentType, ROLES, DUTY_PHONES, DUTY_UCAPS, WARD_GROUPS, getCNPostContact, areWardsEqual,
  initialInternWardGroups 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, 
  SearchResult, ContactInfo, CustomRule, PathologistSchedule, DutyPhoneItem, CNGroupSchedule,
  InternDoctor, TaskItem, InternWardGroupSetting 
} from '../types';
import { checkKoreanHoliday } from './koreanHolidays';

/**
 * 당직표에서 역할별 의사 이름을 검색합니다. ('내과 1', '내과1 (인턴1)', '비내과 1' 등 별칭 자동 처리)
 */
export function getScheduleDoctor(schedule: Record<string, string> | undefined, roleKey: string): string {
  if (!schedule) return '';
  if (schedule[roleKey]) return schedule[roleKey];

  const cleanKey = roleKey.replace(/\s+/g, '').toLowerCase();

  // 1. Exact match after cleaning whitespace & lowercasing
  for (const [k, v] of Object.entries(schedule)) {
    if (!v) continue;
    const cleanK = k.replace(/\s+/g, '').toLowerCase();
    if (cleanK === cleanKey) return v;
  }

  // 2. Distinguish 내과 from 비내과
  const isNonIm = cleanKey.includes('비내과') || cleanKey.includes('non');
  const isIm = !isNonIm && (cleanKey.includes('내과') || cleanKey.includes('im'));

  for (const [k, v] of Object.entries(schedule)) {
    if (!v) continue;
    const cleanK = k.replace(/\s+/g, '').toLowerCase();
    const kIsNonIm = cleanK.includes('비내과') || cleanK.includes('non');
    const kIsIm = !kIsNonIm && (cleanK.includes('내과') || cleanK.includes('im'));

    if (isIm && kIsIm) {
      if ((cleanKey.includes('1') || cleanKey.includes('인턴1')) && (cleanK.includes('1') || cleanK.includes('인턴1'))) return v;
      if ((cleanKey.includes('2') || cleanKey.includes('인턴2')) && (cleanK.includes('2') || cleanK.includes('인턴2'))) return v;
    }

    if (isNonIm && kIsNonIm) {
      if ((cleanKey.includes('1') || cleanKey.includes('당직인턴1')) && (cleanK.includes('1') || cleanK.includes('당직인턴1'))) return v;
      if ((cleanKey.includes('2') || cleanKey.includes('당직인턴2')) && (cleanK.includes('2') || cleanK.includes('당직인턴2'))) return v;
      if ((cleanKey.includes('3') || cleanKey.includes('당직인턴3')) && (cleanK.includes('3') || cleanK.includes('당직인턴3'))) return v;
    }

    if ((cleanKey.includes('연차') || cleanKey.includes('휴가') || cleanKey.includes('off')) &&
        (cleanK.includes('연차') || cleanK.includes('휴가') || cleanK.includes('off'))) {
      return v;
    }
  }

  return '';
}

export function evaluateDutyRules(
  selectedDept: DepartmentType,
  selectedWard: string,
  selectedTask: string,
  selectedDate: string,
  selectedTime: string,
  schedules: DateScheduleMap,
  contacts: ContactMap,
  cnPosts: CNPost[],
  timeSlots: TimeSlot[],
  weeklyCNSchedule: WeeklyCNScheduleMap,
  customRules: CustomRule[] = [],
  pathologistSchedules: PathologistSchedule[] = [],
  dutyPhones: DutyPhoneItem[] = [],
  cnGroupSchedules: CNGroupSchedule[] = [],
  interns: InternDoctor[] = [],
  tasks: TaskItem[] = [],
  internWardGroups: InternWardGroupSetting[] = initialInternWardGroups
): SearchResult {
  const holidayInfo = checkKoreanHoliday(selectedDate);
  const isWeekendOrHoliday = holidayInfo.isHolidayOrWeekend;
  const dateObj = new Date(selectedDate);
  const dayOfWeek = dateObj.getDay(); 
  const isSunday = dayOfWeek === 0;

  const hour = parseInt(selectedTime.split(':')[0], 10);
  const minute = parseInt(selectedTime.split(':')[1] || '0', 10);
  const timeDecimal = hour + minute / 60;
  
  // 정규 시간: 평일(공휴일 제외) 08:00 ~ 17:00
  const isRegularHours = !isWeekendOrHoliday && (timeDecimal >= 8 && timeDecimal < 17);
  // 야간 시간: 22:00 ~ 익일 08:00
  const isNightHours = (timeDecimal >= 22 || timeDecimal < 8);
  // 이브닝 구간: 17:00 ~ 22:00
  const isEveningHours = (timeDecimal >= 17 && timeDecimal < 22);

  let assignedRole: string | null = null;
  let backupRole = '';
  let notes = '';
  let dutyPhone: string | null = null;
  let dutyUcap: string | null = null;
  let ruleSource: 'DYNAMIC_RULE' | 'SYSTEM_DEFAULT' = 'SYSTEM_DEFAULT';
  let matchedRuleName: string | undefined = undefined;

  const cleanTask = selectedTask.replace(/\s+/g, '').toLowerCase();
  const isTask = (keyword: string) => cleanTask.includes(keyword.replace(/\s+/g, '').toLowerCase());

  // 업무 마스터(Task Master) 매칭
  const cleanSelectedTask = selectedTask.replace(/\s+/g, '').toLowerCase();
  const matchedTaskItem = tasks.find(t => {
    const cleanName = t.name.replace(/\s+/g, '').toLowerCase();
    const cleanNameBase = t.name.split('(')[0].replace(/\s+/g, '').toLowerCase();
    return cleanName === cleanSelectedTask || 
      cleanSelectedTask.includes(cleanName) || 
      cleanName.includes(cleanSelectedTask) ||
      (cleanNameBase && cleanSelectedTask.includes(cleanNameBase));
  });

  // 인턴 역할별 담당 병동 그룹 해석 (관리자 설정 우선)
  const activeInternGroups = (internWardGroups && internWardGroups.length > 0) ? internWardGroups : initialInternWardGroups;
  const im1Wards = activeInternGroups.find(g => g.id === 'im_1')?.wards || WARD_GROUPS.GROUP_A;
  const im2Wards = activeInternGroups.find(g => g.id === 'im_2')?.wards || WARD_GROUPS.GROUP_B;
  const nonIm1Wards = activeInternGroups.find(g => g.id === 'non_im_1')?.wards || ['응급실', '수술실', 'DR', 'DSR'];
  const nonIm2Wards = activeInternGroups.find(g => g.id === 'non_im_2')?.wards || WARD_GROUPS.GROUP_C;
  const nonIm3Wards = activeInternGroups.find(g => g.id === 'non_im_3')?.wards || WARD_GROUPS.GROUP_D;

  const isIM1Ward = im1Wards.some(w => areWardsEqual(w, selectedWard));
  const isIM2Ward = im2Wards.some(w => areWardsEqual(w, selectedWard));
  const isNonIM1Ward = nonIm1Wards.some(w => areWardsEqual(w, selectedWard));
  const isNonIM2Ward = nonIm2Wards.some(w => areWardsEqual(w, selectedWard));
  const isNonIM3Ward = nonIm3Wards.some(w => areWardsEqual(w, selectedWard));

  // 병동 그룹군 분류 및 명칭
  let matchedWardGroup = '';
  if (selectedDept === '내과') {
    if (isIM1Ward) matchedWardGroup = activeInternGroups.find(g => g.id === 'im_1')?.title || '내과계 병동 Group 1 (MICU 등)';
    else if (isIM2Ward) matchedWardGroup = activeInternGroups.find(g => g.id === 'im_2')?.title || '내과계 병동 Group 2';
    else matchedWardGroup = '내과계 기타 병동';
  } else {
    if (isNonIM1Ward) matchedWardGroup = activeInternGroups.find(g => g.id === 'non_im_1')?.title || '비내과계 응급/지정 병동';
    else if (isNonIM2Ward) matchedWardGroup = activeInternGroups.find(g => g.id === 'non_im_2')?.title || '비내과계 병동 Group C (SICU/외과계)';
    else if (isNonIM3Ward) matchedWardGroup = activeInternGroups.find(g => g.id === 'non_im_3')?.title || '비내과계 병동 Group D';
    else matchedWardGroup = '비내과계 기타 병동';
  }

  // =========================================================================
  // 우선순위 0: 관리자 동적 규칙 (Custom Rules from Rule Builder) 평가
  // =========================================================================
  const enabledRules = customRules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority);
  for (const rule of enabledRules) {
    const cond = rule.condition;

    // 1. 진료계열 조건 검사
    if (cond.department && cond.department !== 'ALL' && cond.department !== selectedDept) {
      continue;
    }

    // 2. 요일/공휴일 조건 검사
    if (cond.dayCategory === 'WEEKEND_HOLIDAY' && !isWeekendOrHoliday) continue;
    if (cond.dayCategory === 'WEEKDAY' && isWeekendOrHoliday) continue;
    if (cond.dayCategory === 'SUNDAY_ONLY' && !isSunday) continue;

    // 3. 시간대 조건 검사
    if (cond.timeCategory === 'REGULAR' && !isRegularHours) continue;
    if (cond.timeCategory === 'NON_REGULAR' && isRegularHours) continue;
    if (cond.timeCategory === 'NIGHT_22_08' && !isNightHours) continue;
    if (cond.timeCategory === 'EVENING_17_22' && !isEveningHours) continue;
    if (cond.timeCategory === 'MORNING_06_08' && !(timeDecimal >= 6 && timeDecimal < 8)) continue;

    // 4. 병동 조건 검사 (dynamic group support)
    if (cond.specificWards && cond.specificWards.length > 0 && !cond.specificWards.includes(selectedWard)) {
      continue;
    }
    // Dynamic ward group matching: allow rule to refer to intern ward group IDs or titles
    if (cond.wardGroup) {
      // Check against static groups first
      const staticMatch = (
        (cond.wardGroup === 'GROUP_A' && WARD_GROUPS.GROUP_A.includes(selectedWard)) ||
        (cond.wardGroup === 'GROUP_B' && WARD_GROUPS.GROUP_B.includes(selectedWard)) ||
        (cond.wardGroup === 'GROUP_C' && WARD_GROUPS.GROUP_C.includes(selectedWard)) ||
        (cond.wardGroup === 'GROUP_D' && WARD_GROUPS.GROUP_D.includes(selectedWard))
      );
      if (staticMatch) {
        // matched static group, proceed
      } else {
        // Attempt to match against dynamic intern ward groups
        const dynGroup = (internWardGroups && internWardGroups.length > 0)
          ? internWardGroups.find(g => g.id === cond.wardGroup || g.title === cond.wardGroup)
          : null;
        if (!dynGroup || !dynGroup.wards.some(w => areWardsEqual(w, selectedWard))) {
          continue; // no matching group
        }
      }
    }
    // If no wardGroup condition, fall through to next checks (none needed)
    // Note: existing static checks removed as they are covered above

    // 5. 업무 키워드 조건 검사
    if (cond.taskKeywords && cond.taskKeywords.length > 0) {
      const matchKeyword = cond.taskKeywords.some(k => isTask(k));
      if (!matchKeyword) continue;
    }

    // 조건 일치: 규칙 액션 실행 (관리자 규칙 최우선 강제 적용)
    assignedRole = rule.action.assignedRole;
    notes = `[규칙 빌더: ${rule.name}] ${rule.action.notes || ''}`;
    backupRole = rule.action.backupRole || '';
    if (rule.action.dutyPhone) dutyPhone = rule.action.dutyPhone;
    if (rule.action.dutyUcap) dutyUcap = rule.action.dutyUcap;
    ruleSource = 'DYNAMIC_RULE';
    matchedRuleName = rule.name;
    break;
  }

  // =========================================================================
  // 기본 규칙 엔진 (System Default Rules)
  // =========================================================================
  if (!assignedRole) {
    // -----------------------------------------------------------------------
    // 규칙 0: 임상병리사 예외 규칙 (관리자가 조정한 기간, 평일/공휴일, 시간대 적용)
    // -----------------------------------------------------------------------
    const matchedPathologist = pathologistSchedules.find(p => {
      if (p.startDate && selectedDate < p.startDate) return false;
      if (p.endDate && selectedDate > p.endDate) return false;
      const dayType = p.dayType || 'WEEKDAY';
      if (dayType === 'WEEKDAY' && isWeekendOrHoliday) return false;
      if (dayType === 'WEEKEND_HOLIDAY' && !isWeekendOrHoliday) return false;
      const sTime = p.startTime || '06:00';
      const eTime = p.endTime || '08:00';
      if (selectedTime < sTime || selectedTime >= eTime) return false;
      return true;
    });

    // 응급상황 CPR 및 응급약물 투여 (진료과/시간대 무관 공통 동시 호출)
    if (isTask('CPR') || isTask('응급약물') || isTask('응급상황')) {
      assignedRole = '공통 전담간호사 & 당직의료진 (동시 호출)';
      notes = '병동 내 응급상황: 공통 전담간호사와 당직 의료진이 동시에 자동 호출됩니다.';
    }
    else if (isTask('EKG') && (matchedPathologist || (!isWeekendOrHoliday && timeDecimal >= 6 && timeDecimal < 8))) {
      assignedRole = ROLES.PATHOLOGIST;
      if (matchedPathologist) {
        const dayLabel = matchedPathologist.dayType === 'WEEKDAY' ? '평일' : (matchedPathologist.dayType === 'WEEKEND_HOLIDAY' ? '주말/공휴일' : '매일');
        notes = `${matchedPathologist.name} 임상병리사 순환일정 매칭 (${dayLabel} ${matchedPathologist.startTime || '06:00'}~${matchedPathologist.endTime || '08:00'})`;
      } else {
        notes = '평일 06:00~08:00 정규 EKG(P)는 임상병리사 담당입니다.';
      }
    }

    // -----------------------------------------------------------------------
    // 규칙 1: 내과계 (Internal Medicine) 매칭 로직
    // -----------------------------------------------------------------------
    else if (selectedDept === '내과') {
      // 0. 수혈 동의서 (상시 인턴 전담 - 전담간호사 지원 불가)
      if (isTask('수혈')) {
        const isGroupB = isIM2Ward;
        if (isGroupB) {
          assignedRole = ROLES.IM_2;
          notes = `내과계 병동 Group 2(${selectedWard}) 수혈 동의서는 내과 인턴 2 담당입니다 (전담간호사 지원 불가, 개인 UCAP 연결).`;
        } else {
          assignedRole = ROLES.IM_1;
          notes = `내과계 병동 Group 1(${selectedWard}) 수혈 동의서는 내과 인턴 1 담당입니다 (전담간호사 지원 불가, 개인 UCAP 연결).`;
        }
      }
      // 1. 상시 공통 전담간호사 지원 업무 (Category 1, 2)
      else if (
        isTask('Peripheral') || isTask('일반 정맥 채혈') || isTask('말초') ||
        isTask('Foley') || isTask('Nelaton') || isTask('도뇨') ||
        isTask('배액관') || isTask('카테터 관리') || isTask('Chemoport') ||
        isTask('L-tube') || isTask('비위관')
      ) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '진료과 및 시간대에 상관없이 언제나 공통 전담간호사 상시 지원 대상입니다.';
      }
      // 2. 단순 드레싱, 복합 드레싱: 22:00~08:00 야간 제외하고 공통 전담간호사 기본 담당
      else if (!isNightHours && (isTask('단순 드레싱') || isTask('복합 드레싱') || isTask('Catheter / Tube'))) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '공통 전담간호사가 기본 담당합니다 (22:00~08:00 야간 시간대 제외).';
      }
      // 3. 병동 전담간호사 동의서 (CT/MRI 조영제 등): 08:00~22:00 공통 전담간호사
      else if (isTask('조영제') || isTask('진정 동의서') || isTask('전담간호사 동의서')) {
        if (!isNightHours) {
          assignedRole = ROLES.COMMON_NURSE;
          notes = '병동 전담간호사 업무 지원 시간대(08:00~22:00) 내에 해당 병동 담당 공통 전담간호사가 취득합니다.';
        } else {
          assignedRole = ROLES.IM_1;
          notes = '심야(22:00~08:00) 조영제/진정 동의서는 당직 의료진이 취득합니다.';
        }
      }
      else if (isRegularHours) {
        // 평일 정규시간 (08:00 ~ 17:00)
        if (isTask('그외 술기') || (isTask('동의서') && !isTask('수혈') && !isTask('마취'))) {
          assignedRole = ROLES.COMMON_NURSE;
          notes = '평일 정규시간 내과계 일반 술기 및 동의서는 공통 전담간호사가 지원합니다.';
        } else if (isTask('Primary Call')) {
          assignedRole = ROLES.DUTY_NURSE;
          notes = 'Primary Call은 전담간호사가 우선 접수합니다.';
        } else if (isTask('ABGA') || isTask('Blood culture') || isTask('Line 채혈')) {
          if (selectedWard === 'MICU') {
            assignedRole = ROLES.IM_1;
            notes = '평일 정규시간 MICU ABGA/Line 채혈은 내과 인턴(내과1) 담당입니다.';
          } else {
            assignedRole = ROLES.COMMON_NURSE;
            notes = '평일 정규시간 일반병동 ABGA/Line 채혈은 공통 전담간호사 연결입니다.';
          }
        } else {
          // EKG(P), T-tube 교체 등 필수 술기 -> 병동 그룹(Group 1 vs Group 2)에 따라 내과1 또는 내과2
          if (isIM2Ward) {
            assignedRole = ROLES.IM_2;
            notes = `평일 정규시간 ${selectedWard} (내과 Group 2) 필수 술기/심전도는 내과 인턴 2 담당입니다.`;
          } else {
            assignedRole = ROLES.IM_1;
            notes = `평일 정규시간 ${selectedWard} (내과 Group 1) 필수 술기/심전도는 내과 인턴 1 담당입니다.`;
          }
        }
      } else {
        // 정규시간 외 (평일 17:00~08:00, 주말/휴일 종일)
        const isGroupA = isIM1Ward;
        const isGroupB = isIM2Ward;

        if (isGroupA) {
          // 병동 그룹 A (42, 61, 62, 82, 92, 102, MICU)
          if (isTask('Primary Call')) {
            assignedRole = ROLES.DUTY_NURSE;
            notes = '병동 그룹 A의 Primary Call은 당직 전담간호사 담당입니다.';
          } else if (isTask('T-tube') || isTask('기관절개관')) {
            if (selectedWard === 'MICU') {
              assignedRole = ROLES.IM_1;
              notes = 'MICU T-tube 교체는 내과계 당직인턴 1 담당입니다.';
            } else {
              assignedRole = '내과 전공의 (별도 콜 안내)';
              notes = '일반병동 Group 1 야간 요청 시 내과 전공의 별도 콜 안내 대상입니다.';
            }
          } else if (isTask('EKG') || isTask('수혈동의서') || isTask('사망선언')) {
            // EKG(P), 수혈동의서, 사망선언 -> 내과 당직인턴 1 (개인 UCAP 매칭)
            assignedRole = ROLES.IM_1;
            notes = '내과 당직인턴 1 담당 (개인 UCAP로 직접 연결됩니다).';
          } else if (isTask('ABGA') || isTask('Blood culture') || isTask('채혈')) {
            if (selectedWard === 'MICU') {
              assignedRole = ROLES.IM_1;
              notes = 'MICU 병동의 ABGA 및 라인 채혈은 내과 당직인턴 1 담당입니다.';
            } else {
              // 그 외 병동: 22:00~08:00은 당직 전담간호사, 17:00~22:00/주말 낮시간은 공통 전담간호사
              if (isNightHours) {
                assignedRole = ROLES.DUTY_NURSE;
                notes = '야간(22:00~08:00) 병동 ABGA/Line 채혈은 당직 전담간호사 담당입니다.';
              } else {
                assignedRole = ROLES.COMMON_NURSE;
                notes = '17:00~22:00(주말 낮) 병동 ABGA/Line 채혈은 공통 전담간호사 담당입니다.';
              }
            }
          } else {
            // 그 외 술기 및 동의서
            if (isNightHours) {
              assignedRole = ROLES.DUTY_NURSE;
              notes = '야간(22:00~08:00) 그외 술기 및 동의서는 당직 전담간호사 담당입니다.';
            } else {
              assignedRole = ROLES.COMMON_NURSE;
              notes = '17:00~22:00(주말 낮) 그외 술기 및 동의서는 공통 전담간호사 담당입니다.';
            }
          }
        } else if (isGroupB) {
          // 병동 그룹 B (71, 72, 81, 101, 111, 112)
          if (isTask('EKG') || isTask('수혈동의서') || isTask('T-tube') || isTask('사망선언')) {
            // EKG(P), 수혈동의서, T-tube 교체, 사망선언 -> 내과 당직인턴 2 (개인 UCAP 매칭)
            assignedRole = ROLES.IM_2;
            notes = '내과 당직인턴 2 담당 (개인 UCAP로 직접 연결됩니다).';
          } else if (isTask('ABGA') || isTask('Blood culture') || isTask('채혈') || isTask('그외 술기') || isTask('동의서')) {
            // 22:00~08:00에는 내과 당직인턴 2 / 그 외 시간은 공통 전담간호사
            if (isNightHours) {
              assignedRole = ROLES.IM_2;
              notes = '야간(22:00~08:00) 병동 술기/채혈은 내과 당직인턴 2 담당입니다.';
            } else {
              assignedRole = ROLES.COMMON_NURSE;
              notes = '17:00~22:00(주말 낮) 병동 술기/채혈은 공통 전담간호사 담당입니다.';
            }
          } else {
            assignedRole = ROLES.IM_2;
          }
        } else {
          // 기타 병동
          assignedRole = isNightHours ? ROLES.IM_1 : ROLES.COMMON_NURSE;
        }
      }
    }

    // -----------------------------------------------------------------------
    // 규칙 2: 비내과계 (Non-Internal Medicine) 매칭 로직
    // -----------------------------------------------------------------------
    else {
      // 0. 수혈 동의서 (상시 비내과 당직인턴 전담 - 전담간호사 지원 불가)
      if (isTask('수혈')) {
        const isGroupC = isNonIM2Ward;
        if (isGroupC) {
          assignedRole = ROLES.NON_IM_2;
          backupRole = '1순위: 비내과1 (5-4080) / 2순위: 비내과3 (5-3499)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_2];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_2];
          notes = '비내과계 병동 Group C(SICU, 42, 61, 62 등) 수혈 동의서는 비내과 당직인턴 2(5-4081) 담당입니다 (전담간호사 지원 불가).';
        } else if (isNonIM1Ward) {
          assignedRole = ROLES.NON_IM_1;
          backupRole = '1순위: 비내과2 (5-4081)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
          notes = '비내과계 지정 병동 수혈 동의서는 비내과 당직인턴 1(5-4080) 담당입니다 (전담간호사 지원 불가).';
        } else {
          assignedRole = ROLES.NON_IM_3;
          backupRole = '1순위: 비내과1 (5-4080)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_3];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_3];
          notes = '비내과계 병동 Group D(71~121) 수혈 동의서는 비내과 당직인턴 3(5-3499) 담당입니다 (전담간호사 지원 불가).';
        }
      }
      // 1. 상시 공통 전담간호사 지원 업무 (Category 1, 2)
      else if (
        isTask('Peripheral') || isTask('일반 정맥 채혈') || isTask('말초') ||
        isTask('Foley') || isTask('Nelaton') || isTask('도뇨') ||
        isTask('배액관') || isTask('카테터 관리') || isTask('Chemoport') ||
        isTask('L-tube') || isTask('비위관')
      ) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '진료과 및 시간대에 상관없이 언제나 공통 전담간호사 상시 지원 대상입니다.';
      }
      // 2. 단순 드레싱, 복합 드레싱: 22:00~08:00 야간 제외하고 공통 전담간호사 기본 담당
      else if (!isNightHours && (isTask('단순 드레싱') || isTask('복합 드레싱') || isTask('Catheter / Tube'))) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '공통 전담간호사가 기본 담당합니다 (22:00~08:00 야간 시간대 제외).';
      }
      // 비내과계 특수 및 공통 예외 업무
      else if (isTask('통합의학과 사망선언')) {
        assignedRole = ROLES.NON_IM_2;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_2];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_2];
        notes = '통합의학과 사망선언 -> 비내과 당직인턴 2(5-4081) 고정 매칭.';
      } else if (isWeekendOrHoliday && (isTask('3단계 이상 sore') || isTask('특수 드레싱') || isTask('통합의학과'))) {
        assignedRole = ROLES.NON_IM_1;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '주말/휴일 통합의학과 3단계 이상 sore(특수 드레싱) -> 비내과 당직인턴 1(5-4080) 고정.';
      } else if (isSunday && (isTask('UR Op site') || isTask('수술 부위 드레싱') || isTask('UR'))) {
        assignedRole = ROLES.NON_IM_1;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '일요일 UR Op site 수술 부위 드레싱 -> 비내과 당직인턴 1(5-4080) 고정.';
      } else if (isSunday && isTask('AN 마취동의서')) {
        assignedRole = ROLES.NON_IM_1;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '일요일 AN 마취동의서 -> 비내과 당직인턴 1(5-4080) 고정.';
      } else if (isTask('응급수술 Assist')) {
        assignedRole = ROLES.NON_IM_1;
        backupRole = '1순위 비내과1(5-4080), 2순위 비내과2(5-4081)';
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '응급수술 Assist는 1순위 비내과 당직인턴 1, 2순위 비내과 2로 배정됩니다.';
      } else if (isRegularHours && (isTask('T-tube') || isTask('기관절개관'))) {
        assignedRole = ROLES.INTERN;
        notes = '평일 정규시간 T-tube 교체는 해당 진료과 인턴 담당입니다.';
      } else if (isTask('그외 술기') || (isTask('동의서') && !isTask('수혈') && !isTask('마취'))) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '비내과 일반 술기 및 동의서는 공통 전담간호사가 지원합니다.';
      } else {
        // 일반 병동군 분기
        const isGroupC = isNonIM2Ward;
        const isGroupD = isNonIM3Ward;

        if (isGroupC) {
          // 병동 그룹 C (SICU, 분만장, 42, 61, 62, NICU)
          // -> 비내과 당직인턴 2 (010-7624-5803 / 5-4081)
          // 백업: 1순위 비내과1(5-4080), 2순위 비내과3(5-3499)
          assignedRole = ROLES.NON_IM_2;
          backupRole = '1순위: 비내과1 (5-4080) / 2순위: 비내과3 (5-3499)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_2];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_2];
          notes = '비내과계 병동 Group C (SICU, 분만장, 42, 61, 62, NICU 등) 비내과2 전담.';
        } else if (isNonIM1Ward) {
          assignedRole = ROLES.NON_IM_1;
          backupRole = '1순위: 비내과2 (5-4081)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
          notes = '비내과계 지정 담당 병동 비내과1 전담.';
        } else if (isGroupD) {
          // 병동 그룹 D (71, 72, 81, 82, 92, 101, 102, 111, 112, 121)
          // -> 비내과 당직인턴 3 (010-5794-4170 / 5-3499)
          // 백업: 1순위 비내과1(5-4080)
          assignedRole = ROLES.NON_IM_3;
          backupRole = '1순위: 비내과1 (5-4080)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_3];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_3];
          notes = '비내과계 병동 Group D (71, 72, 81, 82, 92, 101, 102, 111, 112, 121) 비내과3 전담.';
        } else {
          assignedRole = ROLES.NON_IM_2;
          backupRole = '비내과1 (5-4080)';
        }
      }
    }
  }

  // =========================================================================
  // 업무마스터(Task Master) 전담지원 여부(isNurseSupport === 'N') 안전 가드
  // 전담간호사 지원 불가 업무는 절대 공통/당직 전담간호사로 배정되지 않도록 강제 라우팅
  // =========================================================================
  if (matchedTaskItem && (matchedTaskItem.isNurseSupport === 'N' || matchedTaskItem.isNurseSupport === false)) {
    if (assignedRole === ROLES.COMMON_NURSE || assignedRole === ROLES.DUTY_NURSE) {
      if (selectedDept === '내과') {
        const isGroupB = isIM2Ward;
        assignedRole = isGroupB ? ROLES.IM_2 : ROLES.IM_1;
        notes = `${matchedTaskItem.name}은(는) 업무마스터 규정상 전담간호사 지원 불가 업무로, 내과 ${assignedRole === ROLES.IM_2 ? '인턴 2' : '인턴 1'}로 연결됩니다.`;
      } else {
        const isGroupC = isNonIM2Ward;
        assignedRole = isGroupC ? ROLES.NON_IM_2 : (isNonIM1Ward ? ROLES.NON_IM_1 : ROLES.NON_IM_3);
        dutyPhone = DUTY_PHONES[assignedRole];
        dutyUcap = DUTY_UCAPS[assignedRole];
        notes = `${matchedTaskItem.name}은(는) 업무마스터 규정상 전담간호사 지원 불가 업무로, 비내과 당직인턴(${assignedRole})으로 연결됩니다.`;
      }
    }
  }

  // =========================================================================
  // 최종 담당자 이름 및 연락처(개인 UCAP / 공용폰) 매핑
  // =========================================================================
  let assignedPerson = '미배정(근무표 확인)';
  let contactInfo: ContactInfo = { phone: '정보 없음', ucap: '정보 없음' };
  let backupContact1: (ContactInfo & { roleName: string }) | undefined = undefined;
  let backupContact2: (ContactInfo & { roleName: string }) | undefined = undefined;

  // 공통 전담간호사 매칭 세부 로직
  // 공통 전담간호사 매칭 세부 로직
  // 공통 전담간호사 및 당직 전담간호사 매칭 세부 로직 (공통전담간호 근무 매트릭스 연동)
  if (assignedRole === ROLES.COMMON_NURSE || assignedRole === ROLES.DUTY_NURSE) {
    let targetTimeSlot: TimeSlot | null = null;
    const shiftDate = new Date(selectedDate);

    for (const slot of timeSlots) {
      const s = slot.start;
      const e = slot.end;
      if (s <= e) {
        if (selectedTime >= s && selectedTime < e) targetTimeSlot = slot;
      } else {
        // 자정 경계 교대 (예: 22:00 ~ 06:30)
        if (selectedTime >= s || selectedTime < e) {
          targetTimeSlot = slot;
          if (selectedTime < e) {
            shiftDate.setDate(shiftDate.getDate() - 1);
          }
        }
      }
    }

    if (!targetTimeSlot && assignedRole === ROLES.DUTY_NURSE) {
      targetTimeSlot = timeSlots.find(ts => ts.id === 'ts_night') || timeSlots[2] || null;
    }

    const shiftDayOfWeek = shiftDate.getDay();

    // 1순위: 이미지 1 공식 통합 주간 근무표 (cnGroupSchedules)
    const matchedGroup = cnGroupSchedules.find(g => {
      if (g.wards && g.wards.some(w => areWardsEqual(w, selectedWard))) return true;
      const cleanTitle = g.title.replace(/\s+/g, '').replace('병동', '').toLowerCase();
      const cleanSel = selectedWard.replace(/\s+/g, '').replace('병동', '').toLowerCase();
      return cleanTitle.includes(cleanSel);
    });

    if (matchedGroup && targetTimeSlot) {
      const shiftCell = matchedGroup.schedule?.[targetTimeSlot.id]?.[shiftDayOfWeek];
      if (shiftCell && (shiftCell.ucap || shiftCell.role)) {
        const effectiveRole = shiftCell.role || assignedRole || '';
        const contact = getCNPostContact(effectiveRole, cnPosts);
        
        // ★ 관리자 포스트 마스터(cnPosts)에서 변경한 최신 연락처가 최우선으로 반영됨!
        const resolvedUcap = (contact.ucap && contact.ucap.trim()) 
          ? contact.ucap.trim() 
          : (shiftCell.ucap?.trim() || '');
        const resolvedPhone = (contact.phone && contact.phone.trim()) 
          ? contact.phone.trim() 
          : (shiftCell.phone?.trim() || '');

        assignedRole = shiftCell.role || (assignedRole === ROLES.DUTY_NURSE ? '당직 전담간호사' : `${matchedGroup.title}`);
        assignedPerson = `${shiftCell.role || '전담간호사'} (${targetTimeSlot.name})`;
        dutyUcap = resolvedUcap || null;
        dutyPhone = resolvedPhone || null;
        contactInfo = {
          phone: resolvedPhone || '정보 없음',
          ucap: resolvedUcap || '정보 없음',
          dumcTalk: shiftCell.role || '공통전담간호사'
        };
        notes = `${matchedGroup.title} (${selectedWard}) - ${targetTimeSlot.name} 근무 매트릭스 자동 배정`;
      }
    }

    // 2순위: 지정된 역할명(assignedRole)으로 cnPosts 직접 매칭
    if (!dutyUcap && !contactInfo.ucap && assignedRole) {
      const directContact = getCNPostContact(assignedRole, cnPosts);
      if (directContact.ucap || directContact.phone) {
        dutyUcap = directContact.ucap || null;
        dutyPhone = directContact.phone || null;
        contactInfo = {
          phone: directContact.phone || '정보 없음',
          ucap: directContact.ucap || '정보 없음',
          dumcTalk: assignedRole
        };
      }
    }

    // 3순위: 기존 포스트 기준 매칭 fallback
    if (!dutyUcap && !contactInfo.ucap) {
      const targetCN = cnPosts.find(cn => cn.wards.some(w => areWardsEqual(w, selectedWard)));
      if (targetCN && targetTimeSlot) {
        const scheduleForDay = weeklyCNSchedule[shiftDayOfWeek] || {};
        const scheduleForSlot = scheduleForDay[targetTimeSlot.id] || {};
        const nurseName = scheduleForSlot[targetCN.id];

        assignedRole = `${targetCN.name} (${targetTimeSlot.name})`;
        assignedPerson = nurseName || '미배정(근무자 없음)';
        dutyPhone = targetCN.phone;
        dutyUcap = targetCN.ucap;
        contactInfo = {
          phone: targetCN.phone,
          ucap: targetCN.ucap,
          dumcTalk: targetCN.dumcTalk || targetCN.name
        };
      } else {
        assignedRole = assignedRole === ROLES.DUTY_NURSE ? '당직 전담간호사' : '공통전담간호사 (배정정보 없음)';
        assignedPerson = '당직표 확인 요망';
        notes = notes || '해당 시간대나 병동에 관리자가 배정한 공통전담간호사 정보가 없습니다.';
      }
    }
  } 
  // 임상병리사 일정 매칭
  else if (assignedRole === ROLES.PATHOLOGIST) {
    assignedPerson = '임상병리사 (EKG 전담)';
    const matchedPathologist = pathologistSchedules.find(p => {
      if (p.startDate && selectedDate < p.startDate) return false;
      if (p.endDate && selectedDate > p.endDate) return false;
      const dayType = p.dayType || 'WEEKDAY';
      if (dayType === 'WEEKDAY' && isWeekendOrHoliday) return false;
      if (dayType === 'WEEKEND_HOLIDAY' && !isWeekendOrHoliday) return false;
      const sTime = p.startTime || '06:00';
      const eTime = p.endTime || '08:00';
      if (selectedTime < sTime || selectedTime >= eTime) return false;
      return true;
    });
    if (matchedPathologist) {
      assignedPerson = `${matchedPathologist.name} (임상병리사)`;
      dutyPhone = matchedPathologist.phone;
      dutyUcap = matchedPathologist.ucap;
      contactInfo = {
        phone: matchedPathologist.phone,
        ucap: matchedPathologist.ucap,
        dumcTalk: `임상병리사_${matchedPathologist.name}`
      };
    } else {
      contactInfo = contacts[ROLES.PATHOLOGIST] || { phone: '010-9907-8298', ucap: '5-9907', dumcTalk: '임상병리사' };
      dutyPhone = contactInfo.phone;
      dutyUcap = contactInfo.ucap;
    }
  }
  // 일반 인턴 및 당직의 매칭
  else if (assignedRole) {
    if (assignedRole === ROLES.INTERN) {
      assignedRole = selectedDept === '내과' ? (isIM2Ward ? ROLES.IM_2 : ROLES.IM_1) : (isNonIM2Ward ? ROLES.NON_IM_2 : (isNonIM1Ward ? ROLES.NON_IM_1 : ROLES.NON_IM_3));
    }
    const todaysSchedule = schedules[selectedDate];
    if (todaysSchedule) {
      const doctor = getScheduleDoctor(todaysSchedule, assignedRole);
      if (doctor) {
        assignedPerson = doctor;
      }
    }
    if (assignedRole === ROLES.DUTY_NURSE) {
      assignedPerson = assignedRole;
    }
    if (assignedPerson === '미배정(근무표 확인)') {
      // 선택 날짜에 당직표 입력이 없는 경우, 등록된 첫 번째 당직표 일정이나 interns 연락망의 전공의로 자동 매칭
      const allScheds = Object.values(schedules);
      for (const s of allScheds) {
        const doc = getScheduleDoctor(s, assignedRole);
        if (doc) {
          assignedPerson = doc;
          break;
        }
      }
      if (assignedPerson === '미배정(근무표 확인)' && interns.length > 0) {
        const deptIntern = interns.find(i => i.category === selectedDept || i.dept?.includes(selectedDept === '내과' ? 'IM' : 'GS'));
        if (deptIntern) assignedPerson = deptIntern.name;
      }
    }

    // 관리자 공용 당직폰 설정 조회
    const cleanAssigned = (assignedRole || '').replace(/\s+/g, '');
    const matchedDutyPhone = cleanAssigned ? dutyPhones.find(dp => {
      const cleanDp = dp.roleName.replace(/\s+/g, '');
      return cleanDp === cleanAssigned || cleanAssigned.includes(cleanDp) || cleanDp.includes(cleanAssigned);
    }) : undefined;

    // 1순위: 관리자 의료진 연락망(interns)에서 전공의 성명 매칭하여 개인 UCAP 및 개인폰 실시간 조회
    const matchedIntern = interns.find(it => it.name && assignedPerson && it.name.trim() === assignedPerson.trim());
    if (matchedIntern) {
      contactInfo = {
        phone: matchedIntern.phone || '미등록',
        ucap: matchedIntern.ucap || '미등록',
        dumcTalk: `${matchedIntern.name}(${matchedIntern.dept || '전공의'})`
      };
    } else if (contacts[assignedPerson]) {
      contactInfo = contacts[assignedPerson];
    }

    // 내과계 인턴: 개인 UCAP 및 개인폰 우선 (공용 당직폰이 지정된 경우 당직폰 우선)
    if (assignedRole === ROLES.IM_1 || assignedRole === ROLES.IM_2 || assignedRole?.includes('내과')) {
      dutyUcap = dutyUcap || (matchedDutyPhone && matchedDutyPhone.ucap) || contactInfo.ucap;
      dutyPhone = dutyPhone || (matchedDutyPhone && matchedDutyPhone.phone) || contactInfo.phone;
    } 
    // 비내과계 인턴: 공용 당직폰 번호 우선 연결
    else if (matchedDutyPhone && (matchedDutyPhone.phone || matchedDutyPhone.ucap)) {
      dutyPhone = dutyPhone || matchedDutyPhone.phone || DUTY_PHONES[assignedRole] || '010-7628-5803';
      dutyUcap = dutyUcap || matchedDutyPhone.ucap || DUTY_UCAPS[assignedRole] || '5-4080';
      contactInfo = { phone: dutyPhone, ucap: dutyUcap, dumcTalk: contactInfo.dumcTalk || assignedPerson };
    }
    else if (DUTY_PHONES[assignedRole]) {
      dutyPhone = dutyPhone || DUTY_PHONES[assignedRole];
      dutyUcap = dutyUcap || DUTY_UCAPS[assignedRole];
      contactInfo = { phone: dutyPhone, ucap: dutyUcap, dumcTalk: contactInfo.dumcTalk || assignedPerson };
    } 
    else {
      dutyPhone = dutyPhone || contactInfo.phone;
      dutyUcap = dutyUcap || contactInfo.ucap;
    }
  }

  // 백업 라인 상세 번호 생성
  if (backupRole.includes('비내과1')) {
    backupContact1 = {
      roleName: '비내과1 (당직인턴1)',
      phone: DUTY_PHONES[ROLES.NON_IM_1] || '010-7628-5803',
      ucap: DUTY_UCAPS[ROLES.NON_IM_1] || '5-4080'
    };
  }
  if (backupRole.includes('비내과2')) {
    backupContact2 = {
      roleName: '비내과2 (당직인턴2)',
      phone: DUTY_PHONES[ROLES.NON_IM_2] || '010-7624-5803',
      ucap: DUTY_UCAPS[ROLES.NON_IM_2] || '5-4081'
    };
  } else if (backupRole.includes('비내과3')) {
    backupContact2 = {
      roleName: '비내과3 (당직인턴3)',
      phone: DUTY_PHONES[ROLES.NON_IM_3] || '010-5794-4170',
      ucap: DUTY_UCAPS[ROLES.NON_IM_3] || '5-3499'
    };
  }

  return {
    isRegularHours,
    isHolidayOrWeekend: isWeekendOrHoliday,
    holidayName: holidayInfo.name,
    assignedRole: assignedRole || '미배정',
    assignedPerson,
    contactInfo,
    dutyPhone,
    dutyUcap,
    backupRole,
    backupContact1,
    backupContact2,
    notes,
    ruleSource,
    matchedRuleName,
    matchedTaskItem,
    matchedWardGroup
  };
}

export function getLocalISOString(): string {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
}
