import * as XLSX from 'xlsx';
import { DateScheduleMap } from '../types';
import { ROLES } from '../data/initialData';
import { ParsedDutyResult } from './excelParser';

export interface GoogleSheetsConfig {
  enabled: boolean;
  sheetUrl: string;
  sheetName: string;
  autoSyncMinutes: number; // e.g. 5 minutes, 0 = manual only
  lastSyncedAt: string | null;
}

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  enabled: false,
  sheetUrl: '',
  sheetName: '당직표',
  autoSyncMinutes: 5,
  lastSyncedAt: null
};

/**
 * 구글 스프레드시트 URL에서 Spreadsheet ID와 GID를 추출합니다.
 */
export function parseGoogleSheetUrl(url: string): { sheetId: string; gid?: string } | null {
  if (!url || typeof url !== 'string') return null;

  // Pattern 1: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    // Pure ID given
    if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
      return { sheetId: url.trim() };
    }
    return null;
  }

  const sheetId = match[1];
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : undefined;

  return { sheetId, gid };
}

/**
 * 구글 스프레드시트의 공개 CSV 내보내기 URL을 생성합니다.
 */
export function buildGoogleSheetCsvUrl(sheetUrlOrId: string, sheetName = '당직표'): string | null {
  const parsed = parseGoogleSheetUrl(sheetUrlOrId);
  if (!parsed) return null;

  // gviz/tq endpoint returns CSV directly for any sheet with view access
  const encodedSheet = encodeURIComponent(sheetName);
  let csvUrl = `https://docs.google.com/spreadsheets/d/${parsed.sheetId}/gviz/tq?tqx=out:csv`;
  if (parsed.gid) {
    csvUrl += `&gid=${parsed.gid}`;
  } else if (sheetName) {
    csvUrl += `&sheet=${encodedSheet}`;
  }
  return csvUrl;
}

/**
 * 구글 스프레드시트 데이터를 실시간으로 가져와 DateScheduleMap으로 변환합니다.
 */
