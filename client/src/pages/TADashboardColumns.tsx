import { useMemo } from 'react';
import { h } from 'preact';
import { translations, Language } from './translations';

interface GridColumnsOptions {
  language: Language;
  toggleAttendance: (shiftId: number, newStatus: string) => Promise<void>;
  handleEditNotes: (shiftId: number, currentNotes: string) => void;
}

export function useGridColumns({ language, toggleAttendance, handleEditNotes }: GridColumnsOptions) {
  const translateStatus = (status: string) => {
    if (status === 'Tardy') return translations[language].tardy;
    if (status === 'Early Leave') return translations[language].earlyLeave;
    return translations[language].present;
  };

  return useMemo(() => [
    {
      name: 'ID',
      hidden: true,
    },
    {
      name: translations[language].date,
      width: '120px',
    },
    {
      name: translations[language].attendance,
      width: '140px',
      formatter: (cell: any, row: any) => {
        const shiftId = row.cells[0].data;
        const dropdownId = `dropdown-${shiftId}`;
        const buttonId = `btn-${shiftId}`;

        const getColors = (status: string): { bg: string; text: string } => {
          if (status === 'Tardy') return { bg: '#fef3c7', text: '#92400e' };
          if (status === 'Early Leave') return { bg: '#dbeafe', text: '#1e40af' };
          return { bg: '#c4e9d1ff', text: '#166534' };
        };

        const colors = getColors(cell);

        return h('div', { style: 'position: relative; display: inline-block;' }, [
          h('button', {
            id: buttonId,
            style: `
              display: inline-block; padding: 6px 16px; border-radius: 4px;
              font-weight: 500; font-size: 13px;
              background-color: ${colors.bg}; color: ${colors.text};
              border: none; cursor: pointer; transition: opacity 0.2s;
            `,
            onmouseover: function (this: HTMLElement) { this.style.opacity = '0.8'; },
            onmouseout: function (this: HTMLElement) { this.style.opacity = '1'; },
            onclick: (e: Event) => {
              e.stopPropagation();
              const dropdown = document.getElementById(dropdownId);
              document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
                if (d.id !== dropdownId) (d as HTMLElement).style.display = 'none';
              });
              if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
              }
            },
          }, translateStatus(cell || 'Present')),

          h('div', {
            id: dropdownId,
            style: `
              display: none; position: absolute; top: 100%; left: 0; margin-top: 4px;
              background: white; border: 1px solid #e5e7eb; border-radius: 4px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 1000; min-width: 120px;
            `,
          }, (['Present', 'Tardy', 'Early Leave'] as const).map(status =>
            h('div', {
              style: 'padding: 8px 12px; cursor: pointer; font-size: 13px; transition: background-color 0.2s;',
              onmouseover: function (this: HTMLElement) { this.style.backgroundColor = '#f3f4f6'; },
              onmouseout: function (this: HTMLElement) { this.style.backgroundColor = 'transparent'; },
              onclick: (e: Event) => {
                e.stopPropagation();
                const button = document.getElementById(buttonId);
                const c = getColors(status);
                if (button) {
                  (button as HTMLElement).style.backgroundColor = c.bg;
                  (button as HTMLElement).style.color = c.text;
                  (button as HTMLElement).textContent = translateStatus(status);
                }
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) dropdown.style.display = 'none';
                toggleAttendance(shiftId, status);
              },
            }, translateStatus(status))
          )),
        ]);
      },
    },
    {
      name: translations[language].clockIn,
      width: '120px',
    },
    {
      name: translations[language].clockOut,
      width: '120px',
    },
    {
      name: translations[language].elapsedTime,
      width: '130px',
    },
    {
      name: translations[language].notes,
      width: '200px',
      formatter: (cell: any, row: any) => {
        const shiftId = row.cells[0].data;
        const currentNotes = cell || '';

        return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
          h('span', {
            style: 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
          }, currentNotes || translations[language].noNotes),
          h('button', {
            style: `
              background: none; border: none; cursor: pointer; padding: 4px;
              display: flex; align-items: center; justify-content: center;
              color: #6b7280; transition: color 0.2s;
            `,
            onmouseover: function (this: HTMLElement) { this.style.color = '#1e40af'; },
            onmouseout: function (this: HTMLElement) { this.style.color = '#6b7280'; },
            onclick: (e: Event) => {
              e.stopPropagation();
              handleEditNotes(shiftId, currentNotes);
            },
            title: 'Edit notes',
          },
          h('svg', {
            width: '16', height: '16', viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor',
            'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          }, [
            h('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' }),
          ])),
        ]);
      },
    },
  ], [language]);
}