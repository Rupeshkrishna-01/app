import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TodayClassCard } from '@/components/today-class-card';
import { PwaInstallerPrompt } from '@/components/pwa-installer-prompt';
import { TimetableEntry, AttendanceLog } from '@/lib/types/database';
import { formatDateISO } from '@/lib/attendance-math';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // 1. Fetch user timetable
  const { data: allTimetables } = await supabase
    .from('timetables')
    .select('*')
    .eq('user_id', user.id);

  if (!allTimetables || allTimetables.length === 0) {
    redirect('/onboarding');
  }

  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = Sun ... 6 = Sat
  const dateStr = formatDateISO(today);

  // Filter today's timetable entries
  const todayTimetables: TimetableEntry[] = (allTimetables || [])
    .filter((t) => t.day_of_week === todayDayOfWeek)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // 2. Fetch today's attendance logs
  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', dateStr);

  const logMap = new Map<string, AttendanceLog['status']>();
  (logs || []).forEach((log: AttendanceLog) => {
    logMap.set(log.timetable_entry_id, log.status);
  });

  const formattedDateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate summary counts for today
  const markedCount = (logs || []).length;
  const presentCount = (logs || []).filter((l) => l.status === 'present').length;
  const absentCount = (logs || []).filter((l) => l.status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDateString}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Today's Schedule</h1>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 font-bold text-base shadow-inner">
          {user.email?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* PWA Prompt Banner */}
      <PwaInstallerPrompt />

      {/* Today's Log Summary Pill */}
      {todayTimetables.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
              <p className="text-sm font-bold text-slate-200">{todayTimetables.length} Classes</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Present</p>
              <p className="text-sm font-bold text-emerald-400">{presentCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Absent</p>
              <p className="text-sm font-bold text-rose-400">{absentCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-4">
        {todayTimetables.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
              🎉
            </div>
            <h3 className="text-base font-bold text-slate-200">No classes scheduled for today!</h3>
            <p className="text-xs text-slate-400">Enjoy your day off or review your weekly schedule in Settings.</p>
          </div>
        ) : (
          todayTimetables.map((entry) => (
            <TodayClassCard
              key={entry.id}
              entry={entry}
              initialStatus={logMap.get(entry.id) || null}
              dateStr={dateStr}
            />
          ))
        )}
      </div>
    </div>
  );
}
