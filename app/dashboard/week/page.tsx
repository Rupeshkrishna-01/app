'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimetableEntry, AttendanceLog, AttendanceStatus } from '@/lib/types/database';
import { formatTime12h, formatDateISO } from '@/lib/attendance-math';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

export default function WeekViewPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday start
    return new Date(today.setDate(diff));
  });

  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: ttData } = await supabase.from('timetables').select('*').eq('user_id', user.id);
        const { data: logData } = await supabase.from('attendance_logs').select('*').eq('user_id', user.id);

        setTimetables(ttData || []);
        setLogs(logData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleToggleStatus = async (timetableEntryId: string, dateStr: string, currentStatus: AttendanceStatus | null) => {
    let nextStatus: AttendanceStatus = 'present';
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'cancelled';
    else if (currentStatus === 'cancelled') nextStatus = 'present';

    try {
      const res = await fetch('/api/attendance/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableEntryId,
          date: dateStr,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setLogs((prev) => {
          const filtered = prev.filter((l) => !(l.timetable_entry_id === timetableEntryId && l.date === dateStr));
          return [...filtered, { id: 'temp', user_id: '', timetable_entry_id: timetableEntryId, date: dateStr, status: nextStatus }];
        });
      }
    } catch (e) {
      console.error('Error logging status:', e);
    }
  };

  // Generate 7 days for current week starting Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navigateWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  const todayIso = formatDateISO(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Retroactive Attendance</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Week View</h1>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-200">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <p className="text-[10px] text-slate-400">Tap status chips to toggle Present/Absent/Off</p>
        </div>

        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days List */}
      <div className="space-y-5">
        {weekDays.map((dayDate) => {
          const dateStr = formatDateISO(dayDate);
          const dayOfWeek = dayDate.getDay();
          const dayEntries = timetables
            .filter((t) => t.day_of_week === dayOfWeek)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          const isToday = dateStr === todayIso;

          return (
            <div
              key={dateStr}
              className={`p-4 rounded-2xl border transition-all ${
                isToday
                  ? 'bg-slate-900/90 border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">
                    {dayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </span>
                </div>

                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Today
                  </span>
                )}
              </div>

              {dayEntries.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">No classes scheduled</p>
              ) : (
                <div className="space-y-2">
                  {dayEntries.map((entry) => {
                    const log = logs.find((l) => l.timetable_entry_id === entry.id && l.date === dateStr);
                    const status = log?.status || null;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: entry.subject_color || '#3b82f6' }}
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-100">{entry.subject_name}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatTime12h(entry.start_time)} - {formatTime12h(entry.end_time)}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Status Chip Button */}
                        <button
                          onClick={() => handleToggleStatus(entry.id, dateStr, status)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border ${
                            status === 'present'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : status === 'absent'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : status === 'cancelled'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {status === 'present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {status === 'absent' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          {status === 'cancelled' && <MinusCircle className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="capitalize">{status || 'Mark'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
