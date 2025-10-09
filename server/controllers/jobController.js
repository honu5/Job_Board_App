import { prisma } from '../config/db.js';
import nodemailer from 'nodemailer';

// Local lightweight transporter builder (reuse env creds if provided)
const buildTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

// Create a job post (CLIENT or ADMIN)
export const createJob = async (req, res) => {
  try {
    const { role, id: userId, name } = req.user;
    if (role !== 'CLIENT' && role !== 'ADMIN') return res.status(403).json({ message: 'Only clients can post jobs' });
    const { title, description, skills = [], workMode = 'REMOTE', location, hoursPerWeek, salaryRange, applicationLimit, deadline, jobCategory, hireType = 'PROJECT', numOpenings } = req.body;
    if (!title || !description || !jobCategory) return res.status(400).json({ message: 'Missing required fields' });

    // derive company name from profile (for CLIENT) or fallback to user name/email
    const me = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    const derivedCompany = me?.profile?.companyName || me?.name || me?.email || 'Company';

    // connect or create skills
    const connectSkills = Array.isArray(skills) ? skills.filter(Boolean).map((name) => ({ where: { name }, create: { name } })) : [];

    const job = await prisma.jobPost.create({
      data: {
        authorId: userId,
        title,
        companyName: derivedCompany,
        description,
        workMode,
        location: workMode === 'IN_PERSON' ? (location || null) : null,
        hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
        salaryRange: salaryRange || null,
        applicationLimit: applicationLimit ? Number(applicationLimit) : null,
        deadline: deadline ? new Date(deadline) : null,
        jobCategory,
        hireType,
        numOpenings: numOpenings ? Number(numOpenings) : null,
        skills: { connectOrCreate: connectSkills },
      },
      include: { skills: true }
    });
    // Respond early to client
    res.status(201).json({ job });

    // In background: for each non-client user with >=1 overlapping skill, if they now have 3+ open job matches, send a single email notification.
    setImmediate(async () => {
      try {
        const skillNames = job.skills.map(s=>s.name);
        if (!skillNames.length) return; // no skills -> skip matching
        // Find users (talents) that possess at least one of the job skills
        const matchingUsers = await prisma.user.findMany({
          where: {
            role: 'USER',
            skills: { some: { name: { in: skillNames } } },
            emailVerifiedAt: { not: null }
          },
          select: { id: true, email: true, name: true, skills: { select: { name: true } } }
        });
        if (!matchingUsers.length) return;
        const transporter = buildTransporter();
        for (const u of matchingUsers) {
          try {
            // Count current open job matches (>=1 overlapping skill) for this user
            const userSkillNames = u.skills.map(s=>s.name);
            const matchCount = await prisma.jobPost.count({
              where: {
                status: 'OPEN',
                skills: { some: { name: { in: userSkillNames } } }
              }
            });
            if (matchCount >= 3) {
              // Check if a notification already sent recently (avoid spamming). We'll store a Notification record with type JOB_MATCH_EMAIL once per day.
              const since = new Date(Date.now() - 24*60*60*1000);
              const already = await prisma.notification.findFirst({
                where: { userId: u.id, type: 'JOB_MATCH_EMAIL', createdAt: { gte: since } }
              });
              if (already) continue;
              // Create on-platform notification
              await prisma.notification.create({ data: {
                userId: u.id,
                title: 'Job matches available',
                message: `You have ${matchCount} open job opportunities matching your skills. Visit the platform to apply.`,
                type: 'JOB_MATCH_EMAIL'
              }});
              // Send email (best-effort)
              if (u.email) {
                await transporter.sendMail({
                  to: u.email,
                  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@kihlot.local',
                  subject: `You have ${matchCount} matching job opportunities` ,
                  html: `<p>Hi ${u.name || ''},</p><p>There are now <strong>${matchCount}</strong> open jobs matching at least one of your skills.</p><p><a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/dashboard/jobs">View matching jobs</a></p>`
                });
              }
            }
          } catch (inner) {
            console.error('match email user loop error', inner);
          }
        }
      } catch (bgErr) {
        console.error('Background job match email error:', bgErr);
      }
    });
    return; // response already sent
  } catch (e) {
    console.error('createJob error:', e);
    return res.status(500).json({ message: 'Failed to create job' });
  }
};

