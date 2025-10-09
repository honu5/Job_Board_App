import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmailVerified from './pages/EmailVerified.jsx';
import Onboarding from './pages/Onboarding.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import CreatePost from './pages/CreatePost.jsx';
import Jobs from './pages/Jobs.jsx';
import PostJob from './pages/PostJob.jsx';
import PostedJobs from './pages/PostedJobs.jsx';
import ApplyJob from './pages/ApplyJob.jsx';
import AppliedJobs from './pages/AppliedJobs.jsx';
import JobApplications from './pages/JobApplications.jsx';
import Chat from './pages/Chat.jsx';

export default function App(){
	return (
		<BrowserRouter>
			<Routes>
			<Route path="/" element={<Landing />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/reset-password" element={<ResetPassword />} />
			<Route path="/reset-password/:token" element={<ResetPassword />} />
				<Route path="/verify-email/:token" element={<VerifyEmail />} />
			<Route path="/email-verified" element={<EmailVerified />} />
				<Route path="/resend-verification" element={<ResendVerification />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/dashboard/jobs" element={<Jobs />} />
				<Route path="/dashboard/post-job" element={<PostJob />} />
				<Route path="/dashboard/posted-jobs" element={<PostedJobs />} />
				<Route path="/dashboard/apply" element={<ApplyJob />} />
				<Route path="/dashboard/applied-jobs" element={<AppliedJobs />} />
				<Route path="/dashboard/jobs/:id/applications" element={<JobApplications />} />
				<Route path="/dashboard/chat" element={<Chat />} />
						<Route path="/p/:id" element={<PublicProfile />} />
						<Route path="/dashboard/post" element={<CreatePost />} />
						<Route path="/onboarding" element={<Onboarding />} />
			</Routes>
		</BrowserRouter>
	);
}
