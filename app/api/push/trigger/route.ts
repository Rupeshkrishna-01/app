import { createClient } from '@/lib/supabase/server';
import { sendWebPushNotification } from '@/lib/push/vapid';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verify secret query parameter if cron token is configured
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const todayStr = now.toISOString().split('T')[0];

    // Find timetables for today
    const { data: timetables, error: ttError } = await supabase
      .from('timetables')
      .select('*')
      .eq('day_of_week', currentDayOfWeek);

    if (ttError || !timetables) {
      return NextResponse.json({ error: ttError?.message || 'No timetables found' }, { status: 500 });
    }

    let notificationsSent = 0;

    for (const tt of timetables) {
      // Check if user has active push subscriptions
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', tt.user_id);

      if (!subs || subs.length === 0) continue;

      // Check if attendance is already logged for today
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('user_id', tt.user_id)
        .eq('timetable_entry_id', tt.id)
        .eq('date', todayStr);

      if (logs && logs.length > 0) continue; // Already logged

      // Send push to all active subscriptions for this user
      for (const subRecord of subs) {
        const sub = subRecord.subscription;
        const res = await sendWebPushNotification(sub, {
          title: `Class Ended: ${tt.subject_name}`,
          body: `Did you attend ${tt.subject_name} (${tt.start_time} - ${tt.end_time})?`,
          timetableEntryId: tt.id,
          date: todayStr,
          subjectName: tt.subject_name,
        });

        if (res.success) notificationsSent++;
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error triggering push' }, { status: 500 });
  }
}
