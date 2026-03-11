// FOR TA DASHBOARD!!
import { useState, useEffect, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

interface User {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  highschool?: string;
  grade?: string | number;
  age?: string | number;
  gender?: string;
  address?: string;
  emergencyPhone?: string;
  notes?: string;
}

interface Parent {
  koreanName?: string;
  korean_name?: string;
  englishName?: string;
  english_name?: string;
  phone?: string;
  email?: string;
}

interface ChartProps {
  currentUser: User;
  darkMode?: boolean;
  monthlyHours?: number[];
  monthLabels?: string[];
  shifts?: Shift[];
  totalHours?: number;
}

interface Shift {
  id: number;
  ta_id: number;
  clock_in: string;
  clock_out: string | null;
  elapsed_time: number | null;
  attendance: string;
  notes: string;
}

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function Chart({
  currentUser,
  darkMode = false,
  monthlyHours = [],
  monthLabels = [],
  shifts = [],
  totalHours = 0
}: ChartProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [fullTA, setFullTA] = useState<any>(null);
  const [calendarDates, setCalendarDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchParents = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/parents/ta/${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setParents(data);
        } else {
          setParents([]);
        }
      } catch (error) {
        console.error('Error fetching parents:', error);
        setParents([]);
      }
    };
    fetchParents();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/tas/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setFullTA(data))
      .catch(err => console.error('Failed to fetch TA info:', err));
  }, [currentUser?.id]);

  // Fetch calendar dates — same endpoint as VPDashboard / VPTAView
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/friday/get-calendar-dates`)
      .then(res => res.json())
      .then(json => {
        if (json.dates && Array.isArray(json.dates)) {
          setCalendarDates(new Set(json.dates));
        }
      })
      .catch(err => console.error('Failed to fetch calendar dates:', err));
  }, []);

  const taInfo = {
    firstName: fullTA?.first_name || currentUser.first_name,
    lastName: fullTA?.last_name || currentUser.last_name,
    email: fullTA?.email || currentUser?.email,
    phone: fullTA?.phone || "Not provided",
    highschool: fullTA?.high_school || "Not provided",
    grade: fullTA?.grade || "N/A",
    age: fullTA?.age || "N/A",
    gender: fullTA?.gender || "N/A",
    address: fullTA?.address || "Not provided",
    emergencyPhone: fullTA?.emergency_phone || "Not provided",
    notes: fullTA?.notes || "No notes",
    parents: parents.length > 0 ? parents : [
      {
        koreanName: "한국이름",
        englishName: "Parent Name",
        phone: "123-456-7890",
        email: "parent@example.com"
      }
    ]
  };

  // --- Attendance calculation (identical to VPTAView) ---

  // Parse YYYY-MM-DD as local midnight to avoid UTC day-offset errors
  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Slice ISO string directly — no Date conversion, no timezone drift
  const shiftDateSet = useMemo((): Set<string> => {
    const s = new Set<string>();
    shifts.forEach(shift => {
      if (shift.clock_in) s.add(shift.clock_in.slice(0, 10));
    });
    return s;
  }, [shifts]);

  // Past calendar dates matching this TA's session_day
  const relevantPastDates = useMemo((): string[] => {
    if (!fullTA?.session_day) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDay: string = fullTA.session_day;
    return Array.from(calendarDates).filter(dateStr => {
      const date = parseDateLocal(dateStr);
      if (date >= today) return false;
      const dow = date.getDay();
      if (sessionDay === 'Friday') return dow === 5;
      if (sessionDay === 'Saturday') return dow === 6;
      if (sessionDay === 'Both') return dow === 5 || dow === 6;
      return false;
    });
  }, [calendarDates, fullTA]);

  const presentCount = useMemo(
    () => relevantPastDates.filter(d => shiftDateSet.has(d)).length,
    [relevantPastDates, shiftDateSet]
  );
  const absentCount = useMemo(
    () => relevantPastDates.filter(d => !shiftDateSet.has(d)).length,
    [relevantPastDates, shiftDateSet]
  );
  const totalRelevantDays = relevantPastDates.length;
  const presentPercentage = totalRelevantDays > 0
    ? Math.round((presentCount / totalRelevantDays) * 100)
    : 0;
  const absentPercentage = totalRelevantDays > 0 ? 100 - presentPercentage : 0;

  // --- End attendance calculation ---

  const dataValues = monthlyHours.length > 0 ? monthlyHours : [];

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Hours",
        data: dataValues,
        backgroundColor: darkMode ? "#3b82f6" : "#bfdbfe"
      }
    ]
  };

  const barOptions = {
    scales: {
      y: {
        min: 0,
        max: Math.max(10, Math.ceil(Math.max(...dataValues, 0) * 1.2)),
        ticks: { stepSize: 5, color: darkMode ? "#9ca3af" : undefined },
        title: { display: true, text: "Hours", color: darkMode ? "#9ca3af" : undefined },
        grid: { color: darkMode ? "#374151" : "#feefbf" }
      },
      x: {
        ticks: { color: darkMode ? "#9ca3af" : undefined },
        grid: { color: darkMode ? "#374151" : "#feefbf" }
      }
    },
    plugins: {
      legend: { labels: { color: darkMode ? "#d1d5db" : undefined } }
    }
  };

  // Dark mode color shorthands
  const cardBg = darkMode ? "#1f2937" : "#f5eed1";
  const cardBorder = darkMode ? "1px solid #374151" : "none";
  const headingColor = darkMode ? "#60a5fa" : "#5b8dc4";
  const subtextColor = darkMode ? "#9ca3af" : "#9ca3af";
  const rowEven = darkMode ? "#1f2937" : "#ffffff";
  const rowOdd = darkMode ? "#273549" : "#f9fafb";
  const rowBorder = darkMode ? "#374151" : "#e5e7eb";
  const tdColor = darkMode ? "#e5e7eb" : "inherit";
  const progressBg = darkMode ? "#374151" : "#e5e7eb";

  return (
    <div style={{ display: "flex", gap: "40px", marginTop: "20px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ width: "800px" }}>
          <Bar data={barData} options={barOptions} />
          <p style={{ marginTop: "12px", fontWeight: "bold", color: darkMode ? "#f9fafb" : "inherit" }}>
            Total Hours: {Math.round(totalHours)}
          </p>
        </div>

        {/* Parent Information Card */}
        <div style={{
          width: "800px",
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: "16px",
          padding: "30px",
          boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontSize: "20px", color: headingColor, marginBottom: "20px", textAlign: "center" }}>
            Parent Information
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? "#1e3a5f" : "#5b8dc4", color: "white" }}>
                <th style={{ padding: "10px", textAlign: "left", borderRadius: "8px 0 0 0" }}>Korean Name</th>
                <th style={{ padding: "10px", textAlign: "left" }}>English Name</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Phone Number</th>
                <th style={{ padding: "10px", textAlign: "left", borderRadius: "0 8px 0 0" }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {taInfo.parents.map((parent, index) => (
                <tr key={index} style={{
                  backgroundColor: index % 2 === 0 ? rowEven : rowOdd,
                  borderBottom: `1px solid ${rowBorder}`
                }}>
                  <td style={{ padding: "10px", color: tdColor }}>{parent.koreanName || parent.korean_name || 'N/A'}</td>
                  <td style={{ padding: "10px", color: tdColor }}>{parent.englishName || parent.english_name || 'N/A'}</td>
                  <td style={{ padding: "10px", color: tdColor }}>{parent.phone || 'N/A'}</td>
                  <td style={{ padding: "10px", color: tdColor }}>{parent.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Card — SVG donut identical to VPTAView */}
      <div style={{
        width: "400px",
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: "16px",
        padding: "40px 30px",
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {/* SVG Donut — exact same implementation as VPTAView */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            {totalRelevantDays === 0 ? (
              // No calendar dates configured yet — neutral grey ring
              <circle
                cx="140" cy="140" r="100" fill="none"
                stroke={darkMode ? "#374151" : "#e5e7eb"}
                strokeWidth="40"
              />
            ) : (
              <>
                <circle
                  cx="140" cy="140" r="100" fill="none"
                  stroke={darkMode ? "#3b82f6" : "#5b8dc4"}
                  strokeWidth="40"
                  strokeDasharray={`${presentPercentage * 6.283} 628.3`}
                  strokeDashoffset="0"
                  transform="rotate(-90 140 140)"
                />
                <circle
                  cx="140" cy="140" r="100" fill="none"
                  stroke={darkMode ? "#374151" : "#f5f5dc"}
                  strokeWidth="40"
                  strokeDasharray={`${absentPercentage * 6.283} 628.3`}
                  strokeDashoffset={`-${presentPercentage * 6.283}`}
                  transform="rotate(-90 140 140)"
                />
              </>
            )}
            <text x="140" y="125" textAnchor="middle" fontSize="22"
              fill={darkMode ? "#60a5fa" : "#5b8dc4"} fontWeight="500">
              {presentPercentage}% Present
            </text>
            <text x="140" y="155" textAnchor="middle" fontSize="22"
              fill="#d4af37" fontWeight="500">
              {absentPercentage}% Absent
            </text>
            {totalRelevantDays > 0 && (
              <text x="140" y="182" textAnchor="middle" fontSize="13"
                fill={darkMode ? "#6b7280" : "#9ca3af"}>
                {presentCount}/{totalRelevantDays} days
              </text>
            )}
          </svg>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "24px", color: headingColor, marginBottom: "8px" }}>
            {taInfo.firstName} {taInfo.lastName}
          </h2>
          <p style={{ color: subtextColor, fontSize: "16px" }}>
            {taInfo.email} | {taInfo.phone}
            <br />
            {taInfo.highschool} | {taInfo.grade}nd grade
            <br />
            {taInfo.age} years old | {taInfo.gender}
            <br />
            {taInfo.address}
            <br />
            Emergency Phone: {taInfo.emergencyPhone}
            <br />
            Notes: {taInfo.notes}
          </p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <div style={{
            width: "100%", height: "40px", backgroundColor: progressBg,
            borderRadius: "20px", overflow: "hidden", position: "relative"
          }}>
            <div style={{
              width: `${Math.min((totalHours / 300) * 100, 100)}%`,
              height: "100%",
              backgroundColor: darkMode ? "#3b82f6" : "#5b8dc4",
              borderRadius: "20px",
              transition: "width 0.3s ease"
            }} />
            <div style={{
              position: "absolute", right: "20px", top: "50%",
              transform: "translateY(-50%)", fontSize: "24px"
            }}>
              🏅
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "18px", color: headingColor }}>
            {totalHours.toFixed(2)}/300 Hours Completed
          </p>
        </div>
      </div>
    </div>
  );
}