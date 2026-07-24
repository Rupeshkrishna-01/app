export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ... 6 = Saturday

export interface UserProfile {
  user_id: string;
  attendance_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  period_label?: string;
  subject_name: string;
  subject_color: string;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;   // "HH:MM:SS" or "HH:MM"
  created_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface AttendanceLog {
  id: string;
  user_id: string;
  timetable_entry_id: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  logged_at?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  device_info?: string;
  created_at?: string;
}

export interface SubjectStats {
  subject_name: string;
  subject_color: string;
  total_conducted: number; // present + absent
  present_count: number;
  absent_count: number;
  cancelled_count: number;
  percentage: number;
  threshold: number;
  status: 'safe' | 'shortage' | 'on_track';
  margin: number; // positive = can miss X classes, negative (absolute) = must attend Y classes
}
