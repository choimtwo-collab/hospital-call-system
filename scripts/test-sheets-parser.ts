import * as XLSX from 'xlsx';

// googleSheetsSync.ts의 실제 파싱 로직 검증 함수
function parseGoogleSheetCsvContent(csvText: string) {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

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
  const columnMappings: Array<{ colIndex: number; targetKeys: string[] }> = [];

  headerRow.forEach((rawH, idx) => {
    if (idx === dateCol) return;
    const hStr = String(rawH || '').trim();
    if (!hStr) return;
    const h = hStr.toLowerCase().replace(/\s+/g, '');

    const targetKeys: string[] = [];

    if (h.includes('비내과') || h.includes('non')) {
      if (h.includes('1') || h.includes('당직인턴1') || h.includes('인턴1')) {
        targetKeys.push('비내과 1', '비내과1');
      } else if (h.includes('2') || h.includes('당직인턴2') || h.includes('인턴2')) {
        targetKeys.push('비내과 2', '비내과2');
      } else if (h.includes('3') || h.includes('당직인턴3') || h.includes('인턴3')) {
        targetKeys.push('비내과 3', '비내과3');
      }
    } else if (h.includes('심장') || h.includes('cv') || h.includes('순환기')) {
      targetKeys.push('심장내과', 'cv분과');
    } else if (h.includes('호흡기') || h.includes('imr') || h.includes('pulmo')) {
      targetKeys.push('호흡기내과', 'imr분과');
    } else if (h.includes('내과') || h.includes('im')) {
      const isDuty = h.includes('당직') || h.includes('night') || h.includes('duty');
      const isDay = h.includes('주간') || h.includes('day');

      if (h.includes('1') || h.includes('인턴1')) {
        if (isDuty) {
          targetKeys.push('내과당직 1', '내과당직1');
        } else if (isDay) {
          targetKeys.push('내과 1 (주간)', '내과 1(주간)', '내과1(주간)', '내과 1', '내과1');
        } else {
          targetKeys.push('내과 1 (주간)', '내과당직 1', '내과 1', '내과1');
        }
      } else if (h.includes('2') || h.includes('인턴2')) {
        if (isDuty) {
          targetKeys.push('내과당직 2', '내과당직2');
        } else if (isDay) {
          targetKeys.push('내과 2 (주간)', '내과 2(주간)', '내과2(주간)', '내과 2', '내과2');
        } else {
          targetKeys.push('내과 2 (주간)', '내과당직 2', '내과 2', '내과2');
        }
      }
    }

    if (targetKeys.length > 0) {
      columnMappings.push({ colIndex: idx, targetKeys });
    }
  });

  const newSchedules: Record<string, Record<string, string>> = {};

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawDate = row[dateCol];
    if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') continue;

    let formattedDate = '';
    const numDate = Number(rawDate);
    if (typeof rawDate === 'number' || (!isNaN(numDate) && numDate > 30000 && numDate < 60000)) {
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
      }
    }

    if (!formattedDate) continue;

    const daySched: Record<string, string> = {};
    columnMappings.forEach(m => {
      const cellVal = String(row[m.colIndex] || '').trim();
      m.targetKeys.forEach(k => {
        daySched[k] = cellVal;
      });
    });

    newSchedules[formattedDate] = daySched;
  }

  return newSchedules;
}

const csvStandard = `날짜,내과 1 (주간),내과 2 (주간),심장내과,호흡기내과,내과당직 1,내과당직 2,비내과 1,비내과 2,비내과 3
2026-09-12,박신희,전지연,,,박수현,정소영,신유경,이창윤,이상엽
2026-09-13,신정민,이준재,,,신정민,이준재,전하윤,천지원,권민재`;

const csvLegacy = `날짜,내과1,내과2,비내과1,비내과2,비내과3
2026-09-12,박수현,정소영,신유경,이창윤,이상엽`;

console.log('=== 구글 시트 9개 열 표준 규격 파싱 결과 ===');
console.log(JSON.stringify(parseGoogleSheetCsvContent(csvStandard), null, 2));

console.log('\n=== 구글 시트 기존 5개 열 하위 호환 파싱 결과 ===');
console.log(JSON.stringify(parseGoogleSheetCsvContent(csvLegacy), null, 2));

