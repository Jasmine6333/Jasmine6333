import { Student } from '../types';

/**
 * Generate unique id
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Parse raw text or pasted content into Student array.
 * Robustly parses:
 * - Tab-separated columns (Excel / Google Sheets paste)
 * - Comma-separated or semicolon-separated values
 * - Numbered lines (e.g., "1. 王小明", "02、張雅婷", "03 陳俊傑")
 * - Simple line-by-line names
 */
export function parsePastedRoster(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Remove UTF-8 BOM if present
  let cleanText = text.replace(/^\uFEFF/, '');
  // Normalize line breaks
  const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (rawLines.length === 0) return [];

  // Check if it's comma-separated on a single or few lines
  if (rawLines.length === 1 && (rawLines[0].includes(',') || rawLines[0].includes('、') || rawLines[0].includes('，'))) {
    const tokens = rawLines[0].split(/[,，、]+/).map(t => t.trim()).filter(Boolean);
    return tokens.map((name, idx) => ({
      id: generateId(),
      name: cleanStudentName(name),
      studentNumber: String(idx + 1).padStart(2, '0'),
      isAbsent: false,
    }));
  }

  const students: Student[] = [];
  let autoIndex = 1;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Check if header row like "座號\t姓名" or "姓名,備註" or "Name"
    if (i === 0 && isHeaderRow(line)) {
      continue;
    }

    // Try tab separated (Excel paste)
    if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Check which column looks like a seat number vs name
        let seatNo = '';
        let name = '';
        if (/^\d+$/.test(parts[0])) {
          seatNo = parts[0].padStart(2, '0');
          name = parts[1];
        } else if (/^\d+$/.test(parts[1])) {
          seatNo = parts[1].padStart(2, '0');
          name = parts[0];
        } else {
          name = parts[0];
          seatNo = String(autoIndex).padStart(2, '0');
        }
        if (name) {
          students.push({
            id: generateId(),
            name: cleanStudentName(name),
            studentNumber: seatNo || String(autoIndex).padStart(2, '0'),
            isAbsent: false,
          });
          autoIndex++;
          continue;
        }
      } else if (parts.length === 1 && parts[0]) {
        students.push({
          id: generateId(),
          name: cleanStudentName(parts[0]),
          studentNumber: String(autoIndex).padStart(2, '0'),
          isAbsent: false,
        });
        autoIndex++;
        continue;
      }
    }

    // Try comma separated (CSV paste)
    if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (parts.length >= 2) {
        let seatNo = '';
        let name = '';
        if (/^\d+$/.test(parts[0])) {
          seatNo = parts[0].padStart(2, '0');
          name = parts[1];
        } else {
          name = parts[0];
          seatNo = String(autoIndex).padStart(2, '0');
        }
        if (name) {
          students.push({
            id: generateId(),
            name: cleanStudentName(name),
            studentNumber: seatNo,
            isAbsent: false,
          });
          autoIndex++;
          continue;
        }
      }
    }

    // Single line: check for prefixes like "1. 王小明", "01 李大華", "12、陳志豪"
    const numberPrefixMatch = line.match(/^(\d+)[\.\s、\-:\t]+(.+)$/);
    if (numberPrefixMatch) {
      const seatNo = numberPrefixMatch[1].padStart(2, '0');
      const name = numberPrefixMatch[2].trim();
      if (name) {
        students.push({
          id: generateId(),
          name: cleanStudentName(name),
          studentNumber: seatNo,
          isAbsent: false,
        });
        autoIndex++;
        continue;
      }
    }

    // Plain name line
    const cleaned = cleanStudentName(line);
    if (cleaned) {
      students.push({
        id: generateId(),
        name: cleaned,
        studentNumber: String(autoIndex).padStart(2, '0'),
        isAbsent: false,
      });
      autoIndex++;
    }
  }

  return students;
}

/**
 * Clean student name from extraneous quotes or markers
 */
function cleanStudentName(name: string): string {
  return name.replace(/^["']|["']$/g, '').trim();
}

/**
 * Detect if line is likely a header row
 */
function isHeaderRow(line: string): boolean {
  const lower = line.toLowerCase();
  const headerKeywords = ['姓名', '座號', '學號', '名單', 'name', 'student', 'id', 'no', 'number', '班級', '備註'];
  return headerKeywords.some(kw => lower.includes(kw));
}

/**
 * Parse CSV file text
 */
export function parseCSVFile(content: string): Student[] {
  return parsePastedRoster(content);
}

/**
 * Export student roster to CSV string (with UTF-8 BOM so Excel opens it with Chinese characters correctly)
 */
export function exportRosterToCSV(students: Student[]): string {
  const header = '座號,姓名,狀態\n';
  const rows = students
    .map(s => `${s.studentNumber || ''},"${s.name.replace(/"/g, '""')}",${s.isAbsent ? '請假' : '在校'}`)
    .join('\n');
  return '\uFEFF' + header + rows;
}

/**
 * Preset sample class rosters for quick testing
 */
export const SAMPLE_ROSTERS: { id: string; title: string; count: number; data: string[] }[] = [
  {
    id: 'class-30',
    title: '三年二班標準名單 (30人)',
    count: 30,
    data: [
      '陳冠宇', '林怡君', '張庭維', '王美玲', '李俊廷',
      '黃詩涵', '吳柏翰', '蔡雅婷', '許家豪', '鄭羽彤',
      '謝宗翰', '洪舒婷', '曾子軒', '劉又嘉', '郭威廷',
      '賴品妤', '邱振宇', '周佳穎', '葉承恩', '徐曼晴',
      '廖冠霖', '莊佩珊', '楊景皓', '鐘心妤', '宋致遠',
      '方晨曦', '羅偉誠', '童若涵', '彭彥勳', '蕭品安'
    ]
  },
  {
    id: 'class-16',
    title: '多元小班示範 (16人)',
    count: 16,
    data: [
      'Alex', 'Bella', 'Charlie', 'Diana',
      'Ethan', 'Fiona', 'George', 'Hannah',
      'Ian', 'Julia', 'Kevin', 'Luna',
      'Max', 'Nina', 'Oliver', 'Penny'
    ]
  }
];

export function getSampleStudents(rosterId: string = 'class-30'): Student[] {
  const roster = SAMPLE_ROSTERS.find(r => r.id === rosterId) || SAMPLE_ROSTERS[0];
  return roster.data.map((name, i) => ({
    id: generateId(),
    name,
    studentNumber: String(i + 1).padStart(2, '0'),
    isAbsent: false,
  }));
}
