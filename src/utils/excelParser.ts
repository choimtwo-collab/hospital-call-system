import * as XLSX from 'xlsx';
import { DateScheduleMap } from '../types';
import { ROLES } from '../data/initialData';

export interface ParsedDutyResult {
  success: boolean;
  schedules: DateScheduleMap;
  rowCount: number;
  dates: string[];
  message: string;
}

/**
 * 엑셀 또는 CSV 파일을 파싱하여 날짜별 당직표 맵을 추출합니다.
 */
export async function parseDutyExcel(file: File): Promise<ParsedDutyResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 첫 번째 시트 사용
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 2차원 배열로 변환
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          return resolve({
            success: false,
            schedules: {},
            rowCount: 0,
            dates: [],
            message: '엑셀 파일에 데이터가 충분하지 않습니다 (최소 헤더 1줄 + 데이터 1줄 필요).'
          });
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

        // 기본 열 인덱스 대체 (0: 날짜, 1: 내과1, 2: 내과2, 3: 비내과1, 4: 비내과2, 5: 비내과3)
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

          let formattedDate = '';
          if (typeof rawDate === 'number') {
            // Excel Serial Date Number
            const dateObj = XLSX.SSF.parse_date_code(rawDate);
            const y = dateObj.y;
            const m = String(dateObj.m).padStart(2, '0');
            const d = String(dateObj.d).padStart(2, '0');
            formattedDate = `${y}-${m}-${d}`;
          } else {
            const str = String(rawDate).trim().replace(/\./g, '-').replace(/\//g, '-');
            const parts = str.split('-');
            if (parts.length === 3) {
              const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
              const m = parts[1].padStart(2, '0');
              const d = parts[2].padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            } else {
              formattedDate = str;
            }
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

        resolve({
          success: parsedDates.length > 0,
          schedules: newSchedules,
          rowCount: parsedDates.length,
          dates: parsedDates,
          message: parsedDates.length > 0 
            ? `성공: 총 ${parsedDates.length}일치의 당직표 데이터가 파싱되었습니다.` 
            : '유효한 날짜 데이터를 찾지 못했습니다.'
        });
      } catch (err: any) {
        resolve({
          success: false,
          schedules: {},
          rowCount: 0,
          dates: [],
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
    ['날짜', '내과1 (인턴1)', '내과2 (인턴2)', '비내과1 (당직인턴1)', '비내과2 (당직인턴2)', '비내과3 (당직인턴3)'],
    ['2026-09-01', '이준재', '정소영', '신정민', '이창윤', '배규리'],
    ['2026-09-02', '정소영', '박신희', '배규리', '최남석', '이태겸'],
    ['2026-09-03', '전지연', '이준재', '이창윤', '전하윤', '천지원'],
    ['2026-09-04', '정소영', '박수현', '신유경', '권민재', '이태겸'],
    ['2026-09-05', '박신희', '이상엽', '유성윤', '신정민', '최남석'],
    ['2026-09-06', '전지연', '박수현', '전하윤', '이태겸', '권민재']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  // 열 너비 자동 설정
  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '당직표');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
