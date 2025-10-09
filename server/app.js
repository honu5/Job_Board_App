import express from 'express';
import cors from 'cors';
import  authRoutes from './routes/authRoutes.js';
import {Router} from 'express';
import { protect } from './middlewares/authMiddleware.js';
import { getProfile, upsertProfile, listMockSkills } from './controllers/profileController.js';
import { listFeed, createPost, toggleLike, addComment, updatePost, deletePost } from './controllers/postController.js';
import cookieParser from 'cookie-parser';
import { prisma } from './config/db.js';
import { createJob, updateJob, listJobs, listPostedJobs, deleteJob, getJob, jobStats, onDemandCategories } from './controllers/jobController.js';
import { applyToJob, listMyApplications, updateApplication, deleteApplication, listJobApplications, acceptForInterview, toggleConsent, listCompanyExperiencers, scheduleInterview, setInterviewResult, startWork, finishWork, rateTalent } from './controllers/applicationController.js';
import { listNotifications, markNotification } from './controllers/notificationController.js';
import { meetAuth, meetCallback, meetStatus } from './controllers/meetController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// Static serve uploads
app.use('/uploads', express.static(uploadsDir));

// Configure multer storage
const storage = multer.diskStorage({
	destination: function (_req, _file, cb) { cb(null, uploadsDir); },
	filename: function (_req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname || '');
		cb(null, unique + ext);
	}
});
const upload = multer({ storage });

// Video upload (70MB limit) & filter for common video types
const videoUpload = multer({
	storage,
	limits: { fileSize: 70 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const ok = ['video/mp4','video/webm','video/quicktime'].includes(file.mimetype);
		if (!ok) return cb(new Error('Only MP4, WEBM, MOV are allowed'));
		cb(null, true);
	}
});

app.use('/api/auth', authRoutes);

// user scoped
const userRouter = Router();
userRouter.get('/profile', protect, getProfile);
userRouter.post('/profile', protect, upsertProfile);
// Upload optional intro video for profile
userRouter.post('/profile/video', protect, videoUpload.single('video'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ message: 'No video uploaded' });
		const url = `/uploads/${req.file.filename}`;
		await prisma.profile.upsert({
			where: { userId: req.user.id },
			update: { introVideoUrl: url },
			create: { userId: req.user.id, introVideoUrl: url }
		});
		return res.status(200).json({ message: 'Video uploaded', introVideoUrl: url });
	} catch (e) {
		console.error('upload intro video error:', e);
		return res.status(500).json({ message: 'Failed to upload video' });
	}
});
userRouter.delete('/profile/video', protect, async (req, res) => {
	try {
		const prof = await prisma.profile.findUnique({ where: { userId: req.user.id } });
		if (!prof || !prof.introVideoUrl) return res.status(404).json({ message: 'No video to delete' });
		const fileName = prof.introVideoUrl.replace('/uploads/','');
		const filePath = path.join(process.cwd(), 'uploads', fileName);
		try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
		await prisma.profile.update({ where: { userId: req.user.id }, data: { introVideoUrl: null } });
		return res.status(200).json({ message: 'Video removed' });
	} catch (e) {
		console.error('delete intro video error:', e);
		return res.status(500).json({ message: 'Failed to delete video' });
	}
});
userRouter.get('/skills', listMockSkills);
app.use('/api/user', userRouter);
app.use('/api/admin' , authRoutes)

app.get('/api/health', (_req, res) => res.send('API is running...'));

