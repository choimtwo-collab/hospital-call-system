import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { 
  initialSchedules, initialContacts, initialTimeSlots, 
  initialCNPosts, initialWeeklyCNSchedule, initialTasks, 
  initialCustomRules, initialInterns, initialPathologistSchedules,
  initialDutyRoles, initialDutyPhones, initialCNGroupSchedules, emergencyContacts, initialInternWardGroups
} from './data/initialData';
import { useSettings } from './context/SettingsContext';
import { 
  fetchAllSettings, subscribeToSettings, saveSettingDebounced 
} from './api/settingsApi';
import { 
  DateScheduleMap, ContactMap, TimeSlot, CNPost, WeeklyCNScheduleMap,
  TaskItem, CustomRule, InternDoctor, PathologistSchedule, DutyPhoneItem, CNGroupSchedule
} from './types';
import { 
  GoogleSheetsConfig, DEFAULT_SHEETS_CONFIG, fetchGoogleSheetSchedules 
} from './utils/googleSheetsSync';

const STORAGE_KEYS = {
  SCHEDULES: 'hcs_schedules_v1',
  CONTACTS: 'hcs_contacts_v1',
  TIME_SLOTS: 'hcs_time_slots_v1',
  CN_POSTS: 'hcs_cn_posts_v1',
  WEEKLY_CN: 'hcs_weekly_cn_v1',
  TASKS: 'hcs_tasks_v6',
  CUSTOM_RULES: 'hcs_custom_rules_v1',
  INTERNS: 'hcs_interns_v1',
  PATHOLOGISTS: 'hcs_pathologists_v1',
  SHEETS_CONFIG: 'hcs_sheets_config_v1',
  DUTY_ROLES: 'hcs_duty_roles_v1',
  DUTY_PHONES: 'hcs_duty_phones_v1',
  CN_GROUP_SCHEDULES: 'hcs_cn_group_schedules_v1',
  HOTLINES: 'hcs_hotlines_v1',
  INTERN_WARD_GROUPS: 'hcs_intern_ward_groups_v1'
};

const DB_KEYS = {
  SCHEDULES: 'schedules',
  CONTACTS: 'contacts',
  TIME_SLOTS: 'time_slots',
  CN_POSTS: 'cn_posts',
  WEEKLY_CN: 'weekly_cn_schedule',
  TASKS: 'tasks',
  CUSTOM_RULES: 'custom_rules',
  INTERNS: 'interns',
  PATHOLOGISTS: 'pathologist_schedules',
  SHEETS_CONFIG: 'sheets_config',
  DUTY_ROLES: 'duty_roles',
  DUTY_PHONES: 'duty_phones',
  CN_GROUP_SCHEDULES: 'cn_group_schedules',
  HOTLINES: 'hotlines',
  INTERN_WARD_GROUPS: 'intern_ward_groups'
};

