import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function Dashboard(){
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get('/auth/dashboard');
        setUser(data.user);
      }catch(err){
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    })();
  },[]);
  return (
    <div className="container">
      <h1>Dashboard</h1>
      {error && <p>{error}</p>}
      {user ? (
        <p>Welcome, {user.name || user.email}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
