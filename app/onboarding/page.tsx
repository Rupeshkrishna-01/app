'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TimetableBuilder } from '@/components/timetable-builder';
import { PwaInstallerPrompt } from '@/components/pwa-installer-prompt';
import { TimetableEntry } from '@/lib/types/database';
import { Check, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [timetableEntries, setTimetableEntries] = useState<Partial<TimetableEntry>[]>([]);
  const [threshold, setThreshold] = useState<number>(75);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSaveTimetable = (entries: Partial<TimetableEntry>[]) => {
    setTimetableEntries(entries);
    setStep(2); // Move to Threshold step
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // 1. Update Profile Threshold
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          attendance_threshold: threshold,
          updated_at: new Date().toISOString(),
        });

      // 2. Insert Timetable Entries
      if (timetableEntries.length > 0) {
        // Delete existing timetables for clean start
        await supabase.from('timetables').delete().eq('user_id', user.id);

        const formattedEntries = timetableEntries.map((e) => ({
          user_id: user.id,
          day_of_week: e.day_of_week,
          period_label: e.period_label || 'Period',
          subject_name: e.subject_name || 'Class',
          subject_color: e.subject_color || '#3b82f6',
          start_time: e.start_time || '09:00',
          end_time: e.end_time || '10:00',
        }));

        await supabase.from('timetables').insert(formattedEntries);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 flex flex-col justify-between max-w-xl mx-auto">
      {/* Header Stepper */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              A
            </div>
            <span className="font-extrabold text-lg text-white">AttendX Setup</span>
          </div>

          <span className="text-xs font-semibold text-slate-400">Step {step} of 3</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="my-auto py-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Create Your Weekly Timetable</h2>
              <p className="text-xs text-slate-400">
                Add your classes for each day. You can use the "Copy to other days" button to duplicate lab/theory blocks quickly.
              </p>
            </div>

            <TimetableBuilder initialEntries={timetableEntries} onSave={handleSaveTimetable} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Attendance Threshold</span>
              </div>
              <h2 className="text-xl font-bold text-white">What is your college minimum %?</h2>
              <p className="text-xs text-slate-400">
                We use this target threshold to compute how many classes you can safely miss or must attend to avoid shortage.
              </p>
            </div>

            {/* Threshold Input Slider / Field */}
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-4xl font-black text-blue-400">{threshold}%</span>
                <p className="text-[11px] text-slate-500 mt-1">Default is 75% for most universities</p>
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

              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>50%</span>
                <span>75% (Standard)</span>
                <span>95%</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Android PWA & Notifications</span>
              </div>
              <h2 className="text-xl font-bold text-white">Enable Notifications & Add to Home Screen</h2>
              <p className="text-xs text-slate-400">
                To receive 1-tap notifications when your classes end, install AttendX on your Android home screen and grant push permissions.
              </p>
            </div>

            <PwaInstallerPrompt />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Completing Setup...' : 'Finish & Launch App'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-600 pb-2">
        You can update your schedule and settings anytime.
      </div>
    </div>
  );
}
