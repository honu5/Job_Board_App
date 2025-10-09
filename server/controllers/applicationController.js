import { prisma } from '../config/db.js';
import nodemailer from 'nodemailer';
import { createMeetEvent } from './meetController.js';

const buildTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

export const applyToJob = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    if (role !== 'USER' && role !== 'ADMIN') return res.status(403).json({ message: 'Only talents can apply' });
    const { jobId, proposal, resumeId } = req.body;
    if (!jobId || !proposal) return res.status(400).json({ message: 'jobId and proposal required' });
    const job = await prisma.jobPost.findUnique({ where: { id: jobId }, include: { applications: true } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'OPEN') return res.status(400).json({ message: 'Job is closed' });
    // check limit
    if (job.applicationLimit && job.applications.length >= job.applicationLimit) {
      return res.status(400).json({ message: 'Application limit reached' });
    }
    // create
    const app = await prisma.application.create({
      data: { jobId, userId, proposal, resumeId: resumeId || null }
    });
    return res.status(201).json({ application: app });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(400).json({ message: 'You have already applied' });
    console.error('applyToJob error:', e);
    return res.status(500).json({ message: 'Failed to apply' });
  }
};

export const listMyApplications = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const jobId = req.query.jobId || undefined;
    const apps = await prisma.application.findMany({
      where: { userId, jobId: jobId || undefined },
      orderBy: { createdAt: 'desc' },
      include: { job: true, score: true, sharedExperiences: true }
    });
    // Build map of hired apps for all jobIds represented
    const jobIds = Array.from(new Set(apps.map(a=>a.jobId)));
    let hiredMap = {};
    if (jobIds.length) {
      const hiredApps = await prisma.application.findMany({
        where: { jobId: { in: jobIds }, status: 'HIRED' },
        include: { score: true, applicant: { select: { id: true, name: true, email: true } } }
      });
      for (const h of hiredApps) hiredMap[h.jobId] = h;
    }
    const enriched = [];
    for (const a of apps) {
      const hired = hiredMap[a.jobId];
      let hiredTalent = null;
      if (hired) {
        // Always show name & score; only show resume if current application reached INTERVIEW stage
        const isResumeVisible = a.status === 'INTERVIEW';
        let resumeContent = null;
        if (isResumeVisible) {
          const resume = await prisma.resume.findFirst({ where: { userId: hired.userId }, orderBy: { createdAt: 'desc' } });
            resumeContent = resume?.content || null;
        }
        hiredTalent = {
          userId: hired.userId,
          name: hired.applicant?.name || hired.applicant?.email,
          scorePercent: hired.score?.scorePercent || null,
          resumeContent: resumeContent ? (resumeContent.length > 800 ? resumeContent.slice(0,800) + '...' : resumeContent) : null,
          resumeVisible: isResumeVisible
        };
      }
      enriched.push({ ...a, hiredTalent });
    }
    // Backwards compatibility: if jobId query, still return top-level hiredTalent for that job
    let singleHired = null;
    if (jobId && hiredMap[jobId]) {
      const h = hiredMap[jobId];
      singleHired = { userId: h.userId, name: h.applicant?.name || h.applicant?.email, scorePercent: h.score?.scorePercent || null };
    }
    return res.status(200).json({ applications: enriched, hiredTalent: singleHired });
  } catch (e) {
    console.error('listMyApplications error:', e);
    return res.status(500).json({ message: 'Failed to load applications' });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const isOwner = app.userId === userId;
    const isClientOwner = app.job.authorId === userId || role === 'ADMIN';
    const { proposal, status } = req.body;
    const data = {};
    if (proposal !== undefined) {
      if (!isOwner) return res.status(403).json({ message: 'Only applicant can edit proposal' });
      data.proposal = proposal;
    }
    if (status !== undefined) {
      // Applicant can toggle PENDING<->REJECTED to close/reopen; client can set any
      if (isOwner) {
        if (!['PENDING','REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status change' });
      } else if (!isClientOwner) {
        return res.status(403).json({ message: 'Not allowed' });
      }
      data.status = status;
    }
    const updated = await prisma.application.update({ where: { id }, data });
    return res.status(200).json({ application: updated });
  } catch (e) {
    console.error('updateApplication error:', e);
    return res.status(500).json({ message: 'Failed to update' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const isOwner = app.userId === userId;
    const isClientOwner = app.job.authorId === userId || role === 'ADMIN';
    if (!isOwner && !isClientOwner) return res.status(403).json({ message: 'Not allowed' });
    await prisma.application.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('deleteApplication error:', e);
    return res.status(500).json({ message: 'Failed to delete' });
  }
};

export const listJobApplications = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params; // jobId
    const job = await prisma.jobPost.findUnique({ where: { id }, select: { authorId: true } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    const apps = await prisma.application.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { id: true, name: true, email: true, profile: true } },
        score: true,
        interviewInvites: { select: { id: true, scheduledAt: true, status: true, meetLink: true } }
      }
    });
    // Find passed candidate (status HIRED) if any
    let passedCandidate = null;
    const hired = apps.find(a => a.status === 'HIRED');
    if (hired) {
      // Fetch resume (latest) for that user (simplified assumption first resume)
      const resume = await prisma.resume.findFirst({ where: { userId: hired.userId }, orderBy: { createdAt: 'desc' } });
      passedCandidate = {
        applicationId: hired.id,
        userId: hired.userId,
        name: hired.applicant?.name || hired.applicant?.email,
        scorePercent: hired.score?.scorePercent || null,
        resumeContent: resume?.content || null
      };
    }
    const enriched = apps.map(a => ({
      ...a,
      rating: a.score?.scorePercent || null,
      comment: a.score?.details || null,
      interview: a.interviewInvites?.[0] ? {
        id: a.interviewInvites[0].id,
        scheduledAt: a.interviewInvites[0].scheduledAt,
        status: a.interviewInvites[0].status,
        meetLink: a.interviewInvites[0].meetLink
      } : null,
      startedAt: a.startedAt,
      finishedAt: a.finishedAt
    }));
    return res.status(200).json({ applications: enriched, passedCandidate });
  } catch (e) {
    console.error('listJobApplications error:', e);
    return res.status(500).json({ message: 'Failed to load applications' });
  }
};

