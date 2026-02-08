import { google } from 'googleapis';
import { createServiceClient } from '@/lib/supabase/server';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

async function getAuthenticatedClient(userId: string) {
  const supabase = createServiceClient();

  const { data: integration, error } = await supabase
    .from('google_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !integration) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = getOAuth2Client();

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(integration.token_expires_at).getTime();
  const now = Date.now();

  if (now >= expiresAt - 5 * 60 * 1000) {
    const credentials = await refreshAccessToken(integration.refresh_token);

    // Update stored tokens
    await supabase
      .from('google_integrations')
      .update({
        access_token: credentials.access_token!,
        token_expires_at: new Date(credentials.expiry_date!).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    oauth2Client.setCredentials(credentials);
  } else {
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });
  }

  return { oauth2Client, calendarId: integration.calendar_id };
}

export async function listCalendars(userId: string) {
  const { oauth2Client } = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const res = await calendar.calendarList.list();
  const items = res.data.items || [];

  return items.map((cal) => ({
    id: cal.id!,
    summary: cal.summary || cal.id!,
    primary: cal.primary === true,
  }));
}

export async function getAvailability({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { oauth2Client, calendarId } = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = res.data.calendars?.[calendarId]?.busy || [];
  return busy.map((slot) => ({
    start: slot.start!,
    end: slot.end!,
  }));
}

export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled' | 'not_found';

export async function getEventStatus(
  userId: string,
  eventId: string
): Promise<CalendarEventStatus> {
  const { oauth2Client, calendarId } = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const res = await calendar.events.get({
      calendarId,
      eventId,
    });

    const status = res.data.status;
    if (status === 'cancelled') return 'cancelled';
    if (status === 'tentative') return 'tentative';
    return 'confirmed';
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 404 || error.code === 410) {
      return 'not_found';
    }
    throw err;
  }
}

export async function createMeetingEvent({
  userId,
  summary,
  startTime,
  durationMinutes,
  attendeeEmail,
  description,
}: {
  userId: string;
  summary: string;
  startTime: string;
  durationMinutes: number;
  attendeeEmail: string;
  description?: string;
}) {
  const { oauth2Client, calendarId } = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `skaleflow-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  )?.uri;

  return {
    eventId: event.data.id!,
    meetLink: meetLink || null,
  };
}
