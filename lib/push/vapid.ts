import webPush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@attendx.app';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  timetableEntryId: string;
  date: string;
  subjectName: string;
}

export async function sendWebPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not set in environment variables. Web push skipped.');
    return { success: false, reason: 'VAPID keys missing' };
  }

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Error sending web push notification:', error);
    return { success: false, error };
  }
}
