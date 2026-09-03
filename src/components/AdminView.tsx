import React, { useState, useRef } from 'react';
import { 
  Settings, Users, Calendar, Phone, Plus, Trash2, Grid, Clock, 
  RotateCcw, Download, Upload, Save, CheckCircle2, AlertCircle, Search,
  FileSpreadsheet, Sliders, Tag, ArrowRight, Shield, ToggleLeft, ToggleRight,
  HelpCircle, ChevronDown, Sparkles, Filter, Edit3, X
} from 'lucide-react';
import { 
  ROLES, DAYS_OF_WEEK, ALL_WARDS, WARD_GROUPS 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap,
  TaskItem, CustomRule, InternDoctor, PathologistSchedule, TaskCategory 
} from '../types';
import { parseDutyExcel, generateSampleExcelBlob, ParsedDutyResult } from '../utils/excelParser';

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
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  customRules: CustomRule[];
  setCustomRules: React.Dispatch<React.SetStateAction<CustomRule[]>>;
  interns: InternDoctor[];
  setInterns: React.Dispatch<React.SetStateAction<InternDoctor[]>>;
  pathologistSchedules: PathologistSchedule[];
  setPathologistSchedules: React.Dispatch<React.SetStateAction<PathologistSchedule[]>>;
  onResetData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  schedules, setSchedules,
  contacts, setContacts,
  timeSlots, setTimeSlots,
  cnPosts, setCnPosts,
  weeklyCNSchedule, setWeeklyCNSchedule,
  tasks, setTasks,
  customRules, setCustomRules,
  interns, setInterns,
  pathologistSchedules, setPathologistSchedules,
  onResetData
}) => {
  const [adminTab, setAdminTab] = useState<'schedules' | 'tasks' | 'rules' | 'contacts' | 'common_nurse' | 'data'>('schedules');
  const [adminCNSubTab, setAdminCNSubTab] = useState<'timeslot' | 'wards' | 'schedule'>('timeslot');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 1 = Monday
  const [newDateInput, setNewDateInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 엑셀 업로드 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<ParsedDutyResult | null>(null);
  const [isExcelUploading, setIsExcelUploading] = useState(false);

  // 업무 마스터 신규 추가 폼 상태
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDept, setNewTaskDept] = useState<'내과' | '비내과' | 'ALL'>('내과');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('인턴 필수');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('ALL');

  // 규칙 빌더 신규 추가 모달/상태
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleFormName, setRuleFormName] = useState('');
  const [ruleFormDept, setRuleFormDept] = useState<'내과' | '비내과' | 'ALL'>('ALL');
  const [ruleFormWardGroup, setRuleFormWardGroup] = useState<string>('ALL');
  const [ruleFormTaskKeyword, setRuleFormTaskKeyword] = useState<string>('');
  const [ruleFormTimeCategory, setRuleFormTimeCategory] = useState<string>('ALL');
  const [ruleFormDayCategory, setRuleFormDayCategory] = useState<string>('ALL');
  const [ruleFormAssignedRole, setRuleFormAssignedRole] = useState<string>(ROLES.NON_IM_1);
  const [ruleFormBackupRole, setRuleFormBackupRole] = useState<string>('');
  const [ruleFormDutyPhone, setRuleFormDutyPhone] = useState<string>('');
  const [ruleFormDutyUcap, setRuleFormDutyUcap] = useState<string>('');
  const [ruleFormNotes, setRuleFormNotes] = useState<string>('');

  const showSaveSuccess = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // --- Excel Upload Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExcelUploading(true);
    const result = await parseDutyExcel(file);
    setIsExcelUploading(false);
    setExcelPreview(result);
  };

  const handleApplyExcelData = () => {
    if (!excelPreview || !excelPreview.success) return;
    setSchedules(prev => ({
      ...prev,
      ...excelPreview.schedules
    }));
    showSaveSuccess(`엑셀 데이터 ${excelPreview.rowCount}일치가 당직표에 성공적으로 반영되었습니다!`);
    setExcelPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSampleExcel = () => {
    const blob = generateSampleExcelBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '병원_당직표_표준템플릿.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    showSaveSuccess('엑셀 표준 템플릿 파일이 다운로드되었습니다.');
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

  // --- Task Master Handlers ---
  const handleAddTask = () => {
    if (!newTaskName.trim()) {
      alert('업무명을 입력해주세요.');
      return;
    }
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim(),
      dept: newTaskDept,
      category: newTaskCategory,
      description: newTaskDesc.trim() || undefined
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskDesc('');
    showSaveSuccess('새 업무가 마스터에 성공적으로 등록되었습니다.');
  };

  const handleDeleteTask = (id: string, name: string) => {
    if (confirm(`'${name}' 업무를 삭제하시겠습니까?`)) {
      setTasks(prev => prev.filter(t => t.id !== id));
      showSaveSuccess('업무가 삭제되었습니다.');
    }
  };

  // --- Rule Builder Handlers ---
  const handleCreateRule = () => {
    if (!ruleFormName.trim()) {
      alert('규칙 이름을 입력해주세요.');
      return;
    }

    const newRule: CustomRule = {
      id: `rule-${Date.now()}`,
      name: ruleFormName.trim(),
      enabled: true,
      priority: customRules.length + 1,
      condition: {
        department: ruleFormDept,
        wardGroup: ruleFormWardGroup === 'ALL' ? undefined : ruleFormWardGroup,
        taskKeywords: ruleFormTaskKeyword.trim() ? [ruleFormTaskKeyword.trim()] : undefined,
        timeCategory: ruleFormTimeCategory === 'ALL' ? undefined : (ruleFormTimeCategory as any),
        dayCategory: ruleFormDayCategory === 'ALL' ? undefined : (ruleFormDayCategory as any)
      },
      action: {
        assignedRole: ruleFormAssignedRole,
        backupRole: ruleFormBackupRole.trim() || undefined,
        dutyPhone: ruleFormDutyPhone.trim() || undefined,
        dutyUcap: ruleFormDutyUcap.trim() || undefined,
        notes: ruleFormNotes.trim() || undefined
      }
    };

    setCustomRules(prev => [...prev, newRule]);
    setIsRuleModalOpen(false);
    // Reset Form
    setRuleFormName('');
    setRuleFormTaskKeyword('');
    setRuleFormBackupRole('');
    setRuleFormDutyPhone('');
    setRuleFormDutyUcap('');
    setRuleFormNotes('');
    showSaveSuccess('새로운 동적 매칭 규칙이 생성되었습니다.');
  };

  const handleToggleRule = (id: string) => {
    setCustomRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    showSaveSuccess('규칙 활성화 상태가 변경되었습니다.');
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`'${name}' 규칙을 삭제하시겠습니까?`)) {
      setCustomRules(prev => prev.filter(r => r.id !== id));
      showSaveSuccess('규칙이 삭제되었습니다.');
    }
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === customRules.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...customRules];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    // Update priorities
    const updated = next.map((r, i) => ({ ...r, priority: i + 1 }));
    setCustomRules(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Save Success Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-cyan-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-fade-in text-sm font-bold border border-cyan-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          {saveToast}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setAdminTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'schedules'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          당직표 관리 & 엑셀 업로드
        </button>

        <button
          onClick={() => setAdminTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'tasks'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          업무 마스터 설정 ({tasks.length})
        </button>

        <button
          onClick={() => setAdminTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'rules'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          규칙 빌더 (Rule Builder) ({customRules.length})
        </button>

        <button
          onClick={() => setAdminTab('contacts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'contacts'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          의료진 & 임상병리사 연락망
        </button>

        <button
          onClick={() => setAdminTab('common_nurse')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'common_nurse'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          공통전담간호 근무 매트릭스
        </button>

        <button
          onClick={() => setAdminTab('data')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'data'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Download className="w-4 h-4" />
          데이터 백업 & 복원
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: SCHEDULES & EXCEL UPLOADER                                   */}
      {/* ==================================================================== */}
      {adminTab === 'schedules' && (
        <div className="space-y-6">
          
          {/* Excel / CSV Action Card */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 to-slate-900 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                  월간 인턴 당직표 엑셀/CSV 일괄 업로드
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  매월 초 배포되는 인턴 당직표 엑셀(.xlsx, .xls) 또는 CSV 파일을 업로드하면 날짜별 담당 인턴이 자동 파싱됩니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSampleExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  표준 템플릿 다운로드
                </button>

                <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold cursor-pointer shadow-lg shadow-cyan-500/20 transition">
                  <Upload className="w-4 h-4" />
                  {isExcelUploading ? '파일 파싱 중...' : '당직표 엑셀 파일 선택'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Excel Preview Modal / Alert */}
            {excelPreview && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">{excelPreview.message}</span>
                  </div>
                  <button onClick={() => setExcelPreview(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-slate-400 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">날짜</th>
                        <th className="p-2">내과1</th>
                        <th className="p-2">내과2</th>
                        <th className="p-2">비내과1</th>
                        <th className="p-2">비내과2</th>
                        <th className="p-2">비내과3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {excelPreview.dates.slice(0, 10).map(d => (
                        <tr key={d} className="hover:bg-slate-800/40">
                          <td className="p-2 text-cyan-300 font-bold">{d}</td>
                          <td className="p-2 text-slate-300">{excelPreview.schedules[d]?.[ROLES.IM_1]}</td>
                          <td className="p-2 text-slate-300">{excelPreview.schedules[d]?.[ROLES.IM_2]}</td>
                          <td className="p-2 text-slate-300">{excelPreview.schedules[d]?.[ROLES.NON_IM_1]}</td>
                          <td className="p-2 text-slate-300">{excelPreview.schedules[d]?.[ROLES.NON_IM_2]}</td>
                          <td className="p-2 text-slate-300">{excelPreview.schedules[d]?.[ROLES.NON_IM_3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setExcelPreview(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleApplyExcelData}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  >
                    당직표에 즉시 반영하기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grid View Table */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-cyan-400" />
                  일자별 인턴 당직표 수동 그리드 편집
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  셀을 직접 클릭하여 수정하거나, 날짜를 새로 추가/삭제할 수 있습니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDateInput}
                  onChange={e => setNewDateInput(e.target.value)}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddDate}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  행 추가
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/90 text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-32">일자</th>
                    <th className="p-3">내과1 (인턴1)</th>
                    <th className="p-3">내과2 (인턴2)</th>
                    <th className="p-3">비내과1 (당직인턴1)</th>
                    <th className="p-3">비내과2 (당직인턴2)</th>
                    <th className="p-3">비내과3 (당직인턴3)</th>
                    <th className="p-3 w-16 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {Object.keys(schedules).sort().map(date => (
                    <tr key={date} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-cyan-300 whitespace-nowrap">{date}</td>
                      {[ROLES.IM_1, ROLES.IM_2, ROLES.NON_IM_1, ROLES.NON_IM_2, ROLES.NON_IM_3].map(role => (
                        <td key={role} className="p-2">
                          <input
                            type="text"
                            value={schedules[date]?.[role] || ''}
                            onChange={e => handleScheduleChange(date, role, e.target.value)}
                            placeholder="당직자명"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:bg-slate-900"
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteDate(date)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TASK MASTER MANAGEMENT                                       */}
      {/* ==================================================================== */}
      {adminTab === 'tasks' && (
        <div className="space-y-6">
          {/* New Task Form */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              새로운 병원 업무 등록
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">업무 명칭</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  placeholder="예: 뇌척수액 검사 동의서, PICC 세척 등"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">진료계열</label>
                <select
                  value={newTaskDept}
                  onChange={e => setNewTaskDept(e.target.value as any)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="내과">내과</option>
                  <option value="비내과">비내과</option>
                  <option value="ALL">전체 (공통)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">업무 분류 카테고리</label>
                <select
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value as any)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="인턴 필수">인턴 필수</option>
                  <option value="공통 전담 지원">공통 전담 지원</option>
                  <option value="진료과 전담 전용">진료과 전담 전용</option>
                  <option value="특수 예외">특수 예외</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">상세 설명</label>
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  placeholder="설명 또는 주의사항"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddTask}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                업무 등록하기
              </button>
            </div>
          </div>

          {/* Task List Table */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-cyan-400" />
                  업무 마스터 목록 ({tasks.length}개)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  등록된 업무는 간호사 화면의 업무 선택 및 검색 드롭다운에 즉시 반영됩니다.
                </p>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['ALL', '인턴 필수', '공통 전담 지원', '진료과 전담 전용', '특수 예외'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTaskCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      taskCategoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'ALL' ? '전체 보기' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/90 text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-16">계열</th>
                    <th className="p-3">업무 명칭</th>
                    <th className="p-3 w-36">분류 태그</th>
                    <th className="p-3">상세 설명</th>
                    <th className="p-3 w-16 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {tasks
                    .filter(t => taskCategoryFilter === 'ALL' || t.category === taskCategoryFilter)
                    .map(task => (
                      <tr key={task.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            task.dept === '내과' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                            (task.dept === '비내과' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-700 text-slate-300')
                          }`}>
                            {task.dept}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white">{task.name}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            task.category === '인턴 필수' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            (task.category === '공통 전담 지원' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            (task.category === '진료과 전담 전용' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'))
                          }`}>
                            {task.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{task.description || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteTask(task.id, task.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: RULE BUILDER (IF-THEN RULE ENGINE)                           */}
      {/* ==================================================================== */}
      {adminTab === 'rules' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/10 to-slate-900 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  동적 규칙 빌더 (If-Then Rule Engine)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  병원의 당직 규칙이나 예외 지침이 변경될 때, <strong>코드 수정 없이 UI에서 직접 매칭 규칙을 커스텀</strong>할 수 있습니다.
                  위에서 아래 순서(우선순위)로 평가됩니다.
                </p>
              </div>

              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 transition"
              >
                <Plus className="w-4 h-4" />
                새 규칙 만들기
              </button>
            </div>
          </div>

          {/* Rule Cards List */}
          <div className="space-y-3">
            {customRules.map((rule, idx) => (
              <div
                key={rule.id}
                className={`p-5 rounded-3xl border transition ${
                  rule.enabled 
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-lg' 
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 font-extrabold text-xs flex items-center justify-center border border-slate-700">
                      #{rule.priority}
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        {rule.name}
                        {rule.enabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">활성</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500">비활성</span>
                        )}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveRule(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                      title="우선순위 올리기"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveRule(idx, 'down')}
                      disabled={idx === customRules.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                      title="우선순위 내리기"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title={rule.enabled ? '비활성화' : '활성화'}
                    >
                      {rule.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id, rule.name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      title="규칙 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* If-Then Visual Box */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                  {/* IF Conditions */}
                  <div className="md:col-span-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                      IF (일치 조건)
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {rule.condition.department && rule.condition.department !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">계열: {rule.condition.department}</span>
                      )}
                      {rule.condition.wardGroup && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">병동: {rule.condition.wardGroup}</span>
                      )}
                      {rule.condition.dayCategory && rule.condition.dayCategory !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">요일: {rule.condition.dayCategory}</span>
                      )}
                      {rule.condition.timeCategory && rule.condition.timeCategory !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">시간: {rule.condition.timeCategory}</span>
                      )}
                      {rule.condition.taskKeywords?.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">업무: "{kw}"</span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="md:col-span-1 flex justify-center text-slate-500">
                    <ArrowRight className="w-5 h-5 hidden md:block text-amber-400" />
                    <span className="md:hidden font-bold text-amber-400">⬇️</span>
                  </div>

                  {/* THEN Actions */}
                  <div className="md:col-span-6 p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                      THEN (도출 결과)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <strong className="text-white">담당 역할:</strong>
                        <span className="text-cyan-300 font-bold">{rule.action.assignedRole}</span>
                        {rule.action.dutyUcap && <span className="text-slate-400">(UCAP: {rule.action.dutyUcap})</span>}
                      </div>
                      {rule.action.backupRole && (
                        <div className="text-slate-400">
                          <strong className="text-slate-300">백업:</strong> {rule.action.backupRole}
                        </div>
                      )}
                      {rule.action.notes && (
                        <div className="text-slate-400 italic">
                          <strong className="text-slate-300">안내:</strong> {rule.action.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New Rule Modal */}
          {isRuleModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 bg-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    새로운 If-Then 매칭 규칙 정의
                  </h3>
                  <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 mb-1 block">규칙 명칭</label>
                    <input
                      type="text"
                      value={ruleFormName}
                      onChange={e => setRuleFormName(e.target.value)}
                      placeholder="예: 주말 특정 병동 예외 규칙"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="font-extrabold text-amber-400 block text-[11px]">조건 설정 (IF)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 mb-1 block">진료계열</label>
                        <select
                          value={ruleFormDept}
                          onChange={e => setRuleFormDept(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value="ALL">전체 (공통)</option>
                          <option value="내과">내과</option>
                          <option value="비내과">비내과</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 mb-1 block">병동 그룹</label>
                        <select
                          value={ruleFormWardGroup}
                          onChange={e => setRuleFormWardGroup(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value="ALL">전체 병동</option>
                          <option value="GROUP_A">그룹 A (42, 61, 62, 82, 92, 102, MICU)</option>
                          <option value="GROUP_B">그룹 B (71, 72, 81, 101, 111, 112)</option>
                          <option value="GROUP_C">그룹 C (SICU, 분만장, 42, 61, 62, NICU)</option>
                          <option value="GROUP_D">그룹 D (71, 72, 81, 82, 92, 101, 102, 111, 112, 121)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 mb-1 block">요일/공휴일 조건</label>
                        <select
                          value={ruleFormDayCategory}
                          onChange={e => setRuleFormDayCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value="ALL">상관없음</option>
                          <option value="WEEKDAY">평일만</option>
                          <option value="WEEKEND_HOLIDAY">주말 및 법정공휴일</option>
                          <option value="SUNDAY_ONLY">일요일만</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 mb-1 block">시간대 조건</label>
                        <select
                          value={ruleFormTimeCategory}
                          onChange={e => setRuleFormTimeCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value="ALL">상관없음</option>
                          <option value="REGULAR">정규 시간대 (08:00 ~ 17:00)</option>
                          <option value="NON_REGULAR">정규 시간 외 (17:00 ~ 익일 08:00)</option>
                          <option value="EVENING_17_22">이브닝 시간대 (17:00 ~ 22:00)</option>
                          <option value="NIGHT_22_08">야간 시간대 (22:00 ~ 08:00)</option>
                          <option value="MORNING_06_08">아침 시간대 (06:00 ~ 08:00)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-slate-400 mb-1 block">업무 키워드 매칭</label>
                        <input
                          type="text"
                          value={ruleFormTaskKeyword}
                          onChange={e => setRuleFormTaskKeyword(e.target.value)}
                          placeholder="예: 사망선언, sore 드레싱, 마취동의서 등"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                    <span className="font-extrabold text-cyan-400 block text-[11px]">도출 결과 (THEN)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 mb-1 block">담당 역할 지정</label>
                        <select
                          value={ruleFormAssignedRole}
                          onChange={e => setRuleFormAssignedRole(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value={ROLES.NON_IM_1}>비내과1 (당직인턴1)</option>
                          <option value={ROLES.NON_IM_2}>비내과2 (당직인턴2)</option>
                          <option value={ROLES.NON_IM_3}>비내과3 (당직인턴3)</option>
                          <option value={ROLES.IM_1}>내과1 (인턴1)</option>
                          <option value={ROLES.IM_2}>내과2 (인턴2)</option>
                          <option value={ROLES.COMMON_NURSE}>공통전담간호사</option>
                          <option value={ROLES.DUTY_NURSE}>당직 전담간호사</option>
                          <option value={ROLES.PATHOLOGIST}>임상병리사</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 mb-1 block">백업 순위 안내</label>
                        <input
                          type="text"
                          value={ruleFormBackupRole}
                          onChange={e => setRuleFormBackupRole(e.target.value)}
                          placeholder="예: 1순위 비내과1, 2순위 비내과2"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 mb-1 block">고정 당직폰 (선택)</label>
                        <input
                          type="text"
                          value={ruleFormDutyPhone}
                          onChange={e => setRuleFormDutyPhone(e.target.value)}
                          placeholder="예: 010-7628-5803"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 mb-1 block">고정 UCAP (선택)</label>
                        <input
                          type="text"
                          value={ruleFormDutyUcap}
                          onChange={e => setRuleFormDutyUcap(e.target.value)}
                          placeholder="예: 5-4080"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-slate-300 mb-1 block">주의사항 및 안내 문구</label>
                        <input
                          type="text"
                          value={ruleFormNotes}
                          onChange={e => setRuleFormNotes(e.target.value)}
                          placeholder="간호사 화면에 표시될 세부 안내 텍스트"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsRuleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateRule}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20"
                  >
                    규칙 추가 및 활성화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONTACTS & PATHOLOGIST SCHEDULE                              */}
      {/* ==================================================================== */}
      {adminTab === 'contacts' && (
        <div className="space-y-6">
          {/* Pathologist Schedules Section */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              임상병리사 정규 EKG 순환 일정 관리
            </h3>
            <p className="text-xs text-slate-400">
              평일 06:00 ~ 08:00 정규 EKG(P) 호출 시 매칭되는 임상병리사 담당자 기간별 스케줄입니다.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/90 text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">기간 (시작일 ~ 종료일)</th>
                    <th className="p-3">담당 임상병리사</th>
                    <th className="p-3">연락처 (휴대전화)</th>
                    <th className="p-3">원내 내선/UCAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {pathologistSchedules.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-cyan-300 font-bold">
                        {p.startDate} ~ {p.endDate}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={p.phone}
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, phone: val } : item));
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={p.ucap}
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, ucap: val } : item));
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intern Master Contacts */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-400" />
              인턴 마스터 & 개인 UCAP 연락처 매핑
            </h3>
            <p className="text-xs text-slate-400">
              내과계 인턴은 개인 UCAP 번호로 직접 다이얼되므로, 각 인턴의 개인 UCAP 번호가 정확해야 합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(contacts).filter(name => !name.includes('당직') && !name.includes('임상병리사') && !name.includes('해당과')).map(name => (
                <div key={name} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-xs">{name} (인턴)</span>
                    <span className="text-[10px] text-cyan-400 font-bold">UCAP: {contacts[name]?.ucap}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">개인 UCAP</label>
                      <input
                        type="text"
                        value={contacts[name]?.ucap || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setContacts(prev => ({
                            ...prev,
                            [name]: { ...prev[name], ucap: val }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">휴대전화</label>
                      <input
                        type="text"
                        value={contacts[name]?.phone || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setContacts(prev => ({
                            ...prev,
                            [name]: { ...prev[name], phone: val }
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COMMON NURSE SCHEDULE MATRIX                                 */}
      {/* ==================================================================== */}
      {adminTab === 'common_nurse' && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                공통전담간호사 근무 매트릭스 설정
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                요일별/시간대별(Day, Evening, Night) 전담간호사 배정 및 병동 포스트를 관리합니다.
              </p>
            </div>

            {/* Day of Week Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <button
                  key={dayName}
                  onClick={() => setSelectedDayOfWeek(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedDayOfWeek === idx
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dayName.substring(0, 1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/90 text-slate-300 font-bold">
                <tr>
                  <th className="p-3">담당 포스트</th>
                  <th className="p-3">관할 병동</th>
                  <th className="p-3">Day (06:30 ~ 14:30)</th>
                  <th className="p-3">Evening (14:30 ~ 22:00)</th>
                  <th className="p-3">Night (22:00 ~ 06:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {cnPosts.filter(p => p.wards.length > 0).map(post => (
                  <tr key={post.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-cyan-300 font-bold">
                      {post.name}
                      <span className="text-[10px] text-slate-500 block font-normal">UCAP: {post.ucap}</span>
                    </td>
                    <td className="p-3 text-slate-300">{post.wards.join(', ')}</td>
                    {['ts_day', 'ts_eve', 'ts_night'].map(tsId => (
                      <td key={tsId} className="p-2">
                        <input
                          type="text"
                          value={weeklyCNSchedule[selectedDayOfWeek]?.[tsId]?.[post.id] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setWeeklyCNSchedule(prev => ({
                              ...prev,
                              [selectedDayOfWeek]: {
                                ...prev[selectedDayOfWeek],
                                [tsId]: {
                                  ...(prev[selectedDayOfWeek]?.[tsId] || {}),
                                  [post.id]: val
                                }
                              }
                            }));
                          }}
                          placeholder="근무자명"
                          className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-slate-200"
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

      {/* ==================================================================== */}
      {/* TAB 6: DATA BACKUP & RESTORE                                        */}
      {/* ==================================================================== */}
      {adminTab === 'data' && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              전체 시스템 데이터 백업 & 초기화
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              현재 설정된 당직표, 업무 마스터, 동적 규칙, 연락망 전체를 JSON 파일로 백업하거나 복원할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const fullData = {
                  schedules, contacts, timeSlots, cnPosts, 
                  weeklyCNSchedule, tasks, customRules, interns, pathologistSchedules
                };
                const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hospital_call_system_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showSaveSuccess('전체 시스템 데이터가 성공적으로 백업 다운로드되었습니다.');
              }}
              className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition space-y-2 group"
            >
              <Download className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
              <h4 className="text-sm font-bold text-white">전체 백업 다운로드 (JSON)</h4>
              <p className="text-xs text-slate-400">당직표, 규칙, 마스터 데이터를 포함한 원클릭 백업 파일 생성</p>
            </button>

            <label className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition space-y-2 group cursor-pointer">
              <Upload className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
              <h4 className="text-sm font-bold text-white">백업 데이터 복원</h4>
              <p className="text-xs text-slate-400">이전에 저장한 백업 JSON 파일을 불러와 복원</p>
              <input
                type="file"
                accept=".json"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.schedules) setSchedules(data.schedules);
                      if (data.contacts) setContacts(data.contacts);
                      if (data.timeSlots) setTimeSlots(data.timeSlots);
                      if (data.cnPosts) setCnPosts(data.cnPosts);
                      if (data.weeklyCNSchedule) setWeeklyCNSchedule(data.weeklyCNSchedule);
                      if (data.tasks) setTasks(data.tasks);
                      if (data.customRules) setCustomRules(data.customRules);
                      if (data.interns) setInterns(data.interns);
                      if (data.pathologistSchedules) setPathologistSchedules(data.pathologistSchedules);
                      showSaveSuccess('백업 데이터가 성공적으로 복원되었습니다.');
                    } catch (err) {
                      alert('올바른 JSON 백업 파일이 아닙니다.');
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (confirm('정말로 모든 설정을 공장 초기값으로 초기화하시겠습니까? (이 작업은 되돌릴 수 없습니다.)')) {
                  onResetData();
                  showSaveSuccess('모든 시스템 데이터가 초기화되었습니다.');
                }
              }}
              className="p-5 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 hover:border-rose-500 text-left transition space-y-2 group"
            >
              <RotateCcw className="w-6 h-6 text-rose-400 group-hover:rotate-180 transition" />
              <h4 className="text-sm font-bold text-rose-300">공장 초기값으로 리셋</h4>
              <p className="text-xs text-rose-400/80">LocalStorage에 저장된 모든 사용자 설정을 초기 데이터로 복구</p>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
