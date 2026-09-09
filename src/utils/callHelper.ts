/**
 * 프리존 (DUMC Call) 앱 연동 및 전화 연결 유틸리티
 * 
 * [기술 분석 요약]
 * - 프리존(DUMC Call) 사내 APK(kr.or.dumc.cubecalllite)는 구글 플레이스토어 미등록 사내 앱이며,
 *   매니페스트에 BROWSABLE(웹 브라우저 호출 허용) 카테고리가 없어 크롬 브라우저에서 intent: 호출 시
 *   구글 플레이스토어로 강제 전환되어 "항목을 찾을 수 없습니다" 오류가 발생합니다.
 * - 따라서 브라우저에서는 플레이스토어로 튕기지 않도록 일반 전화 다이얼(tel:)로 안전하게 연결하고,
 *   UCAP 내선번호를 클립보드에 자동 복사하여 프리존 앱 및 일반 전화 어디서든 바로 사용할 수 있도록 처리합니다.
 */

export const DUMC_CALL_APK_URL = 'http://61.32.110.138:8080/files/DUMC_Call.apk';

/**
 * 숫자 및 다이얼 기호만 추출
 */
export const cleanPhoneNumber = (number: string): string => {
  return number.replace(/[^0-9*#]/g, '');
};

/**
 * UCAP 번호 클릭 시 전화 연결 함수
 * 
 * 1. UCAP 내선번호를 클립보드에 자동 복사 (프리존 앱 다이얼패드 붙여넣기 지원)
 * 2. 일반 스마트폰 통화(tel:) 다이얼로 즉시 연결하여 구글 플레이 오류 차단
 * 
 * @param ucapNumber UCAP 내선번호 (예: "5-4081")
 * @param fallbackPhone 당직자 개인 휴대전화 또는 당직폰 번호 (예: "010-xxxx-xxxx")
 * @param onMessage 사용자 안내 메시지 콜백 (토스트 알림용)
 */
export const makeUcapCall = (
  ucapNumber: string,
  fallbackPhone?: string,
  onMessage?: (message: string) => void
) => {
  const cleanUcap = cleanPhoneNumber(ucapNumber);
  
  // 당직폰/휴대전화 번호가 유효하게 있으면 일반전화 통화 우선, 없으면 UCAP 번호 다이얼
  const hasValidFallback = fallbackPhone && fallbackPhone !== '-' && fallbackPhone.trim() !== '';
  const dialTarget = hasValidFallback ? cleanPhoneNumber(fallbackPhone) : cleanUcap;

  // 1. 내선번호 클립보드 자동 복사
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(ucapNumber).catch(() => {});
  }

  // 2. 사용자 토스트 메시지
  if (onMessage) {
    if (hasValidFallback) {
      onMessage(`전화 연결 중: ${fallbackPhone} (내선 ${ucapNumber} 복사됨)`);
    } else {
      onMessage(`전화 다이얼 연결 중: ${ucapNumber} (번호 복사됨)`);
    }
  }

  // 3. 브라우저에서 안전하게 스마트폰 기본 전화 앱(tel:)으로 바로 연결
  window.location.href = `tel:${dialTarget}`;
};
