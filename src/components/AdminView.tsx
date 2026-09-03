import React, { useState, useRef } from 'react';
import { 
  Settings, Users, Calendar, Phone, Plus, Trash2, Grid, Clock, 
  RotateCcw, Download, Upload, Save, CheckCircle2, AlertCircle, Search,
  FileSpreadsheet, Sliders, Tag, ArrowRight, Shield, ToggleLeft, ToggleRight,
  HelpCircle, ChevronDown, Sparkles, Filter, Edit3, X, RefreshCw, Building2
} from 'lucide-react';
import { 
  ROLES, DAYS_OF_WEEK, ALL_WARDS, WARD_GROUPS, getCNPostContact 
} from '../data/initialData';
import { 
  ContactMap, DateScheduleMap, TimeSlot, CNPost, WeeklyCNScheduleMap,
  TaskItem, CustomRule, InternDoctor, PathologistSchedule, TaskCategory, 
  DutyPhoneItem, CNGroupSchedule, CNShiftCell 
} from '../types';
import { parseDutyExcel, generateSampleExcelBlob, ParsedDutyResult } from '../utils/excelParser';
import { GoogleSheetsConfig } from '../utils/googleSheetsSync';
import { CalendarDutyView } from './CalendarDutyView';
import { getScheduleDoctor } from '../utils/dutyRules';

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
  sheetsConfig: GoogleSheetsConfig;
  setSheetsConfig: React.Dispatch<React.SetStateAction<GoogleSheetsConfig>>;
  dutyRoles: string[];
  setDutyRoles: React.Dispatch<React.SetStateAction<string[]>>;
  dutyPhones: DutyPhoneItem[];
  setDutyPhones: React.Dispatch<React.SetStateAction<DutyPhoneItem[]>>;
  cnGroupSchedules?: CNGroupSchedule[];
  setCnGroupSchedules?: React.Dispatch<React.SetStateAction<CNGroupSchedule[]>>;
  onSyncSheets: (customUrl?: string, customName?: string) => Promise<void>;
  isSyncingSheets: boolean;
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
  sheetsConfig, setSheetsConfig,
  dutyRoles, setDutyRoles,
  dutyPhones, setDutyPhones,
  cnGroupSchedules = [],
  setCnGroupSchedules,
  onSyncSheets, isSyncingSheets,
  onResetData
}) => {
  const [adminTab, setAdminTab] = useState<'schedules' | 'sheets' | 'tasks' | 'rules' | 'contacts' | 'common_nurse' | 'data'>('schedules');
  const [scheduleViewMode, setScheduleViewMode] = useState<'calendar' | 'list'>('calendar');
  const [dutyPhoneDeptFilter, setDutyPhoneDeptFilter] = useState<'ALL' | '내과' | '비내과'>('ALL');
  const [adminCNSubTab, setAdminCNSubTab] = useState<'schedule' | 'wards' | 'timeslot'>('schedule');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(cnGroupSchedules?.[0]?.id || 'cng-1');
  const [editingWardsPostId, setEditingWardsPostId] = useState<string | null>(null);
  const [editingGroupWardsId, setEditingGroupWardsId] = useState<string | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 1 = Monday
  const [newDateInput, setNewDateInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 공통전담 스케쥴 일괄 배정 도구 상태
  const [batchTargetGroup, setBatchTargetGroup] = useState<string>('ALL');
  const [batchTargetSlot, setBatchTargetSlot] = useState<string>('ALL');
  const [batchTargetDays, setBatchTargetDays] = useState<number[]>([1, 2, 3, 4, 5]); // 기본 평일(월~금)
  const [batchSelectedRole, setBatchSelectedRole] = useState<string>('공통전담 1');
  const [showBatchPanel, setShowBatchPanel] = useState<boolean>(true);

  // 구글 시트 연동 폼 상태
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(sheetsConfig.sheetUrl);
  const [sheetNameInput, setSheetNameInput] = useState<string>(sheetsConfig.sheetName || '당직표');
  const [autoSyncInput, setAutoSyncInput] = useState<number>(sheetsConfig.autoSyncMinutes || 5);

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

  // --- Pathologist Handlers ---
  const handleAddPathologistSchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    const newPath: PathologistSchedule = {
      id: `path-${Date.now()}`,
      startDate: today,
      endDate: today,
      dayType: 'WEEKDAY',
      startTime: '06:00',
      endTime: '08:00',
      name: '',
      phone: '',
      ucap: ''
    };
    setPathologistSchedules(prev => [...prev, newPath]);
    showSaveSuccess('새 임상병리사 순환 일정이 추가되었습니다.');
  };

  const handleDeletePathologistSchedule = (id: string) => {
    if (confirm('이 임상병리사 일정을 삭제하시겠습니까?')) {
      setPathologistSchedules(prev => prev.filter(p => p.id !== id));
      showSaveSuccess('임상병리사 일정이 삭제되었습니다.');
    }
  };

  // --- Duty Role (구분) Handlers ---
  const handleAddDutyRole = (roleName: string) => {
    setDutyRoles(prev => [...prev, roleName]);
    showSaveSuccess(`새 구분 '${roleName}'이(가) 추가되었습니다.`);
  };

  const handleDeleteDutyRole = (roleName: string) => {
    setDutyRoles(prev => prev.filter(r => r !== roleName));
    showSaveSuccess(`구분 '${roleName}'이(가) 삭제되었습니다.`);
  };

  const handleRenameDutyRole = (oldName: string, newName: string) => {
    setDutyRoles(prev => prev.map(r => r === oldName ? newName : r));
    setSchedules(prev => {
      const next = { ...prev };
      for (const d of Object.keys(next)) {
        if (next[d][oldName]) {
          next[d][newName] = next[d][oldName];
          delete next[d][oldName];
        }
      }
      return next;
    });
    showSaveSuccess(`구분명이 '${newName}'(으)로 변경되었습니다.`);
  };

  // --- Duty Phone (공용 당직폰) Handlers ---
  const handleAddDutyPhone = (deptCategory: '내과' | '비내과') => {
    const existingInDept = dutyPhones.filter(dp => dp.deptCategory === deptCategory);
    const nextNum = existingInDept.length + 1;
    const defaultRoleName = `${deptCategory} ${nextNum}`;
    const newPhone: DutyPhoneItem = {
      id: `dp-${deptCategory === '내과' ? 'im' : 'non'}-${Date.now()}`,
      deptCategory,
      roleName: defaultRoleName,
      phone: '',
      ucap: '',
      notes: deptCategory === '내과' ? '개인폰(UCAP) 기본 사용' : '당직폰'
    };
    setDutyPhones(prev => [...prev, newPhone]);
    showSaveSuccess(`새 ${deptCategory} 당직폰(${defaultRoleName})이 추가되었습니다.`);
  };

  const handleDeleteDutyPhone = (id: string, roleName: string) => {
    if (confirm(`'${roleName}' 당직폰 설정을 삭제하시겠습니까?`)) {
      setDutyPhones(prev => prev.filter(dp => dp.id !== id));
      showSaveSuccess(`'${roleName}' 당직폰이 삭제되었습니다.`);
    }
  };

  const handleUpdateDutyPhone = (id: string, field: keyof DutyPhoneItem, value: string) => {
    setDutyPhones(prev => prev.map(dp => dp.id === id ? { ...dp, [field]: value } : dp));
  };

  // --- Intern (전공의 개인폰/개인 UCAP) Handlers ---
  const handleAddIntern = (category: '내과' | '비내과') => {
    const newIntern: InternDoctor = {
      id: `int-${category === '내과' ? 'im' : 'non'}-${Date.now()}`,
      name: '',
      dept: category === '내과' ? 'IM' : 'GS',
      category,
      ucap: '',
      phone: ''
    };
    setInterns(prev => [...prev, newIntern]);
    showSaveSuccess(`새 ${category} 전공의 항목이 추가되었습니다.`);
  };

  const handleDeleteIntern = (id: string, name: string) => {
    if (confirm(`'${name || '전공의'}' 항목을 삭제하시겠습니까?`)) {
      setInterns(prev => prev.filter(item => item.id !== id));
      if (name) {
        setContacts(prev => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
      showSaveSuccess('전공의 항목이 삭제되었습니다.');
    }
  };

  const handleUpdateIntern = (id: string, field: keyof InternDoctor, value: string) => {
    setInterns(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, [field]: value } : item);
      const changedDoctor = updated.find(item => item.id === id);
      if (changedDoctor && changedDoctor.name) {
        setContacts(cPrev => ({
          ...cPrev,
          [changedDoctor.name]: {
            phone: changedDoctor.phone,
            ucap: changedDoctor.ucap,
            dumcTalk: `${changedDoctor.name}(인턴)`
          }
        }));
      }
      return updated;
    });
  };

  // --- Common Nurse Handlers ---
  const handleUpdateTimeSlot = (id: string, field: 'start' | 'end' | 'name', value: string) => {
    setTimeSlots(prev => prev.map(ts => ts.id === id ? { ...ts, [field]: value } : ts));
    showSaveSuccess('근무 시간대가 성공적으로 수정되었습니다.');
  };

  const handleAddCNPost = () => {
    const nextNum = cnPosts.length + 1;
    const newId = `CN${Date.now()}`;
    const newPost: CNPost = {
      id: newId,
      name: `공통전담${nextNum}`,
      wards: [],
      phone: `010-1000-20${nextNum < 10 ? '0' + nextNum : nextNum}`,
      ucap: `530${nextNum < 10 ? '0' + nextNum : nextNum}`,
      dumcTalk: `공통전담${nextNum}조`
    };
    setCnPosts(prev => [...prev, newPost]);
    showSaveSuccess(`새 공통전담 포스트(${newPost.name})가 추가되었습니다.`);
  };

  const handleDeleteCNPost = (id: string, name: string) => {
    if (confirm(`'${name}' 포스트를 삭제하시겠습니까?`)) {
      setCnPosts(prev => prev.filter(p => p.id !== id));
      showSaveSuccess(`'${name}' 포스트가 삭제되었습니다.`);
    }
  };

  const handleUpdateCNPost = (id: string, field: keyof CNPost, value: any) => {
    setCnPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleToggleWardForPost = (postId: string, ward: string) => {
    setCnPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const exists = p.wards.includes(ward);
      const updatedWards = exists ? p.wards.filter(w => w !== ward) : [...p.wards, ward];
      return { ...p, wards: updatedWards };
    }));
  };

  // --- Image 2 Timetable (CNGroupSchedule) Handlers ---
  const handleUpdateCNGroupCell = (groupId: string, timeSlotId: string, dayOfWeek: number, field: keyof CNShiftCell, value: string) => {
    if (!setCnGroupSchedules) return;
    setCnGroupSchedules(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const currentSlot = group.schedule[timeSlotId] || {};
      const currentCell = currentSlot[dayOfWeek] || { role: '', ucap: '' };
      
      const updatedCell = {
        ...currentCell,
        [field]: value
      };

      if (field === 'role') {
        const contact = getCNPostContact(value, cnPosts);
        updatedCell.ucap = contact.ucap;
        updatedCell.phone = contact.phone;
      }

      return {
        ...group,
        schedule: {
          ...group.schedule,
          [timeSlotId]: {
            ...currentSlot,
            [dayOfWeek]: updatedCell
          }
        }
      };
    }));
  };

  const handleBatchFill = (
    targetGroupIds: string[],
    targetSlotIds: string[],
    targetDays: number[],
    roleName: string
  ) => {
    if (!setCnGroupSchedules) return;
    const finalRole = roleName === 'CLEAR' ? '' : roleName;
    const contact = getCNPostContact(finalRole, cnPosts);

    setCnGroupSchedules(prev => prev.map(grp => {
      if (targetGroupIds.length > 0 && !targetGroupIds.includes(grp.id)) return grp;

      const newSchedule = { ...grp.schedule };
      targetSlotIds.forEach(slotId => {
        const slotCells = { ...(newSchedule[slotId] || {}) };
        targetDays.forEach(day => {
          slotCells[day] = {
            role: finalRole,
            ucap: contact.ucap,
            phone: contact.phone
          };
        });
        newSchedule[slotId] = slotCells;
      });

      return {
        ...grp,
        schedule: newSchedule
      };
    }));

    showSaveSuccess(`${finalRole ? finalRole + '이(가)' : '근무자가'} 일괄 배정되었습니다.`);
  };

  const handleUpdateCNGroupTitle = (groupId: string, newTitle: string) => {
    if (!setCnGroupSchedules) return;
    setCnGroupSchedules(prev => prev.map(g => g.id === groupId ? { ...g, title: newTitle } : g));
  };

  const handleToggleWardForGroup = (groupId: string, ward: string) => {
    if (!setCnGroupSchedules) return;
    setCnGroupSchedules(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const exists = g.wards.includes(ward);
      return {
        ...g,
        wards: exists ? g.wards.filter(w => w !== ward) : [...g.wards, ward]
      };
    }));
  };

  const handleAddCNGroup = () => {
    if (!setCnGroupSchedules) return;
    const nextNum = (cnGroupSchedules?.length || 0) + 1;
    const newId = `cng-${Date.now()}`;
    const newGroup: CNGroupSchedule = {
      id: newId,
      title: `공통 전담간호사 ${nextNum}조 근무`,
      wards: [],
      dayTypes: { 1: '공휴일-정상진료', 2: '공휴일-정상진료', 3: '공휴일-정상진료', 4: '공휴일-정상진료', 5: '공휴일-정상진료', 6: '공휴일', 0: '공휴일' },
      schedule: {
        'ts_day': {
          1: { role: '공통전담 1', ucap: '53001' }, 2: { role: '공통전담 1', ucap: '53001' }, 3: { role: '공통전담 1', ucap: '53001' },
          4: { role: '공통전담 1', ucap: '53001' }, 5: { role: '공통전담 1', ucap: '53001' }, 6: { role: '공통전담 1', ucap: '53001' }, 0: { role: '공통전담 1', ucap: '53001' }
        },
        'ts_eve': {
          1: { role: '공통전담 2', ucap: '53002' }, 2: { role: '공통전담 2', ucap: '53002' }, 3: { role: '공통전담 2', ucap: '53002' },
          4: { role: '공통전담 2', ucap: '53002' }, 5: { role: '공통전담 2', ucap: '53002' }, 6: { role: '공통전담 2', ucap: '53002' }, 0: { role: '공통전담 2', ucap: '53002' }
        },
        'ts_night': {
          1: { role: '공통전담 3', ucap: '53003' }, 2: { role: '공통전담 3', ucap: '53003' }, 3: { role: '공통전담 3', ucap: '53003' },
          4: { role: '공통전담 3', ucap: '53003' }, 5: { role: '공통전담 3', ucap: '53003' }, 6: { role: '공통전담 3', ucap: '53003' }, 0: { role: '공통전담 3', ucap: '53003' }
        }
      }
    };
    setCnGroupSchedules(prev => [...prev, newGroup]);
    setSelectedGroupId(newId);
    showSaveSuccess(`새 근무표 그룹(${newGroup.title})이 추가되었습니다.`);
  };

  const handleDeleteCNGroup = (groupId: string, title: string) => {
    if (!setCnGroupSchedules) return;
    if (confirm(`'${title}' 근무표 그룹을 삭제하시겠습니까?`)) {
      setCnGroupSchedules(prev => prev.filter(g => g.id !== groupId));
      const remaining = cnGroupSchedules?.filter(g => g.id !== groupId) || [];
      if (remaining.length > 0) setSelectedGroupId(remaining[0].id);
      showSaveSuccess('근무표 그룹이 삭제되었습니다.');
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
          onClick={() => setAdminTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            adminTab === 'sheets'
              ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          구글 시트 실시간 연동
          {sheetsConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
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

          {/* Schedule View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setScheduleViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition ${
                  scheduleViewMode === 'calendar'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                달력형 주차별 뷰 (이미지 1 스타일)
              </button>

              <button
                onClick={() => setScheduleViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition ${
                  scheduleViewMode === 'list'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                일자별 수직 목록 뷰
              </button>
            </div>

            <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {scheduleViewMode === 'calendar' 
                  ? '구분(내과1, 2, 비내과1...)을 자유롭게 추가/삭제하고 각 일자별 당직자를 직접 입력합니다.' 
                  : '날짜별 행 단위로 확인하고 날짜를 추가/삭제합니다.'}
              </span>
            </div>
          </div>

          {/* 1. CALENDAR VIEW (IMAGE 1 STYLE) */}
          {scheduleViewMode === 'calendar' ? (
            <CalendarDutyView
              schedules={schedules}
              onScheduleChange={handleScheduleChange}
              dutyRoles={dutyRoles}
              onAddRole={handleAddDutyRole}
              onDeleteRole={handleDeleteDutyRole}
              onRenameRole={handleRenameDutyRole}
            />
          ) : (
            /* 2. LIST VIEW (ORIGINAL TABLE) */
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
                      <th className="p-3 w-14 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {Object.keys(schedules).sort().map(date => (
                      <tr key={date} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-cyan-400 font-mono font-bold whitespace-nowrap">{date}</td>
                        {[ROLES.IM_1, ROLES.IM_2, ROLES.NON_IM_1, ROLES.NON_IM_2, ROLES.NON_IM_3].map(role => (
                          <td key={role} className="p-2">
                            <input
                              type="text"
                              value={schedules[date]?.[role] || getScheduleDoctor(schedules[date], role) || ''}
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
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB: GOOGLE SHEETS LIVE SYNC                                        */}
      {/* ==================================================================== */}
      {adminTab === 'sheets' && (
        <div className="space-y-6">
          
          {/* Header Hero Card */}
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  구글 스프레드시트(Google Sheets) 실시간 연동
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  병원에서 관리하는 <strong>구글 시트의 링크</strong>만 등록해 두면, 관리자가 웹 화면에 들어올 필요 없이 평소처럼 <strong>구글 시트에서 당직자 이름을 수정하는 즉시 모든 병동 PC/모바일 간호사 화면에 최신 당직표가 실시간으로 자동 동기화</strong>됩니다.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shrink-0">
                <span className={`w-3 h-3 rounded-full ${sheetsConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">실시간 연동 상태</div>
                  <div className={`text-xs font-black ${sheetsConfig.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {sheetsConfig.enabled ? '활성화 (실시간 자동 갱신)' : '비활성화 (로컬 모드)'}
                  </div>
                </div>
              </div>
            </div>

            {sheetsConfig.lastSyncedAt && (
              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>마지막 성공 동기화 시각: <strong className="text-white">{sheetsConfig.lastSyncedAt}</strong></span>
              </div>
            )}
          </div>

          {/* Sync Setting Form Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-5">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              구글 시트 연동 설정
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              
              {/* Sheet URL Input */}
              <div className="md:col-span-8 space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  1. 구글 스프레드시트 공유 링크(URL) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={e => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
                <span className="text-[11px] text-slate-500 block">
                  브라우저 주소창의 구글 시트 주소 전체를 그대로 복사하여 붙여넣으시면 됩니다.
                </span>
              </div>

              {/* Sheet Name Input */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  2. 시트(탭) 이름
                </label>
                <input
                  type="text"
                  value={sheetNameInput}
                  onChange={e => setSheetNameInput(e.target.value)}
                  placeholder="예: 당직표"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[11px] text-slate-500 block">
                  구글 시트 하단 탭 이름 (기본값: 당직표)
                </span>
              </div>

              {/* Auto Sync Interval */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  3. 자동 동기화 주기 (주기적 새로고침)
                </label>
                <select
                  value={autoSyncInput}
                  onChange={e => setAutoSyncInput(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value={1}>1분마다 자동 새로고침 (가장 빠름)</option>
                  <option value={3}>3분마다 자동 새로고침</option>
                  <option value={5}>5분마다 자동 새로고침 (추천)</option>
                  <option value={10}>10분마다 자동 새로고침</option>
                  <option value={30}>30분마다 자동 새로고침</option>
                </select>
                <span className="text-[11px] text-slate-500 block">
                  모든 간호사 브라우저에서 지정한 주기마다 구글 시트 최신 데이터를 백그라운드로 가져옵니다.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-6 flex flex-col justify-end gap-2 pt-2 sm:pt-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!sheetUrlInput.trim()) {
                        alert('구글 시트 URL을 입력해주세요.');
                        return;
                      }
                      onSyncSheets(sheetUrlInput.trim(), sheetNameInput.trim());
                      setSheetsConfig(prev => ({
                        ...prev,
                        enabled: true,
                        sheetUrl: sheetUrlInput.trim(),
                        sheetName: sheetNameInput.trim(),
                        autoSyncMinutes: autoSyncInput
                      }));
                      showSaveSuccess('구글 시트와 연동되어 최신 당직표를 성공적으로 가져왔습니다!');
                    }}
                    disabled={isSyncingSheets}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    {isSyncingSheets ? '연동 테스트 중...' : '지금 연동 테스트 및 즉시 가져오기'}
                  </button>

                  <button
                    onClick={() => {
                      const nextState = !sheetsConfig.enabled;
                      setSheetsConfig(prev => ({ ...prev, enabled: nextState }));
                      showSaveSuccess(nextState ? '구글 시트 자동 동기화가 켜졌습니다.' : '구글 시트 자동 동기화가 꺼졌습니다.');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                      sheetsConfig.enabled
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {sheetsConfig.enabled ? '연동 끄기' : '연동 켜기'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 3-Step Setup Guide Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              구글 시트 1분 연동 3단계 안내
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                  1
                </span>
                <h5 className="font-bold text-white">구글 시트 생성 또는 열기</h5>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  구글 드라이브에서 새 스프레드시트를 만들고, 맨 아래 탭 이름을 <strong>'당직표'</strong>로 지정합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                  2
                </span>
                <h5 className="font-bold text-white">공유 권한 설정 (핵심!)</h5>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  우측 상단 <strong>[공유]</strong> 버튼 클릭 ➡️ 일반 액세스를 <strong>'링크가 있는 모든 사용자' (역할: 뷰어)</strong>로 변경 후 완료합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                  3
                </span>
                <h5 className="font-bold text-white">주소 붙여넣고 동기화</h5>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  웹 브라우저 주소창 링크를 복사하여 위의 1번 입력란에 붙여넣고 <strong>[연동 테스트 및 즉시 가져오기]</strong>를 누르면 끝입니다!
                </p>
              </div>

            </div>
          </div>

          {/* Standard Format Guide Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              구글 시트 권장 열(Column) 구성
            </h4>
            <p className="text-xs text-slate-400">
              구글 시트 1행(헤더)에 아래 순서로 작성하시면 시스템이 자동으로 정확하게 인식합니다:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5">A열: 날짜</th>
                    <th className="p-2.5">B열: 내과1</th>
                    <th className="p-2.5">C열: 내과2</th>
                    <th className="p-2.5">D열: 비내과1</th>
                    <th className="p-2.5">E열: 비내과2</th>
                    <th className="p-2.5">F열: 비내과3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-cyan-300 font-bold">2026-09-01</td>
                    <td className="p-2.5">이준재</td>
                    <td className="p-2.5">정소영</td>
                    <td className="p-2.5">신정민</td>
                    <td className="p-2.5">이창윤</td>
                    <td className="p-2.5">배규리</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-cyan-300 font-bold">2026-09-02</td>
                    <td className="p-2.5">정소영</td>
                    <td className="p-2.5">박신희</td>
                    <td className="p-2.5">배규리</td>
                    <td className="p-2.5">최남석</td>
                    <td className="p-2.5">이태겸</td>
                  </tr>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  임상병리사 정규 EKG 순환 일정 관리
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  기간(시작일~종료일), 근무 구분(평일/공휴일/매일), 담당 시간대(시작~종료)를 관리자가 직접 조정할 수 있습니다.
                </p>
              </div>

              <button
                onClick={handleAddPathologistSchedule}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                순환 일정 추가
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/90 text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 min-w-[250px]">기간 (시작일 ~ 종료일)</th>
                    <th className="p-3 w-32">근무 구분</th>
                    <th className="p-3 min-w-[170px]">시간대 (시작 ~ 종료)</th>
                    <th className="p-3 w-28">담당 임상병리사</th>
                    <th className="p-3 w-36">연락처 (휴대전화)</th>
                    <th className="p-3 w-28">원내 내선/UCAP</th>
                    <th className="p-3 w-14 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {pathologistSchedules.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* 기간 (시작일 ~ 종료일) */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={p.startDate}
                            onChange={e => {
                              const val = e.target.value;
                              setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, startDate: val } : item));
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                          />
                          <span className="text-slate-500 font-bold">~</span>
                          <input
                            type="date"
                            value={p.endDate}
                            onChange={e => {
                              const val = e.target.value;
                              setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, endDate: val } : item));
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </td>

                      {/* 근무 구분 (평일 / 주말·공휴일 / 매일) */}
                      <td className="p-2.5">
                        <select
                          value={p.dayType || 'WEEKDAY'}
                          onChange={e => {
                            const val = e.target.value as any;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, dayType: val } : item));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value="WEEKDAY">평일만 (기본)</option>
                          <option value="WEEKEND_HOLIDAY">주말/공휴일만</option>
                          <option value="ALL">매일 (전체)</option>
                        </select>
                      </td>

                      {/* 시간대 (시작 시간 ~ 종료 시간) */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={p.startTime || '06:00'}
                            onChange={e => {
                              const val = e.target.value;
                              setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, startTime: val } : item));
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                          />
                          <span className="text-slate-500 font-bold">~</span>
                          <input
                            type="time"
                            value={p.endTime || '08:00'}
                            onChange={e => {
                              const val = e.target.value;
                              setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, endTime: val } : item));
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </td>

                      {/* 담당 임상병리사 */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.name}
                          placeholder="담당자명"
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </td>

                      {/* 연락처 (휴대전화) */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.phone}
                          placeholder="010-0000-0000"
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, phone: val } : item));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </td>

                      {/* 원내 내선/UCAP */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.ucap}
                          placeholder="5-9907"
                          onChange={e => {
                            const val = e.target.value;
                            setPathologistSchedules(prev => prev.map((item, i) => i === idx ? { ...item, ucap: val } : item));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </td>

                      {/* 삭제 */}
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeletePathologistSchedule(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="일정 삭제"
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

          {/* ===================================================================== */}
          {/* SECTION: 의료진 당직폰 & 전공의 연락처 통합 매핑                         */}
          {/* (대구분: 내과/비내과 ➡️ 중구분: 당직폰/개인폰)                            */}
          {/* ===================================================================== */}
          <div className="space-y-6">
            
            {/* Department Sub-Tabs Header */}
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  의료진 당직폰 & 전공의 개인 연락처 통합 관리
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  대구분(내과계 / 비내과계) ➡️ 중구분(공용 당직폰 / 전공의 개인폰) 체계로 번호 및 UCAP을 관리합니다.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setDutyPhoneDeptFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    dutyPhoneDeptFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  전체 보기
                </button>
                <button
                  onClick={() => setDutyPhoneDeptFilter('내과')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    dutyPhoneDeptFilter === '내과' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔵 내과계
                </button>
                <button
                  onClick={() => setDutyPhoneDeptFilter('비내과')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    dutyPhoneDeptFilter === '비내과' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 비내과계
                </button>
              </div>
            </div>

            {/* 1. 내과계 섹션 */}
            {(dutyPhoneDeptFilter === 'ALL' || dutyPhoneDeptFilter === '내과') && (
              <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 via-slate-900/60 to-slate-900/90 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                    <h4 className="text-base font-black text-white">
                      내과계 (Internal Medicine) 연락망
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                      대구분: 내과
                    </span>
                  </div>
                </div>

                {/* 1-A. 내과계 당직폰 설정 */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
                        📱 내과계 당직폰 (공용 UCAP / 핸드폰)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 내과계는 기본적으로 전공의 개인폰(UCAP)으로 연결됩니다. 공용 당직폰 번호를 입력하면 해당 번호로 우선 연결됩니다.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddDutyPhone('내과')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      내과 당직폰 추가
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-bold uppercase">
                        <tr>
                          <th className="p-2.5 w-32">구분 (역할명)</th>
                          <th className="p-2.5 w-36">당직 UCAP</th>
                          <th className="p-2.5 w-44">당직 핸드폰번호</th>
                          <th className="p-2.5">비고 / 메모</th>
                          <th className="p-2.5 w-14 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {dutyPhones.filter(dp => dp.deptCategory === '내과').map(dp => (
                          <tr key={dp.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.roleName}
                                onChange={e => handleUpdateDutyPhone(dp.id, 'roleName', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-blue-300 font-bold focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.ucap}
                                placeholder="예: 5-4080"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'ucap', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.phone}
                                placeholder="예: 010-0000-0000"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'phone', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.notes || ''}
                                placeholder="메모 (예: 개인폰(UCAP) 기본 사용)"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'notes', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteDutyPhone(dp.id, dp.roleName)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
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

                {/* 1-B. 내과계 전공의 개인폰/개인 UCAP 설정 */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                        👤 내과계 전공의 개인 연락처 (개인 UCAP / 개인 핸드폰)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 진료과(IM, IM(분), PED/NP, NP/PED 등), 성명, 개인 UCAP, 개인 휴대전화를 관리합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddIntern('내과')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      내과계 의사 추가
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-bold uppercase">
                        <tr>
                          <th className="p-2.5 w-28">진료과</th>
                          <th className="p-2.5 w-32">성명</th>
                          <th className="p-2.5 w-36">개인 UCAP</th>
                          <th className="p-2.5 w-44">개인 휴대전화</th>
                          <th className="p-2.5 w-14 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {interns.filter(it => it.category === '내과').map(it => (
                          <tr key={it.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.dept}
                                placeholder="예: IM"
                                onChange={e => handleUpdateIntern(it.id, 'dept', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.name}
                                placeholder="이름"
                                onChange={e => handleUpdateIntern(it.id, 'name', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.ucap}
                                placeholder="예: 52606"
                                onChange={e => handleUpdateIntern(it.id, 'ucap', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.phone}
                                placeholder="예: 010-0000-0000"
                                onChange={e => handleUpdateIntern(it.id, 'phone', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteIntern(it.id, it.name)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
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

            {/* 2. 비내과계 섹션 */}
            {(dutyPhoneDeptFilter === 'ALL' || dutyPhoneDeptFilter === '비내과') && (
              <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-slate-900/60 to-slate-900/90 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <h4 className="text-base font-black text-white">
                      비내과계 (Non-Internal Medicine) 연락망
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                      대구분: 비내과
                    </span>
                  </div>
                </div>

                {/* 2-A. 비내과계 당직폰 설정 */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                        📱 비내과계 당직폰 (공용 UCAP / 핸드폰)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 비내과계 필수 콜 접수용 공용 당직폰 번호 및 원내 UCAP입니다. (비내과 1: 5-4080, 비내과 2: 5-4081, 비내과 3: 5-3499(임시))
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddDutyPhone('비내과')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      비내과 당직폰 추가
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-bold uppercase">
                        <tr>
                          <th className="p-2.5 w-32">구분 (역할명)</th>
                          <th className="p-2.5 w-36">당직 UCAP</th>
                          <th className="p-2.5 w-44">당직 핸드폰번호</th>
                          <th className="p-2.5">비고 / 메모</th>
                          <th className="p-2.5 w-14 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {dutyPhones.filter(dp => dp.deptCategory === '비내과').map(dp => (
                          <tr key={dp.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.roleName}
                                onChange={e => handleUpdateDutyPhone(dp.id, 'roleName', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.ucap}
                                placeholder="예: 5-4080"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'ucap', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.phone}
                                placeholder="예: 010-7628-5803"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'phone', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dp.notes || ''}
                                placeholder="메모 (예: 정규 당직폰, (임시) 등)"
                                onChange={e => handleUpdateDutyPhone(dp.id, 'notes', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteDutyPhone(dp.id, dp.roleName)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
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

                {/* 2-B. 비내과계 전공의 개인폰/개인 UCAP 설정 */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                        👤 비내과계 전공의 개인 연락처 (개인 UCAP / 개인 핸드폰)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 진료과(OBGY, GS, OT, RM, CS, AN 등), 성명, 개인 UCAP, 개인 휴대전화를 관리합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddIntern('비내과')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      비내과계 의사 추가
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-bold uppercase">
                        <tr>
                          <th className="p-2.5 w-28">진료과</th>
                          <th className="p-2.5 w-32">성명</th>
                          <th className="p-2.5 w-36">개인 UCAP</th>
                          <th className="p-2.5 w-44">개인 휴대전화</th>
                          <th className="p-2.5 w-14 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {interns.filter(it => it.category === '비내과').map(it => (
                          <tr key={it.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.dept}
                                placeholder="예: GS"
                                onChange={e => handleUpdateIntern(it.id, 'dept', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.name}
                                placeholder="이름"
                                onChange={e => handleUpdateIntern(it.id, 'name', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.ucap}
                                placeholder="예: 52605"
                                onChange={e => handleUpdateIntern(it.id, 'ucap', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.phone}
                                placeholder="예: 010-0000-0000"
                                onChange={e => handleUpdateIntern(it.id, 'phone', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteIntern(it.id, it.name)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
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

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COMMON NURSE SCHEDULE MATRIX & CONFIGURATION                 */}
      {/* ==================================================================== */}
      {adminTab === 'common_nurse' && (
        <div className="space-y-6">
          
          {/* Header & Sub-Tab Navigation Bar */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                공통전담간호사 근무 매트릭스 & 포스트 설정
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                3교대 근무시간대 조정, 담당 포스트(공통전담 1, 2, 3...)의 공용 UCAP·핸드폰 번호, 관할 병동 매핑 및 요일별 스케쥴을 통합 관리합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setAdminCNSubTab('schedule')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  adminCNSubTab === 'schedule'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                요일별 근무표 스케쥴
              </button>

              <button
                onClick={() => setAdminCNSubTab('wards')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  adminCNSubTab === 'wards'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                포스트 & UCAP/핸드폰 & 병동 설정 ({cnPosts.length})
              </button>

              <button
                onClick={() => setAdminCNSubTab('timeslot')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  adminCNSubTab === 'timeslot'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                3교대 시간대 설정
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 1. SUB-TAB: 3-SHIFT TIME SLOT CONFIGURATION                      */}
          {/* ================================================================ */}
          {adminCNSubTab === 'timeslot' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    공통전담간호사 3교대(Day, Evening, Night) 근무 시간대 조정
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    기본 3교대 근무 시간을 관리자가 원내 운영 상황에 맞추어 직접 변경할 수 있습니다.
                  </p>
                </div>
                <div className="text-[11px] text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl">
                  💡 시간대 변경 시 당직 호출 시스템 판별에 즉시 반영
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {timeSlots.map((ts, idx) => {
                  const icons = ['☀️', '🌅', '🌙'];
                  const colors = [
                    'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900',
                    'border-orange-500/40 bg-gradient-to-b from-orange-950/20 to-slate-900',
                    'border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 to-slate-900'
                  ];
                  return (
                    <div key={ts.id} className={`p-5 rounded-2xl border ${colors[idx % 3]} space-y-4 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{icons[idx % 3]}</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {ts.start} ~ {ts.end}
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">근무명</label>
                        <input
                          type="text"
                          value={ts.name}
                          onChange={e => handleUpdateTimeSlot(ts.id, 'name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">시작 시간</label>
                          <input
                            type="time"
                            value={ts.start}
                            onChange={e => handleUpdateTimeSlot(ts.id, 'start', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">종료 시간</label>
                          <input
                            type="time"
                            value={ts.end}
                            onChange={e => handleUpdateTimeSlot(ts.id, 'end', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. SUB-TAB: POSTS, UCAP, PHONE & WARDS CONFIGURATION             */}
          {/* ================================================================ */}
          {adminCNSubTab === 'wards' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    공통전담 포스트(1, 2, 3...) 공용 UCAP·핸드폰 & 관할 병동 관리
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    포스트별 공용 UCAP과 핸드폰 번호를 입력하고, 담당할 병동을 셋팅하거나 새 포스트를 추가/삭제합니다.
                  </p>
                </div>
                <button
                  onClick={handleAddCNPost}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  새 공통전담 포스트 추가
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-32">포스트 명칭</th>
                      <th className="p-3 w-36">공용 UCAP</th>
                      <th className="p-3 w-44">공용 핸드폰 번호</th>
                      <th className="p-3">관할 병동 셋팅</th>
                      <th className="p-3 w-16 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {cnPosts.map(post => (
                      <tr key={post.id} className="hover:bg-slate-900/40 transition">
                        {/* 포스트 명칭 */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={post.name}
                            onChange={e => handleUpdateCNPost(post.id, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                          />
                        </td>

                        {/* 공용 UCAP */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={post.ucap}
                            placeholder="예: 53001"
                            onChange={e => handleUpdateCNPost(post.id, 'ucap', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                          />
                        </td>

                        {/* 공용 핸드폰 */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={post.phone}
                            placeholder="예: 010-1000-2001"
                            onChange={e => handleUpdateCNPost(post.id, 'phone', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </td>

                        {/* 관할 병동 */}
                        <td className="p-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {post.wards.map(w => (
                              <span key={w} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[11px] font-bold">
                                {w}
                                <button
                                  onClick={() => handleToggleWardForPost(post.id, w)}
                                  className="hover:text-rose-400 transition"
                                  title="제거"
                                >
                                  ×
                                </button>
                              </span>
                            ))}

                            <button
                              onClick={() => setEditingWardsPostId(post.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                            >
                              + 병동 선택/추가
                            </button>
                          </div>
                        </td>

                        {/* 삭제 */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteCNPost(post.id, post.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="포스트 삭제"
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
          )}

          {/* ================================================================ */}
          {/* 3. SUB-TAB: WEEKLY SHIFT MATRIX SCHEDULE INPUT                   */}
          {/* ================================================================ */}
          {/* ================================================================ */}
          {/* 3. SUB-TAB: IMAGE 1 MASTER TIMETABLE MATRIX                      */}
          {/* ================================================================ */}
          {adminCNSubTab === 'schedule' && (
            <div className="space-y-4">
              
              {/* Datalist for autocompleting common nurse post names */}
              <datalist id="cn-posts-datalist">
                {cnPosts.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </datalist>

              {/* Top Bar: Title & Add Group Button */}
              <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    공통전담간호사 통합 주간 근무표 (부서/병동그룹별 × 3교대 × 요일별)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    병동 그룹(부서)별 3교대 시간대에 맞추어 공통전담(1, 2, 3...)을 배정합니다. 핸드폰 관리의 공용 UCAP 번호가 표에 자동 연동되어 함께 표시됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAddCNGroup}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    새 병동 그룹 추가
                  </button>
                </div>
              </div>

              {/* Master Batch Assignment Panel */}
              <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/40 bg-slate-900/90 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      ⚡ 공통전담 일괄 배정 도구
                    </span>
                    <span className="text-xs text-slate-400">
                      원하는 병동 그룹, 시간대, 요일 범위를 지정하여 공통전담을 한 번에 배정합니다.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBatchPanel(!showBatchPanel)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    {showBatchPanel ? '접기 ▲' : '도구 열기 ▼'}
                  </button>
                </div>

                {showBatchPanel && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-end gap-3 text-xs">
                    {/* 1. 대상 병동 그룹 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">1. 대상 병동 그룹</label>
                      <select
                        value={batchTargetGroup}
                        onChange={e => setBatchTargetGroup(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-200 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="ALL">🌟 전체 병동 그룹 (모두)</option>
                        {cnGroupSchedules?.map(g => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. 대상 시간대 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">2. 대상 시간대</label>
                      <select
                        value={batchTargetSlot}
                        onChange={e => setBatchTargetSlot(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-amber-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="ALL">⏰ 전체 시간대 (3교대 모두)</option>
                        {timeSlots.map(ts => (
                          <option key={ts.id} value={ts.id}>{ts.name} ({ts.start}~{ts.end})</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. 대상 요일 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-400">3. 대상 요일</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setBatchTargetDays([1, 2, 3, 4, 5])}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              JSON.stringify([...batchTargetDays].sort()) === JSON.stringify([1, 2, 3, 4, 5])
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            평일(월~금)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBatchTargetDays([6, 0])}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              JSON.stringify([...batchTargetDays].sort()) === JSON.stringify([0, 6])
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            주말(토~일)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBatchTargetDays([1, 2, 3, 4, 5, 6, 0])}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              batchTargetDays.length === 7
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            전체(7일)
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                          { day: 1, name: '월' },
                          { day: 2, name: '화' },
                          { day: 3, name: '수' },
                          { day: 4, name: '목' },
                          { day: 5, name: '금' },
                          { day: 6, name: '토' },
                          { day: 0, name: '일' }
                        ].map(d => {
                          const isChecked = batchTargetDays.includes(d.day);
                          return (
                            <button
                              key={d.day}
                              type="button"
                              onClick={() => {
                                setBatchTargetDays(prev => 
                                  prev.includes(d.day) ? prev.filter(x => x !== d.day) : [...prev, d.day]
                                );
                              }}
                              className={`w-6 h-6 rounded-lg text-xs font-bold transition ${
                                isChecked
                                  ? 'bg-cyan-500 text-slate-950 font-black'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              {d.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. 배정할 공통전담 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">4. 배정할 공통전담</label>
                      <select
                        value={batchSelectedRole}
                        onChange={e => setBatchSelectedRole(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-black text-cyan-300 focus:outline-none focus:border-cyan-400"
                      >
                        {Array.from({ length: 10 }, (_, i) => (
                          <option key={i + 1} value={`공통전담 ${i + 1}`}>
                            공통전담 {i + 1}
                          </option>
                        ))}
                        <option value="CLEAR">-- 미배정 (비우기) --</option>
                      </select>
                    </div>

                    {/* 5. 실행 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        const targetGroups = batchTargetGroup === 'ALL' ? (cnGroupSchedules?.map(g => g.id) || []) : [batchTargetGroup];
                        const targetSlots = batchTargetSlot === 'ALL' ? timeSlots.map(ts => ts.id) : [batchTargetSlot];
                        if (batchTargetDays.length === 0) {
                          alert('최소 1개 이상의 요일을 선택해주세요.');
                          return;
                        }
                        handleBatchFill(targetGroups, targetSlots, batchTargetDays, batchSelectedRole);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      ⚡ 일괄 배정 실행
                    </button>
                  </div>
                )}
              </div>

              {/* Info Notice Box */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-xs">
                <span className="text-slate-300">
                  💡 <strong>시간대</strong>는 [3교대 시간대 설정] 값이 자동 반영되며, <strong>공용 UCAP 번호</strong>는 [포스트 & UCAP/핸드폰 & 병동 설정]의 등록 정보와 실시간 연동됩니다.
                </span>
                <span className="text-cyan-400 font-bold font-mono">
                  총 {cnGroupSchedules?.length || 0}개 병동 그룹 운용 중
                </span>
              </div>

              {/* Master Unified Table (Matching Image 1) */}
              <div className="overflow-x-auto rounded-2xl border-2 border-slate-700 bg-slate-950 shadow-2xl">
                <table className="w-full text-xs text-center border-collapse">
                  {/* Table Header: Image 1 exact columns */}
                  <thead className="bg-slate-900 border-b-2 border-slate-700 text-white font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 w-52 border-r border-slate-700 text-sm">병동 그룹</th>
                      <th className="p-3.5 w-36 border-r border-slate-700 text-sm text-amber-300">시간대</th>
                      {[
                        { day: 1, name: '월' },
                        { day: 2, name: '화' },
                        { day: 3, name: '수' },
                        { day: 4, name: '목' },
                        { day: 5, name: '금' },
                        { day: 6, name: '토' },
                        { day: 0, name: '일' }
                      ].map(d => (
                        <th 
                          key={d.day} 
                          className={`p-2.5 border-r border-slate-700 min-w-[125px] ${
                            d.name === '토' ? 'text-cyan-300' : (d.name === '일' ? 'text-rose-300' : '')
                          }`}
                        >
                          <div>{d.name}요일</div>
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                const allGroupIds = cnGroupSchedules?.map(g => g.id) || [];
                                const allSlotIds = timeSlots.map(t => t.id);
                                handleBatchFill(allGroupIds, allSlotIds, [d.day], e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="mt-1 text-[9px] font-bold bg-slate-950 text-slate-400 hover:text-white px-1 py-0.5 rounded border border-slate-800 cursor-pointer"
                            title={`${d.name}요일 전체 일괄 배정`}
                          >
                            <option value="">일괄 ▾</option>
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i + 1} value={`공통전담 ${i + 1}`}>공통전담 {i + 1}</option>
                            ))}
                            <option value="CLEAR">비우기</option>
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y-2 divide-slate-800 font-medium">
                    {cnGroupSchedules?.map((grp, grpIdx) => {
                      const IMAGE1_DAYS = [
                        { day: 1, name: '월' },
                        { day: 2, name: '화' },
                        { day: 3, name: '수' },
                        { day: 4, name: '목' },
                        { day: 5, name: '금' },
                        { day: 6, name: '토' },
                        { day: 0, name: '일' }
                      ];

                      return timeSlots.map((ts, tsIdx) => {
                        return (
                          <tr 
                            key={`${grp.id}-${ts.id}`} 
                            className={`divide-x divide-slate-800/80 transition hover:bg-slate-900/40 ${
                              tsIdx === timeSlots.length - 1 ? 'border-b-2 border-slate-700' : ''
                            }`}
                          >
                            {/* Column 1: 병동 그룹 (Rowspan = 3) */}
                            {tsIdx === 0 && (
                              <td 
                                rowSpan={timeSlots.length} 
                                className="align-top p-4 bg-slate-900/90 border-r-2 border-slate-700 text-left space-y-2.5"
                              >
                                <div>
                                  <label className="text-[10px] text-slate-500 font-bold block mb-1">
                                    부서 / 관할 병동
                                  </label>
                                  <input
                                    type="text"
                                    value={grp.title}
                                    onChange={e => handleUpdateCNGroupTitle(grp.id, e.target.value)}
                                    placeholder="예: MICU, 81, 82W"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-black text-white focus:outline-none focus:border-cyan-400"
                                  />
                                </div>

                                <div className="flex flex-wrap items-center gap-1">
                                  {grp.wards.slice(0, 4).map(w => (
                                    <span key={w} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-bold">
                                      {w}
                                    </span>
                                  ))}
                                  {grp.wards.length > 4 && (
                                    <span className="text-[10px] text-slate-500 font-mono">+{grp.wards.length - 4}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 pt-1">
                                  <button
                                    onClick={() => setEditingGroupWardsId(grp.id)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                                  >
                                    + 병동 칩 선택
                                  </button>

                                  {cnGroupSchedules.length > 1 && (
                                    <button
                                      onClick={() => handleDeleteCNGroup(grp.id, grp.title)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                      title="그룹 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Column 2: 시간대 (06:30~14:30 / 14:30~22:00 / 22:00~06:30) */}
                            <td className="p-2.5 font-mono font-bold text-xs bg-amber-950/20 text-amber-300 border-r border-slate-700 whitespace-nowrap text-center space-y-1.5">
                              <div>{ts.start}~{ts.end}</div>
                              <span className="text-[10px] text-amber-400/60 font-sans block">
                                {ts.name.split(' ')[0]}
                              </span>

                              {/* Quick inline row batch fills */}
                              <div className="pt-1.5 border-t border-slate-800/80 flex flex-col gap-1 items-center">
                                <select
                                  onChange={e => {
                                    if (e.target.value) {
                                      handleBatchFill([grp.id], [ts.id], [1, 2, 3, 4, 5], e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-[10px] bg-slate-900 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-800/60 cursor-pointer"
                                  title="이 시간대 평일(월~금) 일괄 배정"
                                >
                                  <option value="">평일(월~금) ▾</option>
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i + 1} value={`공통전담 ${i + 1}`}>공통전담 {i + 1}</option>
                                  ))}
                                  <option value="CLEAR">비우기</option>
                                </select>

                                <select
                                  onChange={e => {
                                    if (e.target.value) {
                                      handleBatchFill([grp.id], [ts.id], [6, 0], e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-[10px] bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-800/60 cursor-pointer"
                                  title="이 시간대 주말(토~일) 일괄 배정"
                                >
                                  <option value="">주말(토~일) ▾</option>
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i + 1} value={`공통전담 ${i + 1}`}>공통전담 {i + 1}</option>
                                  ))}
                                  <option value="CLEAR">비우기</option>
                                </select>
                              </div>
                            </td>

                            {/* Columns 3~9: 월, 화, 수, 목, 금, 토, 일 */}
                            {IMAGE1_DAYS.map(d => {
                              const cell = grp.schedule?.[ts.id]?.[d.day] || { role: '', ucap: '' };
                              const contact = getCNPostContact(cell.role, cnPosts);
                              const displayUcap = contact.ucap || cell.ucap;

                              return (
                                <td 
                                  key={d.day} 
                                  className="p-2 border-r border-slate-800/80 align-middle hover:bg-slate-900/60 transition group"
                                >
                                  <div className="space-y-1">
                                    {/* Role Select Dropdown (1~10) - labels without contact */}
                                    <select
                                      value={(() => {
                                        if (!cell.role) return '';
                                        const m = cell.role.match(/\d+/);
                                        return m ? `공통전담 ${m[0]}` : cell.role;
                                      })()}
                                      onChange={e => handleUpdateCNGroupCell(grp.id, ts.id, d.day, 'role', e.target.value)}
                                      className={`w-full text-center font-bold text-xs px-1.5 py-1.5 rounded-lg border focus:outline-none transition cursor-pointer appearance-none ${
                                        cell.role
                                          ? 'bg-slate-900 text-cyan-300 border-cyan-700/80 font-black shadow-sm'
                                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <option value="" className="bg-slate-950 text-slate-400">-- 미배정 --</option>
                                      {Array.from({ length: 10 }, (_, i) => {
                                        const roleName = `공통전담 ${i + 1}`;
                                        return (
                                          <option key={i + 1} value={roleName} className="bg-slate-900 text-white font-medium">
                                            {roleName}
                                          </option>
                                        );
                                      })}
                                    </select>

                                    {/* Auto-resolved 공용 UCAP Display from cnPosts */}
                                    {displayUcap ? (
                                      <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-black text-cyan-300 bg-cyan-950/90 px-2 py-0.5 rounded-md border border-cyan-800/60 shadow-sm">
                                        <span>📞 {displayUcap}</span>
                                      </div>
                                    ) : cell.role ? (
                                      <div className="text-[9px] text-slate-500 italic">UCAP 미등록</div>
                                    ) : null}

                                    {/* Quick Clear Button on Hover */}
                                    {cell.role && (
                                      <div className="hidden group-hover:flex items-center justify-center pt-0.5">
                                        <button
                                          onClick={() => handleUpdateCNGroupCell(grp.id, ts.id, d.day, 'role', '')}
                                          className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white text-[9px] font-bold transition flex items-center gap-1"
                                          title="근무자 배정 취소"
                                        >
                                          <span>취소</span>
                                          <span>×</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}

                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* MODAL: WARD SELECTION POPOVER / MODAL                            */}
          {/* ================================================================ */}
          {editingWardsPostId && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      관할 병동 선택 - {cnPosts.find(p => p.id === editingWardsPostId)?.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      해당 포스트가 전담할 병동을 클릭하여 선택하거나 해제하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingWardsPostId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Ward Chips Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
                  {ALL_WARDS.map(ward => {
                    const currentPost = cnPosts.find(p => p.id === editingWardsPostId);
                    const isSelected = currentPost?.wards.includes(ward);
                    return (
                      <button
                        key={ward}
                        onClick={() => handleToggleWardForPost(editingWardsPostId, ward)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-center transition border ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {ward}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    선택된 병동 수: <strong className="text-cyan-400">{cnPosts.find(p => p.id === editingWardsPostId)?.wards.length || 0}개</strong>
                  </span>
                  <button
                    onClick={() => setEditingWardsPostId(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  >
                    선택 완료
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: GROUP WARD SELECTION POPOVER / MODAL */}
          {editingGroupWardsId && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      관할 병동 선택 - {cnGroupSchedules?.find(g => g.id === editingGroupWardsId)?.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      해당 근무표 그룹이 담당할 병동을 클릭하여 선택하거나 해제하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingGroupWardsId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Ward Chips Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
                  {ALL_WARDS.map(ward => {
                    const currentGrp = cnGroupSchedules?.find(g => g.id === editingGroupWardsId);
                    const isSelected = currentGrp?.wards.includes(ward);
                    return (
                      <button
                        key={ward}
                        onClick={() => handleToggleWardForGroup(editingGroupWardsId, ward)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-center transition border ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {ward}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    선택된 병동 수: <strong className="text-cyan-400">{cnGroupSchedules?.find(g => g.id === editingGroupWardsId)?.wards.length || 0}개</strong>
                  </span>
                  <button
                    onClick={() => setEditingGroupWardsId(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  >
                    선택 완료
                  </button>
                </div>
              </div>
            </div>
          )}

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
