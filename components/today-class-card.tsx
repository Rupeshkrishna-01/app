'use client';

import { useState } from 'react';
import { TimetableEntry, AttendanceStatus } from '@/lib/types/database';
import { formatTime12h } from '@/lib/attendance-math';
import { CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react';

interface TodayClassCardProps {
  entry: TimetableEntry;
  initialStatus?: AttendanceStatus | null;
  dateStr: string;
  onStatusChange?: (timetableEntryId: string, status: AttendanceStatus) => void;
}

export function TodayClassCard({
  entry,
  initialStatus = null,
  dateStr,
  onStatusChange,
}: TodayClassCardProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [loading, setLoading] = useState(false);

  // Calculate if this class is currently ongoing, upcoming, or completed
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = entry.start_time.split(':').map(Number);
  const [endH, endM] = entry.end_time.split(':').map(Number);
  const classStartMinutes = startH * 60 + startM;
  const classEndMinutes = endH * 60 + endM;

  const isCurrent = currentMinutes >= classStartMinutes && currentMinutes <= classEndMinutes;
  const isPast = currentMinutes > classEndMinutes;

  const handleMarkStatus = async (newStatus: AttendanceStatus) => {
    setLoading(true);
    setStatus(newStatus);

    try {
      const res = await fetch('/api/attendance/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableEntryId: entry.id,
          date: dateStr,
          status: newStatus,
        }),
      });

      if (res.ok) {
        onStatusChange?.(entry.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to log status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
        isCurrent
          ? 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Subject Color Left Accent */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: entry.subject_color || '#3b82f6' }}
      />

      <div className="pl-3">
        {/* Top bar: Period label & Status badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.subject_color || '#3b82f6' }}
            />
            {entry.period_label && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {entry.period_label}
              </span>
            )}
          </div>

          {isCurrent && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
              <Clock className="w-3 h-3" /> ONGOING
            </span>
          )}
          {!isCurrent && isPast && (
            <span className="text-[11px] font-medium text-slate-500">Ended</span>
          )}
          {!isCurrent && !isPast && (
            <span className="text-[11px] font-medium text-slate-400">Upcoming</span>
          )}
        </div>

        {/* Subject Title */}
        <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-1">
          {entry.subject_name}
        </h3>

        {/* Time range */}
        <p className="text-xs font-medium text-slate-400 mb-4">
          {formatTime12h(entry.start_time)} - {formatTime12h(entry.end_time)}
        </p>

        {/* One-Tap Attendance Buttons (Large Mobile Touch Targets) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleMarkStatus('present')}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
              status === 'present'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800/80 text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Present</span>
          </button>

          <button
            onClick={() => handleMarkStatus('absent')}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
              status === 'absent'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/50'
                : 'bg-slate-800/80 text-rose-400 hover:bg-rose-950/40 border border-rose-500/20'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Absent</span>
          </button>

          <button
            onClick={() => handleMarkStatus('cancelled')}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
              status === 'cancelled'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/50'
                : 'bg-slate-800/80 text-amber-400 hover:bg-amber-950/40 border border-amber-500/20'
            }`}
          >
            <MinusCircle className="w-4 h-4" />
            <span>Off</span>
          </button>
        </div>
      </div>
    </div>
  );
}
