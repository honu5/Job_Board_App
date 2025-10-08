import express from 'express';
import cors from 'cors';
import  authRoutes from './routes/authRoutes.js';
import {Router} from 'express';
import { protect } from './middlewares/authMiddleware.js';
import { getProfile, upsertProfile, listMockSkills } from './controllers/profileController.js';
import { listFeed, createPost, toggleLike, addComment, updatePost, deletePost } from './controllers/postController.js';
import cookieParser from 'cookie-parser';
import { prisma } from './config/db.js';
import { createJob, updateJob, listJobs, listPostedJobs, deleteJob, getJob, jobStats } from './controllers/jobController.js';
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

app.use('/api/auth', authRoutes);

// user scoped
const userRouter = Router();
userRouter.get('/profile', protect, getProfile);
userRouter.post('/profile', protect, upsertProfile);
userRouter.get('/skills', listMockSkills);
app.use('/api/user', userRouter);
app.use('/api/admin' , authRoutes)

app.get('/api/health', (_req, res) => res.send('API is running...'));

// Public profile endpoint: fetch by user id without auth
app.get('/api/profile/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const user = await prisma.user.findUnique({
			where: { id },
			include: { profile: true, skills: true },
		});
		if (!user) return res.status(404).json({ message: 'User not found' });
		const safe = {
			user: { id: user.id, name: user.name, email: user.email, role: user.role },
			profile: user.profile || null,
			skills: (user.skills || []).map(s => ({ id: s.id, name: s.name })),
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

export default app;
