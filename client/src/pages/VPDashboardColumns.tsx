import { h } from 'gridjs';
import { FridayData, CLASSROOMS } from './VPDashboardTypes';
import { DATE_REGEX, isDateInPast } from './VPDashboardUtils';

interface ColumnDef {
  name: string;
  id: string;
}

export const getFridayColumns = (fridayData: FridayData[], selectedDates: Set<string>): ColumnDef[] => {
  if (fridayData.length === 0) return [];
  const keys = Object.keys(fridayData[0]);
  const hidden = ['id', 'ta_code', 'email', 'session_day', 'is_active', 'created_at', 'phone', 'attendance_count', 'absence_count', 'classroom'];
  const nonDateKeys = keys.filter(k => !DATE_REGEX.test(k) && !hidden.includes(k));
  const selectedUnderscored = new Set(Array.from(selectedDates).map(d => d.replace(/-/g, '_')));
  const dateKeys = keys.filter(k => {
    if (!DATE_REGEX.test(k) || !selectedUnderscored.has(k)) return false;
    const [year, month, day] = k.split('_').map(Number);
    return new Date(year, month - 1, day).getDay() === 5;
  }).sort();

  const koreanNameIndex = nonDateKeys.indexOf('korean_name');
  const insertAt = koreanNameIndex >= 0 ? koreanNameIndex + 1 : nonDateKeys.length;
  nonDateKeys.splice(insertAt, 0, 'classroom');

  return [
    ...[...nonDateKeys, ...dateKeys].map(key => ({
      name: DATE_REGEX.test(key)
        ? key.split('_').slice(1).join('-') // get rid of the year
        : key === 'classroom'
          ? 'Classroom'
          : key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      id: key,
    })),
    { name: 'Presences', id: '__days_present__' },
    { name: 'Absences', id: '__days_absent__' },
  ];
};

export const getSaturdayColumns = (saturdayData: any[], selectedDates: Set<string>): ColumnDef[] => {
  if (saturdayData.length === 0) return [];
  const keys = Object.keys(saturdayData[0]);
  const hidden = ['id', 'ta_code', 'email', 'session_day', 'is_active', 'created_at', 'phone', 'attendance_count', 'absence_count', 'classroom'];
  const nonDateKeys = keys.filter(k => !DATE_REGEX.test(k) && !hidden.includes(k));
  const selectedUnderscored = new Set(Array.from(selectedDates).map(d => d.replace(/-/g, '_')));
  const dateKeys = keys.filter(k => {
    if (!DATE_REGEX.test(k) || !selectedUnderscored.has(k)) return false;
    const [year, month, day] = k.split('_').map(Number);
    return new Date(year, month - 1, day).getDay() === 6;
  }).sort();

  const koreanNameIndex = nonDateKeys.indexOf('korean_name');
  const insertAt = koreanNameIndex >= 0 ? koreanNameIndex + 1 : nonDateKeys.length;
  nonDateKeys.splice(insertAt, 0, 'classroom');

  return [
    ...[...nonDateKeys, ...dateKeys].map(key => ({
      name: DATE_REGEX.test(key)
        ? key.split('_').slice(1).join('-') // get rid of the year
        : key === 'classroom'
          ? 'Classroom'
          : key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      id: key,
    })),
    { name: 'Presences', id: '__days_present__' },
    { name: 'Absences', id: '__days_absent__' },
  ];
};

