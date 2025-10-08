import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

export default function Landing(){
  const [stats, setStats] = useState({ talents: 0, clients: 0, companies: 0, jobs: 0 });
  const [error, setError] = useState('');
  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get('/auth/stats');
        setStats(data);
      }catch(err){
        setError(err.response?.data?.message || '');
      }
    })();
  },[]);

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#ffffff'}}>
      <section style={{padding:'56px 24px 32px',background:'#ffffff',color:'#064e3b',height:"70vh"}}>
        <div className="container" style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',height:"50vh"}}>
          <div style={{flex:'1 1 360px'}}>
              <h1 style={{fontSize:48,margin:0,color:'#065f46'}}>Kihlot — Find work you love</h1>
            <p style={{color:'#065f46',opacity:0.9}}>Kihlot Jobs connects talented people with great companies and help talents to upgrade thier application. Apply in minutes and track your progress transparently.</p>
            <div className="row" style={{marginTop:16}}>
              <Link className="btn" style={{background:'#16a34a',color:'#fff'}} to="/register?role=USER">I’m talent — find jobs</Link>
              <Link className="btn secondary" style={{borderColor:'#16a34a',color:'#065f46'}} to="/register?role=CLIENT">I’m client — hire talents</Link>
            </div>
          </div>
          <div style={{flex:'1 1 320px',background:'#ecfdf5',border:'1px solid #d1fae5',borderRadius:16,padding:24}}>
            <h3 style={{marginTop:0,color:'#047857'}}>Why Kihlot?</h3>
            <ul style={{margin:0,paddingLeft:18,color:'#065f46'}}>
              <li>Transparent application tracking</li>
              <li>Smart matching and resume scoring</li>
              <li>Fast, secure, and private</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{padding:'40px 24px',background:'#065f46',color:'#ecfdf5',flexGrow:1,height:"30vh"}}>
        <div className="container" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16}}>
          <div style={{background:'#047857',borderRadius:12,padding:16}}>
            <div style={{fontSize:14,opacity:0.9}}>Talents</div>
            <div style={{fontSize:28,fontWeight:700}}>{stats.talents}</div>
          </div>
          <div style={{background:'#047857',borderRadius:12,padding:16}}>
            <div style={{fontSize:14,opacity:0.9}}>Clients</div>
            <div style={{fontSize:28,fontWeight:700}}>{stats.clients}</div>
          </div>
          <div style={{background:'#047857',borderRadius:12,padding:16}}>
            <div style={{fontSize:14,opacity:0.9}}>Companies</div>
            <div style={{fontSize:28,fontWeight:700}}>{stats.companies}</div>
          </div>
          <div style={{background:'#047857',borderRadius:12,padding:16}}>
            <div style={{fontSize:14,opacity:0.9}}>Jobs Posted</div>
            <div style={{fontSize:28,fontWeight:700}}>{stats.jobs}</div>
          </div>
        </div>
        {error && <div className="container" style={{marginTop:8}}><small>{error}</small></div>}
      </section>
      
    </div>
  );
}
