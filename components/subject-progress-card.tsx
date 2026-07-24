'use client';

import { SubjectStats } from '@/lib/types/database';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SubjectProgressCardProps {
  stats: SubjectStats;
}

export function SubjectProgressCard({ stats }: SubjectProgressCardProps) {
  const {
    subject_name,
    subject_color,
    total_conducted,
    present_count,
    absent_count,
    cancelled_count,
    percentage,
    threshold,
    status,
    margin,
  } = stats;

  const isAboveThreshold = percentage >= threshold;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 p-4 transition-all hover:border-slate-700 shadow-md">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: subject_color || '#3b82f6' }}
      />

      <div className="pt-1">
        {/* Title & Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: subject_color || '#3b82f6' }}
              />
              {subject_name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {present_count} attended / {total_conducted} conducted
              {cancelled_count > 0 && ` (${cancelled_count} off)`}
            </p>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
              isAboveThreshold
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {isAboveThreshold ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>{percentage}%</span>
          </div>
        </div>

        {/* Attendance Progress Bar with Threshold Line Indicator */}
        <div className="relative my-3">
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAboveThreshold ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>

          {/* Threshold Line Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10 shadow-sm"
            style={{ left: `${threshold}%` }}
            title={`Required Threshold: ${threshold}%`}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>

        {/* Clear Actionable Note */}
        <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl bg-slate-850/80 border border-slate-800 text-slate-300">
          <Info className="w-4 h-4 shrink-0 text-blue-400" />
          <div>
            {total_conducted === 0 ? (
              <span className="text-slate-400">No classes conducted yet.</span>
            ) : isAboveThreshold ? (
              margin > 0 ? (
                <span>
                  You can safely miss <strong className="text-emerald-400 font-bold">{margin}</strong> next class{margin > 1 ? 'es' : ''} while staying above {threshold}%.
                </span>
              ) : (
                <span>You are currently exactly on your {threshold}% target.</span>
              )
            ) : (
              <span>
                Must attend <strong className="text-rose-400 font-bold">{Math.abs(margin)}</strong> next consecutive class{Math.abs(margin) > 1 ? 'es' : ''} to reach {threshold}%.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
