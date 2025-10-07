import express from 'express';
import cors from 'cors';
import  authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';


const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use('/api/user' , authRoutes)
app.use('/api/admin' , authRoutes)

app.get('/api/health', (res) => res.send('API is running...'));

export default app;
