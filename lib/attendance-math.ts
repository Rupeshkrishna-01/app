import { AttendanceLog, SubjectStats, TimetableEntry } from './types/database';

/**
 * Calculates subject-wise attendance statistics and threshold metrics.
 * 
 * Rules:
 * - Total conducted classes = Present + Absent (Cancelled classes do NOT count towards total)
 * - Attendance % = (Present / Total conducted) * 100
 * - If total conducted = 0, default percentage is 100%
 * - If % >= Threshold: Safe margin = floor((100 * Present - Threshold * Total) / Threshold) -> Max classes can miss
 * - If % < Threshold: Required consecutive classes = ceil((Threshold * Total - 100 * Present) / (100 - Threshold))
 */
export function calculateSubjectStats(
  timetables: TimetableEntry[],
  attendanceLogs: AttendanceLog[],
  threshold: number = 75
): SubjectStats[] {
  // Group timetables by subject name (case-insensitive trim)
  const subjectMap = new Map<string, { color: string; timetableIds: Set<string> }>();

  for (const item of timetables) {
    const key = item.subject_name.trim();
    if (!subjectMap.has(key)) {
      subjectMap.set(key, { color: item.subject_color || '#3b82f6', timetableIds: new Set() });
    }
    subjectMap.get(key)!.timetableIds.add(item.id);
  }

  const logMap = new Map<string, AttendanceLog>();
  for (const log of attendanceLogs) {
    logMap.set(`${log.timetable_entry_id}_${log.date}`, log);
  }

  const results: SubjectStats[] = [];

  for (const [subject_name, { color, timetableIds }] of subjectMap.entries()) {
    let present_count = 0;
    let absent_count = 0;
    let cancelled_count = 0;

    for (const log of attendanceLogs) {
      if (timetableIds.has(log.timetable_entry_id)) {
        if (log.status === 'present') present_count++;
        else if (log.status === 'absent') absent_count++;
        else if (log.status === 'cancelled') cancelled_count++;
      }
    }

    const total_conducted = present_count + absent_count;
    const percentage = total_conducted > 0 
      ? Math.round((present_count / total_conducted) * 10000) / 100 
      : 100;

    let margin = 0;
    let status: 'safe' | 'shortage' | 'on_track' = 'on_track';

    if (total_conducted === 0) {
      status = 'safe';
      margin = 0;
    } else if (percentage >= threshold) {
      status = 'safe';
      // y <= (100*P - T*N)/T
      const maxMissable = Math.floor((100 * present_count - threshold * total_conducted) / threshold);
      margin = Math.max(0, maxMissable);
    } else {
      status = 'shortage';
      // x >= (T*N - 100*P)/(100 - T)
      const requiredAttends = Math.ceil((threshold * total_conducted - 100 * present_count) / (100 - threshold));
      margin = -Math.max(1, requiredAttends);
    }

    results.push({
      subject_name,
      subject_color: color,
      total_conducted,
      present_count,
      absent_count,
      cancelled_count,
      percentage,
      threshold,
      status,
      margin
    });
  }

  return results.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
}

/**
 * Format time string "14:30:00" -> "2:30 PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Returns formatted date YYYY-MM-DD
 */
export function formatDateISO(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
