import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarIcon, Clock, Phone, User, Search, Settings, ShieldAlert, Activity, 
  PhoneCall, CheckCircle2, Plus, Trash2, Edit3, Grid, List, Users
} from 'lucide-react';

const DEPARTMENTS = ['내과', '비내과'];
const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const ROLES = {
  IM_1: '내과1 (인턴1)', IM_2: '내과2 (인턴2)',
  NON_IM_1: '비내과1 (당직인턴1)', NON_IM_2: '비내과2 (당직인턴2)', NON_IM_3: '비내과3 (당직인턴3)',
  COMMON_NURSE: '공통전담간호사', DUTY_NURSE: '당직 전담간호사', PATHOLOGIST: '임상병리사', INTERN: '해당과 인턴'
};

const DUTY_PHONES = {
  [ROLES.NON_IM_1]: '010-7628-5803',
  [ROLES.NON_IM_2]: '010-7624-5803',
  [ROLES.NON_IM_3]: '010-5794-4170'
};
const DUTY_UCAPS = {
  [ROLES.NON_IM_1]: '5-4080',
  [ROLES.NON_IM_2]: '5-4081',
  [ROLES.NON_IM_3]: '5-3499'
};

const WARD_OPTIONS = {
  '내과': ['MICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동'],
  '비내과': ['SICU', '분만장', 'NICU', '42병동', '61병동', '62병동', '71병동', '72병동', '81병동', '82병동', '92병동', '101병동', '102병동', '111병동', '112병동', '121병동']
};
// 전체 병동 리스트 (관리자 병동 할당용 중복 제거)
const ALL_WARDS = Array.from(new Set([...WARD_OPTIONS['내과'], ...WARD_OPTIONS['비내과']]));

const TASK_OPTIONS = {
  '내과': [
    '1. EKG(P), 수혈동의서, T-tube 교체, 사망선언', 
    '2. ABGA/Line 통한 채혈 및 Blood culture', 
    '3. 그외 술기 및 동의서', 
    '4. Primary Call'
  ],
  '비내과': [
    '1. EKG(P), 수혈동의서, T-tube 교체', 
    '2. ABGA/Line 통한 채혈 및 Blood culture', 
    '3. 통합의학과 사망선언', 
    '4. 주말 및 휴일_통합의학과 및 3단계 이상 sore Dx, 일요일_UR Op wx, Dressing, AN 마취동의서', 
    '5. 그외 술기 및 동의서'
  ]
};

const initialContacts = {
  '정소영': { phone: '개인폰', ucap: '52644' }, '전지연': { phone: '개인폰', ucap: '52642' },
  '이준재': { phone: '개인폰', ucap: '52606' }, '박신희': { phone: '개인폰', ucap: '52634' },
  '박수현': { phone: '개인폰', ucap: '52633' }, '신정민': { phone: '개인폰', ucap: '52637' },
  '신유경': { phone: '개인폰', ucap: '52636' }, '권민재': { phone: '개인폰', ucap: '52632' },
  '이태겸': { phone: '개인폰', ucap: '52641' }, '배규리': { phone: '개인폰', ucap: '52635' },
  '이상엽': { phone: '개인폰', ucap: '52605' }, '이창윤': { phone: '개인폰', ucap: '52607' },
  '천지원': { phone: '개인폰', ucap: '52608' }, '최남석': { phone: '개인폰', ucap: '52609' },
  '전하윤': { phone: '개인폰', ucap: '52643' }, '유성윤': { phone: '개인폰', ucap: '52604' },
  [ROLES.DUTY_NURSE]: { phone: '근무표 참조', ucap: '근무표 참조' },
  [ROLES.PATHOLOGIST]: { phone: '010-9907-8298(황예진)', ucap: '해당없음' },
  [ROLES.INTERN]: { phone: '근무표 참조', ucap: '근무표 참조' }
};

