import React, { useState } from 'react';
import { 
  X, Lock, User, Shield, Building2, Key, CheckCircle2, AlertCircle, Sparkles, LogIn, UserPlus 
} from 'lucide-react';
import { AppUser } from '../types';
import { hashPassword, verifyPassword } from '../utils/authUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onRegisterUser: (newUser: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  onRegisterUser
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // 로그인 폼 상태
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 회원가입 폼 상태
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUsername = loginUsername.trim();
    if (!cleanUsername || !loginPassword) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const user = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (!user) {
        setLoginError('존재하지 않는 아이디입니다.');
        setIsLoggingIn(false);
        return;
      }

      const isMatch = await verifyPassword(loginPassword, user.passwordHash);
      if (!isMatch) {
        setLoginError('비밀번호가 일치하지 않습니다.');
        setIsLoggingIn(false);
        return;
      }

      if (user.status === 'PENDING') {
        setLoginError('현재 관리자 승인 대기 중인 계정입니다. 최고 관리자에게 승인을 요청하세요.');
        setIsLoggingIn(false);
        return;
      }

      if (user.status === 'REJECTED') {
        setLoginError('관리자에 의해 승인이 거절된 계정입니다.');
        setIsLoggingIn(false);
        return;
      }

      // 로그인 성공
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setLoginError(`로그인 처리 중 오류가 발생했습니다: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const cleanUsername = regUsername.trim();
    const cleanName = regName.trim();
    const cleanDept = regDept.trim();

    if (!cleanUsername || !cleanName || !cleanDept || !regPassword) {
      setRegError('모든 필수 항목(아이디, 성명, 소속 부서, 비밀번호)을 입력해주세요.');
      return;
    }

    if (cleanUsername.length < 3) {
      setRegError('아이디는 최소 3자 이상이어야 합니다.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const exists = users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      setRegError('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
      return;
    }

    setIsRegistering(true);
    try {
      const passwordHash = await hashPassword(regPassword);
      const newUser: AppUser = {
        id: `user_${Date.now()}`,
        username: cleanUsername,
        name: cleanName,
        department: cleanDept,
        position: regPosition.trim() || undefined,
        passwordHash,
        role: 'USER',
        status: 'PENDING', // 관리자 승인 대기
        permissions: [],   // 기본 권한 없음 (관리자가 부여)
        createdAt: new Date().toISOString()
      };

      onRegisterUser(newUser);
      setRegSuccess('회원가입 신청이 완료되었습니다! 최고 관리자가 승인 및 권한을 부여한 후 이용하실 수 있습니다.');
      
      // 폼 초기화
      setRegUsername('');
      setRegName('');
      setRegDept('');
      setRegPosition('');
      setRegPassword('');
      setRegPasswordConfirm('');
    } catch (err: any) {
      setRegError(`가입 처리 중 오류가 발생했습니다: ${err.message || err}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">관리자 권한 인증</h3>
              <p className="text-[11px] text-slate-400">설정 권한이 있는 담당자만 수정이 가능합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (로그인 vs 회원가입) */}
        <div className="p-4 pt-3 pb-0 relative z-10">
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-extrabold">
            <button
              onClick={() => { setTab('login'); setLoginError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
            <button
              onClick={() => { setTab('register'); setRegError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>회원가입 신청</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 pt-4 relative z-10">

          {/* 1. 로그인 탭 */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">아이디 (ID)</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">비밀번호</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Initial Super Admin Hint */}
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  초기 마스터 계정: <strong>admin</strong> / <strong>admin1234</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('admin');
                    setLoginPassword('admin1234');
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-bold text-[10px]"
                >
                  자동입력
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isLoggingIn ? '인증 중...' : '관리자 로그인'}
              </button>
            </form>
          )}

          {/* 2. 회원가입 탭 */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {regError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300 font-medium animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <p className="font-bold text-emerald-200">가입 신청 완료</p>
                    <p className="text-[11px] mt-0.5 text-emerald-300/90">{regSuccess}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    아이디 (ID) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="예: nurse_kim"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    성명 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="예: 김수간"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    소속 병동/부서 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regDept}
                    onChange={e => setRegDept(e.target.value)}
                    placeholder="예: 61병동, 간호부"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">직급 (선택)</label>
                  <input
                    type="text"
                    value={regPosition}
                    onChange={e => setRegPosition(e.target.value)}
                    placeholder="예: 수간호사, 주임"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    비밀번호 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="4자 이상"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    비밀번호 확인 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={e => setRegPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300">
                💡 가입 신청 후 <strong>최고 관리자(admin)</strong>가 [사용자 및 권한 관리] 화면에서 승인하고 권한을 부여해야 로그인할 수 있습니다.
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {isRegistering ? '가입 신청 중...' : '회원가입 신청하기'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
