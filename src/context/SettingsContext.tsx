// src/context/SettingsContext.tsx — Neon PostgreSQL 실시간 동기화 Context
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAllSettings, saveSetting, subscribeToSettings } from '../api/settingsApi';
import {
  InternWardGroupSetting, EmergencyContact
} from '../types';
import { initialInternWardGroups, emergencyContacts as defaultEmergencyContacts } from '../data/initialData';

// ─── 설정 키 상수 ───
export const SETTING_KEYS = {
  INTERN_WARD_GROUPS: 'intern_ward_groups',
  HOTLINES: 'hotlines',
  DUTY_PHONES: 'duty_phones',
  CUSTOM_RULES: 'custom_rules',
} as const;

// ─── 상태 타입 ───
interface SettingsState {
  internWardGroups: InternWardGroupSetting[];
  hotlines: EmergencyContact[];
  isLoading: boolean;
  isConnected: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

interface SettingsContextType {
  settings: SettingsState;
  updateInternWardGroups: (groups: InternWardGroupSetting[]) => Promise<void>;
  updateHotlines: (contacts: EmergencyContact[]) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ─── Provider ───
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    // 초기 렌더링 시에는 localStorage에 저장된 최신 값 또는 initialData 사용
    let initialGroups = initialInternWardGroups;
    let initialHotlines = defaultEmergencyContacts;
    try {
      const savedGroups = localStorage.getItem('hcs_intern_ward_groups_v1');
      if (savedGroups) initialGroups = JSON.parse(savedGroups);
      const savedHotlines = localStorage.getItem('hcs_hotlines_v1');
      if (savedHotlines) initialHotlines = JSON.parse(savedHotlines);
    } catch (e) {
      console.warn('localStorage 파싱 에러:', e);
    }

    return {
      internWardGroups: initialGroups,
      hotlines: initialHotlines,
      isLoading: true,
      isConnected: false,
      lastSyncedAt: null,
      error: null,
    };
  });

  // ─── 초기 데이터 로드 ───
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetchAllSettings();
      const loadedSettings = res.settings || {};

      setSettings(prev => ({
        ...prev,
        internWardGroups: loadedSettings[SETTING_KEYS.INTERN_WARD_GROUPS] || prev.internWardGroups,
        hotlines: loadedSettings[SETTING_KEYS.HOTLINES] || prev.hotlines,
        isLoading: false,
        isConnected: true,
        lastSyncedAt: new Date().toLocaleTimeString(),
        error: null,
      }));

      // localStorage에도 캐싱
      if (loadedSettings[SETTING_KEYS.INTERN_WARD_GROUPS]) {
        localStorage.setItem('hcs_intern_ward_groups_v1', JSON.stringify(loadedSettings[SETTING_KEYS.INTERN_WARD_GROUPS]));
      }
      if (loadedSettings[SETTING_KEYS.HOTLINES]) {
        localStorage.setItem('hcs_hotlines_v1', JSON.stringify(loadedSettings[SETTING_KEYS.HOTLINES]));
      }
    } catch (err: any) {
      console.warn('Neon API 연결 실패, 로컬 캐시 데이터 사용:', err.message);
      setSettings(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: '클라우드 DB에 연결할 수 없어 로컬 캐시 데이터를 사용 중입니다.',
      }));
    }
  }, []);

  // ─── 실시간 주기적 동기화 ───
  useEffect(() => {
    loadInitial();

    const unsubscribe = subscribeToSettings((newSettings) => {
      setSettings(prev => {
        const next = { ...prev, lastSyncedAt: new Date().toLocaleTimeString(), isConnected: true };
        if (newSettings[SETTING_KEYS.INTERN_WARD_GROUPS]) {
          next.internWardGroups = newSettings[SETTING_KEYS.INTERN_WARD_GROUPS];
          localStorage.setItem('hcs_intern_ward_groups_v1', JSON.stringify(next.internWardGroups));
        }
        if (newSettings[SETTING_KEYS.HOTLINES]) {
          next.hotlines = newSettings[SETTING_KEYS.HOTLINES];
          localStorage.setItem('hcs_hotlines_v1', JSON.stringify(next.hotlines));
        }
        return next;
      });
    });

    return unsubscribe;
  }, [loadInitial]);

  // ─── Setter 함수들 (DB 저장 + 즉시 상태 갱신 + localStorage 캐시) ───

  const updateInternWardGroups = useCallback(async (groups: InternWardGroupSetting[]) => {
    // 1. UI 즉시 반응 (낙관적 갱신)
    setSettings(prev => ({ ...prev, internWardGroups: groups }));
    localStorage.setItem('hcs_intern_ward_groups_v1', JSON.stringify(groups));

    // 2. Neon DB에 저장
    try {
      await saveSetting(SETTING_KEYS.INTERN_WARD_GROUPS, groups);
    } catch (err: any) {
      console.error('Neon 저장 실패 (intern_ward_groups):', err.message);
    }
  }, []);

  const updateHotlines = useCallback(async (contacts: EmergencyContact[]) => {
    // 1. UI 즉시 반응 (낙관적 갱신)
    setSettings(prev => ({ ...prev, hotlines: contacts }));
    localStorage.setItem('hcs_hotlines_v1', JSON.stringify(contacts));

    // 2. Neon DB에 저장
    try {
      await saveSetting(SETTING_KEYS.HOTLINES, contacts);
    } catch (err: any) {
      console.error('Neon 저장 실패 (hotlines):', err.message);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateInternWardGroups, updateHotlines }}>
      {children}
    </SettingsContext.Provider>
  );
};

// ─── Hook ───
export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within <SettingsProvider>');
  }
  return ctx;
};