export async function fetchGoogleSheetSchedules(
  sheetUrlOrId: string,
  sheetName = '당직표'
): Promise<ParsedDutyResult> {
  const csvUrl = buildGoogleSheetCsvUrl(sheetUrlOrId, sheetName);
  if (!csvUrl) {
    return {
      success: false,
      schedules: {},
      rowCount: 0,
      dates: [],
      message: '유효한 구글 스프레드시트 URL 또는 시트 ID를 입력해주세요.'
    };
  }

  try {
    // Cache buster to ensure real-time fresh data
    const urlWithTimestamp = `${csvUrl}&_t=${Date.now()}`;
    const response = await fetch(urlWithTimestamp);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          schedules: {},
          rowCount: 0,
          dates: [],
          message: '구글 시트를 찾을 수 없습니다. 시트 링크를 다시 확인해주세요.'
        };
      }
      return {
        success: false,
        schedules: {},
        rowCount: 0,
        dates: [],
        message: `구글 시트 접근 실패 (상태코드: ${response.status}). 시트 공유 설정에서 '링크가 있는 모든 사용자에게 보기 권한'이 켜져 있는지 확인해주세요.`
      };
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      return {
        success: false,
        schedules: {},
        rowCount: 0,
        dates: [],
        message: '구글 시트로부터 빈 데이터가 수신되었습니다.'
      };
    }

    // Parse CSV using xlsx
    const workbook = XLSX.read(csvText, { type: 'string' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    if (rows.length < 2) {
      return {
        success: false,
        schedules: {},
        rowCount: 0,
        dates: [],
        message: '시트에 데이터가 충분하지 않습니다 (최소 헤더 1줄 + 데이터 1줄 필요).'
      };
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

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      dateCol = 0;
    }

    const headerRow = rows[headerRowIndex] || [];
    interface ColumnMapping {
      colIndex: number;
      targetKeys: string[];
    }
    const columnMappings: ColumnMapping[] = [];

    headerRow.forEach((rawH, idx) => {
      if (idx === dateCol) return;
      const hStr = String(rawH || '').trim();
      if (!hStr) return;
      const h = hStr.toLowerCase().replace(/\s+/g, '');

      const targetKeys: string[] = [];

      // 1. 비내과 (Non-Internal Medicine) - 반드시 내과보다 먼저 판별!
      if (h.includes('비내과') || h.includes('non')) {
        if (h.includes('1') || h.includes('당직인턴1') || h.includes('인턴1')) {
          targetKeys.push(ROLES.NON_IM_1, '비내과 1', '비내과1', '비내과1 (당직인턴1)');
        } else if (h.includes('2') || h.includes('당직인턴2') || h.includes('인턴2')) {
          targetKeys.push(ROLES.NON_IM_2, '비내과 2', '비내과2', '비내과2 (당직인턴2)');
        } else if (h.includes('3') || h.includes('당직인턴3') || h.includes('인턴3')) {
          targetKeys.push(ROLES.NON_IM_3, '비내과 3', '비내과3', '비내과3 (당직인턴3)');
        }
      }
      // 2. 심장내과 (Cardiology / CV 분과)
      else if (h.includes('심장') || h.includes('cv') || h.includes('순환기')) {
        targetKeys.push('심장내과', 'cv 분과', 'cv분과', 'cv', '순환기내과');
      }
      // 3. 호흡기내과 (Pulmonology / IMR 분과)
      else if (h.includes('호흡기') || h.includes('imr') || h.includes('pulmo')) {
        targetKeys.push('호흡기내과', 'imr 분과', 'imr분과', 'imr');
      }
      // 4. 내과 (Internal Medicine) - 주간 / 당직 구분 지원
      else if (h.includes('내과') || h.includes('im')) {
        const isDuty = h.includes('당직') || h.includes('night') || h.includes('duty');
        const isDay = h.includes('주간') || h.includes('day');

        if (h.includes('1') || h.includes('인턴1')) {
          if (isDuty) {
            targetKeys.push('내과당직 1', '내과당직1', ROLES.IM_DUTY_1, '내과인턴당직1', '내과인턴당직 1');
          } else if (isDay) {
            targetKeys.push('내과 1 (주간)', '내과 1(주간)', '내과1(주간)', ROLES.IM_1, '내과1 (인턴1)', '내과 1', '내과1');
          } else {
            // 주간/당직 미명시된 일반 '내과 1'인 경우 하위 호환을 위해 주간 및 당직 둘 다 매핑
            targetKeys.push(
              '내과 1 (주간)', '내과 1(주간)', '내과1(주간)', ROLES.IM_1, '내과1 (인턴1)', '내과 1', '내과1',
              '내과당직 1', '내과당직1', ROLES.IM_DUTY_1, '내과인턴당직1'
            );
          }
        } else if (h.includes('2') || h.includes('인턴2')) {
          if (isDuty) {
            targetKeys.push('내과당직 2', '내과당직2', ROLES.IM_DUTY_2, '내과인턴당직2', '내과인턴당직 2');
          } else if (isDay) {
            targetKeys.push('내과 2 (주간)', '내과 2(주간)', '내과2(주간)', ROLES.IM_2, '내과2 (인턴2)', '내과 2', '내과2');
          } else {
            // 주간/당직 미명시된 일반 '내과 2'인 경우 하위 호환을 위해 주간 및 당직 둘 다 매핑
            targetKeys.push(
              '내과 2 (주간)', '내과 2(주간)', '내과2(주간)', ROLES.IM_2, '내과2 (인턴2)', '내과 2', '내과2',
              '내과당직 2', '내과당직2', ROLES.IM_DUTY_2, '내과인턴당직2'
            );
          }
        }
      }
      // 5. 기타 당직 키워드 단독 열
      else if (h.includes('당직인턴1') || h === '당직1') {
        targetKeys.push(ROLES.NON_IM_1, '비내과 1', '비내과1', '비내과1 (당직인턴1)');
      } else if (h.includes('당직인턴2') || h === '당직2') {
        targetKeys.push(ROLES.NON_IM_2, '비내과 2', '비내과2', '비내과2 (당직인턴2)');
      } else if (h.includes('당직인턴3') || h === '당직3') {
        targetKeys.push(ROLES.NON_IM_3, '비내과 3', '비내과3', '비내과3 (당직인턴3)');
      } else if (h === '인턴1') {
        targetKeys.push('내과 1 (주간)', '내과당직 1', ROLES.IM_1, '내과 1', '내과1', ROLES.IM_DUTY_1, '내과인턴당직1');
      } else if (h === '인턴2') {
        targetKeys.push('내과 2 (주간)', '내과당직 2', ROLES.IM_2, '내과 2', '내과2', ROLES.IM_DUTY_2, '내과인턴당직2');
      }

      if (targetKeys.length > 0) {
        columnMappings.push({ colIndex: idx, targetKeys });
      }
    });

    const newSchedules: DateScheduleMap = {};
    const parsedDates: string[] = [];

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let rawDate = row[dateCol];
      if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') continue;

      let formattedDate = '';
      const numDate = Number(rawDate);
      if (typeof rawDate === 'number' || (!isNaN(numDate) && numDate > 30000 && numDate < 60000)) {
        // 엑셀/구글시트 시리얼 날짜 코드 안전 변환 (1970-01-01 기준 25569일 차이)
        try {
          const jsDate = new Date(Math.round((numDate - 25569) * 86400 * 1000));
          const y = jsDate.getUTCFullYear();
          const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
          const d = String(jsDate.getUTCDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        } catch {
          formattedDate = '';
        }
      } else {
        const cleanedStr = String(rawDate).trim().replace(/\./g, '-').replace(/\//g, '-');
        const parts = cleanedStr.split('-');
        if (parts.length === 3) {
          const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
          const m = parts[1].padStart(2, '0');
          const d = parts[2].padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        } else if (/^\d{8}$/.test(cleanedStr)) {
          // YYYYMMDD
          formattedDate = `${cleanedStr.substring(0, 4)}-${cleanedStr.substring(4, 6)}-${cleanedStr.substring(6, 8)}`;
        }
      }

      if (!formattedDate || formattedDate.length < 8) continue;

      const daySched: Record<string, string> = {};

      columnMappings.forEach(mapping => {
        const cellVal = String(row[mapping.colIndex] || '').trim();
        mapping.targetKeys.forEach(key => {
          daySched[key] = cellVal;
        });
      });

      newSchedules[formattedDate] = daySched;
      parsedDates.push(formattedDate);
    }

    return {
      success: parsedDates.length > 0,
      schedules: newSchedules,
      rowCount: parsedDates.length,
      dates: parsedDates,
      message: parsedDates.length > 0 
        ? `구글 시트 실시간 동기화 완료: 총 ${parsedDates.length}일치 당직표가 정상 반영되었습니다.` 
        : '구글 시트에서 날짜 데이터를 파싱하지 못했습니다.'
    };
  } catch (err: any) {
    return {
      success: false,
      schedules: {},
      rowCount: 0,
      dates: [],
      message: `구글 시트 연동 오류: ${err.message || '네트워크 연결 상태를 확인해주세요.'}`
    };
  }
}
