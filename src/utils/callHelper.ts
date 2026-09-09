/**
 * 프리존 (DUMC Call) 앱 연동 및 전화 연결 유틸리티
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
 * iOS 환경 여부 확인
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * 숫자 및 다이얼 기호만 추출
 */
export const cleanPhoneNumber = (number: string): string => {
  return number.replace(/[^0-9*#]/g, '');
};

/**
 * UCAP 번호 통화 처리 함수
 * 
 * 사용자 요청: "미설치시는 일반전화로 연결되도록하고 설치시에만 DUMC call로 연결"
 * 
 * - 안드로이드 기기:
 *   1. DUMC Call (kr.or.dumc.cubecalllite) 앱 인텐트 호출
 *   2. 앱이 설치되어 있으면 DUMC Call 앱이 즉시 실행됨 (화면 전환 발생)
 *   3. 미설치 상태로 화면에 그대로 머무를 경우, 900ms 후 스마트폰 기본 전화(tel:)로 자동 전환
 * - iOS / PC / 기타 기기:
 *   - 즉시 스마트폰 기본 전화(tel:)로 연결
 * 
 * @param ucapNumber 호출할 UCAP 내선번호 (예: "5-4081")
 * @param fallbackPhone 일반전화 연결 시 사용할 대체 번호 (미입력 시 UCAP 번호 사용)
 * @param onMessage 사용자 안내 메시지 콜백 (토스트 등 표시용)
 */
export const makeUcapCall = (
  ucapNumber: string,
  fallbackPhone?: string,
  onMessage?: (message: string) => void
) => {
  const cleanUcap = cleanPhoneNumber(ucapNumber);
  const targetPhone = fallbackPhone ? cleanPhoneNumber(fallbackPhone) : cleanUcap;

  // 1. 편의를 위해 번호를 클립보드에 자동 복사
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(ucapNumber).catch(() => {});
  }

  // 2. 안드로이드가 아닌 기기(iOS, PC 등)는 즉시 일반 전화(tel:)로 연결
  if (!isAndroidDevice()) {
    if (onMessage) {
      onMessage(`일반 전화로 연결합니다. (UCAP: ${ucapNumber})`);
    }
    window.location.href = `tel:${targetPhone}`;
    return;
  }

  // 3. 안드로이드 기기: DUMC Call 앱 인텐트 실행 시도
  if (onMessage) {
    onMessage(`DUMC Call 연결 중... (미설치 시 일반전화 자동 전환)`);
  }

  // DUMC Call 앱 실행용 인텐트 URI
  const intentUrl = `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${DUMC_CALL_PACKAGE};S.extra_phone_number=${cleanUcap};end;`;

  let appOpened = false;
  const startTime = Date.now();

  const handleVisibilityChange = () => {
    if (document.hidden) {
      appOpened = true;
    }
  };

  const handleBlur = () => {
    appOpened = true;
  };

  document.addEventListener('visibilitychange', handleVisibilityChange, { once: true });
  window.addEventListener('blur', handleBlur, { once: true });

  // DUMC Call 앱 인텐트 트리거
  window.location.href = intentUrl;

  // 미설치 시 일반 전화로 폴백 (약 900ms 대기 후 브라우저가 계속 활성 상태이면 미설치로 판단)
  setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);

    // 사용자가 다른 앱(DUMC Call)으로 넘어가지 않고 브라우저에 머물러 있는 경우 -> 미설치
    if (!appOpened && !document.hidden && Date.now() - startTime < 2500) {
      if (onMessage) {
        onMessage(`DUMC Call 미설치 확인됨 → 일반 전화로 연결합니다.`);
      }
      window.location.href = `tel:${targetPhone}`;
    }
  }, 950);
};
