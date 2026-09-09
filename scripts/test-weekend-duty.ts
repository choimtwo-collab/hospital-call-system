import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { evaluateDutyRules } from '../src/utils/dutyRules';
import { initialContacts, initialCNPosts, initialTimeSlots, initialWeeklyCNSchedule, initialInternWardGroups } from '../src/data/initialData';

dotenv.config();
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [schedRow, internsRow, tasksRow, phonesRow, rulesRow] = await Promise.all([
    sql`SELECT value FROM admin_settings WHERE key = 'schedules'`,
    sql`SELECT value FROM admin_settings WHERE key = 'interns'`,
    sql`SELECT value FROM admin_settings WHERE key = 'tasks'`,
    sql`SELECT value FROM admin_settings WHERE key = 'duty_phones'`,
    sql`SELECT value FROM admin_settings WHERE key = 'custom_rules'`,
  ]);

  const schedules = schedRow[0]?.value || {};
  const interns = internsRow[0]?.value || [];
  const tasks = tasksRow[0]?.value || [];
  const dutyPhones = phonesRow[0]?.value || [];
  const customRules = rulesRow[0]?.value || [];

  console.log('=== 9월 12일(토) ~ 9월 13일(일) 내과당직 매칭 테스트 ===\n');

  const testCases = [
    // 9/12 (토) 당일
    { date: '2026-09-12', time: '07:59', desc: '9/12(토) 07:59 (전일 9/11 금 당직 연장)' },
    { date: '2026-09-12', time: '08:00', desc: '9/12(토) 08:00 정각 (9/12 토 당직 시작!)' },
    { date: '2026-09-12', time: '08:01', desc: '9/12(토) 08:01 (9/12 토 당직 중)' },
    { date: '2026-09-12', time: '12:00', desc: '9/12(토) 12:00 낮 (9/12 토 당직 중)' },
    { date: '2026-09-12', time: '18:00', desc: '9/12(토) 18:00 저녁 (9/12 토 당직 중)' },
    { date: '2026-09-12', time: '23:59', desc: '9/12(토) 23:59 심야 (9/12 토 당직 중)' },
    // 9/13 (일) 익일 새벽 (9/12 토 당직 연장 구간)
    { date: '2026-09-13', time: '00:00', desc: '9/13(일) 00:00 자정 (9/12 토 당직 익일 연장)' },
    { date: '2026-09-13', time: '03:00', desc: '9/13(일) 03:00 새벽 (9/12 토 당직 익일 연장)' },
    { date: '2026-09-13', time: '07:59', desc: '9/13(일) 07:59 아침 (9/12 토 당직 종료 직전)' },
    // 9/13 (일) 당일 08:00 정각 (9/13 일 당직 시작!)
    { date: '2026-09-13', time: '08:00', desc: '9/13(일) 08:00 정각 (9/13 일 당직 시작!)' },
    { date: '2026-09-13', time: '14:00', desc: '9/13(일) 14:00 낮 (9/13 일 당직 중)' },
    { date: '2026-09-13', time: '23:59', desc: '9/13(일) 23:59 심야 (9/13 일 당직 중)' },
    // 9/14 (월) 익일 새벽 (9/13 일 당직 연장 구간)
    { date: '2026-09-14', time: '07:59', desc: '9/14(월) 07:59 아침 수혈동의서 (9/13 일 당직 종료 직전)' },
    // 9/14 (월) 평일 주간 시작
    { date: '2026-09-14', time: '08:00', desc: '9/14(월) 08:00 (평일 주간 시작)' },
  ];

  // 내과당직 1 (MICU / 61 등 Group 1 병동) & 내과당직 2 (71 / 81 등 Group 2 병동)
  for (const tc of testCases) {
    const taskName = tc.desc.includes('수혈동의서') ? '수혈' : 'EKG(P)';
    // 1. Group 1 병동 (MICU)
    const resG1 = evaluateDutyRules(
      '내과', 'MICU', taskName, tc.date, tc.time,
      schedules, initialContacts, initialCNPosts, initialTimeSlots, initialWeeklyCNSchedule,
      customRules, [], dutyPhones, [], interns, tasks, initialInternWardGroups
    );

    // 2. Group 2 병동 (71병동)
    const resG2 = evaluateDutyRules(
      '내과', '71병동', taskName, tc.date, tc.time,
      schedules, initialContacts, initialCNPosts, initialTimeSlots, initialWeeklyCNSchedule,
      customRules, [], dutyPhones, [], interns, tasks, initialInternWardGroups
    );

    console.log(`[${tc.desc}] (${tc.date} ${tc.time})`);
    console.log(`  - Group 1 (MICU): 역할=${resG1.assignedRole}, 담당자=${resG1.assignedPerson}, UCAP=${resG1.dutyUcap || resG1.contactInfo.ucap}`);
    console.log(`  - Group 2 (71병동): 역할=${resG2.assignedRole}, 담당자=${resG2.assignedPerson}, UCAP=${resG2.dutyUcap || resG2.contactInfo.ucap}`);
    console.log(`  - 비고: ${resG1.notes}`);
    console.log('');
  }
}

main().catch(console.error);
