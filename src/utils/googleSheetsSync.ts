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

    // 헤더 행 분석
    const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
    let dateCol = -1;
    let im1Col = -1;
    let im2Col = -1;
    let non1Col = -1;
    let non2Col = -1;
    let non3Col = -1;

    headerRow.forEach((h, idx) => {
      if (h.includes('날짜') || h.includes('date') || h.includes('일자')) dateCol = idx;
      else if (h.includes('내과1') || h.includes('im1') || h.includes('인턴1')) im1Col = idx;
      else if (h.includes('내과2') || h.includes('im2') || h.includes('인턴2')) im2Col = idx;
      else if (h.includes('비내과1') || h.includes('non1') || h.includes('당직인턴1')) non1Col = idx;
      else if (h.includes('비내과2') || h.includes('non2') || h.includes('당직인턴2')) non2Col = idx;
      else if (h.includes('비내과3') || h.includes('non3') || h.includes('당직인턴3')) non3Col = idx;
    });

    if (dateCol === -1) dateCol = 0;
    if (im1Col === -1) im1Col = 1;
    if (im2Col === -1) im2Col = 2;
    if (non1Col === -1) non1Col = 3;
    if (non2Col === -1) non2Col = 4;
    if (non3Col === -1) non3Col = 5;

    const newSchedules: DateScheduleMap = {};
    const parsedDates: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let rawDate = row[dateCol];
      if (!rawDate) continue;

      let formattedDate = String(rawDate).trim().replace(/\./g, '-').replace(/\//g, '-');
      const parts = formattedDate.split('-');
      if (parts.length === 3) {
        const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        formattedDate = `${y}-${m}-${d}`;
      }

      if (!formattedDate || formattedDate.length < 8) continue;

      newSchedules[formattedDate] = {
        [ROLES.IM_1]: String(row[im1Col] || '').trim(),
        [ROLES.IM_2]: String(row[im2Col] || '').trim(),
        [ROLES.NON_IM_1]: String(row[non1Col] || '').trim(),
        [ROLES.NON_IM_2]: String(row[non2Col] || '').trim(),
        [ROLES.NON_IM_3]: String(row[non3Col] || '').trim()
      };
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