export const acceptForInterview = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params; // application id
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true, applicant: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
  const updated = await prisma.application.update({ where: { id }, data: { status: 'INTERVIEW' } });
    // create invite skeleton
    await prisma.interviewInvite.create({ data: { applicationId: id, options: { slots: [] } } });
    // send email
    try {
      if (app.applicant?.email) {
        const transporter = buildTransporter();
        await transporter.sendMail({
          to: app.applicant.email,
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@kihlot.local',
          subject: '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉  Congratulations! You are invited to interview',
          text: `Your application for ${app.job.title} has been moved to Interview. It is a great Milestone. Please check the platform to coordinate times.Good Luck!`
        });
      }
    } catch (e) { /* swallow email errors */ }
    // create on-platform notification for applicant
    await prisma.notification.create({ data: {
      userId: app.applicant.id,
      title: 'Interview invite',
      message: `Congratulations! You are invited to interview for ${app.job.title}. It is a great Milestone. Good Luck!`,
      type: 'INTERVIEW'
    }});
    return res.status(200).json({ application: updated, notification: {
      title: 'Interview invite',
      message: `Congratulations! You are invited to interview for ${app.job.title}.`,
      type: 'INTERVIEW'
    }});
  } catch (e) {
    console.error('acceptForInterview error:', e);
    return res.status(500).json({ message: 'Failed to accept for interview' });
  }
};

