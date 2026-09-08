const rawApiUrl = (import.meta as any).env?.VITE_API_URL || '';
// 로컬 개발 환경에서 별도의 3001 포트 서버가 없을 경우 Vite 내장 미들웨어(상대 경로 '')로 안전하게 fallback
const API_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && rawApiUrl.includes(':3001') && window.location.port !== '3001')
  ? ''
  : rawApiUrl;

// ─── 고유 탭 식별자 및 메모리 캐시 (무한 핑퐁 루프 & 중복 요청 원천 차단) ───
const TAB_SESSION_ID = typeof window !== 'undefined'
  ? 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  : 'server_env';

// 마지막으로 저장/수신된 데이터의 직렬화 해시 캐시 (동일한 데이터는 네트워크 요청 자체를 100% 생략)
const lastKnownDataCache: Record<string, string> = {};

/** 캐시 직접 갱신 (원격에서 가져온 데이터를 미리 등록하여 React 리렌더링 시 불필요한 저장 방지) */
export function registerKnownSettings(settings: Record<string, any>): void {
  if (!settings) return;
  for (const [k, v] of Object.entries(settings)) {
    try {
      lastKnownDataCache[k] = JSON.stringify(v);
    } catch (e) {}
  }
}

// ─── REST API 호출 ───

/** 모든 설정값 조회 (fresh = true일 때만 CDN 캐시를 우회하여 Neon DB 직접 조회) */
export async function fetchAllSettings(fresh = false): Promise<{ settings: Record<string, any>; updated_at?: string }> {
  const url = fresh ? `${API_URL}/api/settings?fresh=true` : `${API_URL}/api/settings`;
  const headers: Record<string, string> = fresh ? { 'Cache-Control': 'no-cache' } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
  const data = await res.json();
  
  // 조회된 최신 데이터를 캐시에 사전 등록하여 불필요한 역방향 저장 차단
  const settingsMap = (data && data.settings) ? data.settings : (data || {});
  registerKnownSettings(settingsMap);

  if (data && data.settings) {
    return data;
  }
  return { settings: settingsMap };
}

/** 특정 키의 설정값 조회 */
export async function fetchSetting(key: string, fresh = false): Promise<any> {
  const url = fresh
    ? `${API_URL}/api/settings?key=${encodeURIComponent(key)}&fresh=true`
    : `${API_URL}/api/settings?key=${encodeURIComponent(key)}`;
  const headers: Record<string, string> = fresh ? { 'Cache-Control': 'no-cache' } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch setting "${key}": ${res.statusText}`);
  const data = await res.json();
  try {
    lastKnownDataCache[key] = JSON.stringify(data.value);
  } catch (e) {}
  return data.value;
}

/** 설정값 저장 (Upsert) - 변경 사항이 없을 경우 네트워크 요청 0건 */
export async function saveSetting(key: string, value: any): Promise<void> {
  let stringified = '';
  try {
    stringified = JSON.stringify(value);
  } catch (e) {
    stringified = String(value);
  }

  // 1차 방어선: 이전 데이터와 100% 동일하면 Vercel/Neon 네트워크 호출 0건으로 즉시 종료
  if (lastKnownDataCache[key] === stringified) {
    return;
  }

  // 캐시 선반영
  lastKnownDataCache[key] = stringified;

  const res = await fetch(`${API_URL}/api/settings?key=${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to save setting "${key}": ${res.statusText} (${errorBody})`);
  }

  // 동일 브라우저 내 다른 탭으로 안전하게 전송 (발신자 ID 첨부하여 에코 루프 차단)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('hcs_neon_sync_channel');
      bc.postMessage({
        type: 'SETTINGS_UPDATED',
        senderId: TAB_SESSION_ID,
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
export function saveSettingDebounced(key: string, value: any, delay = 500): void {
  // 선행 검사: 이미 동일한 내용이면 타이머 등록조차 하지 않음
  try {
    const str = JSON.stringify(value);
    if (lastKnownDataCache[key] === str) {
      return;
    }
  } catch (e) {}

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
  delete lastKnownDataCache[key];
  const res = await fetch(`${API_URL}/api/settings?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete setting "${key}": ${res.statusText}`);
}

// ─── 실시간 동기화 (Polling + Visibility Change + BroadcastChannel) ───

export type SettingsSyncCallback = (settings: Record<string, any>) => void;

/**
 * Neon DB & Vercel 무료 플랜 극절약형 스마트 동기화 구독기
 */
export function subscribeToSettings(onSync: SettingsSyncCallback): () => void {
  let timer: any = null;
  let isRunning = true;
  let lastUpdatedAt: string | null = null;
  let lastCheckedTime = 0;

  // 브라우저 탭 간 실시간 통신 (네트워크 요청 0건)
  let broadcastChannel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('hcs_neon_sync_channel');
      broadcastChannel.onmessage = (event) => {
        // 1. 자기가 보낸 메시지(Echo)는 무조건 무시
        if (event.data?.senderId === TAB_SESSION_ID) {
          return;
        }

        if (event.data?.type === 'SETTINGS_UPDATED' && event.data?.settings) {
          // 2. 수신된 데이터 캐시 등록 (역방향 재전송 차단)
          registerKnownSettings(event.data.settings);
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

    // 1. 화면이 보이지 않는 백그라운드 탭이면 쿼리 실행 안 함
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    // 2. 쿨타임 (최소 20초 이내 중복 확인 절대 금지)
    const now = Date.now();
    if (!force && now - lastCheckedTime < 20000) {
      return;
    }
    lastCheckedTime = now;

    try {
      const res = await fetchAllSettings();
      if (res.updated_at !== lastUpdatedAt) {
        lastUpdatedAt = res.updated_at || null;
        registerKnownSettings(res.settings);
        onSync(res.settings);
      }
    } catch (err) {
      console.warn('설정 동기화 확인 대기 중:', err);
    }
  }

  // Neon & Vercel 절전을 고려한 5분(300,000ms) 주기 폴링
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

