/**
 * 대한민국 법정 공휴일 및 대체 공휴일 판별 유틸리티
 */

// 고정 양력 공휴일 (월-일)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '3·1절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절'
};

// 연도별 음력 명절 및 대체공휴일 테이블 (2025 ~ 2027)
const VARIABLE_HOLIDAYS: Record<string, string> = {
  // 2025년
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날 당일',
  '2025-01-30': '설날 연휴',
  '2025-03-03': '3·1절 대체공휴일',
  '2025-05-06': '부처님오신날 대체공휴일',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석 당일',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '추석 대체공휴일',

  // 2026년
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날 당일',
  '2026-02-18': '설날 연휴',
  '2026-03-02': '3·1절 대체공휴일',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '부처님오신날 대체공휴일',
  '2026-08-17': '광복절 대체공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석 당일',
  '2026-09-26': '추석 연휴',
  '2026-10-05': '개천절 대체공휴일',

  // 2027년
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날 당일',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '설날 대체공휴일',
  '2027-05-13': '부처님오신날',
  '2027-08-16': '광복절 대체공휴일',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석 당일',
  '2027-09-16': '추석 연휴',
  '2027-10-04': '개천절 대체공휴일',
  '2027-10-11': '한글날 대체공휴일',
  '2027-12-27': '성탄절 대체공휴일'
};

export interface HolidayCheckResult {
  isHoliday: boolean;
  isWeekend: boolean;
  isHolidayOrWeekend: boolean;
  name?: string;
  dayOfWeekKorean: string;
}

const KOREAN_DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/**
 * YYYY-MM-DD 날짜를 검사하여 주말 또는 공휴일 여부를 판별합니다.
 */
export function checkKoreanHoliday(dateStr: string): HolidayCheckResult {
  const [year, month, day] = dateStr.split('-');
  const mmdd = `${month}-${day}`;
  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let holidayName: string | undefined = undefined;

  if (FIXED_HOLIDAYS[mmdd]) {
    holidayName = FIXED_HOLIDAYS[mmdd];
  } else if (VARIABLE_HOLIDAYS[dateStr]) {
    holidayName = VARIABLE_HOLIDAYS[dateStr];
  }

  const isHoliday = !!holidayName;

  return {
    isHoliday,
    isWeekend,
    isHolidayOrWeekend: isWeekend || isHoliday,
    name: holidayName,
    dayOfWeekKorean: KOREAN_DAYS[dayOfWeek]
  };
}
