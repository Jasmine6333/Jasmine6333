import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Student,
  StudentGroup,
  GroupMember,
  GroupingConfig,
  GroupingStrategy,
  RemainderStrategy,
  TeamNamingTheme
} from '../types';
import { playShuffle, playFanfare, playPop } from '../utils/soundEffects';
import {
  Shuffle,
  Users,
  Crown,
  Copy,
  Check,
  Download,
  RotateCw,
  Palette,
  Sparkles,
  ArrowRightLeft,
  MoveRight
} from 'lucide-react';

interface AutoGroupProps {
  students: Student[];
  onGoToRoster: () => void;
}

const THEME_NAMES: Record<TeamNamingTheme, string[]> = {
  number: ['第 1 組', '第 2 組', '第 3 組', '第 4 組', '第 5 組', '第 6 組', '第 7 組', '第 8 組', '第 9 組', '第 10 組', '第 11 組', '第 12 組'],
  animal: ['神鷹隊 🦅', '獵豹隊 🐆', '飛龍隊 🐉', '海豚隊 🐬', '靈狐隊 🦊', '雪狼隊 🐺', '黑豹隊 🐾', '雄獅隊 🦁', '白虎隊 🐯', '玄武隊 🐢', '金雕隊 🦅', '猛瑪隊 🦣'],
  constellation: ['獵戶座 ✨', '仙女座 🌟', '天鵝座 🌌', '天琴座 🪐', '飛馬座 🚀', '鳳凰座 🔥', '金牛座 💫', '天蠍座 🌠', '英仙座 ⭐', '雙子座 🌙', '獅子座 ☀️', '白羊座 ⚡'],
  gem: ['藍寶石組 💎', '翡翠組 🟩', '紅寶石組 🔴', '琥珀組 🍯', '紫水晶組 🔮', '鑽石組 💍', '黑曜石組 🖤', '黃玉組 🟨', '碧璽組 🌺', '瑪瑙組 🪨', '尖晶石組 🌸', '青金石組 🌊']
};

const COLOR_PALETTES = [
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-900', badge: 'bg-sky-100 text-sky-800', accent: '#0284c7' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-800', accent: '#6366f1' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800', accent: '#10b981' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800', accent: '#f59e0b' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800', accent: '#f43f5e' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800', accent: '#a855f7' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-100 text-teal-800', accent: '#14b8a6' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-800', accent: '#f97316' },
];

