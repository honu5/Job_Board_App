import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import Recaptcha from '../components/Recaptcha.jsx';
import api from '../api.js';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password, recaptchaToken });
      localStorage.setItem('access_token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField label="Email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" />
        <TextField label="Password" name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" />
        <Recaptcha onChange={setRecaptchaToken} />
        <div className="actions">
          <button className="btn full" type="submit">Sign in</button>
        </div>
      </form>
      <div className="spacer"/>
      <GoogleButton />
      <p className="note">Don't have an account? <Link to="/register">Create one</Link></p>
      <p className="note"><Link to="/forgot-password">Forgot your password?</Link></p>
    </AuthLayout>
  );
}
