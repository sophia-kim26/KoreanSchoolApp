export interface TAData {
  id: number;
  first_name: string;
  last_name: string;
  korean_name: string;
  session_day: string;
  classroom?: string;
  is_active: boolean;
  total_hours: number | string;
  attendance: string;
  ta_code: string;
  email: string;
  created_at: string;
  phone?: string;
}

export interface FridayData {
  id?: number;
  first_name?: string;
  last_name?: string;
  korean_name?: string;
  [key: string]: any;
}

export interface SaturdayData {
  id?: number;
  first_name?: string;
  last_name?: string;
  korean_name?: string;
  [key: string]: any;
}

export interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  session_day: string;
  is_active: boolean;
  korean_name: string;
  classroom: string;
}

export interface CreateAccountResponse {
  success: boolean;
  unhashed_pin: string;
  message?: string;
}

export interface CalendarDatesResponse {
  dates?: string[];
}

export type Language = 'en' | 'ko';
export type ActiveTab = 'appearance';
export type MainTab = 'tas' | 'friday' | 'saturday';

export const CLASSROOMS = [
  '앵두꽃반', '제비꽃반', '접시꽃반', '초롱꽃반', '풀꽃반', '배꽃반',
  '백합반', '개나리반', '봉선화반', '수선화반', 'KSL1A.도라지꽃반',
  'KSL1B.프리지아반', 'KSL3.붓꽃반', 'KSL4.유채꽃반', 'KSL5 은방울꽃반',
  '진달래반', '채송화반', '월계수반', '모란반', '목련반', '난초반',
  '해바라기반', '장미반', '튤립반', '연꽃반', '국화반', '무궁화반',
];

export const VP_TRANSLATIONS = {
  en: {
    firstName: 'First Name', lastName: 'Last Name', koreanName: 'Korean Name',
    sessionDay: 'Session Day', classroom: 'Classroom', active: 'Active',
    totalHours: 'Total Hours', attendance: 'Attendance', analytics: 'Analytics',
    actions: 'Actions', yes: 'Yes', no: 'No', viewAnalytics: 'View Analytics', remove: 'Remove',
  },
  ko: {
    firstName: '이름', lastName: '성', koreanName: '한국어 이름',
    sessionDay: '수업 요일', classroom: '교실', active: '활성 상태',
    totalHours: '총 시간', attendance: '출석', analytics: '통계',
    actions: '작업', yes: '예', no: '아니오', viewAnalytics: '통계 보기', remove: '삭제',
  },
};