const initialSchedules = {
  '2026-09-02': { [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박신희', [ROLES.NON_IM_1]: '배규리', [ROLES.NON_IM_2]: '최남석', [ROLES.NON_IM_3]: '이태겸' },
  '2026-09-03': { [ROLES.IM_1]: '전지연', [ROLES.IM_2]: '이준재', [ROLES.NON_IM_1]: '이창윤', [ROLES.NON_IM_2]: '전하윤', [ROLES.NON_IM_3]: '천지원' },
  '2026-09-04': { [ROLES.IM_1]: '정소영', [ROLES.IM_2]: '박수현', [ROLES.NON_IM_1]: '신유경', [ROLES.NON_IM_2]: '권민재', [ROLES.NON_IM_3]: '이태겸' },
};

// 공통전담간호사 초기 셋업 데이터
const initialTimeSlots = [
  { id: 'ts_day', name: 'Day', start: '06:30', end: '14:30' },
  { id: 'ts_eve', name: 'Evening', start: '14:30', end: '22:00' },
  { id: 'ts_night', name: 'Night', start: '22:00', end: '06:30' } 
];

const initialCNPosts = Array.from({ length: 10 }, (_, i) => ({
  id: `CN${i + 1}`,
  name: `공통전담${i + 1}`,
  wards: i === 0 ? ['61병동', '62병동'] : (i === 1 ? ['71병동', '72병동'] : []), // 기본 예시 매핑
  phone: `010-1000-200${i}`,
  ucap: `530${i < 10 ? '0'+i : i}`
}));

const initialWeeklyCNSchedule = {};
for(let i=0; i<7; i++) {
  initialWeeklyCNSchedule[i] = {
    'ts_day': { 'CN1': '김데이', 'CN2': '박데이' },
    'ts_eve': { 'CN1': '이이브', 'CN2': '최이브' },
    'ts_night': { 'CN1': '정나잇', 'CN2': '강나잇' }
  };
}

const getLocalISOString = () => {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
};
const todayDateStr = getLocalISOString().split('T')[0];
if (!initialSchedules[todayDateStr]) {
    initialSchedules[todayDateStr] = initialSchedules['2026-09-03']; 
}

export default function HospitalCallRouter() {
  const [view, setView] = useState('user'); 
  const [adminTab, setAdminTab] = useState('schedules'); 
  const [adminCNSubTab, setAdminCNSubTab] = useState('timeslot');

  // Main Data States
  const [schedules, setSchedules] = useState(initialSchedules);
  const [contacts, setContacts] = useState(initialContacts);
  const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
  const [cnPosts, setCnPosts] = useState(initialCNPosts);
  const [weeklyCNSchedule, setWeeklyCNSchedule] = useState(initialWeeklyCNSchedule);

  // User View States
  const [selectedDept, setSelectedDept] = useState('내과');
  const [selectedWard, setSelectedWard] = useState('61병동');
  const [selectedTask, setSelectedTask] = useState(TASK_OPTIONS['내과'][0]);
  const [selectedDate, setSelectedDate] = useState(todayDateStr); 
  const [selectedTime, setSelectedTime] = useState(getLocalISOString().split('T')[1].substring(0, 5));
  
  const [searchResult, setSearchResult] = useState(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(1); 

  useEffect(() => {
    setSelectedWard(WARD_OPTIONS[selectedDept][0]);
    setSelectedTask(TASK_OPTIONS[selectedDept][0]);
  }, [selectedDept]);

  const setToCurrentTime = () => {
    const iso = getLocalISOString();
    setSelectedDate(iso.split('T')[0]);
    setSelectedTime(iso.split('T')[1].substring(0, 5));
  };

  const evaluateRules = () => {
    const dateObj = new Date(selectedDate);
    let dayOfWeek = dateObj.getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hour = parseInt(selectedTime.split(':')[0], 10);
    
    let isRegularHours = !isWeekend && (hour >= 8 && hour < 17);
    let assignedRole = null;
    let backupRole = '';
    let notes = '';

    const isTask = (keyword) => selectedTask.includes(keyword);

    // Rule 0: Pathologist Exceptions
    if (!isWeekend && hour >= 6 && hour < 8 && isTask('EKG(P)')) {
        assignedRole = ROLES.PATHOLOGIST;
        notes = '평일 06:00~08:00 정규 EKG(P)는 임상병리사 담당입니다.';
    } 
    // Rule 1: Internal Medicine (내과)
    else if (selectedDept === '내과') {
        if (isRegularHours) {
            if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
            else assignedRole = ROLES.INTERN;
        } else {
            const isNight = (hour >= 22 || hour < 8);
            if (selectedWard === 'MICU') {
                if (isTask('그외 술기')) assignedRole = isNight ? ROLES.IM_2 : ROLES.COMMON_NURSE;
                else assignedRole = ROLES.IM_1;
            } else if (['71', '72', '81', '101', '111', '112'].some(w => selectedWard.includes(w))) {
                if (isTask('그외 술기')) assignedRole = isNight ? ROLES.IM_2 : ROLES.COMMON_NURSE;
                else assignedRole = ROLES.IM_2;
            } else { 
                if (isTask('Primary Call') || isTask('ABGA')) assignedRole = ROLES.DUTY_NURSE;
                else if (isTask('EKG') || isTask('사망선언')) assignedRole = ROLES.IM_1;
                else if (isTask('그외 술기')) assignedRole = isNight ? ROLES.DUTY_NURSE : ROLES.COMMON_NURSE;
            }
        }
    } 
    // Rule 2: Non-Internal Medicine (비내과)
    else {
        const isGroup1 = ['SICU', '분만장', '42', '61', '62', 'NICU'].some(w => selectedWard.includes(w));
        if (isRegularHours) {
             if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
             else if (isTask('사망선언') || isTask('주말')) assignedRole = ROLES.NON_IM_1; 
             else {
                  assignedRole = isGroup1 ? ROLES.NON_IM_2 : ROLES.NON_IM_3;
                  backupRole = isGroup1 ? 'Back up: 1st 당직인턴1, 2nd 당직인턴3' : 'Back up: 당직인턴1';
             }
        } else {
            if (isTask('사망선언')) assignedRole = ROLES.NON_IM_2;
            else if (isTask('주말 및 휴일')) assignedRole = ROLES.NON_IM_1;
            else if (isTask('그외 술기')) assignedRole = ROLES.COMMON_NURSE;
            else { 
                if (isGroup1) {
                    assignedRole = ROLES.NON_IM_2;
                    backupRole = 'Back up: 1st 비내과1, 2nd 비내과3';
                } else {
                    assignedRole = ROLES.NON_IM_3;
                    backupRole = 'Back up: 비내과1 우선 call';
                }
            }
        }
    }

    let assignedPerson = '미배정(표 확인)';
    let contactInfo = { phone: '정보 없음', ucap: '정보 없음' };
    let dutyPhone = null;
    let dutyUcap = null;

    if (assignedRole === ROLES.COMMON_NURSE) {
      // 1. 선택된 병동을 담당하는 공통전담 포스트(CN1~10) 찾기
      const targetCN = cnPosts.find(cn => cn.wards.includes(selectedWard));
      
      // 2. 선택된 시간대에 해당하는 커스텀 타임슬롯 찾기
      let targetTimeSlot = null;
      let shiftDate = new Date(selectedDate);

      for (const slot of timeSlots) {
        const s = slot.start;
        const e = slot.end;
        if (s <= e) {
          if (selectedTime >= s && selectedTime < e) targetTimeSlot = slot;
        } else {
          // 야간 근무처럼 자정을 넘기는 경우 (예: 22:00 ~ 06:30)
          if (selectedTime >= s || selectedTime < e) {
            targetTimeSlot = slot;
            if (selectedTime < e) {
               shiftDate.setDate(shiftDate.getDate() - 1); // 새벽 시간은 전날 근무표 기준
            }
          }
        }
      }

      if (targetCN && targetTimeSlot) {
        const shiftDayOfWeek = shiftDate.getDay();
        const scheduleForDay = weeklyCNSchedule[shiftDayOfWeek] || {};
        const scheduleForSlot = scheduleForDay[targetTimeSlot.id] || {};
        const nurseName = scheduleForSlot[targetCN.id];

        assignedRole = `${targetCN.name} (${targetTimeSlot.name})`;
        assignedPerson = nurseName || '미배정(근무자 없음)';
        dutyPhone = targetCN.phone;
        dutyUcap = targetCN.ucap;
      } else {
        assignedRole = '공통전담간호사 (배정정보 없음)';
        assignedPerson = '당직표 확인 요망';
        notes = '해당 시간대나 병동에 관리자가 배정한 공통전담간호사 정보가 없습니다.';
      }
    } 
    else if (assignedRole) {
        // 인턴 및 기타 역할 해결
        const todaysSchedule = schedules[selectedDate];
        if (todaysSchedule && todaysSchedule[assignedRole]) {
            assignedPerson = todaysSchedule[assignedRole];
        }
        if ([ROLES.DUTY_NURSE, ROLES.PATHOLOGIST, ROLES.INTERN].includes(assignedRole)) {
            assignedPerson = assignedRole;
        }
        contactInfo = contacts[assignedPerson] || contactInfo;
        if (DUTY_PHONES[assignedRole]) {
            dutyPhone = DUTY_PHONES[assignedRole];
            dutyUcap = DUTY_UCAPS[assignedRole];
        }
    }

    setSearchResult({
        isRegularHours, assignedRole, assignedPerson, contactInfo, dutyPhone, dutyUcap, backupRole, notes
    });
  };

  useEffect(() => {
    evaluateRules();
  }, [selectedDept, selectedWard, selectedTask, selectedDate, selectedTime, schedules, contacts, cnPosts, timeSlots, weeklyCNSchedule]);

  const handleScheduleChange = (date, role, value) => {
    setSchedules(prev => ({ ...prev, [date]: { ...prev[date], [role]: value } }));
  };

  const addTimeSlot = () => {
    const newId = `ts_${Date.now()}`;
    setTimeSlots([...timeSlots, { id: newId, name: '새 시간대', start: '00:00', end: '00:00' }]);
  };
  const updateTimeSlot = (id, field, value) => {
    setTimeSlots(timeSlots.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
  };
  const removeTimeSlot = (id) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };
  
  const toggleWardForCN = (cnId, ward) => {
    setCnPosts(posts => posts.map(post => {
      if (post.id === cnId) {
        const hasWard = post.wards.includes(ward);
        return { ...post, wards: hasWard ? post.wards.filter(w => w !== ward) : [...post.wards, ward] };
      }
      return post;
    }));
  };
  const updateCNContact = (cnId, field, value) => {
    setCnPosts(posts => posts.map(post => post.id === cnId ? { ...post, [field]: value } : post));
  };

  const handleCNScheduleChange = (day, slotId, cnId, value) => {
    setWeeklyCNSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotId]: {
          ...(prev[day]?.[slotId] || {}),
          [cnId]: value
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 lg:pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600 w-5 h-5" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">당직 연락망</h1>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('user')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>간호사 뷰</button>
            <button onClick={() => setView('admin')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>관리자</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {view === 'user' && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">진료과</label>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {DEPARTMENTS.map(dept => (
                    <button key={dept} onClick={() => setSelectedDept(dept)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedDept === dept ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{dept}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">병동 선택</label>
                <select className="w-full p-3.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium shadow-sm" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                  {WARD_OPTIONS[selectedDept].map(ward => <option key={ward} value={ward}>{ward}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">필요 업무</label>
                <select className="w-full p-3.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium shadow-sm break-words whitespace-normal" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                  {TASK_OPTIONS[selectedDept].map(task => <option key={task} value={task}>{task}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1" /> 날짜</label>
                  <input type="date" className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div>
                   <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> 시간</label>
                    <button onClick={setToCurrentTime} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">현재</button>
                  </div>
                  <input type="time" className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/3">
              {searchResult && (
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><PhoneCall className="w-48 h-48 transform rotate-12" /></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {searchResult.isRegularHours ? '정규 시간 분배' : '당직 시간 분배'}
                      </span>
                    </div>
                    <div className="mb-8">
                      <p className="text-blue-200 font-medium text-sm mb-1">{searchResult.assignedRole}</p>
                      <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{searchResult.assignedPerson}</h2>
                      {searchResult.backupRole && <p className="text-yellow-300 text-sm font-bold mt-3 bg-black/20 inline-block px-3 py-1 rounded-lg">{searchResult.backupRole}</p>}
                    </div>
                    {/* Click-to-call implementation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                      <a href={`tel:${searchResult.dutyUcap || searchResult.contactInfo.ucap}`} className="flex items-center justify-between bg-white text-slate-900 p-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-0.5">내선 (UCAP)</p>
                          <p className="text-2xl font-black text-blue-600">{searchResult.dutyUcap || searchResult.contactInfo.ucap}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center"><Phone className="w-5 h-5 text-blue-600" /></div>
                      </a>
                      <a href={`tel:${searchResult.dutyPhone || searchResult.contactInfo.phone}`} className="flex items-center justify-between bg-blue-700/50 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl active:scale-95 transition-transform">
                        <div>
                          <p className="text-xs font-bold text-blue-200 mb-0.5">{searchResult.dutyPhone ? '당직폰/공통폰' : '개인폰'}</p>
                          <p className="text-xl font-bold tracking-wider">{searchResult.dutyPhone || searchResult.contactInfo.phone}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><PhoneCall className="w-5 h-5 text-white" /></div>
                      </a>
                    </div>
                    {searchResult.notes && (
                      <div className="mt-4 p-3 bg-black/20 rounded-xl text-sm font-medium flex items-start gap-2 border border-white/10 text-white">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                        <p>{searchResult.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {view === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
             <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                <Settings className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">시스템 관리</h2>
             </div>

             <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-100">
               <button onClick={() => setAdminTab('schedules')} className={`whitespace-nowrap px-4 py-2 font-bold text-sm rounded-lg ${adminTab === 'schedules' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>인턴 당직표</button>
               <button onClick={() => setAdminTab('contacts')} className={`whitespace-nowrap px-4 py-2 font-bold text-sm rounded-lg ${adminTab === 'contacts' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>연락망 관리</button>
               <button onClick={() => setAdminTab('common_nurse')} className={`whitespace-nowrap px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-1 ${adminTab === 'common_nurse' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-700'}`}>
                 <Users className="w-4 h-4"/> 공통전담간호 관리
               </button>
             </div>

             {adminTab === 'schedules' && (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                   <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                     <tr><th className="p-3">날짜</th><th className="p-3">내과1</th><th className="p-3">내과2</th><th className="p-3">비내과1</th><th className="p-3">비내과2</th><th className="p-3">비내과3</th></tr>
                   </thead>
                   <tbody>
                     {Object.entries(schedules).map(([date, roles]) => (
                       <tr key={date} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="p-3 font-semibold text-slate-900">{date}</td>
                         {[ROLES.IM_1, ROLES.IM_2, ROLES.NON_IM_1, ROLES.NON_IM_2, ROLES.NON_IM_3].map(role => (
                            <td key={role} className="p-2"><input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-medium" value={roles[role] || ''} onChange={(e) => handleScheduleChange(date, role, e.target.value)} /></td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}

             {adminTab === 'contacts' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(contacts).filter(([name]) => !['공통전담간호사', '당직 전담간호사', '임상병리사', '해당과 인턴'].includes(name)).map(([name, info]) => (
                    <div key={name} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <h4 className="font-bold text-slate-800 mb-3">{name}</h4>
                      <div className="space-y-2 text-sm">
                         <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-100"><span className="text-slate-500 font-bold">UCAP</span><span className="font-black text-blue-600">{info.ucap}</span></div>
                         <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-100"><span className="text-slate-500 font-bold">Phone</span><span className="font-bold text-slate-700">{info.phone}</span></div>
                      </div>
                    </div>
                  ))}
               </div>
             )}

             {}
             {adminTab === 'common_nurse' && (
               <div className="space-y-6">
                 {/* CN Sub Navigation */}
                 <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-4">
                   <button onClick={() => setAdminCNSubTab('timeslot')} className={`px-4 py-2 text-sm font-bold rounded-md transition-shadow ${adminCNSubTab === 'timeslot' ? 'bg-white text-blue-700 shadow' : 'text-slate-600'}`}>시간대 설정</button>
                   <button onClick={() => setAdminCNSubTab('wards')} className={`px-4 py-2 text-sm font-bold rounded-md transition-shadow ${adminCNSubTab === 'wards' ? 'bg-white text-blue-700 shadow' : 'text-slate-600'}`}>담당 병동 관리</button>
                   <button onClick={() => setAdminCNSubTab('schedule')} className={`px-4 py-2 text-sm font-bold rounded-md transition-shadow ${adminCNSubTab === 'schedule' ? 'bg-white text-blue-700 shadow' : 'text-slate-600'}`}>주간 근무표 설정</button>
                 </div>

                 {/* 1. Time Slot Management */}
                 {adminCNSubTab === 'timeslot' && (
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4"/> 근무 시간대 커스텀</h3>
                       <button onClick={addTimeSlot} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700"><Plus className="w-4 h-4"/> 추가</button>
                     </div>
                     <div className="space-y-3">
                       {timeSlots.map(slot => (
                         <div key={slot.id} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                           <input type="text" value={slot.name} onChange={(e) => updateTimeSlot(slot.id, 'name', e.target.value)} className="font-bold p-2 border border-slate-200 rounded w-32 outline-none focus:ring-1 focus:ring-blue-500" placeholder="예: Day"/>
                           <input type="time" value={slot.start} onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)} className="p-2 border border-slate-200 rounded w-32 outline-none"/>
                           <span className="font-bold text-slate-400">~</span>
                           <input type="time" value={slot.end} onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)} className="p-2 border border-slate-200 rounded w-32 outline-none"/>
                           <button onClick={() => removeTimeSlot(slot.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-auto"><Trash2 className="w-5 h-5"/></button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* 2. Ward Assignment */}
                 {adminCNSubTab === 'wards' && (
                   <div className="space-y-4">
                     {cnPosts.map(post => (
                       <div key={post.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 lg:items-start">
                         <div className="w-full lg:w-64 flex-shrink-0">
                           <h4 className="font-bold text-lg text-blue-700 mb-3">{post.name}</h4>
                           <div className="space-y-2 text-sm">
                             <div>
                               <label className="text-xs font-bold text-slate-500">전용 UCAP</label>
                               <input type="text" value={post.ucap} onChange={e => updateCNContact(post.id, 'ucap', e.target.value)} className="w-full p-2 border border-slate-200 rounded mt-1 font-bold text-blue-600 bg-slate-50 outline-none"/>
                             </div>
                             <div>
                               <label className="text-xs font-bold text-slate-500">전용 연락처</label>
                               <input type="text" value={post.phone} onChange={e => updateCNContact(post.id, 'phone', e.target.value)} className="w-full p-2 border border-slate-200 rounded mt-1 font-bold bg-slate-50 outline-none"/>
                             </div>
                           </div>
                         </div>
                         <div className="flex-grow border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                           <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Grid className="w-4 h-4"/> 담당 병동 지정 (다중선택 가능)</label>
                           <div className="flex flex-wrap gap-2">
                             {ALL_WARDS.map(ward => {
                               const isSelected = post.wards.includes(ward);
                               return (
                                 <button key={ward} onClick={() => toggleWardForCN(post.id, ward)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                                   {ward}
                                 </button>
                               )
                             })}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* 3. Weekly Schedule */}
                 {adminCNSubTab === 'schedule' && (
                   <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                     <div className="flex flex-wrap gap-2 mb-6">
                       {DAYS_OF_WEEK.map((day, idx) => (
                         <button key={idx} onClick={() => setSelectedDayOfWeek(idx)} className={`px-4 py-2 rounded-lg font-bold text-sm ${selectedDayOfWeek === idx ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                           {day}
                         </button>
                       ))}
                     </div>
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                         <thead className="bg-blue-50 text-blue-800 font-bold border-b-2 border-blue-200">
                           <tr>
                             <th className="p-3">포스트 (Post)</th>
                             {timeSlots.map(slot => (
                               <th key={slot.id} className="p-3 text-center">{slot.name} <br/><span className="text-xs font-normal text-blue-600">{slot.start}~{slot.end}</span></th>
                             ))}
                           </tr>
                         </thead>
                         <tbody>
                           {cnPosts.map(post => (
                             <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50">
                               <td className="p-3 font-bold text-slate-700">{post.name}</td>
                               {timeSlots.map(slot => (
                                 <td key={slot.id} className="p-2">
                                   <input 
                                     type="text" 
                                     placeholder="근무자명"
                                     value={weeklyCNSchedule[selectedDayOfWeek]?.[slot.id]?.[post.id] || ''}
                                     onChange={(e) => handleCNScheduleChange(selectedDayOfWeek, slot.id, post.id, e.target.value)}
                                     className="w-full p-2 border border-slate-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                   />
                                 </td>
                               ))}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}