// Edit job (author or ADMIN)
export const updateJob = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;
    const job = await prisma.jobPost.findUnique({ where: { id }, include: { skills: true } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });

  const { title, description, skills, workMode, location, hoursPerWeek, salaryRange, applicationLimit, deadline, status, jobCategory, hireType, numOpenings } = req.body;

    const data = {
      title: title ?? job.title,
      // companyName is derived and not edited here
      description: description ?? job.description,
      workMode: workMode ?? job.workMode,
      location: (workMode ?? job.workMode) === 'IN_PERSON' ? (location ?? job.location) : null,
      hoursPerWeek: hoursPerWeek !== undefined ? Number(hoursPerWeek) : job.hoursPerWeek,
      salaryRange: salaryRange ?? job.salaryRange,
      applicationLimit: applicationLimit !== undefined ? Number(applicationLimit) : job.applicationLimit,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : job.deadline,
      status: status ?? job.status,
      jobCategory: jobCategory ?? job.jobCategory,
      hireType: hireType ?? job.hireType,
      numOpenings: numOpenings !== undefined ? Number(numOpenings) : job.numOpenings,
    };

    // skills update: replace if provided
    if (Array.isArray(skills)) {
      const connectSkills = skills.filter(Boolean).map((name) => ({ where: { name }, create: { name } }));
      await prisma.jobPost.update({ where: { id }, data: { skills: { set: [], connectOrCreate: connectSkills } } });
    }
    const updated = await prisma.jobPost.update({ where: { id }, data, include: { skills: true } });
    return res.status(200).json({ job: updated });
  } catch (e) {
    console.error('updateJob error:', e);
    return res.status(500).json({ message: 'Failed to update job' });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;
    const job = await prisma.jobPost.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    await prisma.jobPost.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('deleteJob error:', e);
    return res.status(500).json({ message: 'Failed to delete job' });
  }
};

// Get job by id
export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.jobPost.findUnique({ where: { id }, include: { skills: true, author: { select: { id: true, name: true, email: true } } } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    return res.status(200).json({ job });
  } catch (e) {
    console.error('getJob error:', e);
    return res.status(500).json({ message: 'Failed to fetch job' });
  }
};

