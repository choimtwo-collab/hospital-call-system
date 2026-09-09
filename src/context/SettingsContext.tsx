// src/context/SettingsContext.tsx — Neon PostgreSQL 실시간 동기화 Context
import React, { createContext, useContext, useState, useCallback } from 'react';
import { saveSetting } from '../api/settingsApi';
import {
  InternWardGroupSetting, EmergencyContact
} from '../types';
import { 
  initialInternWardGroups, emergencyContacts as defaultEmergencyContacts, normalizeInternWardGroups 
} from '../data/initialData';

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
  applyRemoteInternWardGroups: (groups: InternWardGroupSetting[]) => void;
  applyRemoteHotlines: (contacts: EmergencyContact[]) => void;
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
      if (savedGroups) initialGroups = normalizeInternWardGroups(JSON.parse(savedGroups));
      const savedHotlines = localStorage.getItem('hcs_hotlines_v1');
      if (savedHotlines) initialHotlines = JSON.parse(savedHotlines);
    } catch (e) {
      console.warn('localStorage 파싱 에러:', e);
    }

    return {
      internWardGroups: normalizeInternWardGroups(initialGroups),
      hotlines: initialHotlines,
      isLoading: false,
      isConnected: false,
      lastSyncedAt: null,
      error: null,
    };
  });

  // ─── 원격 동기화 수신 전용 함수 (절대 DB에 재저장(saveSetting)하지 않음 - 무한 루프 원천 차단) ───
  const applyRemoteInternWardGroups = useCallback((groups: InternWardGroupSetting[]) => {
    const normalized = normalizeInternWardGroups(groups);
    setSettings(prev => ({
      ...prev,
      internWardGroups: normalized,
      isConnected: true,
      lastSyncedAt: new Date().toLocaleTimeString(),
    }));
    try {
      localStorage.setItem('hcs_intern_ward_groups_v1', JSON.stringify(normalized));
    } catch (e) {}
  }, []);

  const applyRemoteHotlines = useCallback((contacts: EmergencyContact[]) => {
    setSettings(prev => ({
      ...prev,
      hotlines: contacts,
      isConnected: true,
      lastSyncedAt: new Date().toLocaleTimeString(),
    }));
    try {
      localStorage.setItem('hcs_hotlines_v1', JSON.stringify(contacts));
    } catch (e) {}
  }, []);

  // ─── 사용자 직접 수정 Setter 함수들 (사용자가 관리자 UI에서 직접 수정했을 때만 DB 저장) ───

  const updateInternWardGroups = useCallback(async (groups: InternWardGroupSetting[]) => {
    // 1. UI 즉시 반응 (낙관적 갱신)
    setSettings(prev => ({ ...prev, internWardGroups: groups }));
    try {
      localStorage.setItem('hcs_intern_ward_groups_v1', JSON.stringify(groups));
    } catch (e) {}

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
    try {
      localStorage.setItem('hcs_hotlines_v1', JSON.stringify(contacts));
    } catch (e) {}

    // 2. Neon DB에 저장
    try {
      await saveSetting(SETTING_KEYS.HOTLINES, contacts);
    } catch (err: any) {
      console.error('Neon 저장 실패 (hotlines):', err.message);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateInternWardGroups,
      updateHotlines,
      applyRemoteInternWardGroups,
      applyRemoteHotlines,
    }}>
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

