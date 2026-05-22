import { useState, useMemo, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { Shift, TA, Parent, EditedShift, NewShift, RouteParams } from "./VPTAViewTypes";
import { parseDateLocal, calculateHours, formatDateTimeLocal, localToISO } from "./VPTAViewUtils";

export const useVPTAView = () => {
  const { ta_id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [taInfo, setTaInfo] = useState<TA | null>(null);
  const [fullTAInfo, setFullTAInfo] = useState<TA | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
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

  const [editingInfo, setEditingInfo] = useState<boolean>(false);
  const [editingParents, setEditingParents] = useState<boolean>(false);
  const [editTAForm, setEditTAForm] = useState<Partial<TA>>({});
  const [editParentsForm, setEditParentsForm] = useState<Parent[]>([]);
  const [savingInfo, setSavingInfo] = useState<boolean>(false);

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
        setFullTAInfo(currentTA);

        const parentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/parents/ta/${ta_id}`, { headers: authHeaders });
        if (parentsResponse.ok) {
          const parentsData: Parent[] = await parentsResponse.json();
          setParents(Array.isArray(parentsData) ? parentsData : []);
        }

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

  const handleDeleteShift = async (shiftId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this shift? This action cannot be undone.')) return;
    try {
      setSaving(true);
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete shift');

      setEditedShifts(prev => {
        const updated = { ...prev };
        delete updated[shiftId];
        return updated;
      });

      const shiftsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/ta/${ta_id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data: Shift[] = await shiftsResponse.json();
      setAllShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      alert('Error deleting shift: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
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

  const handleEditInfo = (): void => {
    setEditTAForm({
      phone: fullTAInfo?.phone || '',
      email: fullTAInfo?.email || '',
      high_school: fullTAInfo?.high_school || '',
      grade: fullTAInfo?.grade || '',
      age: fullTAInfo?.age || '',
      gender: fullTAInfo?.gender || '',
      address: fullTAInfo?.address || '',
      emergency_phone: fullTAInfo?.emergency_phone || '',
      notes: fullTAInfo?.notes || '',
    });
    setEditingInfo(true);
  };

  const handleCancelEditInfo = (): void => {
    setEditingInfo(false);
    setEditTAForm({});
  };

  const handleSaveInfo = async (): Promise<void> => {
    try {
      setSavingInfo(true);
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tas/${ta_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editTAForm)
      });
      if (!response.ok) throw new Error('Failed to update TA info');
      const result = await response.json();
      setFullTAInfo(result.ta);
      setTaInfo(prev => prev ? { ...prev, ...result.ta } : result.ta);
      setEditingInfo(false);
      setEditTAForm({});
    } catch (err) {
      alert('Error saving TA info: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleEditParents = (): void => {
    const initial = parents.map(p => ({ ...p }));
    while (initial.length < 2) {
      initial.push({ englishName: '', koreanName: '', phone: '', email: '' });
    }
    setEditParentsForm(initial);
    setEditingParents(true);
  };

  const handleCancelEditParents = (): void => {
    setEditingParents(false);
    setEditParentsForm([]);
  };

  const handleParentFormChange = (index: number, field: string, value: string): void => {
    setEditParentsForm(prev => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { englishName: '', koreanName: '', phone: '', email: '' };
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveParents = async (): Promise<void> => {
    try {
      setSavingInfo(true);
      const token = await getAccessTokenSilently();

      for (let i = 0; i < editParentsForm.length; i++) {
        const parent = editParentsForm[i];
        const existingParent = parents[i];

        const payload = {
          english_name: parent.englishName || parent.english_name || '',
          korean_name: parent.koreanName || parent.korean_name || '',
          phone: parent.phone || '',
          email: parent.email || ''
        };

        if (existingParent?.id) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/parents/${existingParent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        }
      }

      const parentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/parents/ta/${ta_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (parentsResponse.ok) {
        const parentsData: Parent[] = await parentsResponse.json();
        setParents(Array.isArray(parentsData) ? parentsData : []);
      }

      setEditingParents(false);
      setEditParentsForm([]);
    } catch (err) {
      alert('Error saving parent info: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSavingInfo(false);
    }
  };

  return {
    ta_id, navigate, loading, error, taInfo, fullTAInfo, parents,
    shiftsByMonth, totalHours, presentCount, absentCount, totalRelevantDays,
    presentPercentage, absentPercentage, resettingPin, editingMonth,
    editedShifts, newShift, saving, showResetPinModal, newPin, setShowResetPinModal, setNewShift,
    handleEditMonth, handleCloseEdit, handleShiftChange, handleSaveChanges, handleDeleteShift, handleResetPin, copyPinToClipboard, calculateEditedHours,
    editingInfo, editingParents, editTAForm, editParentsForm, savingInfo,
    handleEditInfo, handleCancelEditInfo, handleSaveInfo,
    handleEditParents, handleCancelEditParents, handleParentFormChange, handleSaveParents
  };
};
