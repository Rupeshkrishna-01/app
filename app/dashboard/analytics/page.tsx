import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubjectProgressCard } from '@/components/subject-progress-card';
import { calculateSubjectStats } from '@/lib/attendance-math';
import { TimetableEntry, AttendanceLog } from '@/lib/types/database';
import { BarChart3, Target, ShieldCheck, AlertCircle } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // 1. Fetch user profile threshold
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('attendance_threshold')
    .eq('user_id', user.id)
    .single();

  const threshold = profile?.attendance_threshold ? Number(profile.attendance_threshold) : 75;

  // 2. Fetch all timetables & attendance logs
  const { data: timetables } = await supabase
    .from('timetables')
    .select('*')
    .eq('user_id', user.id);

  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user.id);

  const stats = calculateSubjectStats(
    (timetables as TimetableEntry[]) || [],
    (logs as AttendanceLog[]) || [],
    threshold
  );

  // Overall calculations
  const totalConducted = stats.reduce((acc, curr) => acc + curr.total_conducted, 0);
  const totalPresent = stats.reduce((acc, curr) => acc + curr.present_count, 0);
  const overallPercentage = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 10000) / 100 : 100;
  const isOverallSafe = overallPercentage >= threshold;

  const shortageSubjectsCount = stats.filter((s) => s.percentage < threshold).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Attendance Analytics</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Subject Percentages</h1>
      </div>

      {/* Overall Summary Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{overallPercentage}%</span>
              <span className="text-xs text-slate-400">Target: {threshold}%</span>
            </div>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
              isOverallSafe
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isOverallSafe ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
        </div>

        {/* Shortage warning pill if any subject is below threshold */}
        {shortageSubjectsCount > 0 ? (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{shortageSubjectsCount} subject{shortageSubjectsCount > 1 ? 's' : ''}</strong> below your {threshold}% target!
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>All subjects are safely above your {threshold}% threshold! Great job!</span>
          </div>
        )}
      </div>

      {/* Subject Stats Cards List */}
      <div className="space-y-4">
        {stats.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-800 text-slate-500">
            No subjects added to your timetable yet. Add subjects in Settings.
          </div>
        ) : (
          stats.map((s) => <SubjectProgressCard key={s.subject_name} stats={s} />)
        )}
      </div>
    </div>
  );
}
