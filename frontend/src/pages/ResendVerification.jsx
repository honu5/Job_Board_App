import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import api from '../api.js';
import { Link } from 'react-router-dom';

export default function ResendVerification(){
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const onSubmit = async (e)=>{
    e.preventDefault(); setError(''); setMessage('');
    try{
      const { data } = await api.post('/auth/resend-verification', { email });
      setMessage(data.message || 'Verification email sent');
    }catch(err){
      setError(err.response?.data?.message || 'Failed to resend verification');
    }
  };
  return (
    <AuthLayout title="Resend verification email">
      {message && <Alert kind="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField label="Email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <div className="actions"><button className="btn full" type="submit">Send</button></div>
      </form>
      <p className="note"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  );
}
