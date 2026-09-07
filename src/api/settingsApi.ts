const rawApiUrl = (import.meta as any).env?.VITE_API_URL || '';
// 로컬 개발 환경에서 별도의 3001 포트 서버가 없을 경우 Vite 내장 미들웨어(상대 경로 '')로 안전하게 fallback
const API_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && rawApiUrl.includes(':3001') && window.location.port !== '3001')
  ? ''
  : rawApiUrl;

// ─── REST API 호출 ───

/** 모든 설정값 조회 */
export async function fetchAllSettings(): Promise<{ settings: Record<string, any>; updated_at?: string }> {
  const res = await fetch(`${API_URL}/api/settings`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
  const data = await res.json();
  // data 구조: { settings: { key: value, ... }, updated_at: ... } 또는 구버전 fallback
  if (data && data.settings) {
    return data;
  }
  return { settings: data || {} };
}

/** 특정 키의 설정값 조회 */
export async function fetchSetting(key: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/settings?key=${encodeURIComponent(key)}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) throw new Error(`Failed to fetch setting "${key}": ${res.statusText}`);
  const data = await res.json();
  return data.value;
}

/** 설정값 저장 (Upsert) */
export async function saveSetting(key: string, value: any): Promise<void> {
  const res = await fetch(`${API_URL}/api/settings?key=${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to save setting "${key}": ${res.statusText} (${errorBody})`);
  }

  // 동일 브라우저 내 다른 탭으로 즉시 알림 (추가 DB 쿼리 방지)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('hcs_neon_sync_channel');
      bc.postMessage({
        type: 'SETTINGS_UPDATED',
        settings: { [key]: value },
        updated_at: new Date().toISOString()
      });
      bc.close();
    }
  } catch (e) {
    // ignore
  }
}

const debounceTimers: Record<string, any> = {};

/** 디바운스된 설정값 저장 (연속 입력 또는 빈번한 상태 변경 시 최적화) */
export function saveSettingDebounced(key: string, value: any, delay = 400): void {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(() => {
    saveSetting(key, value).catch(err => {
      console.error(`Neon DB 저장 실패 ("${key}"):`, err);
    });
    delete debounceTimers[key];
  }, delay);
}

/** 설정값 삭제 */
export async function deleteSetting(key: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/settings?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete setting "${key}": ${res.statusText}`);
}

// ─── 실시간 동기화 (Polling + Visibility Change) ───

export type SettingsSyncCallback = (settings: Record<string, any>) => void;

/**
 * Neon DB 무료 플랜 (100 Compute Hours) 절약형 스마트 동기화 구독기:
 * - 탭이 숨겨져 있거나(백그라운드) 화면이 꺼져 있으면 절대 DB 요청을 보내지 않음 (Neon의 5분 자동 절전 지원)
 * - 사용자가 브라우저 창을 보거나(Focus/VisibilityChange) 화면을 터치할 때 즉시 최신 데이터 확인 (최소 15초 쿨타임 적용)
 * - 화면을 켜둔 채로 유지할 경우 5분(300초) 주기로만 가볍게 확인하여 무료 시간 낭비 방지
 * - 같은 브라우저 내 탭 간에는 BroadcastChannel로 DB 요청 없이 0ms 즉시 동기화
 *
 * @returns 구독 해제 함수
 */
export function subscribeToSettings(onSync: SettingsSyncCallback): () => void {
  let timer: any = null;
  let isRunning = true;
  let lastUpdatedAt: string | null = null;
  let lastCheckedTime = 0;

  // 브라우저 탭 간 실시간 통신 (DB 요청 0건으로 즉시 동기화)
  let broadcastChannel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('hcs_neon_sync_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'SETTINGS_UPDATED' && event.data?.settings) {
          lastUpdatedAt = event.data.updated_at || null;
          onSync(event.data.settings);
        }
      };
    }
  } catch (e) {
    // BroadcastChannel 미지원 환경 fallback
  }

  async function checkUpdates(force = false) {
    if (!isRunning) return;

    // 1. 화면이 보이지 않는 백그라운드 탭이면 쿼리 실행 안 함 (Neon 절전 모드 진입 허용)
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    // 2. 쿨타임 (15초 이내 중복 확인 방지)
    const now = Date.now();
    if (!force && now - lastCheckedTime < 15000) {
      return;
    }
    lastCheckedTime = now;

    try {
      const res = await fetchAllSettings();
      if (res.updated_at !== lastUpdatedAt) {
        lastUpdatedAt = res.updated_at || null;
        onSync(res.settings);
      }
    } catch (err) {
      console.warn('설정 동기화 확인 실패 (재시도 대기):', err);
    }
  }

  // Neon 절전을 고려한 5분(300,000ms) 주기 완화 폴링
  timer = setInterval(() => checkUpdates(false), 300000);

  // 사용자가 탭으로 돌아오거나(화면 켬), 창을 클릭했을 때 스마트 확인
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkUpdates(false);
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);

  return () => {
    isRunning = false;
    if (timer) clearInterval(timer);
    window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  };
}
