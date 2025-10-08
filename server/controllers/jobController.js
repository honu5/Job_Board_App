import { prisma } from '../config/db.js';

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
    return res.status(201).json({ job });
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
      jobs = await prisma.jobPost.findMany({
        where: {
          status: 'OPEN',
          OR: skillNames.length ? skillNames.map((nm) => ({ skills: { some: { name: nm } } })) : undefined,
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
