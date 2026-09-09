import React, { useState, useEffect, useRef } from 'react';
import { Activity, Shield, User, Clock, Database, LogIn, LogOut, ShieldCheck, Lock, RefreshCw, FileText, Download, ChevronDown } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  view: 'user' | 'admin';
  setView: (view: 'user' | 'admin') => void;
  onResetData?: () => void;
  isCloudConnected?: boolean;
  lastCloudSyncAt?: string | null;
  onManualSync?: () => void;
  currentUser?: AppUser | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  view, 
  setView, 
  isCloudConnected = false,
  lastCloudSyncAt = null,
  onManualSync,
  currentUser = null,
  onOpenAuthModal,
  onLogout
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showDocMenu, setShowDocMenu] = useState<boolean>(false);
  const docMenuRef = useRef<HTMLDivElement>(null);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(e.target as Node)) {
        setShowDocMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) +
        ' ' +
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                스마트 당직 콜 라우터
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v2.4 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden md:block">
              의료진 콜 대상 실시간 자동 분배 및 원클릭 내선 연결 시스템
            </p>
          </div>
        </div>

        {/* Right Info & View Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Cloud DB Status Badge (클릭 시 절전형 즉시 동기화) */}
          <button 
            type="button"
            onClick={onManualSync}
            title={
              isCloudConnected 
                ? `Neon 클라우드 연결됨 (최근: ${lastCloudSyncAt || '방금'})\n클릭하면 지금 즉시 최신 데이터를 새로고침합니다.` 
                : '클라우드 DB 연결 대기 중 (클릭하여 재연결 시도)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isCloudConnected 
                ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isCloudConnected ? 'Neon 동기화' : '로컬 캐시'}
            </span>
            <RefreshCw className="w-3 h-3 text-emerald-400/80 opacity-70 hover:opacity-100 transition" />
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
          </button>

          {/* Skill & MD 문서 다운로드 드롭다운 메뉴 */}
          <div className="relative" ref={docMenuRef}>
            <button
              type="button"
              onClick={() => setShowDocMenu(!showDocMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition shadow-sm"
              title="시스템 설계 문서 및 Skill 파일 다운로드"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">문서 다운로드</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDocMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDocMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    시스템 설계 및 스킬 파일
                  </span>
                </div>

                {/* 1. SKILL.md 다운로드 */}
                <a
                  href="/downloads/SKILL.md"
                  download="hospital-call-system-SKILL.md"
                  onClick={() => setShowDocMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition group"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold">Skill 파일 (.md)</div>
                    <div className="text-[10px] text-slate-400">Antigravity AI 전용 에이전트 스킬</div>
                  </div>
                </a>

                {/* 2. SYSTEM_ARCHITECTURE.md 다운로드 */}
                <a
                  href="/downloads/SYSTEM_ARCHITECTURE.md"
                  download="SYSTEM_ARCHITECTURE.md"
                  onClick={() => setShowDocMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 transition group mt-1"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold">설계 가이드 문서 (.md)</div>
                    <div className="text-[10px] text-slate-400">규칙엔진/RBAC/동기화 분석서</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Live Clock Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-slate-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr}</span>
          </div>

          {/* User Auth Profile Badge or Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-purple-500/40 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white">{currentUser.name}</span>
                <span className="text-[10px] text-purple-300 font-semibold hidden sm:inline">
                  ({currentUser.role === 'SUPER_ADMIN' ? '최고관리자' : (currentUser.department || '관리자')})
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition ml-1"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-extrabold transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>관리자 로그인</span>
            </button>
          )}

          {/* Toggle Switch */}
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setView('user')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                view === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>간호사 뷰</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  if (onOpenAuthModal) onOpenAuthModal();
                  return;
                }
                setView('admin');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                view === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={currentUser ? '관리자 설정으로 전환' : '관리자 설정은 로그인이 필요합니다'}
            >
              {currentUser ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-purple-400" />}
              <span>관리자 설정</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