// Public profile endpoint: fetch by user id without auth
app.get('/api/profile/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const jobId = req.query.jobId || null;
		const user = await prisma.user.findUnique({
			where: { id },
			include: { profile: true, skills: true },
		});
		if (!user) return res.status(404).json({ message: 'User not found' });
		// Ratings aggregation
		const ratings = await prisma.talentRating.findMany({
			where: { application: { userId: id } },
			select: { rating: true, comment: true, period: true, createdAt: true }
		});
		const avgRating = ratings.length ? (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length) : null;
		// Fetch applications for this user to classify active vs completed jobs (only if talent role)
		let activeJobs = [];
		let completedJobs = [];
		if (user.role === 'USER') {
			const talentApps = await prisma.application.findMany({
				where: { userId: id, status: { in: ['HIRED'] } },
				include: { job: true, ratings: true }
			});
			for (const a of talentApps) {
				const base = {
					applicationId: a.id,
					jobId: a.jobId,
					jobTitle: a.job?.title,
					companyName: a.job?.companyName,
					hireType: a.job?.hireType,
					startedAt: a.startedAt,
					finishedAt: a.finishedAt,
					ratings: a.ratings.map(r=>({ id: r.id, rating: r.rating, comment: r.comment, period: r.period, createdAt: r.createdAt }))
				};
				if (a.finishedAt) completedJobs.push(base); else activeJobs.push(base);
			}
		}
		let interviewScore = null;
		if (jobId) {
			const app = await prisma.application.findFirst({ where: { jobId, userId: id }, include: { score: true } });
			if (app?.score?.scorePercent) interviewScore = app.score.scorePercent;
		}
		const safe = {
			user: { id: user.id, name: user.name, email: user.email, role: user.role },
			profile: user.profile || null,
			skills: (user.skills || []).map(s => ({ id: s.id, name: s.name })),
			avgRating,
			ratings,
			interviewScore,
			activeJobs,
			completedJobs,
		};
		return res.status(200).json(safe);
	} catch (e) {
		console.error('public profile error:', e);
		return res.status(500).json({ message: 'Failed to fetch profile' });
	}
});

// Feed endpoints (protected)
app.get('/api/feed', protect, listFeed);
app.post('/api/posts', protect, upload.single('media'), createPost);
app.put('/api/posts/:id', protect, upload.single('media'), updatePost);
app.delete('/api/posts/:id', protect, deletePost);
app.post('/api/posts/:id/like', protect, toggleLike);
app.post('/api/posts/:id/comments', protect, addComment);

// Jobs endpoints (protected)
app.post('/api/jobs', protect, createJob);
app.put('/api/jobs/:id', protect, updateJob);
app.get('/api/jobs', protect, listJobs);
app.get('/api/jobs/posted', protect, listPostedJobs);
app.get('/api/jobs/:id', protect, getJob);
app.delete('/api/jobs/:id', protect, deleteJob);
app.get('/api/jobs-stats', protect, jobStats);
// On-demand categories (top posted & applied)
app.get('/api/on-demand/categories', protect, onDemandCategories);

// Applications endpoints (protected)
app.post('/api/applications', protect, applyToJob);
app.get('/api/applications', protect, listMyApplications);
app.put('/api/applications/:id', protect, updateApplication);
app.delete('/api/applications/:id', protect, deleteApplication);
app.get('/api/jobs/:id/applications', protect, listJobApplications);
app.post('/api/applications/:id/accept-interview', protect, acceptForInterview);
app.post('/api/applications/:id/schedule-interview', protect, scheduleInterview);
app.post('/api/applications/:id/interview-result', protect, setInterviewResult);
app.post('/api/applications/:id/start', protect, startWork);
app.post('/api/applications/:id/finish', protect, finishWork);
app.post('/api/applications/:id/rate', protect, rateTalent);
app.post('/api/applications/:id/consent', protect, toggleConsent);
app.get('/api/companies/:company/experiencers', protect, listCompanyExperiencers);
// Chat history for an application room
app.get('/api/applications/:id/chat', protect, async (req, res) => {
	try {
		const applicationId = req.params.id;
		const appRec = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
		if (!appRec) return res.status(404).json({ message: 'Application not found' });
		const uid = req.user.id;
		const isApplicant = appRec.userId === uid;
		const isClient = appRec.job?.authorId === uid;
		let isExperiencer = false;
		if (!isApplicant && !isClient) {
			const se = await prisma.sharedExperience.findFirst({ where: { aboutApplicationId: applicationId, fromUserId: uid, consented: true } });
			isExperiencer = !!se;
		}
		if (!(isApplicant || isClient || isExperiencer)) return res.status(403).json({ message: 'Not allowed' });
		const messages = await prisma.chatMessage.findMany({ where: { applicationId }, orderBy: { createdAt: 'asc' }, take: 200 });
		return res.status(200).json({ messages });
	} catch (e) {
		console.error('chat history error:', e);
		return res.status(500).json({ message: 'Failed to load chat' });
	}
});

// Google Meet integration
app.get('/api/meet/auth', protect, meetAuth); // returns URL for client-side redirect
app.get('/api/meet/callback', protect, meetCallback); // Google redirects here
app.get('/api/meet/status', protect, meetStatus);

// Notifications
app.get('/api/notifications', protect, listNotifications);
app.post('/api/notifications/:id/mark', protect, markNotification);

export default app;
