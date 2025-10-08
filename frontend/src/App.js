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
			</Routes>
		</BrowserRouter>
	);
}