// Schedule an interview: client provides ISO datetime; sets InterviewInvite scheduledAt and creates notification
export const scheduleInterview = async (req, res) => {
  try {
    const { id: userId, role } = req.user; // requester (client)
    const { id } = req.params; // application id
    const { scheduledAt } = req.body; // ISO string
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt required (ISO datetime)' });
    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true, applicant: true, interviews: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    // ensure invite exists (create if missing)
    let invite = await prisma.interviewInvite.findFirst({ where: { applicationId: id } });
    if (!invite) {
      invite = await prisma.interviewInvite.create({ data: { applicationId: id, options: { slots: [] } } });
    }
  // Attempt to create Google Meet event if client connected
  let meetMeta = null;
  try { meetMeta = await createMeetEvent(req, app, when); } catch {}
  const updatedInvite = await prisma.interviewInvite.update({ where: { id: invite.id }, data: { scheduledAt: when, status: 'SCHEDULED', meetLink: meetMeta?.meetLink || invite.meetLink, calendarEventId: meetMeta?.eventId || invite.calendarEventId } });
    // Create notification for applicant with time
    const timeStr = when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    await prisma.notification.create({ data: {
      userId: app.applicant.id,
      title: 'Interview Scheduled',
      message: `Your interview for ${app.job.title} is scheduled at ${timeStr}. Please be ready 5 minutes earlier.`,
      type: 'INTERVIEW_SCHEDULED'
    }});
    // Optional email
    try {
      if (app.applicant?.email) {
        const transporter = buildTransporter();
        await transporter.sendMail({
          to: app.applicant.email,
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@kihlot.local',
          subject: `Interview scheduled: ${app.job.title}`,
          text: `Your interview for ${app.job.title} is scheduled at ${timeStr}. Good luck!`,
        });
      }
    } catch (e) { /* swallow email errors */ }
  return res.status(200).json({ invite: updatedInvite });
  } catch (e) {
    console.error('scheduleInterview error:', e);
    return res.status(500).json({ message: 'Failed to schedule interview' });
  }
};

// Mark interview result (mock without Google Meet)
export const setInterviewResult = async (req, res) => {
  try {
    const { id: userId, role } = req.user; // job author or admin
    const { id } = req.params; // application id
    const { result, scorePercent } = req.body; // result: PASSED | FAILED
    if (!['PASSED','FAILED'].includes(result)) return res.status(400).json({ message: 'Invalid result' });
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true, score: true, applicant: { select: { id: true, name: true, email: true } } } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    // If marking PASSED ensure no other application for this job already passed/hired
    if (result === 'PASSED') {
      const existingPassed = await prisma.application.findFirst({ where: { jobId: app.jobId, status: 'HIRED' }, select: { id: true } });
      if (existingPassed && existingPassed.id !== app.id) return res.status(400).json({ message: 'A candidate has already been marked as passed for this job.' });
    }
    // Upsert interview record
    let interview = await prisma.interview.findFirst({ where: { applicationId: id } });
    if (!interview) {
      interview = await prisma.interview.create({ data: { applicationId: id, result: result === 'PASSED' ? 'PASSED' : 'FAILED' } });
    } else {
      interview = await prisma.interview.update({ where: { id: interview.id }, data: { result: result === 'PASSED' ? 'PASSED' : 'FAILED' } });
    }
    // Update application status
    const newStatus = result === 'PASSED' ? 'HIRED' : 'REJECTED';
    await prisma.application.update({ where: { id }, data: { status: newStatus } });
    // Score (ApplicationScore) if provided
    let scoreRec = app.score;
    if (typeof scorePercent === 'number' && scorePercent >= 0 && scorePercent <= 100) {
      if (scoreRec) {
        scoreRec = await prisma.applicationScore.update({ where: { id: scoreRec.id }, data: { scorePercent } });
      } else {
        scoreRec = await prisma.applicationScore.create({ data: { applicationId: app.id, scorePercent, details: { source: 'manual' } } });
      }
    }
    // Notify applicant
    await prisma.notification.create({ data: {
      userId: app.applicant.id,
      title: result === 'PASSED' ? 'Interview Result: Passed' : 'Interview Result',
      message: result === 'PASSED' ? `Congratulations! You have been selected for ${app.job.title}.` : `We appreciate your time interviewing for ${app.job.title}.` ,
      type: 'INTERVIEW_RESULT'
    }});
    return res.status(200).json({ applicationId: app.id, status: newStatus, interview, score: scoreRec });
  } catch (e) {
    console.error('setInterviewResult error:', e);
    return res.status(500).json({ message: 'Failed to set interview result' });
  }
};

export const startWork = async (req, res) => {
  try {
    const { id } = req.params; // application id
    const { id: userId, role } = req.user;
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    if (app.status !== 'HIRED') return res.status(400).json({ message: 'Only hired application can be started' });
    if (app.startedAt) return res.status(400).json({ message: 'Already started' });
    const updated = await prisma.application.update({ where: { id }, data: { startedAt: new Date() } });
    return res.status(200).json({ application: updated });
  } catch (e) {
    console.error('startWork error', e);
    return res.status(500).json({ message: 'Failed to start work' });
  }
};

