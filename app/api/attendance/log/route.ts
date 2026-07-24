import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timetableEntryId, date, status } = await request.json();

    if (!timetableEntryId || !date || !['present', 'absent', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid parameters. Requires timetableEntryId, date (YYYY-MM-DD), and valid status.' },
        { status: 400 }
      );
    }

    // Upsert attendance record for current user
    const { data, error } = await supabase
      .from('attendance_logs')
      .upsert(
        {
          user_id: user.id,
          timetable_entry_id: timetableEntryId,
          date,
          status,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, timetable_entry_id, date' }
      )
      .select();

    if (error) {
      console.error('Error logging attendance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
