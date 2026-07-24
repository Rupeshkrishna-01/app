import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, BellRing, Sparkles, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">AttendX</span>
        </div>

        <Link
          href="/auth"
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition"
        >
          Sign In
        </Link>
      </div>

      {/* Hero Content */}
      <div className="max-w-md mx-auto w-full my-auto py-10 space-y-8">
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-User Android PWA</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Never miss your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">75% attendance</span> limit.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Track weekly timetables, get 1-tap push notifications after class ends, and know exactly how many classes you can miss or must attend.
          </p>
        </div>

        {/* Core Features Cards */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1-Tap Push Notifications</h3>
              <p className="text-xs text-slate-400">Log attendance directly from your Android notification bar without opening the app.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Safe / Shortage Math</h3>
              <p className="text-xs text-slate-400">Instant calculations telling you how many classes you can safely skip or must attend.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">100% Private (Supabase RLS)</h3>
              <p className="text-xs text-slate-400">Row Level Security ensures only you can view and edit your schedule and logs.</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/auth"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-600/25 transition active:scale-[0.98]"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-slate-600 pb-4">
        AttendX • Optimized for Android Home Screen PWA
      </div>
    </div>
  );
}
