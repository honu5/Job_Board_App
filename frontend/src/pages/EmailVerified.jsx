import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmailVerified(){
  const navigate = useNavigate();
  useEffect(()=>{
    const t = setTimeout(()=>navigate('/login'), 1200);
    return ()=>clearTimeout(t);
  },[navigate]);
  return (
    <div className="container" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card" style={{textAlign:'center'}}>
        <h2>Email verified</h2>
        <p className="subtitle">Redirecting you to sign in…</p>
      </div>
    </div>
  );
}