export const finishWork = async (req, res) => {
  try {
    const { id } = req.params; // application id
    const { id: userId, role } = req.user;
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    if (!app.startedAt) return res.status(400).json({ message: 'Work not started' });
    if (app.finishedAt) return res.status(400).json({ message: 'Already finished' });
    const updated = await prisma.application.update({ where: { id }, data: { finishedAt: new Date() } });
    return res.status(200).json({ application: updated });
  } catch (e) {
    console.error('finishWork error', e);
    return res.status(500).json({ message: 'Failed to finish work' });
  }
};

export const rateTalent = async (req, res) => {
  try {
    const { id } = req.params; // application id
    const { rating, comment, period } = req.body;
    const { id: userId, role } = req.user;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ message: 'rating 1-5 required' });
    const app = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    if (!app.startedAt) return res.status(400).json({ message: 'Work not started yet' });
    // For project: allow one rating after finish; for permanent: allow multiple (period tag recommended)
    if (app.job.hireType === 'PROJECT' && !app.finishedAt) return res.status(400).json({ message: 'Finish project before rating' });
    if (app.job.hireType === 'PROJECT') {
      const existing = await prisma.talentRating.findFirst({ where: { applicationId: id } });
      if (existing) return res.status(400).json({ message: 'Already rated' });
    }
    const rec = await prisma.talentRating.create({ data: { applicationId: id, raterId: userId, rating: Math.round(rating), comment: comment || null, period: period || null } });
    return res.status(201).json({ rating: rec });
  } catch (e) {
    console.error('rateTalent error', e);
    return res.status(500).json({ message: 'Failed to rate talent' });
  }
};

export const toggleConsent = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id } = req.params; // application id
    const { consented } = req.body;
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.userId !== userId) return res.status(403).json({ message: 'Only applicant' });
    // upsert shared experience
    const existing = await prisma.sharedExperience.findFirst({ where: { fromUserId: userId, aboutApplicationId: id } });
    if (existing) {
      const upd = await prisma.sharedExperience.update({ where: { id: existing.id }, data: { consented: !!consented } });
      return res.status(200).json({ sharedExperience: upd });
    } else {
      const created = await prisma.sharedExperience.create({ data: { fromUserId: userId, aboutApplicationId: id, consented: !!consented } });
      return res.status(201).json({ sharedExperience: created });
    }
  } catch (e) {
    console.error('toggleConsent error:', e);
    return res.status(500).json({ message: 'Failed to update consent' });
  }
};

// List consenting interviewees (experiencers) for a company.
// Permission: requester must have at least one application (any status) to a job of this company OR be CLIENT/ADMIN.
export const listCompanyExperiencers = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { company } = req.params;
    if (!company) return res.status(400).json({ message: 'Company required' });
    let allowed = role === 'CLIENT' || role === 'ADMIN';
    if (!allowed) {
      const anyApp = await prisma.application.findFirst({
        where: { userId, job: { companyName: company } },
        select: { id: true }
      });
      allowed = !!anyApp;
    }
    if (!allowed) return res.status(403).json({ message: 'Not allowed' });
    // Find all applications for that company with status INTERVIEW and consented shared experience
    const apps = await prisma.application.findMany({
      where: { status: 'INTERVIEW', job: { companyName: company }, sharedExperiences: { some: { consented: true } } },
      include: { applicant: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true, headline: true } } } }, sharedExperiences: true }
    });
    // Flatten unique applicants
    const seen = new Set();
    const experiencers = [];
    for (const a of apps) {
      if (!seen.has(a.applicant.id)) {
        seen.add(a.applicant.id);
        experiencers.push({
          id: a.applicant.id,
          name: a.applicant.name || a.applicant.email,
          avatarUrl: a.applicant.profile?.avatarUrl || null,
          headline: a.applicant.profile?.headline || null,
        });
      }
    }
    return res.status(200).json({ experiencers });
  } catch (e) {
    console.error('listCompanyExperiencers error:', e);
    return res.status(500).json({ message: 'Failed to load experiencers' });
  }
};
