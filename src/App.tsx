import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { 
  initialSchedules, initialContacts, initialTimeSlots, 
  initialCNPosts, initialWeeklyCNSchedule, initialTasks, 
  initialCustomRules, initialInterns, initialPathologistSchedules,
  initialDutyRoles, initialDutyPhones, initialCNGroupSchedules
} from './data/initialData';
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
  CN_GROUP_SCHEDULES: 'hcs_cn_group_schedules_v1'
};

export default function App() {
  const [view, setView] = useState<'user' | 'admin'>('user');

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

  // Sync state to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DUTY_ROLES, JSON.stringify(dutyRoles));
  }, [dutyRoles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DUTY_PHONES, JSON.stringify(dutyPhones));
  }, [dutyPhones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CN_GROUP_SCHEDULES, JSON.stringify(cnGroupSchedules));
  }, [cnGroupSchedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIME_SLOTS, JSON.stringify(timeSlots));
  }, [timeSlots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CN_POSTS, JSON.stringify(cnPosts));
  }, [cnPosts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_CN, JSON.stringify(weeklyCNSchedule));
  }, [weeklyCNSchedule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_RULES, JSON.stringify(customRules));
  }, [customRules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTERNS, JSON.stringify(interns));
  }, [interns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATHOLOGISTS, JSON.stringify(pathologistSchedules));
  }, [pathologistSchedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  // Google Sheets Sync Action
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

  // Periodic Auto-Sync Effect
  useEffect(() => {
    if (!sheetsConfig.enabled || !sheetsConfig.sheetUrl) return;

    // Initial sync on app start
    handleSyncSheets();

    // Auto-sync interval
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
      <Header view={view} setView={setView} onResetData={handleResetData} />

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
            {sheetsConfig.enabled ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                구글 시트 실시간 연동 활성
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
