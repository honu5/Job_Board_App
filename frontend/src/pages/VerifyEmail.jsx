import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Alert from '../components/Alert.jsx';
import api from '../api.js';

export default function VerifyEmail(){
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setMessage(data.message || 'Email verified');
      }catch(err){
        setError(err.response?.data?.message || 'Verification failed');
      }
    })();
  },[token]);

  return (
    <AuthLayout title="Email verification">
      {message && <Alert kind="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}
      <p className="note"><Link to="/login">Go to sign in</Link></p>
    </AuthLayout>
  );
}