export default function App() {
  const [view, setView] = useState<'user' | 'admin'>('user');
  const { settings: neonSettings, updateInternWardGroups, updateHotlines } = useSettings();

  const isInitialLoaded = useRef(false);
  const isUpdatingFromRemote = useRef(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);

  // Lazy initialize state from LocalStorage or default initial dataset
  const [schedules, setSchedules] = useState<DateScheduleMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : initialSchedules;
  });

  const [contacts, setContacts] = useState<ContactMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    return saved ? JSON.parse(saved) : initialContacts;
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIME_SLOTS);
    return saved ? JSON.parse(saved) : initialTimeSlots;
  });

  const [cnPosts, setCnPosts] = useState<CNPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CN_POSTS);
    return saved ? JSON.parse(saved) : initialCNPosts;
  });

  const [weeklyCNSchedule, setWeeklyCNSchedule] = useState<WeeklyCNScheduleMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_CN);
    return saved ? JSON.parse(saved) : initialWeeklyCNSchedule;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!saved) return initialTasks;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialTasks;
      if (
        parsed.some((t: any) => t.id === 'task-im-1' || !t.id?.startsWith('TSK_')) ||
        !parsed.some((t: any) => t.id === 'TSK_BLOOD_CONSENT') ||
        !parsed.some((t: any) => t.id === 'TSK_EMERG_CPR')
      ) {
        return initialTasks;
      }
      return parsed;
    } catch {
      return initialTasks;
    }
  });

  const [customRules, setCustomRules] = useState<CustomRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_RULES);
    return saved ? JSON.parse(saved) : initialCustomRules;
  });

  const [interns, setInterns] = useState<InternDoctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INTERNS);
    return saved ? JSON.parse(saved) : initialInterns;
  });

  const [pathologistSchedules, setPathologistSchedules] = useState<PathologistSchedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PATHOLOGISTS);
    return saved ? JSON.parse(saved) : initialPathologistSchedules;
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_SHEETS_CONFIG;
  });

  const [dutyRoles, setDutyRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DUTY_ROLES);
    return saved ? JSON.parse(saved) : initialDutyRoles;
  });

  const [dutyPhones, setDutyPhones] = useState<DutyPhoneItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DUTY_PHONES);
    return saved ? JSON.parse(saved) : initialDutyPhones;
  });

  const [cnGroupSchedules, setCnGroupSchedules] = useState<CNGroupSchedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CN_GROUP_SCHEDULES);
    return saved ? JSON.parse(saved) : initialCNGroupSchedules;
  });

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // ─── 1. Neon DB 초기 로드 및 실시간 양방향 동기화 ───
  useEffect(() => {
    let isMounted = true;

    async function loadFromNeon() {
      try {
        const { settings } = await fetchAllSettings();
        if (!isMounted) return;

        isUpdatingFromRemote.current = true;
        if (settings[DB_KEYS.SCHEDULES]) setSchedules(settings[DB_KEYS.SCHEDULES]);
        if (settings[DB_KEYS.CONTACTS]) setContacts(settings[DB_KEYS.CONTACTS]);
        if (settings[DB_KEYS.TIME_SLOTS]) setTimeSlots(settings[DB_KEYS.TIME_SLOTS]);
        if (settings[DB_KEYS.CN_POSTS]) setCnPosts(settings[DB_KEYS.CN_POSTS]);
        if (settings[DB_KEYS.WEEKLY_CN]) setWeeklyCNSchedule(settings[DB_KEYS.WEEKLY_CN]);
        if (settings[DB_KEYS.TASKS]) setTasks(settings[DB_KEYS.TASKS]);
        if (settings[DB_KEYS.CUSTOM_RULES]) setCustomRules(settings[DB_KEYS.CUSTOM_RULES]);
        if (settings[DB_KEYS.INTERNS]) setInterns(settings[DB_KEYS.INTERNS]);
        if (settings[DB_KEYS.PATHOLOGISTS]) setPathologistSchedules(settings[DB_KEYS.PATHOLOGISTS]);
        if (settings[DB_KEYS.SHEETS_CONFIG]) setSheetsConfig(settings[DB_KEYS.SHEETS_CONFIG]);
        if (settings[DB_KEYS.DUTY_ROLES]) setDutyRoles(settings[DB_KEYS.DUTY_ROLES]);
        if (settings[DB_KEYS.DUTY_PHONES]) setDutyPhones(settings[DB_KEYS.DUTY_PHONES]);
        if (settings[DB_KEYS.CN_GROUP_SCHEDULES]) setCnGroupSchedules(settings[DB_KEYS.CN_GROUP_SCHEDULES]);
        if (settings[DB_KEYS.HOTLINES]) updateHotlines(settings[DB_KEYS.HOTLINES]);
        if (settings[DB_KEYS.INTERN_WARD_GROUPS]) updateInternWardGroups(settings[DB_KEYS.INTERN_WARD_GROUPS]);

        setIsCloudConnected(true);
        setLastCloudSyncAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Neon DB 로드 실패 (로컬 캐시 사용):', err);
        setIsCloudConnected(false);
      } finally {
        if (isMounted) {
          isInitialLoaded.current = true;
          setTimeout(() => { isUpdatingFromRemote.current = false; }, 600);
        }
      }
    }

    loadFromNeon();

    // 5초 주기 폴링 + 포커스 복귀 시 실시간 동기화
    const unsubscribe = subscribeToSettings((remoteSettings) => {
      if (!isInitialLoaded.current) return;
      isUpdatingFromRemote.current = true;

      if (remoteSettings[DB_KEYS.SCHEDULES]) setSchedules(remoteSettings[DB_KEYS.SCHEDULES]);
      if (remoteSettings[DB_KEYS.CONTACTS]) setContacts(remoteSettings[DB_KEYS.CONTACTS]);
      if (remoteSettings[DB_KEYS.TIME_SLOTS]) setTimeSlots(remoteSettings[DB_KEYS.TIME_SLOTS]);
      if (remoteSettings[DB_KEYS.CN_POSTS]) setCnPosts(remoteSettings[DB_KEYS.CN_POSTS]);
      if (remoteSettings[DB_KEYS.WEEKLY_CN]) setWeeklyCNSchedule(remoteSettings[DB_KEYS.WEEKLY_CN]);
      if (remoteSettings[DB_KEYS.TASKS]) setTasks(remoteSettings[DB_KEYS.TASKS]);
      if (remoteSettings[DB_KEYS.CUSTOM_RULES]) setCustomRules(remoteSettings[DB_KEYS.CUSTOM_RULES]);
      if (remoteSettings[DB_KEYS.INTERNS]) setInterns(remoteSettings[DB_KEYS.INTERNS]);
      if (remoteSettings[DB_KEYS.PATHOLOGISTS]) setPathologistSchedules(remoteSettings[DB_KEYS.PATHOLOGISTS]);
      if (remoteSettings[DB_KEYS.SHEETS_CONFIG]) setSheetsConfig(remoteSettings[DB_KEYS.SHEETS_CONFIG]);
      if (remoteSettings[DB_KEYS.DUTY_ROLES]) setDutyRoles(remoteSettings[DB_KEYS.DUTY_ROLES]);
      if (remoteSettings[DB_KEYS.DUTY_PHONES]) setDutyPhones(remoteSettings[DB_KEYS.DUTY_PHONES]);
      if (remoteSettings[DB_KEYS.CN_GROUP_SCHEDULES]) setCnGroupSchedules(remoteSettings[DB_KEYS.CN_GROUP_SCHEDULES]);
      if (remoteSettings[DB_KEYS.HOTLINES]) updateHotlines(remoteSettings[DB_KEYS.HOTLINES]);
      if (remoteSettings[DB_KEYS.INTERN_WARD_GROUPS]) updateInternWardGroups(remoteSettings[DB_KEYS.INTERN_WARD_GROUPS]);

      setIsCloudConnected(true);
      setLastCloudSyncAt(new Date().toLocaleTimeString());
      setTimeout(() => { isUpdatingFromRemote.current = false; }, 600);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [updateHotlines, updateInternWardGroups]);

  // ─── 2. 로컬스토리지 저장 + Neon DB 자동 동기화 헬퍼 ───
  const syncState = useCallback((storageKey: string, dbKey: string, value: any) => {
    localStorage.setItem(storageKey, JSON.stringify(value));
    if (isInitialLoaded.current && !isUpdatingFromRemote.current) {
      saveSettingDebounced(dbKey, value);
    }
  }, []);

  useEffect(() => { syncState(STORAGE_KEYS.SCHEDULES, DB_KEYS.SCHEDULES, schedules); }, [schedules, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.DUTY_ROLES, DB_KEYS.DUTY_ROLES, dutyRoles); }, [dutyRoles, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.DUTY_PHONES, DB_KEYS.DUTY_PHONES, dutyPhones); }, [dutyPhones, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.CN_GROUP_SCHEDULES, DB_KEYS.CN_GROUP_SCHEDULES, cnGroupSchedules); }, [cnGroupSchedules, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.CONTACTS, DB_KEYS.CONTACTS, contacts); }, [contacts, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.TIME_SLOTS, DB_KEYS.TIME_SLOTS, timeSlots); }, [timeSlots, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.CN_POSTS, DB_KEYS.CN_POSTS, cnPosts); }, [cnPosts, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.WEEKLY_CN, DB_KEYS.WEEKLY_CN, weeklyCNSchedule); }, [weeklyCNSchedule, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.TASKS, DB_KEYS.TASKS, tasks); }, [tasks, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.CUSTOM_RULES, DB_KEYS.CUSTOM_RULES, customRules); }, [customRules, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.INTERNS, DB_KEYS.INTERNS, interns); }, [interns, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.PATHOLOGISTS, DB_KEYS.PATHOLOGISTS, pathologistSchedules); }, [pathologistSchedules, syncState]);
  useEffect(() => { syncState(STORAGE_KEYS.SHEETS_CONFIG, DB_KEYS.SHEETS_CONFIG, sheetsConfig); }, [sheetsConfig, syncState]);

  // ─── 3. Google Sheets Sync Action ───
  const handleSyncSheets = useCallback(async (customUrl?: string, customName?: string) => {
    const targetUrl = customUrl || sheetsConfig.sheetUrl;
    const targetName = customName || sheetsConfig.sheetName || '당직표';
    if (!targetUrl) return;

    setIsSyncingSheets(true);
    const result = await fetchGoogleSheetSchedules(targetUrl, targetName);
    setIsSyncingSheets(false);

    if (result.success) {
      setSchedules(prev => ({ ...prev, ...result.schedules }));
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSheetsConfig(prev => ({
        ...prev,
        enabled: true,
        sheetUrl: targetUrl,
        sheetName: targetName,
        lastSyncedAt: nowStr
      }));
      setSyncToastMessage(result.message);
      setTimeout(() => setSyncToastMessage(null), 3500);
    } else {
      setSyncToastMessage(result.message);
      setTimeout(() => setSyncToastMessage(null), 5000);
    }
  }, [sheetsConfig]);

  // Periodic Auto-Sync Effect for Google Sheets
  useEffect(() => {
    if (!sheetsConfig.enabled || !sheetsConfig.sheetUrl) return;
    handleSyncSheets();
    const intervalMinutes = Math.max(1, sheetsConfig.autoSyncMinutes || 5);
    const timer = setInterval(() => {
      handleSyncSheets();
    }, intervalMinutes * 60 * 1000);
    return () => clearInterval(timer);
  }, [sheetsConfig.enabled, sheetsConfig.sheetUrl, sheetsConfig.autoSyncMinutes, handleSyncSheets]);

  const handleResetData = () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));

    setSchedules(initialSchedules);
    setContacts(initialContacts);
    setTimeSlots(initialTimeSlots);
    setCnPosts(initialCNPosts);
    setWeeklyCNSchedule(initialWeeklyCNSchedule);
    setTasks(initialTasks);
    setCustomRules(initialCustomRules);
    setInterns(initialInterns);
    setPathologistSchedules(initialPathologistSchedules);
    setSheetsConfig(DEFAULT_SHEETS_CONFIG);
    setDutyRoles(initialDutyRoles);
    setDutyPhones(initialDutyPhones);
    setCnGroupSchedules(initialCNGroupSchedules);
    updateHotlines(emergencyContacts);
    updateInternWardGroups(initialInternWardGroups);

    // Neon DB에도 기본값 저장
    saveSettingDebounced(DB_KEYS.SCHEDULES, initialSchedules);
    saveSettingDebounced(DB_KEYS.CONTACTS, initialContacts);
    saveSettingDebounced(DB_KEYS.TIME_SLOTS, initialTimeSlots);
    saveSettingDebounced(DB_KEYS.CN_POSTS, initialCNPosts);
    saveSettingDebounced(DB_KEYS.WEEKLY_CN, initialWeeklyCNSchedule);
    saveSettingDebounced(DB_KEYS.TASKS, initialTasks);
    saveSettingDebounced(DB_KEYS.CUSTOM_RULES, initialCustomRules);
    saveSettingDebounced(DB_KEYS.INTERNS, initialInterns);
    saveSettingDebounced(DB_KEYS.PATHOLOGISTS, initialPathologistSchedules);
    saveSettingDebounced(DB_KEYS.SHEETS_CONFIG, DEFAULT_SHEETS_CONFIG);
    saveSettingDebounced(DB_KEYS.DUTY_ROLES, initialDutyRoles);
    saveSettingDebounced(DB_KEYS.DUTY_PHONES, initialDutyPhones);
    saveSettingDebounced(DB_KEYS.CN_GROUP_SCHEDULES, initialCNGroupSchedules);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* Global Sync Toast Notification */}
      {syncToastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 bg-cyan-700 text-white px-5 py-3 rounded-2xl shadow-2xl animate-fade-in text-xs sm:text-sm font-bold border border-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping"></span>
          {syncToastMessage}
        </div>
      )}

      {/* Header Bar */}
      <Header 
        view={view} 
        setView={setView} 
        onResetData={handleResetData}
        isCloudConnected={isCloudConnected}
        lastCloudSyncAt={lastCloudSyncAt}
      />

      {/* Main Workspace View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {view === 'user' ? (
          <UserView
            schedules={schedules}
            contacts={contacts}
            timeSlots={timeSlots}
            cnPosts={cnPosts}
            weeklyCNSchedule={weeklyCNSchedule}
            tasks={tasks}
            customRules={customRules}
            pathologistSchedules={pathologistSchedules}
            dutyPhones={dutyPhones}
            cnGroupSchedules={cnGroupSchedules}
            interns={interns}
            emergencyContacts={neonSettings.hotlines}
            internWardGroups={neonSettings.internWardGroups}
            sheetsConfig={sheetsConfig}
            onSyncSheets={() => handleSyncSheets()}
            isSyncingSheets={isSyncingSheets}
          />
        ) : (
          <AdminView
            schedules={schedules}
            setSchedules={setSchedules}
            contacts={contacts}
            setContacts={setContacts}
            timeSlots={timeSlots}
            setTimeSlots={setTimeSlots}
            cnPosts={cnPosts}
            setCnPosts={setCnPosts}
            weeklyCNSchedule={weeklyCNSchedule}
            setWeeklyCNSchedule={setWeeklyCNSchedule}
            tasks={tasks}
            setTasks={setTasks}
            customRules={customRules}
            setCustomRules={setCustomRules}
            interns={interns}
            setInterns={setInterns}
            pathologistSchedules={pathologistSchedules}
            setPathologistSchedules={setPathologistSchedules}
            sheetsConfig={sheetsConfig}
            setSheetsConfig={setSheetsConfig}
            dutyRoles={dutyRoles}
            setDutyRoles={setDutyRoles}
            dutyPhones={dutyPhones}
            setDutyPhones={setDutyPhones}
            cnGroupSchedules={cnGroupSchedules}
            setCnGroupSchedules={setCnGroupSchedules}
            emergencyContacts={neonSettings.hotlines}
            setEmergencyContacts={updateHotlines}
            internWardGroups={neonSettings.internWardGroups}
            setInternWardGroups={updateInternWardGroups}
            onSyncSheets={handleSyncSheets}
            isSyncingSheets={isSyncingSheets}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Modern System Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>병원 당직 콜 통합 세부 시스템 &copy; 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            {isCloudConnected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Neon 클라우드 DB 연동 중 (실시간)
              </span>
            ) : (
              <span className="text-slate-500">로컬 데이터 모드</span>
            )}
            <span>•</span>
            <span className="hover:text-slate-300 transition">보안 레벨: 최고 (SSL Encrypted)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