export const buildFridayGridColumns = (
  cols: ColumnDef[],
  fridayData: FridayData[],
  darkMode: boolean,
  updateClassroom: (taId: number, classroom: string) => void,
) => cols.map(col => ({
  name: col.name,
  width: col.id === 'classroom' ? '180px' : col.id === '__days_present__' || col.id === '__days_absent__' ? '100px' : DATE_REGEX.test(col.id) ? '90px' : '150px',
  formatter: (cell: any, row: any) => {
    if (col.id === '__days_present__') return h('span', { style: `font-weight: 600; color: ${darkMode ? '#4ade80' : '#16a34a'};` }, String(cell ?? 0));
    if (col.id === '__days_absent__') return h('span', { style: `font-weight: 600; color: ${darkMode ? '#f87171' : '#dc2626'};` }, String(cell ?? 0));

    if (col.id === 'classroom') {
      const idColIndex = cols.findIndex(c => c.id === 'korean_name');
      const koreanName = idColIndex >= 0 ? row.cells[idColIndex].data : null;
      const taMatch = fridayData.find(r => r.korean_name === koreanName);
      const taId = taMatch?.id;
      return h('select', {
        style: `padding: 4px 8px; border-radius: 4px; border: 1px solid ${darkMode ? '#4b5563' : '#93c5fd'}; background-color: ${darkMode ? '#273549' : '#eff6ff'}; color: ${darkMode ? '#e5e7eb' : '#1e40af'}; font-size: 13px; cursor: pointer; width: 100%;`,
        onchange: (e: Event) => { if (taId) updateClassroom(taId, (e.target as HTMLSelectElement).value); },
      }, [
        h('option', { value: '' }, '— Select —'),
        ...CLASSROOMS.map(room => h('option', { value: room, selected: cell === room }, room)),
      ]);
    }

    if (DATE_REGEX.test(col.id)) {
      if (cell === true) return '✓';
      if (cell === false) {
        // clocked in but not out yet — still show ✓ for today
        const [y, m, d] = col.id.split('_').map(Number);
        const colDate = new Date(y, m - 1, d);
        const today = new Date(); today.setHours(0,0,0,0);
        if (colDate.getTime() === today.getTime()) return '✓';
        return '✗';
      }
      if (isDateInPast(col.id)) return '✗';
      return '';
    }

    if (cell === true) return '✓';
    if (cell === false) return '✗';
    if (cell === null || cell === undefined) return '';
    return cell;
  },
}));

export const buildSaturdayGridColumns = (
  cols: ColumnDef[],
  saturdayData: any[],
  darkMode: boolean,
  updateClassroom: (taId: number, classroom: string) => void,
) => cols.map(col => ({
  name: col.name,
  width: col.id === 'classroom' ? '180px' : col.id === '__days_present__' || col.id === '__days_absent__' ? '100px' : DATE_REGEX.test(col.id) ? '90px' : '150px',
  formatter: (cell: any, row: any) => {
    if (col.id === '__days_present__') return h('span', { style: `font-weight: 600; color: ${darkMode ? '#4ade80' : '#16a34a'};` }, String(cell ?? 0));
    if (col.id === '__days_absent__') return h('span', { style: `font-weight: 600; color: ${darkMode ? '#f87171' : '#dc2626'};` }, String(cell ?? 0));

    if (col.id === 'classroom') {
      const idColIndex = cols.findIndex(c => c.id === 'korean_name');
      const koreanName = idColIndex >= 0 ? row.cells[idColIndex].data : null;
      const taMatch = saturdayData.find(r => r.korean_name === koreanName);
      const taId = taMatch?.id;
      return h('select', {
        style: `padding: 4px 8px; border-radius: 4px; border: 1px solid ${darkMode ? '#4b5563' : '#93c5fd'}; background-color: ${darkMode ? '#273549' : '#eff6ff'}; color: ${darkMode ? '#e5e7eb' : '#1e40af'}; font-size: 13px; cursor: pointer; width: 100%;`,
        onchange: (e: Event) => { if (taId) updateClassroom(taId, (e.target as HTMLSelectElement).value); },
      }, [
        h('option', { value: '' }, '— Select —'),
        ...CLASSROOMS.map(room => h('option', { value: room, selected: cell === room }, room)),
      ]);
    }

    if (DATE_REGEX.test(col.id)) {
      if (cell === true) return '✓';
      if (isDateInPast(col.id)) return '✗';
      return '';
    }
    if (cell === true) return '✓';
    if (cell === false) return '✗';
    if (cell === null || cell === undefined) return '';
    return cell;
  },
}));