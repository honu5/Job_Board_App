import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import api from '../api.js';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'Password reset link sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We'll send you a reset link">
      {message && <Alert kind="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField label="Email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" />
        <div className="actions">
          <button className="btn full" type="submit">Send reset link</button>
        </div>
      </form>
      <p className="note">Remember it? <Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  );
}