// Stats: counts per category for recent days (default 3 days)
export const jobStats = async (req, res) => {
  try {
    const days = Math.max(1, Number(req.query.windowDays || 3));
    const since = new Date(Date.now() - days*24*60*60*1000);
    const jobs = await prisma.jobPost.groupBy({
      by: ['jobCategory'],
      where: { createdAt: { gte: since } },
      _count: { _all: true }
    });
    const sorted = jobs.sort((a,b)=> b._count._all - a._count._all).slice(0,5);
    return res.status(200).json({ categories: jobs, top5: sorted, since });
  } catch (e) {
    console.error('jobStats error:', e);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Enhanced stats for "On demand" section: top 5 posted categories & top 5 applied categories (by applications referencing job category)
export const onDemandCategories = async (req, res) => {
  try {
    // Top posted categories (all time or optional window)
    const days = req.query.windowDays ? Math.max(1, Number(req.query.windowDays)) : null;
    const since = days ? new Date(Date.now() - days*24*60*60*1000) : null;
    const posted = await prisma.jobPost.groupBy({
      by: ['jobCategory'],
      where: { jobCategory: { not: null }, ...(since ? { createdAt: { gte: since } } : {}) },
      _count: { _all: true }
    });
    const topPosted = posted.filter(p=>p.jobCategory).sort((a,b)=> b._count._all - a._count._all).slice(0,5);
    // Top applied categories: count applications joined with jobPost jobCategory
    const appliedRaw = await prisma.application.groupBy({
      by: ['jobId'],
      _count: { _all: true }
    });
    // Fetch categories for these jobIds
    const jobIds = appliedRaw.map(a=>a.jobId);
    const jobs = await prisma.jobPost.findMany({ where: { id: { in: jobIds } }, select: { id: true, jobCategory: true } });
    const catCount = {};
    for (const a of appliedRaw) {
      const job = jobs.find(j=>j.id === a.jobId);
      if (!job?.jobCategory) continue;
      catCount[job.jobCategory] = (catCount[job.jobCategory] || 0) + a._count._all;
    }
    const appliedArr = Object.entries(catCount).map(([jobCategory,count])=>({ jobCategory, _count: { _all: count } }));
    appliedArr.sort((a,b)=> b._count._all - a._count._all);
    const topApplied = appliedArr.slice(0,5);
    // For each topPosted category gather recent jobs (limit 5)
    const postedJobsByCat = {};
    for (const cat of topPosted) {
      const jobsForCat = await prisma.jobPost.findMany({
        where: { jobCategory: cat.jobCategory },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, companyName: true, createdAt: true }
      });
      postedJobsByCat[cat.jobCategory] = jobsForCat;
    }
    // For each topApplied category gather recent jobs (limit 5) that belong to the category
    const appliedJobsByCat = {};
    for (const cat of topApplied) {
      const jobsForCat = await prisma.jobPost.findMany({
        where: { jobCategory: cat.jobCategory },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, companyName: true, createdAt: true }
      });
      appliedJobsByCat[cat.jobCategory] = jobsForCat;
    }
    return res.status(200).json({ topPosted, topApplied, postedJobsByCat, appliedJobsByCat, windowDays: days || undefined });
  } catch (e) {
    console.error('onDemandCategories error:', e);
    return res.status(500).json({ message: 'Failed to fetch on-demand categories' });
  }
};

// List jobs for current user: CLIENT sees all; USER sees skill-matched (>=1 overlap)
export const listJobs = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let jobs;
    if (role === 'CLIENT' || role === 'ADMIN') {
      jobs = await prisma.jobPost.findMany({
        where: {},
        orderBy: { createdAt: 'desc' },
        include: { skills: true, author: { select: { id: true, name: true, email: true } } }
      });
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { skills: true } });
      const skillNames = (user?.skills || []).map((s) => s.name);
      // Find jobIds where the user has a REJECTED application; we will exclude them from listing
      const rejectedApps = await prisma.application.findMany({ where: { userId, status: 'REJECTED' }, select: { jobId: true } });
      const rejectedJobIds = rejectedApps.map(r=>r.jobId);
      jobs = await prisma.jobPost.findMany({
        where: {
          status: 'OPEN',
          OR: skillNames.length ? skillNames.map((nm) => ({ skills: { some: { name: nm } } })) : undefined,
          id: rejectedJobIds.length ? { notIn: rejectedJobIds } : undefined,
        },
        orderBy: { createdAt: 'desc' },
        include: { skills: true, author: { select: { id: true, name: true, email: true } } }
      });
    }
    return res.status(200).json({ jobs });
  } catch (e) {
    console.error('listJobs error:', e);
    return res.status(500).json({ message: 'Failed to list jobs' });
  }
};

// List jobs posted by current client
export const listPostedJobs = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    if (role !== 'CLIENT' && role !== 'ADMIN') return res.status(403).json({ message: 'Only clients' });
    const jobs = await prisma.jobPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { skills: true }
    });
    return res.status(200).json({ jobs });
  } catch (e) {
    console.error('listPostedJobs error:', e);
    return res.status(500).json({ message: 'Failed to list posted jobs' });
  }
};
