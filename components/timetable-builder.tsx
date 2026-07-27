'use client';

import { useState } from 'react';
import { TimetableEntry, DayOfWeek } from '@/lib/types/database';
import { Plus, Trash2, Copy, Check, Palette } from 'lucide-react';

interface TimetableBuilderProps {
  initialEntries?: TimetableEntry[];
  onSave?: (entries: TimetableEntry[]) => void;
  saving?: boolean;
}

const DAYS: { id: DayOfWeek; name: string; short: string }[] = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 0, name: 'Sunday', short: 'Sun' },
];

const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#eab308', // Yellow
];

export function TimetableBuilder({
  initialEntries = [],
  onSave,
  saving = false,
}: TimetableBuilderProps) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(1); // Default Monday
  const [entries, setEntries] = useState<TimetableEntry[]>(initialEntries);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedTargetDays, setSelectedTargetDays] = useState<DayOfWeek[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // New Class Form State
  const [subjectName, setSubjectName] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectColor, setSubjectColor] = useState(DEFAULT_COLORS[0]);

  // Filter entries for active day
  const activeDayEntries = entries
    .filter((e) => e.day_of_week === activeDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    const newEntry: TimetableEntry = {
      id: generateId(),
      user_id: '',
      day_of_week: activeDay,
      period_label: periodLabel.trim() || `Period ${activeDayEntries.length + 1}`,
      subject_name: subjectName.trim(),
      subject_color: subjectColor,
      start_time: startTime,
      end_time: endTime,
    };

    setEntries([...entries, newEntry]);

    // Clear input fields
    setSubjectName('');
    setPeriodLabel('');
  };

  const handleRemoveEntry = (tempIdOrId: string) => {
    setEntries(entries.filter((e) => e.id !== tempIdOrId));
  };

  const handleCopyDaySchedule = () => {
    if (selectedTargetDays.length === 0) return;

    const currentDayItems = entries.filter((e) => e.day_of_week === activeDay);

    const updatedEntries = entries.filter((e) => !selectedTargetDays.includes(e.day_of_week as DayOfWeek));

    for (const targetDay of selectedTargetDays) {
      for (const item of currentDayItems) {
        updatedEntries.push({
          ...item,
          id: generateId(),
          day_of_week: targetDay,
        });
      }
    }

    setEntries(updatedEntries);
    setCopyModalOpen(false);
    setSelectedTargetDays([]);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {DAYS.map((day) => {
          const count = entries.filter((e) => e.day_of_week === day.id).length;
          const isActive = activeDay === day.id;

          return (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`flex flex-col items-center min-w-[54px] py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="text-xs">{day.short}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full mt-1 ${
                  isActive ? 'bg-blue-500/40 text-white' : 'bg-slate-700/80 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Header & Fast Copy Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">
          {DAYS.find((d) => d.id === activeDay)?.name}'s Schedule
        </h2>

        <button
          type="button"
          onClick={() => setCopyModalOpen(true)}
          disabled={activeDayEntries.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all border border-blue-500/20 disabled:opacity-40"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy to other days</span>
        </button>
      </div>

      {copiedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" /> Schedule copied successfully!
        </div>
      )}

      {/* Class List for Active Day */}
      <div className="space-y-3">
        {activeDayEntries.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-800 text-slate-500">
            No classes added for {DAYS.find((d) => d.id === activeDay)?.name} yet.
          </div>
        ) : (
          activeDayEntries.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.subject_color || '#3b82f6' }}
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{item.subject_name}</h4>
                  <p className="text-xs text-slate-400">
                    {item.period_label ? `${item.period_label} • ` : ''}
                    {item.start_time} - {item.end_time}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => item.id && handleRemoveEntry(item.id)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add New Class Form */}
      <form onSubmit={handleAddClass} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Add Class</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Period Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Period 1 / Lab Block"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Subject Color Tag Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5" /> Subject Tag Color
          </label>
          <div className="flex gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setSubjectColor(color)}
                className={`w-7 h-7 rounded-full transition-all ${
                  subjectColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Schedule</span>
        </button>
      </form>

      {/* Save Button */}
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(entries)}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {saving ? 'Saving Timetable...' : 'Save Full Timetable'}
        </button>
      )}

      {/* Copy Day Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Copy {DAYS.find((d) => d.id === activeDay)?.name}'s Schedule
            </h3>
            <p className="text-xs text-slate-400">Select target days to duplicate this schedule to:</p>

            <div className="space-y-2">
              {DAYS.filter((d) => d.id !== activeDay).map((day) => {
                const isSelected = selectedTargetDays.includes(day.id);
                return (
                  <label
                    key={day.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{day.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTargetDays([...selectedTargetDays, day.id]);
                        } else {
                          setSelectedTargetDays(selectedTargetDays.filter((id) => id !== day.id));
                        }
                      }}
                      className="accent-blue-500 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyDaySchedule}
                disabled={selectedTargetDays.length === 0}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold disabled:opacity-40"
              >
                Apply Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
