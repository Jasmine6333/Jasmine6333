import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { parsePastedRoster, parseCSVFile, exportRosterToCSV, getSampleStudents, generateId } from '../utils/csvParser';
import { playPop } from '../utils/soundEffects';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  UserX,
  UserCheck,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  Edit2
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onGoToPicker: () => void;
  onGoToGrouping: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  setStudents,
  onGoToPicker,
  onGoToGrouping,
}) => {
  const [pasteInput, setPasteInput] = useState('');
  const [activeInputMode, setActiveInputMode] = useState<'csv' | 'paste'>('paste');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStudents = students.filter(s => !s.isAbsent);
  const absentStudents = students.filter(s => s.isAbsent);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentNumber && s.studentNumber.includes(searchQuery))
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCSVFile(content);
        if (parsed.length > 0) {
          setStudents(parsed);
          playPop();
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteInput.trim()) return;
    const parsed = parsePastedRoster(pasteInput);
    if (parsed.length > 0) {
      setStudents(parsed);
      setPasteInput('');
      playPop();
    }
  };

  const handleAppendPasteImport = () => {
    if (!pasteInput.trim()) return;
    const parsed = parsePastedRoster(pasteInput);
    if (parsed.length > 0) {
      setStudents(prev => [...prev, ...parsed]);
      setPasteInput('');
      playPop();
    }
  };

  const handleLoadSample = (sampleId: string = 'class-30') => {
    const sample = getSampleStudents(sampleId);
    setStudents(sample);
    playPop();
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nextNumber = String(students.length + 1).padStart(2, '0');
    const newStudent: Student = {
      id: generateId(),
      name: newStudentName.trim(),
      studentNumber: nextNumber,
      isAbsent: false,
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    playPop();
  };

  const handleToggleAbsent = (id: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, isAbsent: !s.isAbsent } : s))
    );
    playPop();
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空目前所有學生名單嗎？')) {
      setStudents([]);
    }
  };

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditingName(student.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, name: editingName.trim() } : s))
    );
    setEditingStudentId(null);
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvContent = exportRosterToCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyNames = () => {
    if (students.length === 0) return;
    const names = students.map(s => `${s.studentNumber ? s.studentNumber + '. ' : ''}${s.name}`).join('\n');
    navigator.clipboard.writeText(names);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            學生名單管理
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>支援 CSV 上傳</span>
            <span aria-hidden="true">·</span>
            <span>直接貼上文字</span>
            <span aria-hidden="true">·</span>
            <span>座號與請假標記</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadSample('class-30')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>載入 30 人示範名單</span>
          </button>
          {students.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="匯出 CSV 檔案"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">匯出 CSV</span>
              </button>
              <button
                onClick={handleCopyNames}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="複製純文字名單"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedNotification ? '已複製！' : '複製文字'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left = Input/Import Deck, Right = Roster List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Import & Add Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            {/* Tab switch between Paste & CSV */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-semibold text-slate-900">匯入名單</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveInputMode('paste')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeInputMode === 'paste'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <ClipboardPaste className="w-3 h-3" />
                    貼上文字
                  </span>
                </button>
                <button
                  onClick={() => setActiveInputMode('csv')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeInputMode === 'csv'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    CSV 上傳
                  </span>
                </button>
              </div>
            </div>

            {/* Paste Mode */}
            {activeInputMode === 'paste' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  可直接從 Excel、Word 或記事本複製學生姓名貼在下方。支援「換行」、「逗號」、「座號+姓名（如 01 王小明）」格式：
                </p>
                <textarea
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder={`例如：\n01 陳冠宇\n02 林怡君\n03 張庭維\n04 王美玲\n\n或直接以逗號隔開：\n陳冠宇, 林怡君, 張庭維`}
                  rows={6}
                  className="w-full text-sm font-mono p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none placeholder:text-slate-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePasteImport}
                    disabled={!pasteInput.trim()}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:hover:bg-sky-600 rounded-lg transition-colors shadow-xs"
                  >
                    替換現有名單
                  </button>
                  <button
                    onClick={handleAppendPasteImport}
                    disabled={!pasteInput.trim()}
                    className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    附加至現有名單
                  </button>
                </div>
              </div>
            ) : (
              /* CSV Upload Mode */
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-slate-800">
                    點擊或拖曳 CSV 檔案至此
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    支援包含「姓名」欄位之 UTF-8 / Excel 匯出檔
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    小提示：若從 Excel 另存為「CSV (逗點分隔) (*.csv)」，本系統會自動判讀座號與姓名欄位，並支援繁體中文不會亂碼。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Single Student */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <span className="text-sm font-semibold text-slate-900">手動單筆新增</span>
            <form onSubmit={handleAddSingleStudent} className="flex gap-2">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="輸入學生姓名..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!newStudentName.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增</span>
              </button>
            </form>
          </div>

          {/* Quick Actions Card for Teacher */}
          {students.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 space-y-4">
              <div className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                下一步操作
              </div>
              <div className="text-sm text-slate-200">
                名單已就緒！目前共有 <span className="font-bold text-white tabular-nums">{activeStudents.length}</span> 位學生參與抽籤與分組。
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onGoToPicker}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors text-center"
                >
                  前往隨機抽籤 →
                </button>
                <button
                  onClick={onGoToGrouping}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-center"
                >
                  前往自動分組 →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Student Roster Table & List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-base font-semibold text-slate-900">
                班級學生名冊
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>總計 <strong className="text-slate-800 tabular-nums">{students.length}</strong> 人</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700">可抽籤/分組 <strong className="tabular-nums">{activeStudents.length}</strong> 人</span>
                {absentStudents.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-600">請假 <strong className="tabular-nums">{absentStudents.length}</strong> 人</span>
                  </>
                )}
              </div>
            </div>

            {students.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 self-start sm:self-auto py-1 px-2 hover:bg-rose-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空名單</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          {students.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋座號或學生姓名..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          )}

          {/* Empty State */}
          {students.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="text-base font-semibold text-slate-800">
                目前尚無學生名單
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                請在左側貼上姓名、上傳 CSV 檔案，或點選上方「載入 30 人示範名單」立即體驗！
              </p>
              <button
                onClick={() => handleLoadSample('class-30')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 rounded-lg transition-colors mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>載入 30 人示範名單</span>
              </button>
            </div>
          ) : (
            /* Student List Grid */
            <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  查無符合「{searchQuery}」的學生
                </div>
              ) : (
                filteredStudents.map((student, idx) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                      student.isAbsent ? 'bg-slate-50/70 text-slate-400' : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Seat number */}
                      <span className="font-mono text-xs text-slate-400 w-7 shrink-0 tabular-nums">
                        {student.studentNumber || String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Name with inline editing */}
                      {editingStudentId === student.id ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(student.id);
                              if (e.key === 'Escape') setEditingStudentId(null);
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs border border-sky-500 rounded bg-white font-medium"
                          />
                          <button
                            onClick={() => handleSaveEdit(student.id)}
                            className="text-xs px-2 py-0.5 bg-sky-600 text-white rounded font-medium"
                          >
                            儲存
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`font-medium truncate ${
                            student.isAbsent ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {student.name}
                        </span>
                      )}

                      {/* Status indicator */}
                      {student.isAbsent && (
                        <span className="text-[11px] text-rose-500 font-medium">
                          (請假中)
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle Absent Button */}
                      <button
                        onClick={() => handleToggleAbsent(student.id)}
                        title={student.isAbsent ? '取消請假 (設為出席)' : '設為請假 (不參與抽籤/分組)'}
                        className={`p-1.5 rounded-md transition-colors ${
                          student.isAbsent
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        {student.isAbsent ? (
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(student)}
                        title="編輯姓名"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        title="刪除"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
