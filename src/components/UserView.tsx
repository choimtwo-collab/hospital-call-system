import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Phone, PhoneCall, ShieldAlert, CheckCircle2, 
  Building2, FileText, Zap, ChevronRight, AlertTriangle, ExternalLink, 
  RefreshCw, Bookmark, BookmarkCheck, Search, Copy, Check, MessageSquare,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { 
  DEPARTMENTS, DepartmentType, WARD_OPTIONS, emergencyContacts 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, 
  SearchResult, TaskItem, CustomRule, PathologistSchedule 
} from '../types';
import { evaluateDutyRules, getLocalISOString } from '../utils/dutyRules';
import { checkKoreanHoliday } from '../utils/koreanHolidays';

interface UserViewProps {
  schedules: DateScheduleMap;
  contacts: ContactMap;
  timeSlots: TimeSlot[];
  cnPosts: CNPost[];
  weeklyCNSchedule: WeeklyCNScheduleMap;
  tasks: TaskItem[];
  customRules: CustomRule[];
  pathologistSchedules: PathologistSchedule[];
}

const MY_WARD_KEY = 'hcs_my_default_ward';

export const UserView: React.FC<UserViewProps> = ({
  schedules,
  contacts,
  timeSlots,
  cnPosts,
  weeklyCNSchedule,
  tasks,
  customRules,
  pathologistSchedules
}) => {
  const initialIso = getLocalISOString();
  const initialDate = initialIso.split('T')[0];
  const initialTime = initialIso.split('T')[1].substring(0, 5);

  const savedMyWard = localStorage.getItem(MY_WARD_KEY);

  const [selectedDept, setSelectedDept] = useState<DepartmentType>('내과');
  const [selectedWard, setSelectedWard] = useState<string>(
    savedMyWard || WARD_OPTIONS['내과'][0]
  );
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [myDefaultWard, setMyDefaultWard] = useState<string | null>(savedMyWard);

  // Filter tasks based on selected department and search query
  const availableTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchDept = t.dept === selectedDept || t.dept === 'ALL';
      const matchQuery = !taskSearchQuery || t.name.toLowerCase().includes(taskSearchQuery.toLowerCase());
      return matchDept && matchQuery;
    });
  }, [tasks, selectedDept, taskSearchQuery]);

  // Set default task when department changes
  useEffect(() => {
    const defaultTaskForDept = tasks.find(t => t.dept === selectedDept || t.dept === 'ALL');
    if (defaultTaskForDept) {
      setSelectedTask(defaultTaskForDept.name);
    }
  }, [selectedDept, tasks]);

  // Recalculate rules on any input change
  useEffect(() => {
    if (!selectedTask) return;
    const result = evaluateDutyRules(
      selectedDept,
      selectedWard,
      selectedTask,
      selectedDate,
      selectedTime,
      schedules,
      contacts,
      cnPosts,
      timeSlots,
      weeklyCNSchedule,
      customRules,
      pathologistSchedules
    );
    setSearchResult(result);
  }, [selectedDept, selectedWard, selectedTask, selectedDate, selectedTime, schedules, contacts, cnPosts, timeSlots, weeklyCNSchedule, customRules, pathologistSchedules]);

  const setToCurrentTime = () => {
    const iso = getLocalISOString();
    setSelectedDate(iso.split('T')[0]);
    setSelectedTime(iso.split('T')[1].substring(0, 5));
  };

  const toggleSaveDefaultWard = () => {
    if (myDefaultWard === selectedWard) {
      localStorage.removeItem(MY_WARD_KEY);
      setMyDefaultWard(null);
    } else {
      localStorage.setItem(MY_WARD_KEY, selectedWard);
      setMyDefaultWard(selectedWard);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const applyPreset = (dept: DepartmentType, ward: string, taskKeyword: string, timeStr?: string, dateStr?: string) => {
    setSelectedDept(dept);
    setSelectedWard(ward);
    if (timeStr) setSelectedTime(timeStr);
    if (dateStr) setSelectedDate(dateStr);
    const targetTask = tasks.find(t => (t.dept === dept || t.dept === 'ALL') && t.name.includes(taskKeyword));
    if (targetTask) setSelectedTask(targetTask.name);
  };

  const holidayInfo = checkKoreanHoliday(selectedDate);

  return (
    <div className="space-y-6">
      
      {/* Quick Scenario Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          3초 퀵 시나리오 프리셋:
        </span>
        <button
          onClick={() => applyPreset('내과', 'MICU', 'EKG', '07:00')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🏥 평일 아침 MICU EKG(07시)
        </button>
        <button
          onClick={() => applyPreset('내과', '61병동', 'ABGA', '10:00')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🩸 61병동 정규 ABGA(10시)
        </button>
        <button
          onClick={() => applyPreset('비내과', 'SICU', 'EKG', '23:30')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🌙 야간 SICU 술기(23:30)
        </button>
        <button
          onClick={() => applyPreset('비내과', '61병동', '통합의학과 사망선언')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          ⚠️ 통합의학과 사망선언
        </button>
        <button
          onClick={() => applyPreset('비내과', '71병동', '3단계 이상 sore', '14:00', '2026-09-06')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🩹 주말 sore 드레싱
        </button>
        <button
          onClick={() => applyPreset('비내과', '42병동', '응급수술 Assist')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🚨 응급수술 Assist
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Filter Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 border border-slate-700/60 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                호출 조건 설정
              </h2>
              <button
                onClick={setToCurrentTime}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                현재 시간 동기화
              </button>
            </div>

            {/* 1. Department Selector (내과계 vs 비내과계) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                1. 환자 주진료계열 <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 border ${
                      selectedDept === dept
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {dept}계열
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ward Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  2. 요청 병동 <span className="text-rose-400">*</span>
                </label>
                <button
                  onClick={toggleSaveDefaultWard}
                  className={`text-[11px] font-bold flex items-center gap-1 transition ${
                    myDefaultWard === selectedWard 
                      ? 'text-amber-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="이 병동을 내 기본 병동으로 저장합니다"
                >
                  {myDefaultWard === selectedWard ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      내 기본 병동 저장됨
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      내 병동으로 기억하기
                    </>
                  )}
                </button>
              </div>

              <select
                value={selectedWard}
                onChange={e => setSelectedWard(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {WARD_OPTIONS[selectedDept].map(ward => (
                  <option key={ward} value={ward}>
                    {ward} {myDefaultWard === ward ? '⭐ (내 기본 병동)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Task Selector with Search Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                3. 요청 업무 구분 <span className="text-rose-400">*</span>
              </label>

              {/* Task Autocomplete Search Box */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={e => setTaskSearchQuery(e.target.value)}
                  placeholder="업무 키워드 빠른 검색 (예: EKG, 사망, 드레싱 등)"
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {availableTasks.map(t => (
                  <option key={t.id} value={t.name}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date & Time Picker with Holiday Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  4. 호출 일시 <span className="text-rose-400">*</span>
                </label>
                {holidayInfo.isHoliday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    🎌 {holidayInfo.name} (공휴일)
                  </span>
                )}
                {!holidayInfo.isHoliday && holidayInfo.isWeekend && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    🏖️ {holidayInfo.dayOfWeekKorean} (주말)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Matched Call Destination Cards */}
        <div className="lg:col-span-7 space-y-5">
          {searchResult && (
            <>
              {/* Primary Call Destination Hero Card */}
              <div className="glass-panel rounded-3xl p-6 border-2 border-cyan-500/60 bg-gradient-to-b from-cyan-950/30 via-slate-900 to-slate-900 shadow-2xl space-y-5 relative overflow-hidden">
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      당직 매칭 성공 (최우선 연결)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {searchResult.ruleSource === 'DYNAMIC_RULE' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        커스텀 관리자 규칙 적용됨
                      </span>
                    )}

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      searchResult.isRegularHours
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {searchResult.isRegularHours ? '평일 정규근무 시간' : '정규 외/야간 당직근무'}
                    </span>
                  </div>
                </div>

                {/* Main Role & Person Title */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">최우선 호출 대상</div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {searchResult.assignedRole}
                    </h3>
                    <span className="text-lg sm:text-xl font-bold text-cyan-400">
                      {searchResult.assignedPerson}
                    </span>
                  </div>
                </div>

                {/* One-Click Call Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  
                  {/* UCAP Button */}
                  <a
                    href={`tel:${searchResult.dutyUcap || searchResult.contactInfo.ucap}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-xl shadow-cyan-500/25 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 text-slate-950" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-900">
                          병동 내선 (UCAP 즉시 콜)
                        </div>
                        <div className="text-lg font-black tracking-tight">
                          {searchResult.dutyUcap || searchResult.contactInfo.ucap}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </a>

                  {/* Phone Button */}
                  <a
                    href={`tel:${searchResult.dutyPhone || searchResult.contactInfo.phone}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white border border-slate-700 hover:border-cyan-500/50 shadow-lg transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          {selectedDept === '내과' ? '개인 휴대전화' : '공용 당직폰'}
                        </div>
                        <div className="text-base font-bold text-slate-100">
                          {searchResult.dutyPhone || searchResult.contactInfo.phone}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition text-slate-400" />
                  </a>

                </div>

                {/* DUMC Talk ID & Copy helpers */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>DUMC 톡 ID:</span>
                    <strong className="text-white font-bold">
                      {searchResult.contactInfo.dumcTalk || searchResult.assignedPerson}
                    </strong>
                  </div>

                  <button
                    onClick={() => copyToClipboard(
                      `${searchResult.assignedRole} ${searchResult.assignedPerson} (UCAP: ${searchResult.dutyUcap || searchResult.contactInfo.ucap})`,
                      'phone'
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] font-bold"
                  >
                    {copiedText === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        연락처 텍스트 복사
                      </>
                    )}
                  </button>
                </div>

                {/* Notes Alert Banner */}
                {searchResult.notes && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{searchResult.notes}</span>
                  </div>
                )}
              </div>

              {/* Backup Call Line Card (연락 두절 시 비상 백업) */}
              {searchResult.backupRole && (
                <div className="glass-panel rounded-3xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-slate-900 shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                      부재 시 백업 순위 (Backup Call Line)
                    </h4>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">
                    {searchResult.backupRole}
                  </p>

                  {/* Backup Quick Dial Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {searchResult.backupContact1 && (
                      <a
                        href={`tel:${searchResult.backupContact1.ucap}`}
                        className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <span className="text-[10px] text-amber-400 block font-bold">1순위 백업</span>
                          <span className="font-bold text-white">{searchResult.backupContact1.roleName}</span>
                        </div>
                        <span className="font-extrabold text-cyan-300">UCAP {searchResult.backupContact1.ucap}</span>
                      </a>
                    )}

                    {searchResult.backupContact2 && (
                      <a
                        href={`tel:${searchResult.backupContact2.ucap}`}
                        className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <span className="text-[10px] text-amber-400 block font-bold">2순위 백업</span>
                          <span className="font-bold text-white">{searchResult.backupContact2.roleName}</span>
                        </div>
                        <span className="font-extrabold text-cyan-300">UCAP {searchResult.backupContact2.ucap}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Emergency / Hotline Grid Cards */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-700/60 shadow-xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              주요 긴급 / 야간 파트 핫라인 다이얼
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {emergencyContacts.map(contact => (
                <a
                  key={contact.id}
                  href={`tel:${contact.ucap}`}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between"
                >
                  <div className="text-[10px] font-bold text-slate-500">{contact.dept}</div>
                  <div className="font-bold text-white truncate">{contact.name}</div>
                  <div className="text-xs font-black text-cyan-400 mt-1">UCAP {contact.ucap}</div>
                </a>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
