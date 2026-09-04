// src/api/settingsApi.ts — Vercel Serverless + Neon API 연동 클라이언트
const API_URL = (import.meta as any).env?.VITE_API_URL || '';

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
 * Vercel Serverless 호스팅 환경에 최적화된 실시간 동기화 구독기:
 * - 5초 주기로 가벼운 변경 감지 폴링
 * - 브라우저 탭 활성화 시 즉시 최신 데이터 반영
 *
 * @returns 구독 해제 함수
 */
export function subscribeToSettings(onSync: SettingsSyncCallback): () => void {
  let timer: any = null;
  let isRunning = true;
  let lastUpdatedAt: string | null = null;

  async function checkUpdates() {
    if (!isRunning) return;
    try {
      const res = await fetchAllSettings();
      if (res.updated_at !== lastUpdatedAt) {
        lastUpdatedAt = res.updated_at || null;
        onSync(res.settings);
      }
    } catch (err) {
      // 네트워크 장애 시 조용히 넘어가고 다음 주기에 재시도
      console.warn('설정 동기화 확인 실패 (재시도 대기):', err);
    }
  }

  // 주기적 폴링 (5초)
  timer = setInterval(checkUpdates, 5000);

  // 사용자가 탭으로 돌아왔을 때 즉시 확인
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkUpdates();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);

  return () => {
    isRunning = false;
    if (timer) clearInterval(timer);
    window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('focus', handleVisibilityOrFocus);
  };
}
