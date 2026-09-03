import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Phone, PhoneCall, ShieldAlert, CheckCircle2, 
  Building2, FileText, Zap, ChevronRight, AlertTriangle, ExternalLink, RefreshCw
} from 'lucide-react';
import { 
  DEPARTMENTS, DepartmentType, WARD_OPTIONS, TASK_OPTIONS, emergencyContacts 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap, SearchResult 
} from '../types';
import { evaluateDutyRules, getLocalISOString } from '../utils/dutyRules';

interface UserViewProps {
  schedules: DateScheduleMap;
  contacts: ContactMap;
  timeSlots: TimeSlot[];
  cnPosts: CNPost[];
  weeklyCNSchedule: WeeklyCNScheduleMap;
}

export const UserView: React.FC<UserViewProps> = ({
  schedules,
  contacts,
  timeSlots,
  cnPosts,
  weeklyCNSchedule
}) => {
  const initialIso = getLocalISOString();
  const initialDate = initialIso.split('T')[0];
  const initialTime = initialIso.split('T')[1].substring(0, 5);

  const [selectedDept, setSelectedDept] = useState<DepartmentType>('내과');
  const [selectedWard, setSelectedWard] = useState<string>(WARD_OPTIONS['내과'][0]);
  const [selectedTask, setSelectedTask] = useState<string>(TASK_OPTIONS['내과'][0]);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // When Department changes, update ward & task defaults
  useEffect(() => {
    setSelectedWard(WARD_OPTIONS[selectedDept][0]);
    setSelectedTask(TASK_OPTIONS[selectedDept][0]);
  }, [selectedDept]);

  // Recalculate rules on any input change
  useEffect(() => {
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
      weeklyCNSchedule
    );
    setSearchResult(result);
  }, [selectedDept, selectedWard, selectedTask, selectedDate, selectedTime, schedules, contacts, cnPosts, timeSlots, weeklyCNSchedule]);

  const setToCurrentTime = () => {
    const iso = getLocalISOString();
    setSelectedDate(iso.split('T')[0]);
    setSelectedTime(iso.split('T')[1].substring(0, 5));
  };

  const applyPreset = (dept: DepartmentType, ward: string, taskIdx: number, timeStr?: string) => {
    setSelectedDept(dept);
    setTimeout(() => {
      setSelectedWard(ward);
      setSelectedTask(TASK_OPTIONS[dept][taskIdx] || TASK_OPTIONS[dept][0]);
      if (timeStr) setSelectedTime(timeStr);
    }, 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Quick Scenario Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          빠른 시나리오 프리셋:
        </span>
        <button
          onClick={() => applyPreset('내과', 'MICU', 0, '07:00')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🏥 평일 아침 MICU EKG(07시)
        </button>
        <button
          onClick={() => applyPreset('내과', '61병동', 1, '10:00')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🩸 61병동 정규 ABGA(10시)
        </button>
        <button
          onClick={() => applyPreset('비내과', 'SICU', 2, '23:30')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          🌙 야간 SICU 사망선언(23:30)
        </button>
        <button
          onClick={() => applyPreset('내과', '71병동', 2, '15:00')}
          className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-700/60 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-600/50 transition"
        >
          👩‍⚕️ 71병동 공통전담 술기(15시)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Filter Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 border border-slate-700/60 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                콜 대역 및 조건 선택
              </h2>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                실시간 평가
              </span>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. 진료과 구분
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`py-3 rounded-xl text-sm font-black transition-all duration-200 ${
                      selectedDept === dept
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Ward Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                2. 대상 병동 선택
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 font-bold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              >
                {WARD_OPTIONS[selectedDept].map((ward) => (
                  <option key={ward} value={ward} className="bg-slate-900 text-slate-100">
                    {ward}
                  </option>
                ))}
              </select>

              {/* Quick Ward Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {WARD_OPTIONS[selectedDept].slice(0, 6).map((ward) => (
                  <button
                    key={ward}
                    onClick={() => setSelectedWard(ward)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                      selectedWard === ward
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    {ward}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                3. 필요 수행 업무
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              >
                {TASK_OPTIONS[selectedDept].map((task) => (
                  <option key={task} value={task} className="bg-slate-900 text-slate-100 py-1">
                    {task}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  날짜
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 font-semibold text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    시간
                  </label>
                  <button
                    onClick={setToCurrentTime}
                    className="text-[10px] font-extrabold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800 hover:bg-cyan-900 transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    현재시간
                  </button>
                </div>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 font-semibold text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Search Result Display */}
        <div className="lg:col-span-7 space-y-6">
          {searchResult && (
            <div className="space-y-6">
              
              {/* Main Call Target Hero Card */}
              <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-300 ${
                searchResult.isRegularHours
                  ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 border-cyan-500/30'
                  : 'bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 border-purple-500/30'
              }`}>
                
                {/* Background Accent glow */}
                <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  searchResult.isRegularHours ? 'bg-cyan-400' : 'bg-purple-500'
                }`} />

                <div className="relative z-10 space-y-6">
                  
                  {/* Top Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md ${
                        searchResult.isRegularHours
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {searchResult.isRegularHours ? '정규 근무시간 배정 (08:00~17:00)' : '당직 근무시간 배정'}
                      </span>

                      <span className="bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                        {selectedDept} &gt; {selectedWard}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      {selectedDate} ({selectedTime})
                    </span>
                  </div>

                  {/* Role & Person Section */}
                  <div className="space-y-2">
                    <p className="text-sm font-bold tracking-wide text-cyan-400">
                      선택 조건 맞춤 Call 담당자:
                    </p>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        {searchResult.assignedPerson}
                      </h2>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-300 bg-slate-800/60 px-3.5 py-1 rounded-xl border border-slate-700/60">
                        {searchResult.assignedRole}
                      </span>
                    </div>

                    {/* Backup Role Info */}
                    {searchResult.backupRole && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>{searchResult.backupRole}</span>
                      </div>
                    )}
                  </div>

                  {/* Click-to-Call Action Buttons Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* UCAP Extension Call */}
                    <a
                      href={`tel:${searchResult.dutyUcap || searchResult.contactInfo.ucap}`}
                      className="group flex items-center justify-between bg-slate-800/90 hover:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-cyan-500/40 shadow-lg hover:border-cyan-400 transition-all transform hover:-translate-y-0.5 active:scale-98"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 block tracking-wider">
                          병동 내선 (UCAP) Call
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-wider group-hover:text-cyan-300">
                          {searchResult.dutyUcap || searchResult.contactInfo.ucap}
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-white transition">
                        <Phone className="w-6 h-6 text-cyan-400 group-hover:text-white" />
                      </div>
                    </a>

                    {/* Phone Call */}
                    <a
                      href={`tel:${searchResult.dutyPhone || searchResult.contactInfo.phone}`}
                      className="group flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-4 sm:p-5 rounded-2xl shadow-lg border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:scale-98"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-200 block tracking-wider">
                          {searchResult.dutyPhone ? '당직 전용 폰 / 공통 폰' : '개인 휴대폰 Call'}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white tracking-wider">
                          {searchResult.dutyPhone || searchResult.contactInfo.phone}
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-blue-600 transition">
                        <PhoneCall className="w-6 h-6 text-white group-hover:text-blue-600" />
                      </div>
                    </a>

                  </div>

                  {/* Special Clinical Rules Notice */}
                  {searchResult.notes && (
                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/40 text-xs sm:text-sm font-semibold flex items-start gap-3 text-amber-200">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-amber-300 block mb-0.5">특이사항 안내:</span>
                        <p>{searchResult.notes}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Emergency Quick Call Directory */}
              <div className="glass-panel rounded-3xl p-5 border border-slate-700/60 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    주요 긴급/야간 파트 핫라인
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    원클릭 연결
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.id}
                      href={`tel:${contact.ucap}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {contact.category}
                        </span>
                        <p className="text-xs font-bold text-slate-200 mt-1">{contact.name}</p>
                        <p className="text-sm font-black text-cyan-400">{contact.ucap}</p>
                      </div>
                      <Phone className="w-4 h-4 text-slate-500 hover:text-cyan-400 transition" />
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
