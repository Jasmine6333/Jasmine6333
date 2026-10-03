export interface Student {
  id: string;
  name: string;
  studentNumber?: string; // 座號，如 "01", "12"
  isAbsent?: boolean;     // 請假 / 不參與抽籤與分組
  notes?: string;
}

export type DrawMode = 'with-replacement' | 'without-replacement';

export interface DrawHistoryItem {
  id: string;
  timestamp: Date;
  student: Student;
  mode: DrawMode;
}

export interface GroupMember extends Student {
  isLeader?: boolean;
}

export interface StudentGroup {
  id: string;
  name: string;
  colorThemeIndex: number;
  members: GroupMember[];
}

export type GroupingStrategy = 'by-size' | 'by-count';
export type RemainderStrategy = 'distribute' | 'separate';
export type TeamNamingTheme = 'number' | 'animal' | 'constellation' | 'gem';

export interface GroupingConfig {
  strategy: GroupingStrategy;
  groupSize: number;       // 每組幾人 (當 strategy === 'by-size')
  groupCount: number;      // 分成幾組 (當 strategy === 'by-count')
  remainderStrategy: RemainderStrategy;
  assignLeaders: boolean;
  namingTheme: TeamNamingTheme;
}
