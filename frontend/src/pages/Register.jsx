import React, { useMemo, useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import Recaptcha from '../components/Recaptcha.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import api from '../api.js';
import { Link, useSearchParams } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  const role = useMemo(()=> (params.get('role') === 'CLIENT' ? 'CLIENT' : 'USER'),[params]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password, recaptchaToken, role });
      setMessage(data.message || 'Registered. Check your email to verify your account.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
  <AuthLayout title="Create your account" subtitle={role==='CLIENT' ? 'Create a client account to hire talents' : 'Join Kihlot Jobs and start applying in minutes'}>
      {message && <Alert kind="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField label="Full name" name="name" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" />
        <TextField label="Email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" />
        <TextField label="Password" name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />
  <Recaptcha onChange={(t)=>{ console.log('recaptcha token:', t); setRecaptchaToken(t); }} />
        <div className="actions">
          <button className="btn full" type="submit">Create account</button>
        </div>
      </form>
      <div className="spacer"/>
      <GoogleButton role={role} />
      <p className="note">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
