import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Edit2, 
  Settings, Check, X, Sparkles, RefreshCw 
} from 'lucide-react';
import { DateScheduleMap } from '../types';
import { checkKoreanHoliday } from '../utils/koreanHolidays';
import { getScheduleDoctor } from '../utils/dutyRules';

interface CalendarDutyViewProps {
  schedules: DateScheduleMap;
  onScheduleChange: (date: string, role: string, value: string) => void;
  dutyRoles: string[];
  onAddRole: (roleName: string) => void;
  onDeleteRole: (roleName: string) => void;
  onRenameRole: (oldName: string, newName: string) => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarDutyView: React.FC<CalendarDutyViewProps> = ({
  schedules,
  onScheduleChange,
  dutyRoles,
  onAddRole,
  onDeleteRole,
  onRenameRole
}) => {
  // 월 선택 상태 (기본 2026년 9월)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 1-12

  // 구분(역할) 관리 모달/패널 상태
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState<boolean>(false);
  const [newRoleInput, setNewRoleInput] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // 이전 달 / 다음 달 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // 주차별 날짜 그리드 계산 (일요일 시작)
  const calendarWeeks = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 (일) ~ 6 (토)

    const weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayNumber: number | null;
        dateStr: string | null;
        isSunday: boolean;
        isSaturday: boolean;
        isHoliday: boolean;
        holidayName?: string;
      }>;
    }> = [];

    let currentDay = 1;
    let weekIndex = 1;

    // First week with padding
    const firstWeekDays = [];
    for (let d = 0; d < 7; d++) {
      if (d < firstDayOfWeek) {
        firstWeekDays.push({
          dayNumber: null,
          dateStr: null,
          isSunday: d === 0,
          isSaturday: d === 6,
          isHoliday: false
        });
      } else {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
        const holidayInfo = checkKoreanHoliday(dateStr);
        firstWeekDays.push({
          dayNumber: currentDay,
          dateStr,
          isSunday: d === 0,
          isSaturday: d === 6,
          isHoliday: holidayInfo.isHoliday,
          holidayName: holidayInfo.name
        });
        currentDay++;
      }
    }
    weeks.push({ weekNumber: weekIndex++, days: firstWeekDays });

    // Middle & End weeks
    while (currentDay <= daysInMonth) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        if (currentDay <= daysInMonth) {
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          const holidayInfo = checkKoreanHoliday(dateStr);
          weekDays.push({
            dayNumber: currentDay,
            dateStr,
            isSunday: d === 0,
            isSaturday: d === 6,
            isHoliday: holidayInfo.isHoliday,
            holidayName: holidayInfo.name
          });
          currentDay++;
        } else {
          weekDays.push({
            dayNumber: null,
            dateStr: null,
            isSunday: d === 0,
            isSaturday: d === 6,
            isHoliday: false
          });
        }
      }
      weeks.push({ weekNumber: weekIndex++, days: weekDays });
    }

    return weeks;
  }, [currentYear, currentMonth]);

  const handleCreateNewRole = () => {
    if (!newRoleInput.trim()) return;
    if (dutyRoles.includes(newRoleInput.trim())) {
      alert('이미 존재하는 구분(역할) 명칭입니다.');
      return;
    }
    onAddRole(newRoleInput.trim());
    setNewRoleInput('');
  };

  const handleStartEditRole = (idx: number, name: string) => {
    setEditingIndex(idx);
    setEditingValue(name);
  };

  const handleSaveEditRole = (oldName: string) => {
    if (!editingValue.trim() || editingValue.trim() === oldName) {
      setEditingIndex(null);
      return;
    }
    onRenameRole(oldName, editingValue.trim());
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">

      {/* Top Controller Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-xl">
        
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              {currentYear}년 {currentMonth}월 인턴 당직표
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleGoToToday}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 transition"
          >
            오늘로 이동
          </button>
        </div>

        {/* Division Settings Button & Live Sync Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            수정 즉시 간호사 화면 & DB 자동 반영
          </span>

          <button
            onClick={() => setIsRoleManagerOpen(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              isRoleManagerOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>구분(역할) 설정 & 추가/삭제</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px] font-black">
              {dutyRoles.length}개
            </span>
          </button>
        </div>
      </div>

      {/* Division (구분) Management Collapsible Panel */}
      {isRoleManagerOpen && (
        <div className="glass-panel p-5 rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                당직표 구분(역할) 셋팅 및 추가·삭제
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                당직 달력의 각 주차 행에 표시될 구분 항목을 관리자가 자유롭게 구성합니다. (예: 내과 1, 내과 2, 비내과 1, 연차 등)
              </p>
            </div>
            <button
              onClick={() => setIsRoleManagerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Roles List */}
          <div className="flex flex-wrap gap-2">
            {dutyRoles.map((role, idx) => (
              <div
                key={role}
                className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 shadow-sm"
              >
                {editingIndex === idx ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      className="bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white w-24"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEditRole(role)}
                      className="text-emerald-400 hover:text-emerald-300"
                      title="저장"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="text-slate-400 hover:text-white"
                      title="취소"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-cyan-300">{role}</span>
                    <button
                      onClick={() => handleStartEditRole(idx, role)}
                      className="text-slate-400 hover:text-cyan-300 transition"
                      title="이름 수정"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${role}' 구분을 삭제하시겠습니까?`)) {
                          onDeleteRole(role);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 transition ml-0.5"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add Role Form */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              value={newRoleInput}
              onChange={e => setNewRoleInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateNewRole(); }}
              placeholder="새로운 구분 입력 (예: 비내과 4, 연차, 파견인턴 등)"
              className="flex-1 max-w-sm bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleCreateNewRole}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              구분 추가
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HOSPITAL MONTHLY CALENDAR TABLE (IMAGE 1 STYLE)                      */}
      {/* ===================================================================== */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 shadow-2xl bg-slate-950">
        <table className="w-full text-xs border-collapse">
          
          {/* Main Table Column Layout */}
          <colgroup>
            <col className="w-24 sm:w-28" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
          </colgroup>

          <tbody>
            {calendarWeeks.map((week) => (
              <React.Fragment key={`week-${week.weekNumber}`}>
                
                {/* 1. Week Header Row (주차 & 요일 및 날짜) */}
                <tr className="border-t-2 border-slate-700/80 bg-slate-900/90">
                  
                  {/* 주차 라벨 */}
                  <th className="p-2.5 text-center font-black text-cyan-300 border-r border-slate-800 bg-slate-900">
                    <div className="text-xs uppercase tracking-wider">{week.weekNumber}주차</div>
                    <div className="text-[10px] text-slate-400 font-normal">구분</div>
                  </th>

                  {/* 7 Days: 일 ~ 토 */}
                  {week.days.map((day, dIdx) => {
                    const isSun = dIdx === 0;
                    const isSat = dIdx === 6;

                    return (
                      <th
                        key={`wh-${week.weekNumber}-${dIdx}`}
                        className={`p-2 text-center border-r border-slate-800 last:border-r-0 ${
                          isSun ? 'bg-rose-950/20' : (isSat ? 'bg-sky-950/20' : 'bg-slate-900/70')
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          {/* 요일 명칭 */}
                          <span
                            className={`text-xs font-black ${
                              isSun ? 'text-rose-400' : (isSat ? 'text-sky-400' : 'text-slate-300')
                            }`}
                          >
                            {DAY_NAMES[dIdx]}
                          </span>

                          {/* 날짜 번호 */}
                          {day.dayNumber ? (
                            <span
                              className={`text-sm font-black px-1.5 rounded ${
                                day.isHoliday || isSun
                                  ? 'text-rose-400 font-extrabold'
                                  : (isSat ? 'text-sky-400' : 'text-white')
                              }`}
                              title={day.holidayName}
                            >
                              {day.dayNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-700">-</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* 2. Duty Role Rows for this week */}
                {dutyRoles.map((role) => (
                  <tr
                    key={`week-${week.weekNumber}-role-${role}`}
                    className="border-t border-slate-800/80 hover:bg-slate-900/40 transition"
                  >
                    {/* Role Header (구분 이름) */}
                    <td className="p-2 text-center font-bold text-slate-300 border-r border-slate-800 bg-slate-900/70">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                        role.includes('내과')
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : (role.includes('비내과')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700')
                      }`}>
                        {role}
                      </span>
                    </td>

                    {/* 7 Days Cells */}
                    {week.days.map((day, dIdx) => {
                      if (!day.dateStr) {
                        return (
                          <td
                            key={`empty-${week.weekNumber}-${role}-${dIdx}`}
                            className="p-1 text-center border-r border-slate-800/60 last:border-r-0 bg-slate-950/60"
                          >
                            <span className="text-slate-800 text-xs select-none">✕</span>
                          </td>
                        );
                      }

                      const dateKey = day.dateStr;
                      const currentValue = schedules[dateKey]?.[role] || getScheduleDoctor(schedules[dateKey], role) || '';

                      return (
                        <td
                          key={`cell-${dateKey}-${role}`}
                          className={`p-1 border-r border-slate-800/60 last:border-r-0 ${
                            day.isSunday ? 'bg-rose-950/10' : (day.isSaturday ? 'bg-sky-950/10' : '')
                          }`}
                        >
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => onScheduleChange(dateKey, role, e.target.value)}
                            placeholder="이름 입력"
                            className="w-full bg-slate-900/80 hover:bg-slate-850 focus:bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-2 py-1.5 text-center text-xs font-bold text-white placeholder-slate-600 transition focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}

              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
