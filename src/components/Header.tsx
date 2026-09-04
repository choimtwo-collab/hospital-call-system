import React, { useState, useEffect } from 'react';
import { Activity, Shield, User, Clock, Database } from 'lucide-react';

interface HeaderProps {
  view: 'user' | 'admin';
  setView: (view: 'user' | 'admin') => void;
  onResetData?: () => void;
  isCloudConnected?: boolean;
  lastCloudSyncAt?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  view, 
  setView, 
  isCloudConnected = false,
  lastCloudSyncAt = null
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

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
          
          {/* Cloud DB Status Badge */}
          <div 
            title={isCloudConnected ? `Neon PostgreSQL 실시간 동기화 (최근: ${lastCloudSyncAt || '방금'})` : '클라우드 DB 연결 대기 중 (로컬 캐시 모드)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isCloudConnected 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isCloudConnected ? 'Neon 실시간 동기화' : '로컬 캐시 모드'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
          </div>

          {/* Live Clock Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-slate-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr}</span>
          </div>

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
              onClick={() => setView('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                view === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>관리자 설정</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
