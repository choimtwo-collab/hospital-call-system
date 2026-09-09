/**
 * 프리존 (DUMC Call) 앱 연동 유틸리티
 * 
 * 동국대학교일산병원 프리존(DUMC Call / CubeCallLite)
 * - 패키지명: kr.or.dumc.cubecalllite
 * - 설치 APK: http://61.32.110.138:8080/files/DUMC_Call.apk
 * - 인텐트 파라미터: extra_phone_number
 */

export const DUMC_CALL_PACKAGE = 'kr.or.dumc.cubecalllite';
export const DUMC_CALL_APK_URL = 'http://61.32.110.138:8080/files/DUMC_Call.apk';

/**
 * 안드로이드 환경 여부 확인
 */
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

/**
 * 숫자 및 다이얼 기호만 추출
 */
export const cleanPhoneNumber = (number: string): string => {
  return number.replace(/[^0-9*#]/g, '');
};

/**
 * UCAP 번호 클릭용 링크 반환
 * 
 * 안드로이드 표준 Intent URI 규격:
 * intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=kr.or.dumc.cubecalllite;S.extra_phone_number={cleanNumber};S.browser_fallback_url={apkUrl};end
 * 
 * - 안드로이드 환경:
 *   1. HTML <a> 태그의 직접 사용자 제스처로 프리존(DUMC Call) 앱 실행
 *   2. extra_phone_number로 UCAP 내선번호 전달
 *   3. 미설치 기기에서는 Google Play로 가지 않고 S.browser_fallback_url에 의해 DUMC_Call.apk 다운로드 진행
 * - iOS / PC 환경:
 *   - 일반 tel: 스킴으로 연결
 */
export const getUcapCallHref = (ucapNumber: string): string => {
  const clean = cleanPhoneNumber(ucapNumber);
  
  if (!isAndroidDevice()) {
    return `tel:${clean}`;
  }

  const fallback = encodeURIComponent(DUMC_CALL_APK_URL);
  return `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${DUMC_CALL_PACKAGE};S.extra_phone_number=${clean};S.number=${clean};S.browser_fallback_url=${fallback};end`;
};
