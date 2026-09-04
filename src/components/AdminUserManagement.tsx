import React, { useState } from 'react';
import { 
  Users, Shield, Check, X, Trash2, Key, Search, CheckCircle2, 
  AlertCircle, ShieldCheck, UserCheck, UserX, Sparkles, Filter, Lock 
} from 'lucide-react';
import { AppUser, AdminTabId, ALL_ADMIN_TABS } from '../types';
import { hashPassword } from '../utils/authUtils';

interface AdminUserManagementProps {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  currentUser: AppUser | null;
  showSaveSuccess: (msg: string) => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  setUsers,
  currentUser,
  showSaveSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // 1. 가입 승인 처리
  const handleApproveUser = (userId: string, defaultPermissions: AdminTabId[] = ['schedules', 'common_nurse']) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        status: 'APPROVED',
        permissions: u.permissions.length > 0 ? u.permissions : defaultPermissions
      };
    }));
    showSaveSuccess('사용자 가입이 승인되었습니다.');
  };

  // 2. 가입 반려/거절 처리
  const handleRejectUser = (userId: string) => {
    if (confirm('해당 사용자의 가입 신청을 거절하시겠습니까?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showSaveSuccess('가입 신청이 거절 및 삭제되었습니다.');
    }
  };

  // 3. 권한 토글 (체크박스)
  const handleTogglePermission = (userId: string, tabId: AdminTabId) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const hasPerm = u.permissions.includes(tabId);
      const newPerms = hasPerm
        ? u.permissions.filter(p => p !== tabId)
        : [...u.permissions, tabId];
      return { ...u, permissions: newPerms };
    }));
  };

  // 4. 전체 권한 일괄 부여 / 해제
  const handleToggleAllPermissions = (userId: string) => {
    const assignableTabs = ALL_ADMIN_TABS.map(t => t.id).filter(id => id !== 'users');
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const hasAll = assignableTabs.every(t => u.permissions.includes(t));
      return {
        ...u,
        permissions: hasAll ? [] : assignableTabs
      };
    }));
  };

  // 5. 최고 관리자 (Super Admin) 권한 토글
  const handleToggleSuperAdmin = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      alert('본인의 최고 관리자 권한은 직접 해제할 수 없습니다.');
      return;
    }

    const isCurrentlySuper = target.role === 'SUPER_ADMIN';
    if (!isCurrentlySuper && !confirm(`'${target.name}'님에게 모든 설정 및 사용자 관리가 가능한 최고 관리자 권한을 부여하시겠습니까?`)) {
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newRole = isCurrentlySuper ? 'USER' : 'SUPER_ADMIN';
      const allTabs = ALL_ADMIN_TABS.map(t => t.id);
      return {
        ...u,
        role: newRole,
        permissions: newRole === 'SUPER_ADMIN' ? allTabs : u.permissions
      };
    }));
    showSaveSuccess(`${target.name}님의 최고 관리자 상태가 변경되었습니다.`);
  };

  // 6. 비밀번호 초기화
  const handleResetPassword = async (userId: string) => {
    if (!newPasswordInput || newPasswordInput.length < 4) {
      alert('새 비밀번호를 4자 이상 입력해주세요.');
      return;
    }
    const hash = await hashPassword(newPasswordInput);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, passwordHash: hash } : u));
    setResetPwdUserId(null);
    setNewPasswordInput('');
    showSaveSuccess('비밀번호가 성공적으로 변경되었습니다.');
  };

  // 7. 사용자 삭제
  const handleDeleteUser = (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      alert('현재 로그인된 본인 계정은 삭제할 수 없습니다.');
      return;
    }
    if (confirm(`'${name}' 사용자를 완전히 삭제하시겠습니까?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showSaveSuccess(`'${name}' 사용자가 삭제되었습니다.`);
    }
  };

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(u => {
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const approvedCount = users.filter(u => u.status === 'APPROVED').length;
  const superCount = users.filter(u => u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              사용자 및 관리화면 권한 관리 (RBAC)
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                최고 관리자 전용
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              회원가입 신청자를 승인하고, 각 담당자별로 접근 가능한 관리자 화면(탭)을 체크박스로 개별 지정합니다.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] text-slate-500 font-bold">승인 대기</div>
            <div className={`text-sm font-black ${pendingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
              {pendingCount}명
            </div>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] text-slate-500 font-bold">승인 회원</div>
            <div className="text-sm font-black text-cyan-400">{approvedCount}명</div>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] text-slate-500 font-bold">최고 관리자</div>
            <div className="text-sm font-black text-purple-400">{superCount}명</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Notice Section */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              신규 회원가입 승인 대기자 ({pendingCount}명)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {users.filter(u => u.status === 'PENDING').map(pendingUser => (
              <div
                key={pendingUser.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20 flex items-center justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{pendingUser.name}</span>
                    <span className="text-[10px] font-mono font-normal text-slate-400">({pendingUser.username})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {pendingUser.department} {pendingUser.position ? `· ${pendingUser.position}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApproveUser(pendingUser.id)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition flex items-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    승인
                  </button>
                  <button
                    onClick={() => handleRejectUser(pendingUser.id)}
                    className="p-1 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="거절 및 삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="이름, 아이디, 부서 검색..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">전체 상태</option>
            <option value="APPROVED">승인 완료</option>
            <option value="PENDING">승인 대기</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          권한 변경 시 클라우드 DB에 즉시 자동 저장됩니다.
        </div>
      </div>

      {/* Main Users & Permissions Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 shadow-2xl bg-slate-950">
        <table className="w-full text-xs text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3.5 w-44">사용자 정보</th>
              <th className="p-3.5 w-28 text-center">계정 상태 / 역할</th>
              <th className="p-3.5">
                <div className="flex items-center justify-between">
                  <span>화면별 세부 권한 부여 (체크 시 해당 탭 활성화)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    💡 최고 관리자는 모든 권한 자동 포함
                  </span>
                </div>
              </th>
              <th className="p-3.5 w-28 text-center">관리</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80 font-medium">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                  검색 조건과 일치하는 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const isSuper = user.role === 'SUPER_ADMIN';
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-900/50 transition">
                    
                    {/* User Info */}
                    <td className="p-3.5 align-top">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-white">{user.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              본인
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-cyan-400 font-bold">
                          @{user.username}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {user.department} {user.position ? `· ${user.position}` : ''}
                        </div>
                      </div>
                    </td>

                    {/* Status & Role */}
                    <td className="p-3.5 text-center align-top">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          user.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : (user.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
                        }`}>
                          {user.status === 'APPROVED' ? '승인 완료' : (user.status === 'PENDING' ? '승인 대기' : '반려됨')}
                        </span>

                        {/* Super Admin Toggle Button */}
                        <button
                          onClick={() => handleToggleSuperAdmin(user.id)}
                          className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                            isSuper
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                          }`}
                          title={isSuper ? '최고 관리자 권한 해제' : '최고 관리자 지정 (모든 권한 부여)'}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{isSuper ? '최고 관리자' : '일반 사용자'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Permissions Matrix (Checkboxes) */}
                    <td className="p-3.5 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                          <span className="text-[11px] font-bold text-slate-400">
                            부여된 권한: <strong className="text-cyan-300">{isSuper ? '전체' : `${user.permissions.length}개`}</strong>
                          </span>
                          {!isSuper && (
                            <button
                              onClick={() => handleToggleAllPermissions(user.id)}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                            >
                              전체 선택 / 해제
                            </button>
                          )}
                        </div>

                        {/* 8 Checkbox Chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {ALL_ADMIN_TABS.filter(t => t.id !== 'users').map(tab => {
                            const isChecked = isSuper || user.permissions.includes(tab.id);

                            return (
                              <label
                                key={tab.id}
                                className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-sm'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                                } ${isSuper ? 'opacity-80 cursor-default' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isSuper}
                                  onChange={() => handleTogglePermission(user.id, tab.id)}
                                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-default"
                                />
                                <span className="truncate" title={tab.name}>
                                  {tab.name.split('&')[0].trim()}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Action Controls */}
                    <td className="p-3.5 text-center align-top">
                      <div className="flex flex-col items-center gap-1.5">
                        {user.status === 'PENDING' ? (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                          >
                            가입 승인
                          </button>
                        ) : null}

                        {/* Password Reset Modal / Toggle */}
                        {resetPwdUserId === user.id ? (
                          <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/50 space-y-1.5 w-36">
                            <input
                              type="password"
                              placeholder="새 비밀번호"
                              value={newPasswordInput}
                              onChange={e => setNewPasswordInput(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                              autoFocus
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                className="flex-1 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-[10px]"
                              >
                                변경
                              </button>
                              <button
                                onClick={() => setResetPwdUserId(null)}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setResetPwdUserId(user.id);
                              setNewPasswordInput('');
                            }}
                            className="w-full px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1"
                            title="비밀번호 재설정"
                          >
                            <Key className="w-3 h-3" />
                            <span>비번 변경</span>
                          </button>
                        )}

                        {/* Delete User */}
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="w-full px-2 py-1 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 text-[11px] font-bold transition flex items-center justify-center gap-1 border border-slate-800"
                            title="사용자 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