export const AutoGroup: React.FC<AutoGroupProps> = ({ students, onGoToRoster }) => {
  const activeStudents = students.filter(s => !s.isAbsent);

  // Grouping configuration
  const [config, setConfig] = useState<GroupingConfig>({
    strategy: 'by-size', // 'by-size' (每組幾人) or 'by-count' (分成幾組)
    groupSize: 4,
    groupCount: 4,
    remainderStrategy: 'distribute', // 'distribute' (平均分配) or 'separate' (獨立成組)
    assignLeaders: true,
    namingTheme: 'animal',
  });

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Quick move dialog state
  const [movingMember, setMovingMember] = useState<{ member: GroupMember; fromGroupId: string } | null>(null);

  // Execute grouping calculation
  const handleExecuteGrouping = () => {
    if (activeStudents.length === 0) return;

    setIsShuffling(true);
    playShuffle();

    setTimeout(() => {
      // 1. Shuffle students randomly
      const pool = [...activeStudents].sort(() => Math.random() - 0.5);
      const total = pool.length;

      let targetNumGroups = 1;

      if (config.strategy === 'by-size') {
        const size = Math.max(1, config.groupSize);
        if (config.remainderStrategy === 'distribute') {
          // Calculate number of base groups so remainders spread nicely
          targetNumGroups = Math.max(1, Math.round(total / size));
        } else {
          // Separate remainder into its own group
          targetNumGroups = Math.max(1, Math.ceil(total / size));
        }
      } else {
        // By count
        targetNumGroups = Math.max(1, Math.min(total, config.groupCount));
      }

      // Initialize groups
      const themeNames = THEME_NAMES[config.namingTheme];
      const newGroups: StudentGroup[] = Array.from({ length: targetNumGroups }, (_, i) => ({
        id: `group-${i + 1}-${Date.now()}`,
        name: themeNames[i % themeNames.length] || `第 ${i + 1} 組`,
        colorThemeIndex: i % COLOR_PALETTES.length,
        members: [],
      }));

      // Distribute students
      if (config.strategy === 'by-size' && config.remainderStrategy === 'separate') {
        // Fill chunk by chunk
        let currentGroupIdx = 0;
        for (let i = 0; i < pool.length; i++) {
          if (newGroups[currentGroupIdx].members.length >= config.groupSize && currentGroupIdx < newGroups.length - 1) {
            currentGroupIdx++;
          }
          newGroups[currentGroupIdx].members.push({ ...pool[i], isLeader: false });
        }
      } else {
        // Round-robin distribution for perfectly balanced groups
        for (let i = 0; i < pool.length; i++) {
          const targetIndex = i % targetNumGroups;
          newGroups[targetIndex].members.push({ ...pool[i], isLeader: false });
        }
      }

      // Assign leaders if configured
      if (config.assignLeaders) {
        newGroups.forEach(g => {
          if (g.members.length > 0) {
            const leaderIdx = Math.floor(Math.random() * g.members.length);
            g.members[leaderIdx].isLeader = true;
          }
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);
      playFanfare();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Fallback
      }
    }, 450);
  };

  // Re-elect group leaders without reshuffling members
  const handleRerollLeaders = () => {
    if (groups.length === 0) return;
    setGroups(prev =>
      prev.map(g => {
        if (g.members.length === 0) return g;
        const newLeaderIdx = Math.floor(Math.random() * g.members.length);
        const updatedMembers = g.members.map((m, idx) => ({
          ...m,
          isLeader: idx === newLeaderIdx,
        }));
        return { ...g, members: updatedMembers };
      })
    );
    playPop();
  };

  // Toggle leader status on specific student
  const handleToggleLeader = (groupId: string, memberId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          members: g.members.map(m =>
            m.id === memberId ? { ...m, isLeader: !m.isLeader } : m
          ),
        };
      })
    );
    playPop();
  };

  // Move member from one group to another
  const handleMoveMember = (targetGroupId: string) => {
    if (!movingMember || movingMember.fromGroupId === targetGroupId) {
      setMovingMember(null);
      return;
    }

    setGroups(prev => {
      // Remove from source group
      const next = prev.map(g => {
        if (g.id === movingMember.fromGroupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== movingMember.member.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, movingMember.member],
          };
        }
        return g;
      });
      return next;
    });

    setMovingMember(null);
    playPop();
  };

  // Rename a group
  const handleRenameGroup = (groupId: string, newName: string) => {
    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, name: newName } : g))
    );
  };

  // Copy formatted grouping results
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `📋 【班級分組名單】（共 ${groups.length} 組，${activeStudents.length} 人）\n\n`;
    groups.forEach((g, idx) => {
      const leader = g.members.find(m => m.isLeader);
      const memberList = g.members
        .map(m => `${m.name}${m.isLeader ? ' (⭐組長)' : ''}`)
        .join('、');
      text += `【${g.name}】(${g.members.length}人)\n`;
      if (leader) {
        text += `組長：${leader.name}\n`;
      }
      text += `成員：${memberList}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Export grouping to CSV
  const handleExportCSV = () => {
    if (groups.length === 0) return;
    let csv = '\uFEFF組別,座號,姓名,是否為組長\n';
    groups.forEach(g => {
      g.members.forEach(m => {
        csv += `"${g.name.replace(/"/g, '""')}","${m.studentNumber || ''}","${m.name.replace(/"/g, '""')}",${m.isLeader ? '是' : '否'}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `分組結果_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // If no students
  if (activeStudents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">尚未匯入學生名單</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          自動分組需要名單來源。請先前往名單管理匯入或載入示範名單。
        </p>
        <button
          onClick={onGoToRoster}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          前往匯入學生名單 →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>課堂自動分組</span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              視覺化顯示
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>參與分組學生 <strong className="text-slate-800 tabular-nums">{activeStudents.length}</strong> 人</span>
            <span aria-hidden="true">·</span>
            <span>
              {config.strategy === 'by-size'
                ? `設定每組 ${config.groupSize} 人`
                : `設定分成 ${config.groupCount} 組`}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <>
              <button
                onClick={handleCopyResults}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="複製文字格式名單"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? '已複製！' : '複製分組名單'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="匯出分組 CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">匯出 CSV</span>
              </button>
              <button
                onClick={handleRerollLeaders}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                title="每組重新隨機選出組長"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">重選組長</span>
              </button>
            </>
          )}

          <button
            onClick={handleExecuteGrouping}
            disabled={isShuffling}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{groups.length > 0 ? '重新隨機分組' : '開始隨機分組'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
          <span>分組規則與設定</span>
          <span className="text-xs font-normal text-slate-500">
            預計產生約 <strong className="text-slate-800 tabular-nums">
              {config.strategy === 'by-size'
                ? Math.round(activeStudents.length / Math.max(1, config.groupSize))
                : config.groupCount}
            </strong> 組
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Strategy selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">分組方式</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setConfig(prev => ({ ...prev, strategy: 'by-size' }));
                  playPop();
                }}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                  config.strategy === 'by-size'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依每組人數
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfig(prev => ({ ...prev, strategy: 'by-count' }));
                  playPop();
                }}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                  config.strategy === 'by-count'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依指定組數
              </button>
            </div>
          </div>

          {/* Group size or group count input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              {config.strategy === 'by-size' ? '每組人數 (人)' : '總組數 (組)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={activeStudents.length || 50}
                value={config.strategy === 'by-size' ? config.groupSize : config.groupCount}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  if (config.strategy === 'by-size') {
                    setConfig(prev => ({ ...prev, groupSize: val }));
                  } else {
                    setConfig(prev => ({ ...prev, groupCount: val }));
                  }
                }}
                className="w-full px-3 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex gap-1 shrink-0">
                {[3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (config.strategy === 'by-size') {
                        setConfig(prev => ({ ...prev, groupSize: num }));
                      } else {
                        setConfig(prev => ({ ...prev, groupCount: num }));
                      }
                      playPop();
                    }}
                    className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Remainder strategy */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">餘數處理方式</label>
            <select
              value={config.remainderStrategy}
              onChange={(e) => setConfig(prev => ({ ...prev, remainderStrategy: e.target.value as RemainderStrategy }))}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="distribute">平均分配至各組 (推薦)</option>
              <option value="separate">獨立成最後一組</option>
            </select>
          </div>

          {/* Naming theme & Leader toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">組名風格 & 組長</label>
            <div className="flex gap-2">
              <select
                value={config.namingTheme}
                onChange={(e) => {
                  const newTheme = e.target.value as TeamNamingTheme;
                  setConfig(prev => ({ ...prev, namingTheme: newTheme }));
                  // Update current group names if already formed
                  if (groups.length > 0) {
                    const names = THEME_NAMES[newTheme];
                    setGroups(gList =>
                      gList.map((g, idx) => ({
                        ...g,
                        name: names[idx % names.length] || `第 ${idx + 1} 組`,
                      }))
                    );
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="animal">動物猛獸隊 🦅</option>
                <option value="constellation">宇宙星座隊 ✨</option>
                <option value="gem">寶石水晶隊 💎</option>
                <option value="number">經典數字組</option>
              </select>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, assignLeaders: !prev.assignLeaders }))}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                  config.assignLeaders
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
                title="是否隨機指派每組組長"
              >
                <Crown className={`w-3.5 h-3.5 ${config.assignLeaders ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>組長</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualized Group Cards Display */}
      {groups.length === 0 ? (
        <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-3xl py-16 text-center space-y-4">
          <div className="w-14 h-14 bg-white shadow-xs rounded-2xl flex items-center justify-center mx-auto text-indigo-500">
            <Shuffle className="w-7 h-7" />
          </div>
          <div className="text-base font-semibold text-slate-800">
            尚未進行分組
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            確認上方每組人數與規則後，點擊「開始隨機分組」按鈕，系統將瞬間產生視覺化分組卡片！
          </p>
          <button
            onClick={handleExecuteGrouping}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>開始隨機分組</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              已完成分組：共 <strong className="text-slate-800 tabular-nums">{groups.length}</strong> 組，平均每組約 <strong className="tabular-nums">{(activeStudents.length / groups.length).toFixed(1)}</strong> 人
            </span>
            <span className="hidden sm:inline">
              點擊組名可直接更名 · 點擊成員星號 ⭐ 可指定組長 · 點擊右側箭頭 ⇄ 可微調換組
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {groups.map((group) => {
              const theme = COLOR_PALETTES[group.colorThemeIndex] || COLOR_PALETTES[0];
              return (
                <div
                  key={group.id}
                  className={`border ${theme.border} ${theme.bg} rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-md`}
                >
                  {/* Card Header: Group Name + Member Count */}
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5 mb-3">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                        className={`font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded transition-colors ${theme.text} flex-1`}
                        title="點擊直接修改組名"
                      />
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${theme.badge} shrink-0`}>
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member List */}
                    <div className="space-y-1.5">
                      {group.members.map((member) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors bg-white/80 border ${
                            member.isLeader ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {member.studentNumber && (
                              <span className="font-mono text-[11px] text-slate-400 w-5 shrink-0 tabular-nums">
                                {member.studentNumber}
                              </span>
                            )}
                            <span className="font-medium text-slate-800 truncate">
                              {member.name}
                            </span>
                            {member.isLeader && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-600" />
                                <span>組長</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Toggle leader button */}
                            <button
                              onClick={() => handleToggleLeader(group.id, member.id)}
                              title={member.isLeader ? '取消組長標記' : '設為組長'}
                              className="p-1 text-slate-400 hover:text-amber-500 rounded transition-colors"
                            >
                              <Crown className={`w-3.5 h-3.5 ${member.isLeader ? 'text-amber-500 fill-amber-400' : ''}`} />
                            </button>

                            {/* Move to another group button */}
                            <button
                              onClick={() => setMovingMember({ member, fromGroupId: group.id })}
                              title="移動至其他組"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Empty group fallback */}
                  {group.members.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      此組目前無成員
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for moving student between groups */}
      {movingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                微調組別：移動學生
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                選擇將 <strong className="text-slate-800">{movingMember.member.name}</strong> 移動至哪一組：
              </p>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {groups.map(g => (
                <button
                  key={g.id}
                  disabled={g.id === movingMember.fromGroupId}
                  onClick={() => handleMoveMember(g.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    g.id === movingMember.fromGroupId
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800'
                  }`}
                >
                  <span>{g.name}</span>
                  <span className="font-mono text-slate-500">{g.members.length} 人</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMovingMember(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
