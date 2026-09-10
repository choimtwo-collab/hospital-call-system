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
 * 크롬 및 안드로이드 브라우저 표준 패키지 인텐트 규격:
 * intent://#Intent;package=kr.or.dumc.cubecalllite;S.extra_phone_number={clean};end
 * 
 * - Chrome 보안 차단 요소(component, launchFlags 등)를 일체 배제
 * - 불필요한 APK 다운로드 팝업 유발 파라미터(browser_fallback_url) 배제
 * - 안드로이드 시스템이 package="kr.or.dumc.cubecalllite"의 기본 런처 액티비티를 직접 실행하도록 순수 패키지 인텐트 적용
 * - iOS / PC: 일반 tel: 다이얼
 */
export const getUcapCallHref = (ucapNumber: string): string => {
  const clean = cleanPhoneNumber(ucapNumber);
  
  if (!isAndroidDevice()) {
    return `tel:${clean}`;
  }

  return `intent://#Intent;package=${DUMC_CALL_PACKAGE};S.extra_phone_number=${clean};end`;
};
