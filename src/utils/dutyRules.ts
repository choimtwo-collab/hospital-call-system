import { 
  DepartmentType, ROLES, DUTY_PHONES, DUTY_UCAPS, WARD_GROUPS 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, 
  SearchResult, ContactInfo, CustomRule, PathologistSchedule 
} from '../types';
import { checkKoreanHoliday } from './koreanHolidays';

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
  pathologistSchedules: PathologistSchedule[] = []
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

  const isTask = (keyword: string) => selectedTask.toLowerCase().includes(keyword.toLowerCase());

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

    // 4. 병동 조건 검사
    if (cond.specificWards && cond.specificWards.length > 0 && !cond.specificWards.includes(selectedWard)) {
      continue;
    }
    if (cond.wardGroup === 'GROUP_A' && !WARD_GROUPS.GROUP_A.includes(selectedWard)) continue;
    if (cond.wardGroup === 'GROUP_B' && !WARD_GROUPS.GROUP_B.includes(selectedWard)) continue;
    if (cond.wardGroup === 'GROUP_C' && !WARD_GROUPS.GROUP_C.includes(selectedWard)) continue;
    if (cond.wardGroup === 'GROUP_D' && !WARD_GROUPS.GROUP_D.includes(selectedWard)) continue;

    // 5. 업무 키워드 조건 검사
    if (cond.taskKeywords && cond.taskKeywords.length > 0) {
      const matchTask = cond.taskKeywords.some(kw => isTask(kw));
      if (!matchTask) continue;
    }

    // 조건 모두 충족: 동적 규칙 적용
    assignedRole = rule.action.assignedRole;
    backupRole = rule.action.backupRole || '';
    notes = rule.action.notes || '';
    ruleSource = 'DYNAMIC_RULE';
    break;
  }

  // =========================================================================
  // 기본 규칙 엔진 (System Default Rules)
  // =========================================================================
  if (!assignedRole) {
    // -----------------------------------------------------------------------
    // 규칙 0: 임상병리사 예외 규칙
    // 평일 06:00 ~ 08:00 사이의 정규 EKG(P) -> 임상병리사 담당
    // -----------------------------------------------------------------------
    if (!isWeekendOrHoliday && timeDecimal >= 6 && timeDecimal < 8 && isTask('EKG')) {
      assignedRole = ROLES.PATHOLOGIST;
      notes = '평일 06:00~08:00 정규 EKG(P)는 임상병리사 담당입니다.';
    }

    // -----------------------------------------------------------------------
    // 규칙 1: 내과계 (Internal Medicine) 매칭 로직
    // -----------------------------------------------------------------------
    else if (selectedDept === '내과') {
      if (isRegularHours) {
        // 평일 정규시간 (08:00 ~ 17:00)
        if (isTask('그외 술기') || isTask('동의서')) {
          assignedRole = ROLES.COMMON_NURSE;
          notes = '평일 정규시간 내과계 일반 술기 및 동의서는 공통 전담간호사가 지원합니다.';
        } else if (isTask('Primary Call')) {
          assignedRole = ROLES.DUTY_NURSE;
          notes = 'Primary Call은 전담간호사가 우선 접수합니다.';
        } else {
          // EKG(P), 수혈동의서, T-tube 교체, ABGA/Line 채혈(Blood Culture) -> 해당과 인턴
          assignedRole = ROLES.INTERN;
          notes = '평일 정규시간 필수 술기는 해당 진료과 인턴 담당입니다.';
        }
      } else {
        // 정규시간 외 (평일 17:00~08:00, 주말/휴일 종일)
        const isGroupA = WARD_GROUPS.GROUP_A.includes(selectedWard);
        const isGroupB = WARD_GROUPS.GROUP_B.includes(selectedWard);

        if (isGroupA) {
          // 병동 그룹 A (42, 61, 62, 82, 92, 102, MICU)
          if (isTask('Primary Call')) {
            assignedRole = ROLES.DUTY_NURSE;
            notes = '병동 그룹 A의 Primary Call은 당직 전담간호사 담당입니다.';
          } else if (isTask('EKG') || isTask('수혈동의서') || isTask('T-tube') || isTask('사망선언')) {
            // EKG(P), 수혈동의서, T-tube 교체, 사망선언 -> 내과 당직인턴 1 (개인 UCAP 매칭)
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
      // 비내과계 특수 및 공통 예외 업무
      if (isTask('통합의학과 사망선언')) {
        assignedRole = ROLES.NON_IM_2;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_2];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_2];
        notes = '통합의학과 사망선언 -> 비내과 당직인턴 2(5-4081) 고정 매칭.';
      } else if (isWeekendOrHoliday && isTask('3단계 이상 sore')) {
        assignedRole = ROLES.NON_IM_1;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '주말/휴일 통합의학과 3단계 이상 sore 드레싱 -> 비내과 당직인턴 1(5-4080) 고정.';
      } else if (isSunday && isTask('UR Op site dressing')) {
        assignedRole = ROLES.NON_IM_1;
        dutyPhone = DUTY_PHONES[ROLES.NON_IM_1];
        dutyUcap = DUTY_UCAPS[ROLES.NON_IM_1];
        notes = '일요일 UR Op site dressing -> 비내과 당직인턴 1(5-4080) 고정.';
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
      } else if (isTask('그외 술기') || isTask('동의서')) {
        assignedRole = ROLES.COMMON_NURSE;
        notes = '비내과 일반 술기 및 동의서는 공통 전담간호사가 지원합니다.';
      } else {
        // 일반 병동군 분기
        const isGroupC = WARD_GROUPS.GROUP_C.includes(selectedWard);
        const isGroupD = WARD_GROUPS.GROUP_D.includes(selectedWard);

        if (isGroupC) {
          // 병동 그룹 C (SICU, 분만장, 42, 61, 62, NICU)
          // -> 비내과 당직인턴 2 (010-7624-5803 / 5-4081)
          // 백업: 1순위 비내과1(5-4080), 2순위 비내과3(5-3499)
          assignedRole = ROLES.NON_IM_2;
          backupRole = '1순위: 비내과1 (5-4080) / 2순위: 비내과3 (5-3499)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_2];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_2];
          notes = '병동 그룹 C (SICU, 분만장, 42, 61, 62, NICU) 비내과2 전담.';
        } else if (isGroupD) {
          // 병동 그룹 D (71, 72, 81, 82, 92, 101, 102, 111, 112, 121)
          // -> 비내과 당직인턴 3 (010-5794-4170 / 5-3499)
          // 백업: 1순위 비내과1(5-4080)
          assignedRole = ROLES.NON_IM_3;
          backupRole = '1순위: 비내과1 (5-4080)';
          dutyPhone = DUTY_PHONES[ROLES.NON_IM_3];
          dutyUcap = DUTY_UCAPS[ROLES.NON_IM_3];
          notes = '병동 그룹 D (71, 72, 81, 82, 92, 101, 102, 111, 112, 121) 비내과3 전담.';
        } else {
          assignedRole = ROLES.NON_IM_2;
          backupRole = '비내과1 (5-4080)';
        }
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
  if (assignedRole === ROLES.COMMON_NURSE) {
    const targetCN = cnPosts.find(cn => cn.wards.includes(selectedWard));
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

    if (targetCN && targetTimeSlot) {
      const shiftDayOfWeek = shiftDate.getDay();
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
      assignedRole = '공통전담간호사 (배정정보 없음)';
      assignedPerson = '당직표 확인 요망';
      notes = notes || '해당 시간대나 병동에 관리자가 배정한 공통전담간호사 정보가 없습니다.';
    }
  } 
  // 임상병리사 일정 매칭
  else if (assignedRole === ROLES.PATHOLOGIST) {
    assignedPerson = '임상병리사 (EKG 전담)';
    // 일정표에서 날짜 매칭 확인
    const matchedPathologist = pathologistSchedules.find(p => selectedDate >= p.startDate && selectedDate <= p.endDate);
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
    const todaysSchedule = schedules[selectedDate];
    if (todaysSchedule && todaysSchedule[assignedRole]) {
      assignedPerson = todaysSchedule[assignedRole];
    }
    if ([ROLES.DUTY_NURSE, ROLES.INTERN].includes(assignedRole)) {
      assignedPerson = assignedRole;
    }

    // 내과계 인턴: 개인 UCAP 및 개인폰 우선 매칭!
    if (assignedRole === ROLES.IM_1 || assignedRole === ROLES.IM_2) {
      contactInfo = contacts[assignedPerson] || { phone: '미등록', ucap: '미등록' };
      // 내과계는 공용 당직폰이 없으므로 개인 UCAP를 기본 번호로 설정
      dutyUcap = contactInfo.ucap;
      dutyPhone = contactInfo.phone;
    } 
    // 비내과계 인턴: 고정된 공용 당직폰 번호 필수 연결!
    else if (DUTY_PHONES[assignedRole]) {
      dutyPhone = DUTY_PHONES[assignedRole];
      dutyUcap = DUTY_UCAPS[assignedRole];
      contactInfo = contacts[assignedPerson] || { phone: dutyPhone, ucap: dutyUcap };
    } 
    else {
      contactInfo = contacts[assignedPerson] || contactInfo;
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
    ruleSource
  };
}

export function getLocalISOString(): string {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
}
