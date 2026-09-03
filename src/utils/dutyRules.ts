import { 
  DepartmentType, ROLES, DUTY_PHONES, DUTY_UCAPS 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, SearchResult, ContactInfo 
} from '../types';

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
  weeklyCNSchedule: WeeklyCNScheduleMap
): SearchResult {
  const dateObj = new Date(selectedDate);
  const dayOfWeek = dateObj.getDay(); 
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hour = parseInt(selectedTime.split(':')[0], 10);
  
  const isRegularHours = !isWeekend && (hour >= 8 && hour < 17);
  let assignedRole: string | null = null;
  let backupRole = '';
  let notes = '';

  const isTask = (keyword: string) => selectedTask.includes(keyword);

  // Rule 0: Pathologist Exceptions
  if (!isWeekend && hour >= 6 && hour < 8 && isTask('EKG(P)')) {
    assignedRole = ROLES.PATHOLOGIST;
    notes = '평일 06:00~08:00 정규 EKG(P)는 임상병리사 담당입니다.';
  } 
  // Rule 1: Internal Medicine (내과)
  else if (selectedDept === '내과') {
    if (isRegularHours) {
      if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
      else assignedRole = ROLES.INTERN;
    } else {
      const isNight = (hour >= 22 || hour < 8);
      if (selectedWard === 'MICU') {
        if (isTask('그외 술기')) assignedRole = isNight ? ROLES.IM_2 : ROLES.COMMON_NURSE;
        else assignedRole = ROLES.IM_1;
      } else if (['71', '72', '81', '101', '111', '112'].some(w => selectedWard.includes(w))) {
        if (isTask('그외 술기')) assignedRole = isNight ? ROLES.IM_2 : ROLES.COMMON_NURSE;
        else assignedRole = ROLES.IM_2;
      } else { 
        if (isTask('Primary Call') || isTask('ABGA')) assignedRole = ROLES.DUTY_NURSE;
        else if (isTask('EKG') || isTask('사망선언')) assignedRole = ROLES.IM_1;
        else if (isTask('그외 술기')) assignedRole = isNight ? ROLES.DUTY_NURSE : ROLES.COMMON_NURSE;
      }
    }
  } 
  // Rule 2: Non-Internal Medicine (비내과)
  else {
    const isGroup1 = ['SICU', '분만장', '42', '61', '62', 'NICU'].some(w => selectedWard.includes(w));
    if (isRegularHours) {
      if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
      else if (isTask('사망선언') || isTask('주말')) assignedRole = ROLES.NON_IM_1; 
      else {
        assignedRole = isGroup1 ? ROLES.NON_IM_2 : ROLES.NON_IM_3;
        backupRole = isGroup1 ? 'Back up: 1st 당직인턴1, 2nd 당직인턴3' : 'Back up: 당직인턴1';
      }
    } else {
      if (isTask('사망선언')) assignedRole = ROLES.NON_IM_2;
      else if (isTask('주말 및 휴일')) assignedRole = ROLES.NON_IM_1;
      else if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
      else { 
        if (isGroup1) {
          assignedRole = ROLES.NON_IM_2;
          backupRole = 'Back up: 1st 비내과1, 2nd 비내과3';
        } else {
          assignedRole = ROLES.NON_IM_3;
          backupRole = 'Back up: 비내과1 우선 call';
        }
      }
    }
  }

  let assignedPerson = '미배정(표 확인)';
  let contactInfo: ContactInfo = { phone: '정보 없음', ucap: '정보 없음' };
  let dutyPhone: string | null = null;
  let dutyUcap: string | null = null;

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
        // Midnight transition (e.g., 22:00 ~ 06:30)
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
    } else {
      assignedRole = '공통전담간호사 (배정정보 없음)';
      assignedPerson = '당직표 확인 요망';
      notes = '해당 시간대나 병동에 관리자가 배정한 공통전담간호사 정보가 없습니다.';
    }
  } 
  else if (assignedRole) {
    const todaysSchedule = schedules[selectedDate];
    if (todaysSchedule && todaysSchedule[assignedRole]) {
      assignedPerson = todaysSchedule[assignedRole];
    }
    if ([ROLES.DUTY_NURSE, ROLES.PATHOLOGIST, ROLES.INTERN].includes(assignedRole)) {
      assignedPerson = assignedRole;
    }
    contactInfo = contacts[assignedPerson] || contactInfo;
    if (DUTY_PHONES[assignedRole]) {
      dutyPhone = DUTY_PHONES[assignedRole];
      dutyUcap = DUTY_UCAPS[assignedRole];
    }
  }

  return {
    isRegularHours,
    assignedRole: assignedRole || '미배정',
    assignedPerson,
    contactInfo,
    dutyPhone,
    dutyUcap,
    backupRole,
    notes
  };
}

export function getLocalISOString(): string {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
}
