import React, { useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import api from '../api.js';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  const pathParams = useParams();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
  const token = pathParams.token || params.get('token');
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message || 'Password reset successful');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password">
      {message && <Alert kind="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField label="New password" name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />
        <div className="actions">
          <button className="btn full" type="submit">Reset password</button>
        </div>
      </form>
      <p className="note"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  );
}
