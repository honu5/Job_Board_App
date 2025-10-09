import { google } from 'googleapis';
import { prisma } from '../config/db.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function buildOAuth2(req){
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET;
  const redirectUri = "http://localhost:5000/api/auth/google/callback" || `${req.protocol}://${req.get('host')}/api/meet/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const meetAuth = async (req, res) => {
  try {
    const oAuth2 = buildOAuth2(req);
    const url = oAuth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
    return res.json({ url });
  } catch (e) {
    console.error('meetAuth error', e);
    return res.status(500).json({ message: 'Failed to init auth' });
  }
};

export const meetCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'Missing code' });
    const oAuth2 = buildOAuth2(req);
    const { tokens } = await oAuth2.getToken(code);
    if (!tokens.refresh_token) {
      // If no refresh token returned, user previously consented; we keep existing one.
      console.log('No new refresh token received');
    }
    const userId = req.user?.id; // ensure protect middleware used
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (tokens.refresh_token) {
      await prisma.user.update({ where: { id: userId }, data: { googleRefreshToken: tokens.refresh_token } });
    }
    return res.redirect((process.env.CLIENT_ORIGIN || 'http://localhost:3000') + '/dashboard?google=connected');
  } catch (e) {
    console.error('meetCallback error', e);
    return res.status(500).json({ message: 'Failed to complete auth' });
  }
};

export const meetStatus = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await prisma.user.findUnique({ where: { id }, select: { googleRefreshToken: true } });
    return res.json({ connected: !!user?.googleRefreshToken });
  } catch (e) {
    console.error('meetStatus error', e);
    return res.status(500).json({ message: 'Failed to fetch status' });
  }
};

export async function createMeetEvent(req, application, scheduledAt){
  // Returns { meetLink, eventId } or null if not available
  try {
    // Use client (job author) refresh token
    const clientUser = await prisma.user.findUnique({ where: { id: application.job.authorId }, select: { googleRefreshToken: true, email: true, name: true } });
    if (!clientUser?.googleRefreshToken) return null;
    const oAuth2 = buildOAuth2(req);
    oAuth2.setCredentials({ refresh_token: clientUser.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oAuth2 });
    const startISO = new Date(scheduledAt).toISOString();
    const endISO = new Date(new Date(scheduledAt).getTime() + 30*60000).toISOString();
    const event = {
      summary: `Interview: ${application.job.title}`,
      description: 'Interview scheduled via Kihlot platform',
      start: { dateTime: startISO },
      end: { dateTime: endISO },
      attendees: [
        { email: application.applicant.email },
        { email: clientUser.email }
      ],
      conferenceData: {
        createRequest: { requestId: 'kihlot-' + Date.now() }
      }
    };
    const inserted = await calendar.events.insert({ calendarId: 'primary', requestBody: event, conferenceDataVersion: 1 });
    const meetLink = inserted.data?.hangoutLink || (inserted.data?.conferenceData?.entryPoints || []).find(p=>p.entryPointType==='video')?.uri || null;
    return { meetLink, eventId: inserted.data.id };
  } catch (e) {
    console.error('createMeetEvent error', e);
    return null;
  }
}
