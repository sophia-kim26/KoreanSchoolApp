import { useState, useMemo, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { Shift, TA, EditedShift, NewShift, RouteParams } from "./VPTAViewTypes";
import { parseDateLocal, calculateHours, formatDateTimeLocal, localToISO } from "./VPTAViewUtils";

export const useVPTAView = () => {
  const { ta_id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [taInfo, setTaInfo] = useState<TA | null>(null);
  const [calendarDates, setCalendarDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedShifts, setEditedShifts] = useState<Record<number, EditedShift>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [newShift, setNewShift] = useState<NewShift>({ clock_in: '', clock_out: '' });
  const [showResetPinModal, setShowResetPinModal] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [resettingPin, setResettingPin] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessTokenSilently();
        const authHeaders = { Authorization: `Bearer ${token}` };

        const taResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${ta_id}`, { headers: authHeaders });
        if (!taResponse.ok) throw new Error(`Failed to fetch TA info: ${taResponse.status}`);
        const currentTA: TA = await taResponse.json();
        if (!currentTA) throw new Error(`TA with ID ${ta_id} not found`);
        setTaInfo(currentTA);

        const shiftsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/ta/${ta_id}`, { headers: authHeaders });
        if (!shiftsResponse.ok) throw new Error(`HTTP error! status: ${shiftsResponse.status}`);
        const shiftsData: Shift[] = await shiftsResponse.json();
        setAllShifts(Array.isArray(shiftsData) ? shiftsData : []);

        const datesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/friday/get-calendar-dates`, { headers: authHeaders });
        if (datesResponse.ok) {
          const datesJson = await datesResponse.json();
          if (datesJson.dates && Array.isArray(datesJson.dates)) {
            setCalendarDates(new Set(datesJson.dates));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ta_id) fetchData();
    else { setLoading(false); setError("No TA ID provided"); }
  }, [ta_id, getAccessTokenSilently]);

  const shifts = useMemo(() => {
    if (!allShifts || allShifts.length === 0) return [];
    return allShifts.sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
  }, [allShifts]);

  const shiftDateSet = useMemo((): Set<string> => {
    const s = new Set<string>();
    shifts.forEach(shift => {
      if (shift.clock_in) s.add(shift.clock_in.slice(0, 10));
    });
    return s;
  }, [shifts]);

  const relevantPastDates = useMemo((): string[] => {
    if (!taInfo) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDay = taInfo.session_day;

    return Array.from(calendarDates).filter(dateStr => {
      const date = parseDateLocal(dateStr);
      if (date >= today) return false;
      const dayOfWeek = date.getDay();
      if (sessionDay === 'Friday') return dayOfWeek === 5;
      if (sessionDay === 'Saturday') return dayOfWeek === 6;
      if (sessionDay === 'Both') return dayOfWeek === 5 || dayOfWeek === 6;
      return false;
    });
  }, [calendarDates, taInfo]);

  const presentCount = useMemo(() => relevantPastDates.filter(dateStr => shiftDateSet.has(dateStr)).length, [relevantPastDates, shiftDateSet]);
  const absentCount = useMemo(() => relevantPastDates.filter(dateStr => !shiftDateSet.has(dateStr)).length, [relevantPastDates, shiftDateSet]);
  const totalRelevantDays = relevantPastDates.length;
  const presentPercentage = totalRelevantDays > 0 ? Math.round((presentCount / totalRelevantDays) * 100) : 0;
  const absentPercentage = totalRelevantDays > 0 ? 100 - presentPercentage : 0;

  const shiftsByMonth = useMemo(() => {
    if (!shifts || shifts.length === 0) return {};
    const grouped: Record<string, Shift[]> = {};
    shifts.forEach(shift => {
      if (!shift.clock_in) return;
      const date = new Date(shift.clock_in);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(shift);
    });
    const sortedEntries = Object.entries(grouped).sort((a, b) => new Date(b[1][0].clock_in).getTime() - new Date(a[1][0].clock_in).getTime());
    return Object.fromEntries(sortedEntries);
  }, [shifts]);

  const totalHours = useMemo(() => {
    return shifts.reduce((sum, shift) => {
      const hours = parseFloat(calculateHours(shift.clock_in, shift.clock_out));
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0).toFixed(2);
  }, [shifts]);

  const handleEditMonth = (month: string, monthShifts: Shift[]): void => {
    setEditingMonth(month);
    const initialEdits: Record<number, EditedShift> = {};
    monthShifts.forEach(shift => {
      initialEdits[shift.id] = {
        clock_in: formatDateTimeLocal(shift.clock_in),
        clock_out: shift.clock_out ? formatDateTimeLocal(shift.clock_out) : ''
      };
    });
    setEditedShifts(initialEdits);
  };

  const handleCloseEdit = (): void => {
    setEditingMonth(null);
    setEditedShifts({});
    setNewShift({ clock_in: '', clock_out: '' });
  };

  const handleShiftChange = (shiftId: number, field: keyof EditedShift, value: string): void => {
    setEditedShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], [field]: value } }));
  };

  const handleSaveChanges = async (): Promise<void> => {
    setSaving(true);
    try {
      const token = await getAccessTokenSilently();
      const updatePromises = Object.entries(editedShifts).map(([shiftId, data]) => {
        const payload: Partial<Shift> = {};
        if (data.clock_in) payload.clock_in = localToISO(data.clock_in) || '';
        if (data.clock_out) payload.clock_out = localToISO(data.clock_out);
        return fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      });

      if (updatePromises.length > 0) {
        const updateResponses = await Promise.all(updatePromises);
        for (let i = 0; i < updateResponses.length; i++) {
          if (!updateResponses[i].ok) throw new Error(`Failed to update shift: ${await updateResponses[i].text()}`);
        }
      }

      if (newShift.clock_in && newShift.clock_out) {
        const newShiftPayload = { ta_id: parseInt(ta_id || '0'), clock_in: localToISO(newShift.clock_in), clock_out: localToISO(newShift.clock_out) };
        const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newShiftPayload)
        });
        if (!createResponse.ok) throw new Error(`Failed to create shift: ${createResponse.status}`);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/ta/${ta_id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data: Shift[] = await response.json();
      setAllShifts(Array.isArray(data) ? data : []);
      handleCloseEdit();
    } catch (err) {
      alert(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setSaving(false);
    }
  };

  const calculateEditedHours = (shiftId: number): string | null => {
    const shift = editedShifts[shiftId];
    if (!shift || !shift.clock_in || !shift.clock_out) return null;
    const start = new Date(shift.clock_in);
    const end = new Date(shift.clock_out);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours > 0 ? hours.toFixed(2) : '0';
  };

  const handleResetPin = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to reset the PIN for ${taInfo?.first_name} ${taInfo?.last_name}?`)) return;
    try {
      setResettingPin(true);
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-pin/${ta_id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to reset PIN');
      const result: { unhashed_pin: string } = await response.json();
      setNewPin(result.unhashed_pin);
      setShowResetPinModal(true);
    } catch (err) {
      alert('Error resetting PIN: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setResettingPin(false);
    }
  };

  const copyPinToClipboard = (): void => {
    navigator.clipboard.writeText(newPin);
    alert('PIN copied to clipboard!');
  };

  return {
    ta_id, navigate, loading, error, taInfo,
    shiftsByMonth, totalHours, presentCount, absentCount, totalRelevantDays,
    presentPercentage, absentPercentage, resettingPin, editingMonth,
    editedShifts, newShift, saving, showResetPinModal, newPin, setShowResetPinModal, setNewShift,
    handleEditMonth, handleCloseEdit, handleShiftChange, handleSaveChanges, handleResetPin, copyPinToClipboard, calculateEditedHours
  };
};