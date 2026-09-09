/**
 * 프리존 (DUMC Call) 앱 연동 유틸리티
 * 
 * 동국대학교일산병원 프리존(DUMC Call / CubeCallLite)
 * - 패키지명: kr.or.dumc.cubecalllite
 * - 런처 액티비티: kr.or.dumc.cubecalllite.activity.LoginActivity
 * - 설치 APK: http://61.32.110.138:8080/files/DUMC_Call.apk
 * - 인텐트 파라미터: extra_phone_number
 */

export const DUMC_CALL_PACKAGE = 'kr.or.dumc.cubecalllite';
export const DUMC_CALL_ACTIVITY = 'kr.or.dumc.cubecalllite.activity.LoginActivity';
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
 * 기존 앱이 설치되어 있는 경우 APK 다운로드 창이 뜨지 않고
 * 즉시 프리존(DUMC Call) 앱으로 직결되도록:
 * 1. component: kr.or.dumc.cubecalllite/kr.or.dumc.cubecalllite.activity.LoginActivity 명시
 * 2. launchFlags: 0x10000000 (FLAG_ACTIVITY_NEW_TASK: 기존 작업 포그라운드 활성화) 적용
 * 3. browser_fallback_url을 제거하여 기설치 폰에서 불필요한 APK 다운로드 팝업 원천 차단
 * 
 * - 안드로이드: 프리존(DUMC Call) 명시적 인텐트 URI
 * - iOS / PC: 일반 tel: 스킴
 */
export const getUcapCallHref = (ucapNumber: string): string => {
  const clean = cleanPhoneNumber(ucapNumber);
  
  if (!isAndroidDevice()) {
    return `tel:${clean}`;
  }

  return `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;launchFlags=0x10000000;component=${DUMC_CALL_PACKAGE}/${DUMC_CALL_ACTIVITY};package=${DUMC_CALL_PACKAGE};S.extra_phone_number=${clean};S.number=${clean};end`;
};
