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
          // 2. 내과 (Internal Medicine)
          else if (h.includes('내과') || h.includes('im')) {
            if (h.includes('1') || h.includes('인턴1')) {
              targetKeys.push(ROLES.IM_1, '내과 1', '내과1');
              detectedColumnNames.push('내과 1');
            } else if (h.includes('2') || h.includes('인턴2')) {
              targetKeys.push(ROLES.IM_2, '내과 2', '내과2');
              detectedColumnNames.push('내과 2');
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
          for (const role of activeDutyRoles) {
            const cleanRole = role.replace(/\s+/g, '').toLowerCase();
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

        // 만약 열 매핑이 전혀 잡히지 않았다면 기본 순서 대체 (0: 날짜, 1: 내과1, 2: 내과2, 3: 비내과1, 4: 비내과2, 5: 비내과3)
        if (columnMappings.length === 0) {
          columnMappings.push(
            { colIndex: 1, headerName: '내과 1', targetKeys: [ROLES.IM_1, '내과 1', '내과1'] },
            { colIndex: 2, headerName: '내과 2', targetKeys: [ROLES.IM_2, '내과 2', '내과2'] },
            { colIndex: 3, headerName: '비내과 1', targetKeys: [ROLES.NON_IM_1, '비내과 1', '비내과1'] },
            { colIndex: 4, headerName: '비내과 2', targetKeys: [ROLES.NON_IM_2, '비내과 2', '비내과2'] },
            { colIndex: 5, headerName: '비내과 3', targetKeys: [ROLES.NON_IM_3, '비내과 3', '비내과3'] }
          );
          detectedColumnNames.push('내과 1', '내과 2', '비내과 1', '비내과 2', '비내과 3');
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
            // Excel Serial Date Number
            const dateObj = XLSX.SSF.parse_date_code(rawDate);
            if (dateObj) {
              const y = dateObj.y;
              const m = String(dateObj.m).padStart(2, '0');
              const d = String(dateObj.d).padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
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
          columns: uniqueCols.length > 0 ? uniqueCols : ['내과 1', '내과 2', '비내과 1', '비내과 2', '비내과 3'],
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
 */
export function generateSampleExcelBlob(): Blob {
  const sampleData = [
    ['날짜', '내과1 (인턴1)', '내과2 (인턴2)', '비내과1 (당직인턴1)', '비내과2 (당직인턴2)', '비내과3 (당직인턴3)', '연차'],
    ['2026-09-01', '이준재', '정소영', '신정민', '이창윤', '배규리', ''],
    ['2026-09-02', '정소영', '박신희', '배규리', '최남석', '이태겸', '신유경'],
    ['2026-09-03', '전지연', '이준재', '이창윤', '전하윤', '천지원', ''],
    ['2026-09-04', '정소영', '박수현', '신유경', '권민재', '이태겸', ''],
    ['2026-09-05', '박신희', '이상엽', '유성윤', '신정민', '최남석', ''],
    ['2026-09-06', '전지연', '박수현', '전하윤', '이태겸', '권민재', '이상엽']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  // 열 너비 자동 설정
  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '당직표');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
