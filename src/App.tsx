import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { getSampleStudents } from './utils/csvParser';
import { isMuted, toggleMute } from './utils/soundEffects';
import { Navbar, ActiveTab } from './components/Navbar';
import { RosterManager } from './components/RosterManager';
import { RandomPicker } from './components/RandomPicker';
import { AutoGroup } from './components/AutoGroup';

const STORAGE_KEY = 'classmate_student_roster_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [muted, setMutedState] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize students with saved roster or default 30-student sample roster
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getSampleStudents('class-30');
  });

  // Save roster changes to localStorage for teacher convenience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // Fallback
    }
  }, [students]);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleToggleMute = () => {
    const next = toggleMute();
    setMutedState(next);
  };

  const totalStudents = students.length;
  const activeStudents = students.filter(s => !s.isAbsent).length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-sky-500/20">
      {/* Top Bar Contract (1 row, 3 zones) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStudents={totalStudents}
        activeStudents={activeStudents}
        isMuted={muted}
        onToggleMute={handleToggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            setStudents={setStudents}
            onGoToPicker={() => setActiveTab('picker')}
            onGoToGrouping={() => setActiveTab('groups')}
          />
        )}

        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onGoToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <AutoGroup
            students={students}
            onGoToRoster={() => setActiveTab('roster')}
          />
        )}
      </main>

      {/* Clean quiet educational footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">課堂神隊友</span>
            <span aria-hidden="true">·</span>
            <span>專為互動課堂、翻轉教學與活動分組打造</span>
          </div>

          <div className="flex items-center gap-3">
            <span>支援所有標準 CSV 與 Excel 貼上</span>
            <span aria-hidden="true">·</span>
            <span>離線可用 Web Audio 音效</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
