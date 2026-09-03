import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UserView } from './components/UserView';
import { AdminView } from './components/AdminView';
import { 
  initialSchedules, initialContacts, initialTimeSlots, 
  initialCNPosts, initialWeeklyCNSchedule, initialTasks, 
  initialCustomRules, initialInterns, initialPathologistSchedules
} from './data/initialData';
import { 
  DateScheduleMap, ContactMap, TimeSlot, CNPost, WeeklyCNScheduleMap,
  TaskItem, CustomRule, InternDoctor, PathologistSchedule 
} from './types';

const STORAGE_KEYS = {
  SCHEDULES: 'hcs_schedules_v1',
  CONTACTS: 'hcs_contacts_v1',
  TIME_SLOTS: 'hcs_time_slots_v1',
  CN_POSTS: 'hcs_cn_posts_v1',
  WEEKLY_CN: 'hcs_weekly_cn_v1',
  TASKS: 'hcs_tasks_v1',
  CUSTOM_RULES: 'hcs_custom_rules_v1',
  INTERNS: 'hcs_interns_v1',
  PATHOLOGISTS: 'hcs_pathologists_v1'
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
    return saved ? JSON.parse(saved) : initialTasks;
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

  // Sync state to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-white">
      
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
            <span className="hover:text-slate-300 transition">보안 레벨: 최고 (SSL Encrypted)</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition">로컬 데이터 자동동기화 활성화</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
