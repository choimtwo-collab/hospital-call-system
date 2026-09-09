import * as XLSX from 'xlsx';
import { DateScheduleMap } from '../types';
import { ROLES } from '../data/initialData';

export interface ParsedDutyResult {
  success: boolean;
  schedules: DateScheduleMap;
  rowCount: number;
  dates: string[];
  columns?: string[];
  message: string;
}

interface ColumnMapping {
  colIndex: number;
  headerName: string;
  targetKeys: string[];
}

/**
 * 엑셀 또는 CSV 파일을 파싱하여 날짜별 당직표 맵을 추출합니다.
 */
export async function parseDutyExcel(file: File, activeDutyRoles: string[] = []): Promise<ParsedDutyResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 당직표 관련 시트 우선 선택, 없으면 첫 번째 시트 사용
        let targetSheetName = workbook.SheetNames[0];
        for (const sName of workbook.SheetNames) {
          const lower = sName.toLowerCase();
          if (lower.includes('당직') || lower.includes('인턴') || lower.includes('schedule') || lower.includes('duty')) {
            targetSheetName = sName;
            break;
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];
        if (!worksheet) {
          return resolve({
            success: false,
            schedules: {},
            rowCount: 0,
            dates: [],
            columns: [],
            message: '엑셀 파일의 시트를 읽을 수 없습니다.'
          });
        }

        // 2차원 배열로 변환
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          return resolve({
            success: false,
            schedules: {},
            rowCount: 0,
            dates: [],
            columns: [],
            message: '엑셀 파일에 데이터가 충분하지 않습니다 (최소 헤더 1줄 + 데이터 1줄 필요).'
          });
        }

        // 상위 10행 내에서 유효한 헤더 행 동적 탐색
        let headerRowIndex = -1;
        let dateCol = -1;

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r];
          if (!row || !Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim().toLowerCase().replace(/\s+/g, '');
            if (cell.includes('날짜') || cell.includes('date') || cell.includes('일자') || cell === '일' || cell === '일시') {
              headerRowIndex = r;
              dateCol = c;
              break;
            }
          }
          if (headerRowIndex !== -1) break;
        }

        // 만약 헤더를 못 찾았다면 첫 번째 행을 기본 헤더로 사용
        if (headerRowIndex === -1) {
          headerRowIndex = 0;
          dateCol = 0;
        }

        const headerRow = rows[headerRowIndex] || [];
        const columnMappings: ColumnMapping[] = [];
        const detectedColumnNames: string[] = [];

        // 각 열의 역할 분류
        headerRow.forEach((rawH, idx) => {
          if (idx === dateCol) return;
          const hStr = String(rawH || '').trim();
          if (!hStr) return;
          const h = hStr.toLowerCase().replace(/\s+/g, '');

          const targetKeys: string[] = [];

          // 1. 비내과 (Non-Internal Medicine) - 반드시 내과보다 먼저 판별!
          if (h.includes('비내과') || h.includes('non')) {
            if (h.includes('1') || h.includes('당직인턴1') || h.includes('인턴1')) {
              targetKeys.push(ROLES.NON_IM_1, '비내과 1', '비내과1');
              detectedColumnNames.push('비내과 1');
            } else if (h.includes('2') || h.includes('당직인턴2') || h.includes('인턴2')) {
              targetKeys.push(ROLES.NON_IM_2, '비내과 2', '비내과2');
              detectedColumnNames.push('비내과 2');
            } else if (h.includes('3') || h.includes('당직인턴3') || h.includes('인턴3')) {
              targetKeys.push(ROLES.NON_IM_3, '비내과 3', '비내과3');
              detectedColumnNames.push('비내과 3');
            }
          }
          // 2. 심장내과 (Cardiology / CV 분과)
          else if (h.includes('심장') || h.includes('cv') || h.includes('순환기')) {
            targetKeys.push('심장내과', 'cv 분과', 'cv분과', 'cv', '순환기내과');
            detectedColumnNames.push('심장내과');
          }
          // 3. 호흡기내과 (Pulmonology / IMR 분과)
          else if (h.includes('호흡기') || h.includes('imr') || h.includes('pulmo')) {
            targetKeys.push('호흡기내과', 'imr 분과', 'imr분과', 'imr');
            detectedColumnNames.push('호흡기내과');
          }
          // 4. 내과 (Internal Medicine)
          else if (h.includes('내과') || h.includes('im')) {
            const isDuty = h.includes('당직') || h.includes('night') || h.includes('duty');
            const isDay = h.includes('주간') || h.includes('day');

            if (h.includes('1') || h.includes('인턴1')) {
              if (isDuty) {
                targetKeys.push('내과당직 1', '내과당직1');
                detectedColumnNames.push('내과당직 1');
              } else if (isDay) {
                targetKeys.push('내과 1 (주간)', '내과 1(주간)', '내과1(주간)', ROLES.IM_1);
                detectedColumnNames.push('내과 1 (주간)');
              } else {
                // 주간/당직 명시가 없는 일반 "내과 1"인 경우 둘 다 매핑하여 호환 유지
                targetKeys.push('내과 1 (주간)', '내과당직 1', ROLES.IM_1, '내과 1', '내과1');
                detectedColumnNames.push('내과 1 (주간)');
              }
            } else if (h.includes('2') || h.includes('인턴2')) {
              if (isDuty) {
                targetKeys.push('내과당직 2', '내과당직2');
                detectedColumnNames.push('내과당직 2');
              } else if (isDay) {
                targetKeys.push('내과 2 (주간)', '내과 2(주간)', '내과2(주간)', ROLES.IM_2);
                detectedColumnNames.push('내과 2 (주간)');
              } else {
                // 주간/당직 명시가 없는 일반 "내과 2"인 경우 둘 다 매핑하여 호환 유지
                targetKeys.push('내과 2 (주간)', '내과당직 2', ROLES.IM_2, '내과 2', '내과2');
                detectedColumnNames.push('내과 2 (주간)');
              }
            }
          }
          // 3. 당직인턴1, 2, 3 (비내과 당직인턴)
          else if (h.includes('당직인턴1') || h === '당직1' || h === '당직인턴①') {
            targetKeys.push(ROLES.NON_IM_1, '비내과 1', '비내과1');
            detectedColumnNames.push('비내과 1');
          } else if (h.includes('당직인턴2') || h === '당직2' || h === '당직인턴②') {
            targetKeys.push(ROLES.NON_IM_2, '비내과 2', '비내과2');
            detectedColumnNames.push('비내과 2');
          } else if (h.includes('당직인턴3') || h === '당직3' || h === '당직인턴③') {
            targetKeys.push(ROLES.NON_IM_3, '비내과 3', '비내과3');
            detectedColumnNames.push('비내과 3');
          }
          // 4. 인턴1, 인턴2 (내과 인턴)
          else if (h === '인턴1' || h === '인턴①') {
            targetKeys.push(ROLES.IM_1, '내과 1', '내과1');
            detectedColumnNames.push('내과 1');
          } else if (h === '인턴2' || h === '인턴②') {
            targetKeys.push(ROLES.IM_2, '내과 2', '내과2');
            detectedColumnNames.push('내과 2');
          }
          // 5. 연차 / 휴가 / OFF
          else if (h.includes('연차') || h.includes('휴가') || h.includes('off')) {
            targetKeys.push('연차', '휴가');
            detectedColumnNames.push('연차');
          }

          // 6. 관리자가 등록한 커스텀 구분(role)과 일치 여부 확인
          const isHNonIm = h.includes('비내과') || h.includes('non');
          const isHIm = !isHNonIm && (h.includes('내과') || h.includes('im'));

          for (const role of activeDutyRoles) {
            const cleanRole = role.replace(/\s+/g, '').toLowerCase();
            const isRoleNonIm = cleanRole.includes('비내과') || cleanRole.includes('non');
            const isRoleIm = !isRoleNonIm && (cleanRole.includes('내과') || cleanRole.includes('im'));

            // 비내과 헤더인데 내과 역할이거나, 내과 헤더인데 비내과 역할인 경우 교차 매칭 방지 ('비내과1'.includes('내과1') 방지)
            if (isHNonIm && isRoleIm) continue;
            if (isHIm && isRoleNonIm) continue;

            if (h === cleanRole || h.includes(cleanRole) || cleanRole.includes(h)) {
              if (!targetKeys.includes(role)) targetKeys.push(role);
              if (!detectedColumnNames.includes(role)) detectedColumnNames.push(role);
            }
          }

          // 일치하는 항목이 없을 경우 원본 헤더명 그대로 키로 보존
          if (targetKeys.length === 0) {
            targetKeys.push(hStr);
            detectedColumnNames.push(hStr);
          }

          columnMappings.push({
            colIndex: idx,
            headerName: hStr,
            targetKeys
          });
        });

        // 만약 열 매핑이 전혀 잡히지 않았다면 기본 순서 대체
        if (columnMappings.length === 0) {
          columnMappings.push(
            { colIndex: 1, headerName: '내과 1 (주간)', targetKeys: ['내과 1 (주간)', ROLES.IM_1, '내과 1'] },
            { colIndex: 2, headerName: '내과 2 (주간)', targetKeys: ['내과 2 (주간)', ROLES.IM_2, '내과 2'] },
            { colIndex: 3, headerName: '심장내과', targetKeys: ['심장내과', 'cv 분과', 'cv분과', 'cv', '순환기내과'] },
            { colIndex: 4, headerName: '호흡기내과', targetKeys: ['호흡기내과', 'imr 분과', 'imr분과', 'imr'] },
            { colIndex: 5, headerName: '내과당직 1', targetKeys: ['내과당직 1', '내과당직1'] },
            { colIndex: 6, headerName: '내과당직 2', targetKeys: ['내과당직 2', '내과당직2'] },
            { colIndex: 7, headerName: '비내과 1', targetKeys: [ROLES.NON_IM_1, '비내과 1', '비내과1'] },
            { colIndex: 8, headerName: '비내과 2', targetKeys: [ROLES.NON_IM_2, '비내과 2', '비내과2'] },
            { colIndex: 9, headerName: '비내과 3', targetKeys: [ROLES.NON_IM_3, '비내과 3', '비내과3'] }
          );
          detectedColumnNames.push('내과 1 (주간)', '내과 2 (주간)', '심장내과', '호흡기내과', '내과당직 1', '내과당직 2', '비내과 1', '비내과 2', '비내과 3');
        }

        const newSchedules: DateScheduleMap = {};
        const parsedDates: string[] = [];

        // 데이터 행 파싱
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const rawDate = row[dateCol];
          if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') continue;

          let formattedDate = '';
          if (typeof rawDate === 'number') {
            // Excel Serial Date Number 안전 변환
            try {
              const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
              const y = jsDate.getUTCFullYear();
              const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
              const d = String(jsDate.getUTCDate()).padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            } catch {
              formattedDate = '';
            }
          } else {
            const str = String(rawDate).trim();
            // 숫자만 있는 일자 (예: 1, 2, ... 31)
            if (/^\d{1,2}$/.test(str)) {
              const now = new Date();
              const y = now.getFullYear();
              const m = String(now.getMonth() + 1).padStart(2, '0');
              const d = str.padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            } else {
              const normalized = str.replace(/[년월일]/g, '-').replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, '');
              const parts = normalized.split('-').filter(p => p.length > 0);
              if (parts.length === 3) {
                const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
                const m = parts[1].padStart(2, '0');
                const d = parts[2].padStart(2, '0');
                formattedDate = `${y}-${m}-${d}`;
              } else if (parts.length === 2) {
                const now = new Date();
                const y = now.getFullYear();
                const m = parts[0].padStart(2, '0');
                const d = parts[1].padStart(2, '0');
                formattedDate = `${y}-${m}-${d}`;
              } else {
                formattedDate = normalized;
              }
            }
          }

          if (!formattedDate || formattedDate.length < 8) continue;

          const scheduleEntry: Record<string, string> = {};
          columnMappings.forEach(mapping => {
            const val = String(row[mapping.colIndex] || '').trim();
            mapping.targetKeys.forEach(k => {
              scheduleEntry[k] = val;
            });
          });

          newSchedules[formattedDate] = scheduleEntry;
          parsedDates.push(formattedDate);
        }

        const uniqueCols = Array.from(new Set(detectedColumnNames));

        resolve({
          success: parsedDates.length > 0,
          schedules: newSchedules,
          rowCount: parsedDates.length,
          dates: parsedDates,
          columns: uniqueCols.length > 0 ? uniqueCols : ['내과 1 (주간)', '내과 2 (주간)', '심장내과', '호흡기내과', '내과당직 1', '내과당직 2', '비내과 1', '비내과 2', '비내과 3'],
          message: parsedDates.length > 0 
            ? `성공: 총 ${parsedDates.length}일치의 당직표 데이터가 정상 파싱되었습니다.` 
            : '유효한 날짜 데이터를 찾지 못했습니다. 엑셀의 날짜 열 형식을 확인해주세요.'
        });
      } catch (err: any) {
        resolve({
          success: false,
          schedules: {},
          rowCount: 0,
          dates: [],
          columns: [],
          message: `파싱 중 오류 발생: ${err.message || err}`
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 관리자가 바로 채워 넣을 수 있는 예제 당직표 엑셀 템플릿 파일(Blob)을 생성합니다.
 * 관리자가 설정한 현재 구분(역할) 목록과 스케줄 데이터를 완벽하게 반영합니다.
 */
export function generateSampleExcelBlob(customRoles?: string[], existingSchedules?: DateScheduleMap): Blob {
  const defaultRoles = [
    '내과 1 (주간)',
    '내과 2 (주간)',
    '심장내과',
    '호흡기내과',
    '내과당직 1',
    '내과당직 2',
    '비내과 1',
    '비내과 2',
    '비내과 3',
    '연차'
  ];

  const roles = (customRoles && customRoles.length > 0) ? customRoles : defaultRoles;
  const headers = ['날짜', ...roles];

  const rows: string[][] = [headers];

  // 기존 스케줄 데이터가 있으면 날짜순 정렬하여 실제 데이터 채우기
  if (existingSchedules && Object.keys(existingSchedules).length > 0) {
    const sortedDates = Object.keys(existingSchedules).sort();
    sortedDates.forEach(dStr => {
      const daySched = existingSchedules[dStr] || {};
      const row = [
        dStr,
        ...roles.map(r => daySched[r] ?? '')
      ];
      rows.push(row);
    });
  } else {
    // 기본 7일치 현실적인 예제 데이터
    const fallbackDays = [
      { date: '2026-09-01', im1: '이준재', im2: '', cv: '', imr: '', duty1: '', duty2: '이준재', non1: '신유경', non2: '전하윤', non3: '권민재', off: '' },
      { date: '2026-09-02', im1: '정소영', im2: '박신희', cv: '신정민', imr: '박수현', duty1: '정소영', duty2: '박신희', non1: '배규리', non2: '최남석', non3: '이태겸', off: '' },
      { date: '2026-09-03', im1: '이준재', im2: '전지연', cv: '신정민', imr: '박수현', duty1: '전지연', duty2: '이준재', non1: '이창윤', non2: '전하윤', non3: '천지원', off: '' },
      { date: '2026-09-04', im1: '박신희', im2: '정소영', cv: '신정민', imr: '박수현', duty1: '정소영', duty2: '박수현', non1: '신유경', non2: '권민재', non3: '이태겸', off: '' },
      { date: '2026-09-05', im1: '', im2: '', cv: '', imr: '', duty1: '이준재', duty2: '신정민', non1: '최남석', non2: '이상엽', non3: '이창윤', off: '' },
      { date: '2026-09-06', im1: '', im2: '', cv: '', imr: '', duty1: '전지연', duty2: '박수현', non1: '전하윤', non2: '배규리', non3: '천지원', off: '' },
      { date: '2026-09-07', im1: '정소영', im2: '이준재', cv: '신정민', imr: '박신희', duty1: '정소영', duty2: '신정민', non1: '권민재', non2: '이상엽', non3: '최남석', off: '' }
    ];

    fallbackDays.forEach(fd => {
      const row = [
        fd.date,
        ...roles.map(r => {
          if (r.includes('주간') && r.includes('1')) return fd.im1;
          if (r.includes('주간') && r.includes('2')) return fd.im2;
          if (r.includes('심장') || r.includes('cv')) return fd.cv;
          if (r.includes('호흡기') || r.includes('imr')) return fd.imr;
          if (r.includes('당직') && r.includes('1')) return fd.duty1;
          if (r.includes('당직') && r.includes('2')) return fd.duty2;
          if (r.includes('비내과') && r.includes('1')) return fd.non1;
          if (r.includes('비내과') && r.includes('2')) return fd.non2;
          if (r.includes('비내과') && r.includes('3')) return fd.non3;
          if (r.includes('연차')) return fd.off;
          return '';
        })
      ];
      rows.push(row);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 열 너비 자동 설정 (헤더 길이에 맞춰 여유 있게)
  ws['!cols'] = [
    { wch: 14 },
    ...roles.map(r => ({ wch: Math.max(15, r.length * 2 + 2) }))
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '당직표');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
