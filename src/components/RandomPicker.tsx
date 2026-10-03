import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Student, DrawMode, DrawHistoryItem } from '../types';
import { playTick, playFanfare, playResetChime, playPop } from '../utils/soundEffects';
import {
  Dice5,
  RotateCcw,
  Sparkles,
  Trophy,
  History,
  CheckCircle2,
  Users,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onGoToRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({ students, onGoToRoster }) => {
  // Config
  const [drawMode, setDrawMode] = useState<DrawMode>('without-replacement');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [animationDuration, setAnimationDuration] = useState<number>(3000); // 3 seconds standard

  // Active pool of eligible students (excluding absent)
  const activeStudents = students.filter(s => !s.isAbsent);

  // Drawn student IDs in "without-replacement" mode
  const [drawnStudentIds, setDrawnStudentIds] = useState<string[]>([]);
  // Draw history
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);

  // Animation states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplayNames, setCurrentDisplayNames] = useState<Student[]>([]);
  const [latestWinners, setLatestWinners] = useState<Student[]>([]);
  const [copiedHistory, setCopiedHistory] = useState(false);

  const animationTimerRef = useRef<number | null>(null);

  // Eligible pool depending on mode
  const eligibleStudents = drawMode === 'without-replacement'
    ? activeStudents.filter(s => !drawnStudentIds.includes(s.id))
    : activeStudents;

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // Trigger colorful celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Fallback if canvas-confetti fails
    }
  };

  const handleStartDraw = () => {
    if (isDrawing || eligibleStudents.length === 0) return;

    setIsDrawing(true);
    setLatestWinners([]);
    playPop();

    // Determine how many students to pick (cannot pick more than eligible)
    const countToPick = Math.min(batchCount, eligibleStudents.length);
    // Shuffle eligible students to pick the true winners upfront
    const shuffled = [...eligibleStudents].sort(() => Math.random() - 0.5);
    const selectedWinners = shuffled.slice(0, countToPick);

    const startTime = Date.now();
    const duration = animationDuration;

    // Slot machine rolling loop with dynamic easing deceleration
    const stepAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Play tick sound with pitch shifting based on speed
      playTick(1.0 + (1 - progress) * 0.5);

      // Randomly pick names to flash on screen
      const tempDisplay: Student[] = [];
      for (let i = 0; i < countToPick; i++) {
        const randIndex = Math.floor(Math.random() * activeStudents.length);
        tempDisplay.push(activeStudents[randIndex] || eligibleStudents[0]);
      }
      setCurrentDisplayNames(tempDisplay);

      if (progress < 1) {
        // Interval slows down exponentially: 50ms at start -> ~280ms at end
        // easing curve: t^2.5
        const delay = 45 + Math.pow(progress, 2.5) * 260;
        animationTimerRef.current = window.setTimeout(stepAnimation, delay);
      } else {
        // Animation finished!
        finalizeDraw(selectedWinners);
      }
    };

    stepAnimation();
  };

  const finalizeDraw = (winners: Student[]) => {
    setIsDrawing(false);
    setCurrentDisplayNames(winners);
    setLatestWinners(winners);

    // Play fanfare chord and confetti
    playFanfare();
    triggerConfetti();

    // Update drawn list if without-replacement
    if (drawMode === 'without-replacement') {
      const newWinnerIds = winners.map(w => w.id);
      setDrawnStudentIds(prev => [...prev, ...newWinnerIds]);
    }

    // Add to history
    const historyEntries: DrawHistoryItem[] = winners.map(w => ({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      student: w,
      mode: drawMode,
    }));
    setHistory(prev => [...historyEntries, ...prev]);
  };

  const handleResetPool = () => {
    setDrawnStudentIds([]);
    setLatestWinners([]);
    setCurrentDisplayNames([]);
    playResetChime();
  };

  const handleClearHistory = () => {
    if (window.confirm('確定要清空抽籤歷史紀錄嗎？')) {
      setHistory([]);
    }
  };

  const handleCopyHistory = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (item, idx) =>
          `${idx + 1}. [${item.timestamp.toLocaleTimeString()}] ${item.student.studentNumber ? item.student.studentNumber + '號 ' : ''}${item.student.name}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2000);
  };

  // If no students in roster
  if (activeStudents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">尚未匯入學生名單</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          目前名單中沒有學生（或全部學生均標記為請假）。請先前往名單管理匯入或載入示範名單。
        </p>
        <button
          onClick={onGoToRoster}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          前往匯入學生名單 →
        </button>
      </div>
    );
  }

  const isPoolExhausted = drawMode === 'without-replacement' && eligibleStudents.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>課堂隨機抽籤</span>
            <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              動畫與音效
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>可參與人數 <strong className="text-slate-800 tabular-nums">{activeStudents.length}</strong> 人</span>
            <span aria-hidden="true">·</span>
            <span>
              {drawMode === 'without-replacement' ? (
                <span className="text-indigo-600 font-medium">
                  不重複模式（剩餘 <strong className="tabular-nums">{eligibleStudents.length}</strong> 籤）
                </span>
              ) : (
                <span className="text-slate-600 font-medium">可重複抽取模式</span>
              )}
            </span>
          </div>
        </div>

        {/* Draw Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setDrawMode('without-replacement');
              playPop();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              drawMode === 'without-replacement'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            不重複抽籤 (公平輪流)
          </button>
          <button
            onClick={() => {
              setDrawMode('with-replacement');
              playPop();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              drawMode === 'with-replacement'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            可重複抽籤 (機率相同)
          </button>
        </div>
      </div>

      {/* Main Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Center / Primary Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Huge Animated Stage Box */}
          <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl text-center min-h-[380px] flex flex-col justify-between items-center">
            {/* Background subtle radial spotlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Status inside stage */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 z-10">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span>{isDrawing ? '正在翻牌選定中...' : latestWinners.length > 0 ? '抽籤完成！' : '準備抽籤'}</span>
              </div>

              {drawMode === 'without-replacement' && (
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">
                    籤筒進度: {drawnStudentIds.length} / {activeStudents.length}
                  </span>
                  {drawnStudentIds.length > 0 && (
                    <button
                      onClick={handleResetPool}
                      title="重設籤筒 (放回所有名單)"
                      className="text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-1 ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重設</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stage Centerpiece: Rolling Names or Winner Card */}
            <div className="my-auto py-6 z-10 w-full flex flex-col items-center justify-center">
              {isDrawing ? (
                /* Dynamic Rolling Slot Machine View */
                <div className="space-y-3 animate-pulse">
                  <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold">
                    LUCKY PICKER
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {currentDisplayNames.map((student, idx) => (
                      <div
                        key={idx}
                        className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-5 rounded-2xl shadow-inner min-w-[200px]"
                      >
                        <div className="text-xs text-sky-300 font-mono tabular-nums mb-1">
                          {student.studentNumber ? `座號 ${student.studentNumber}` : `候選 ${idx + 1}`}
                        </div>
                        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                          {student.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : latestWinners.length > 0 ? (
                /* Winner Showcase */
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full text-xs font-semibold">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>恭喜被抽中！</span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    {latestWinners.map((winner) => (
                      <div
                        key={winner.id}
                        className="bg-gradient-to-b from-white/15 to-white/5 border border-sky-400/50 p-6 sm:p-8 rounded-3xl shadow-2xl min-w-[240px] transform transition-transform hover:scale-105"
                      >
                        {winner.studentNumber && (
                          <div className="text-sm font-mono text-sky-300 mb-1 tabular-nums">
                            座號 {winner.studentNumber}
                          </div>
                        )}
                        <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-amber-200 tracking-tight">
                          {winner.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Ready State */
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-sky-400">
                    <Dice5 className="w-8 h-8" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">
                    點擊下方按鈕開始抽籤
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    伴隨緊張輪盤轉動音效與慶祝彩帶，點選後將為您隨機抽出學生！
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions inside stage */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 z-10 pt-4">
              {isPoolExhausted ? (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                  <div className="text-xs text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>全部學生皆已被抽出！請重設籤筒後再抽。</span>
                  </div>
                  <button
                    onClick={handleResetPool}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>重設籤筒 (重新開始)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartDraw}
                  disabled={isDrawing || eligibleStudents.length === 0}
                  className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-sky-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{isDrawing ? '抽籤進行中...' : latestWinners.length > 0 ? '再抽一次！' : '開始抽籤'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Options Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Batch count option */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">一次抽出人數：</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {[1, 2, 3].map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      setBatchCount(count);
                      playPop();
                    }}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                      batchCount === count
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {count} 人
                  </button>
                ))}
              </div>
            </div>

            {/* Animation speed option */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">懸疑音效時長：</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {[
                  { label: '快速 (1.5s)', ms: 1500 },
                  { label: '標準 (3s)', ms: 3000 },
                  { label: '懸疑 (4.5s)', ms: 4500 },
                ].map(speed => (
                  <button
                    key={speed.ms}
                    onClick={() => {
                      setAnimationDuration(speed.ms);
                      playPop();
                    }}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                      animationDuration === speed.ms
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Pool Indicator in Without-Replacement Mode */}
          {drawMode === 'without-replacement' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  籤筒狀態 (不重複抽籤池)
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  剩餘 {eligibleStudents.length} / 共 {activeStudents.length} 人
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${activeStudents.length > 0 ? (drawnStudentIds.length / activeStudents.length) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Student Tags Grid */}
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                {activeStudents.map(student => {
                  const isDrawn = drawnStudentIds.includes(student.id);
                  return (
                    <span
                      key={student.id}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isDrawn
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'bg-sky-50 text-sky-800 border border-sky-100'
                      }`}
                    >
                      {student.studentNumber ? `${student.studentNumber}. ` : ''}
                      {student.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right / History Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <History className="w-4 h-4 text-slate-600" />
              <span>抽籤歷史紀錄</span>
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyHistory}
                  title="複製抽籤名單"
                  className="text-xs text-slate-600 hover:text-slate-900 p-1 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                >
                  {copiedHistory ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHistory ? '已複製' : '複製'}</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  title="清除紀錄"
                  className="text-xs text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                >
                  清除
                </button>
              </div>
            )}
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              尚無抽籤紀錄，抽籤結果將即時列在此處
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 tabular-nums w-5 text-center">
                      #{history.length - idx}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">
                      {item.student.name}
                    </span>
                    {item.student.studentNumber && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ({item.student.studentNumber}號)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
