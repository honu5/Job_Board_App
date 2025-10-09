import { prisma } from '../config/db.js';
import nodemailer from 'nodemailer';

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
      include: { job: true, score: true }
    });
    return res.status(200).json({ applications: apps });
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
        score: true
      }
    });
    const enriched = apps.map(a => ({
      ...a,
      rating: a.score?.scorePercent || null,
      comment: a.score?.details || null,
    }));
    return res.status(200).json({ applications: enriched });
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
