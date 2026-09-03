import React, { useState } from 'react';
import { 
  Settings, Users, Calendar, Phone, Plus, Trash2, Grid, Clock, 
  RotateCcw, Download, Upload, Save, CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { 
  ROLES, DAYS_OF_WEEK, ALL_WARDS 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap 
} from '../types';

interface AdminViewProps {
  schedules: DateScheduleMap;
  setSchedules: React.Dispatch<React.SetStateAction<DateScheduleMap>>;
  contacts: ContactMap;
  setContacts: React.Dispatch<React.SetStateAction<ContactMap>>;
  timeSlots: TimeSlot[];
  setTimeSlots: React.Dispatch<React.SetStateAction<TimeSlot[]>>;
  cnPosts: CNPost[];
  setCnPosts: React.Dispatch<React.SetStateAction<CNPost[]>>;
  weeklyCNSchedule: WeeklyCNScheduleMap;
  setWeeklyCNSchedule: React.Dispatch<React.SetStateAction<WeeklyCNScheduleMap>>;
  onResetData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  schedules, setSchedules,
  contacts, setContacts,
  timeSlots, setTimeSlots,
  cnPosts, setCnPosts,
  weeklyCNSchedule, setWeeklyCNSchedule,
  onResetData
}) => {
  const [adminTab, setAdminTab] = useState<'schedules' | 'contacts' | 'common_nurse' | 'data'>('schedules');
  const [adminCNSubTab, setAdminCNSubTab] = useState<'timeslot' | 'wards' | 'schedule'>('timeslot');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 1 = Monday
  const [newDateInput, setNewDateInput] = useState<string>('');
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactUcap, setNewContactUcap] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showSaveSuccess = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // --- Schedule Handlers ---
  const handleScheduleChange = (date: string, role: string, value: string) => {
    setSchedules(prev => ({
      ...prev,
      [date]: { ...prev[date], [role]: value }
    }));
  };

  const handleAddDate = () => {
    if (!newDateInput) return;
    if (schedules[newDateInput]) {
      alert('이미 존재하는 날짜입니다.');
      return;
    }
    setSchedules(prev => ({
      ...prev,
      [newDateInput]: {
        [ROLES.IM_1]: '', [ROLES.IM_2]: '',
        [ROLES.NON_IM_1]: '', [ROLES.NON_IM_2]: '', [ROLES.NON_IM_3]: ''
      }
    }));
    setNewDateInput('');
    showSaveSuccess('새 날짜 당직표 행이 추가되었습니다.');
  };

  const handleDeleteDate = (date: string) => {
    if (confirm(`${date} 당직표 항목을 삭제하시겠습니까?`)) {
      setSchedules(prev => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      showSaveSuccess('당직표 항목이 삭제되었습니다.');
    }
  };

  // --- Contact Handlers ---
  const handleContactChange = (name: string, field: 'phone' | 'ucap', value: string) => {
    setContacts(prev => ({
      ...prev,
      [name]: { ...prev[name], [field]: value }
    }));
  };

  const handleAddContact = () => {
    if (!newContactName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    setContacts(prev => ({
      ...prev,
      [newContactName.trim()]: {
        phone: newContactPhone.trim() || '010-0000-0000',
        ucap: newContactUcap.trim() || '50000'
      }
    }));
    setNewContactName('');
    setNewContactPhone('');
    setNewContactUcap('');
    showSaveSuccess('새 연락처가 등록되었습니다.');
  };

  const handleDeleteContact = (name: string) => {
    if (confirm(`'${name}' 연락처를 삭제하시겠습니까?`)) {
      setContacts(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      showSaveSuccess('연락처가 삭제되었습니다.');
    }
  };

  // --- Time Slot Handlers ---
  const addTimeSlot = () => {
    const newId = `ts_${Date.now()}`;
    setTimeSlots(prev => [...prev, { id: newId, name: '새 시간대', start: '00:00', end: '08:00' }]);
    showSaveSuccess('근무 시간대가 추가되었습니다.');
  };

  const updateTimeSlot = (id: string, field: 'name' | 'start' | 'end', value: string) => {
    setTimeSlots(prev => prev.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length <= 1) {
      alert('최소 1개 이상의 근무 시간대가 필요합니다.');
      return;
    }
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    showSaveSuccess('시간대가 삭제되었습니다.');
  };

  // --- CN Post Handlers ---
  const toggleWardForCN = (cnId: string, ward: string) => {
    setCnPosts(posts => posts.map(post => {
      if (post.id === cnId) {
        const hasWard = post.wards.includes(ward);
        return {
          ...post,
          wards: hasWard ? post.wards.filter(w => w !== ward) : [...post.wards, ward]
        };
      }
      return post;
    }));
  };

  const updateCNContact = (cnId: string, field: 'phone' | 'ucap' | 'name', value: string) => {
    setCnPosts(posts => posts.map(post => post.id === cnId ? { ...post, [field]: value } : post));
  };

  // --- Weekly CN Schedule Handlers ---
  const handleCNScheduleChange = (day: number, slotId: string, cnId: string, value: string) => {
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

  // --- Export / Import JSON ---
  const handleExportData = () => {
    const fullData = {
      schedules, contacts, timeSlots, cnPosts, weeklyCNSchedule
    };
    const jsonStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital_call_system_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.schedules && parsed.contacts && parsed.timeSlots && parsed.cnPosts && parsed.weeklyCNSchedule) {
          setSchedules(parsed.schedules);
          setContacts(parsed.contacts);
          setTimeSlots(parsed.timeSlots);
          setCnPosts(parsed.cnPosts);
          setWeeklyCNSchedule(parsed.weeklyCNSchedule);
          alert('데이터가 성공적으로 복원/업로드되었습니다.');
        } else {
          alert('올바르지 않은 백업 파일 형식입니다.');
        }
      } catch (err) {
        alert('JSON 파싱 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Filtered contacts list
  const filteredContacts = Object.entries(contacts).filter(([name]) => 
    !['공통전담간호사', '당직 전담간호사', '임상병리사', '해당과 인턴'].includes(name) &&
    (name.includes(searchTerm) || contacts[name].ucap.includes(searchTerm) || contacts[name].phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{saveToast}</span>
        </div>
      )}

      <div className="glass-panel rounded-3xl p-6 border border-slate-700/60 shadow-2xl space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">시스템 관리자 콘솔</h2>
              <p className="text-xs text-slate-400">당직표, 연락망, 공통전담간호 포스트 및 주간 근무표 통합 관리</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LocalStorage 자동 동기화 중
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setAdminTab('schedules')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              adminTab === 'schedules'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            인턴 당직표 관리
          </button>

          <button
            onClick={() => setAdminTab('contacts')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              adminTab === 'contacts'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            의료진 연락망 관리
          </button>

          <button
            onClick={() => setAdminTab('common_nurse')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              adminTab === 'common_nurse'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/80 text-cyan-400 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            공통전담간호 시스템
          </button>

          <button
            onClick={() => setAdminTab('data')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              adminTab === 'data'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            데이터 백업 &amp; 초기화
          </button>
        </div>

        {/* --- TAB 1: Intern Duty Schedule --- */}
        {adminTab === 'schedules' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-300">새 날짜 당직표 추가:</span>
                <input
                  type="date"
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddDate}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition shadow"
                >
                  추가
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                각 역할 셀에 담당 의사의 이름을 직접 입력하면 즉시 반영됩니다.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-800/90 text-slate-300 font-extrabold uppercase border-b border-slate-700">
                  <tr>
                    <th className="p-3.5 w-32">날짜</th>
                    <th className="p-3.5">내과1 (인턴1)</th>
                    <th className="p-3.5">내과2 (인턴2)</th>
                    <th className="p-3.5">비내과1 (당직1)</th>
                    <th className="p-3.5">비내과2 (당직2)</th>
                    <th className="p-3.5">비내과3 (당직3)</th>
                    <th className="p-3.5 w-16 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(schedules).map(([date, roles]) => (
                    <tr key={date} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-cyan-400 whitespace-nowrap">{date}</td>
                      {[ROLES.IM_1, ROLES.IM_2, ROLES.NON_IM_1, ROLES.NON_IM_2, ROLES.NON_IM_3].map(role => (
                        <td key={role} className="p-2">
                          <input
                            type="text"
                            value={roles[role] || ''}
                            onChange={(e) => handleScheduleChange(date, role, e.target.value)}
                            placeholder="의사 이름"
                            className="w-full p-2 bg-slate-900/90 border border-slate-700 rounded-xl text-center text-xs font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteDate(date)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-xl transition"
                          title="날짜 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: Contacts Management --- */}
        {adminTab === 'contacts' && (
          <div className="space-y-6">
            
            {/* Add Contact Card & Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              <div className="md:col-span-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">➕ 신규 의료진 연락처 추가</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="의료진 성명 (예: 김철수)"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="UCAP 내선 (예: 52600)"
                    value={newContactUcap}
                    onChange={(e) => setNewContactUcap(e.target.value)}
                    className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="휴대폰 (예: 010-1234-5678)"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  />
                </div>
                <button
                  onClick={handleAddContact}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition shadow"
                >
                  새 연락처 저장하기
                </button>
              </div>

              <div className="md:col-span-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-300">🔍 연락처 검색</span>
                <div className="relative mt-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="이름 또는 내선/전화번호..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  />
                </div>
              </div>

            </div>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(([name, info]) => (
                <div key={name} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base text-white">{name}</h4>
                    <button
                      onClick={() => handleDeleteContact(name)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="연락처 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 font-bold">UCAP 내선</span>
                      <input
                        type="text"
                        value={info.ucap}
                        onChange={(e) => handleContactChange(name, 'ucap', e.target.value)}
                        className="w-24 text-right bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-black text-cyan-400 outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 font-bold">휴대폰 번호</span>
                      <input
                        type="text"
                        value={info.phone}
                        onChange={(e) => handleContactChange(name, 'phone', e.target.value)}
                        className="w-36 text-right bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-200 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* --- TAB 3: Common Dedicated Nurse System --- */}
        {adminTab === 'common_nurse' && (
          <div className="space-y-6">
            
            {/* Sub-tab pills */}
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
              <button
                onClick={() => setAdminCNSubTab('timeslot')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  adminCNSubTab === 'timeslot' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. 근무 시간대 설정
              </button>
              <button
                onClick={() => setAdminCNSubTab('wards')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  adminCNSubTab === 'wards' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. 포스트별 담당 병동 지정
              </button>
              <button
                onClick={() => setAdminCNSubTab('schedule')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  adminCNSubTab === 'schedule' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. 주간 근무표 매트릭스
              </button>
            </div>

            {/* CN Subtab 1: Time Slot Settings */}
            {adminCNSubTab === 'timeslot' && (
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    커스텀 근무 시간대 커스터마이징
                  </h3>
                  <button
                    onClick={addTimeSlot}
                    className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow"
                  >
                    <Plus className="w-4 h-4" /> 시간대 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateTimeSlot(slot.id, 'name', e.target.value)}
                        className="font-bold p-2 bg-slate-800 border border-slate-700 rounded-lg w-36 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder="시간대명 (예: Day)"
                      />
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg w-32 text-xs text-white outline-none font-bold"
                      />
                      <span className="font-bold text-slate-500">~</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg w-32 text-xs text-white outline-none font-bold"
                      />
                      <button
                        onClick={() => removeTimeSlot(slot.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg ml-auto transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CN Subtab 2: Ward Allocation */}
            {adminCNSubTab === 'wards' && (
              <div className="space-y-4">
                {cnPosts.map((post) => (
                  <div key={post.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col lg:flex-row gap-6 lg:items-start">
                    
                    {/* Left Post Info */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-3">
                      <input
                        type="text"
                        value={post.name}
                        onChange={(e) => updateCNContact(post.id, 'name', e.target.value)}
                        className="text-base font-black text-cyan-400 bg-slate-900 border border-slate-700 rounded-xl p-2 w-full outline-none"
                      />

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">전용 UCAP 내선</label>
                          <input
                            type="text"
                            value={post.ucap}
                            onChange={(e) => updateCNContact(post.id, 'ucap', e.target.value)}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-cyan-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">전용 휴대폰</label>
                          <input
                            type="text"
                            value={post.phone}
                            onChange={(e) => updateCNContact(post.id, 'phone', e.target.value)}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-200 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Ward Multi-select */}
                    <div className="flex-grow border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Grid className="w-4 h-4 text-cyan-400" />
                        담당 병동 커스텀 지정 (클릭하여 켜기/끄기)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_WARDS.map((ward) => {
                          const isSelected = post.wards.includes(ward);
                          return (
                            <button
                              key={ward}
                              onClick={() => toggleWardForCN(post.id, ward)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                                isSelected
                                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {ward}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* CN Subtab 3: Weekly Schedule Matrix */}
            {adminCNSubTab === 'schedule' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
                
                {/* Day selector buttons */}
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayOfWeek(idx)}
                      className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition ${
                        selectedDayOfWeek === idx
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-105'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                    <thead className="bg-slate-800 text-cyan-300 font-extrabold border-b border-slate-700">
                      <tr>
                        <th className="p-3 w-36">포스트 (Post)</th>
                        {timeSlots.map((slot) => (
                          <th key={slot.id} className="p-3 text-center">
                            {slot.name} <br />
                            <span className="text-[10px] font-normal text-slate-400">{slot.start}~{slot.end}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {cnPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">{post.name}</td>
                          {timeSlots.map((slot) => (
                            <td key={slot.id} className="p-2">
                              <input
                                type="text"
                                placeholder="근무자 성명"
                                value={weeklyCNSchedule[selectedDayOfWeek]?.[slot.id]?.[post.id] || ''}
                                onChange={(e) => handleCNScheduleChange(selectedDayOfWeek, slot.id, post.id, e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-center font-bold text-white outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
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

        {/* --- TAB 4: Data Management & Backup --- */}
        {adminTab === 'data' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Backup / Export */}
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-base text-white">데이터 백업 내보내기 (JSON)</h3>
                    <p className="text-xs text-slate-400">현재 입력된 모든 당직표 및 연락처 데이터를 파일로 다운로드합니다.</p>
                  </div>
                </div>

                <button
                  onClick={handleExportData}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> JSON 백업 파일 다운로드
                </button>
              </div>

              {/* Restore / Import */}
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <Upload className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="font-extrabold text-base text-white">데이터 백업 불러오기 (JSON)</h3>
                    <p className="text-xs text-slate-400">기존에 저장한 JSON 파일을 선택하여 데이터를 복원합니다.</p>
                  </div>
                </div>

                <label className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" /> JSON 파일 업로드 선택
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>

            </div>

            {/* Factory Reset Danger Zone */}
            <div className="bg-red-950/30 p-6 rounded-2xl border border-red-900/50 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="font-extrabold text-base text-red-300">시스템 데이터 초기화 (Factory Reset)</h3>
                  <p className="text-xs text-red-400/80">
                    모든 변경 사항을 지우고 초기 데이터(병원 기본 세팅)로 즉시 복원합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm('정말로 모든 설정을 초기 상태로 리셋하시겠습니까? 데이터가 초기화됩니다.')) {
                    onResetData();
                    showSaveSuccess('모든 데이터가 초기 상태로 리셋되었습니다.');
                  }
                }}
                className="py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition shadow flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> 초기 데이터 세팅으로 전체 리셋
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
