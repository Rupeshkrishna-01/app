'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { TimetableBuilder } from '@/components/timetable-builder';
import { TimetableEntry } from '@/lib/types/database';
import { Settings, ShieldAlert, LogOut, Bell, Check, Save } from 'lucide-react';

export default function SettingsPage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [threshold, setThreshold] = useState<number>(75);
  const [loading, setLoading] = useState(true);
  const [savingTT, setSavingTT] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: tt } = await supabase.from('timetables').select('*').eq('user_id', user.id);
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('attendance_threshold')
          .eq('user_id', user.id)
          .single();

        setTimetables(tt || []);
        if (prof?.attendance_threshold) {
          setThreshold(Number(prof.attendance_threshold));
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveTimetable = async (entries: TimetableEntry[]) => {
    setSavingTT(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Clear existing timetables
      await supabase.from('timetables').delete().eq('user_id', user.id);

      // Insert new timetable entries
      const formatted = entries.map((e) => ({
        user_id: user.id,
        day_of_week: e.day_of_week,
        period_label: e.period_label || 'Period',
        subject_name: e.subject_name || 'Subject',
        subject_color: e.subject_color || '#3b82f6',
        start_time: e.start_time || '09:00',
        end_time: e.end_time || '10:00',
      }));

      if (formatted.length > 0) {
        await supabase.from('timetables').insert(formatted);
      }

      setTimetables(formatted as TimetableEntry[]);
    } catch (e) {
      console.error('Error saving timetable:', e);
    } finally {
      setSavingTT(false);
    }
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          attendance_threshold: threshold,
          updated_at: new Date().toISOString(),
        });
    } catch (e) {
      console.error('Error updating threshold:', e);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleTestPush = async () => {
    setTestPushStatus('Triggering test push...');
    try {
      const res = await fetch('/api/push/trigger');
      const data = await res.json();
      if (res.ok) {
        setTestPushStatus(`Test push sent! (${data.notificationsSent} notification sent)`);
      } else {
        setTestPushStatus(`Push trigger failed: ${data.error}`);
      }
    } catch (err: any) {
      setTestPushStatus(`Error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>App Preferences</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Settings</h1>
      </div>

      {/* Threshold Setting Box */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Attendance Threshold</h3>
              <p className="text-xs text-slate-400">Target minimum percentage required</p>
            </div>
          </div>

          <span className="text-xl font-black text-blue-400">{threshold}%</span>
        </div>

        <input
          type="range"
          min="50"
          max="95"
          step="1"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <button
          onClick={handleSaveThreshold}
          disabled={savingThreshold}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savingThreshold ? 'Saving Threshold...' : 'Update Threshold'}</span>
        </button>
      </div>

      {/* Push Notification Tester */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Web Push Alerts</h3>
            <p className="text-xs text-slate-400">Test push notifications to your Android device</p>
          </div>
        </div>

        <button
          onClick={handleTestPush}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs border border-blue-500/20 transition"
        >
          Send Test Class End Push Notification
        </button>

        {testPushStatus && (
          <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {testPushStatus}
          </p>
        )}
      </div>

      {/* Timetable Manager Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-200">Edit Timetable</h3>
        <TimetableBuilder initialEntries={timetables} onSave={handleSaveTimetable} saving={savingTT} />
      </div>

      {/* Sign Out Button */}
      <div className="pt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
