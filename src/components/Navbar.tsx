import React from 'react';
import { Users, Shuffle, Dice5, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export type ActiveTab = 'roster' | 'picker' | 'groups';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalStudents: number;
  activeStudents: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalStudents,
  activeStudents,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Dice5 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              課堂神隊友
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              ClassMate · 抽籤與自動分組
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>學生名單</span>
            {totalStudents > 0 && (
              <span className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                {activeStudents}/{totalStudents}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('picker')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'picker'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dice5 className="w-4 h-4 text-sky-600" />
            <span>隨機抽籤</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shuffle className="w-4 h-4 text-indigo-600" />
            <span>自動分組</span>
          </button>
        </nav>

        {/* Zone 3: Quick Utilities (Audio, Fullscreen / Projector) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? '開啟音效' : '靜音'}
            aria-label={isMuted ? '開啟音效' : '靜音'}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? '結束投影全螢幕' : '投影全螢幕模式'}
            aria-label={isFullscreen ? '結束投影全螢幕' : '投影全螢幕模式'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>結束全螢幕</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>投影模式</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
