import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function JobApplications(){
  const [apps, setApps] = useState([]);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const jobId = window.location.pathname.split('/').slice(-2)[0];

  const load = async ()=>{
    try{
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      setApps(data.applications || []);
      const j = await api.get(`/jobs/${jobId}`);
      setJob(j.data.job);
    }catch(e){ setError(e.response?.data?.message || 'Failed to load'); }
  };
  useEffect(()=>{ load(); },[]);

  const accept = async (a)=>{
    await api.post(`/applications/${a.id}/accept-interview`);
    load();
  };

  return (
    <div className="container" style={{paddingTop:16,paddingBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Applications {job ? `· ${job.title}` : ''}</h2>
      </div>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div style={{display:'grid', gap:12}}>
        {apps.map(a => {
          const avatar = a.applicant?.profile?.avatarUrl;
          const accepted = a.status === 'INTERVIEW';
          return (
            <div key={a.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,background:'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <a href={`/p/${a.applicant?.id}`} style={{textDecoration:'none'}}>
                    <div style={{width:54,height:54,borderRadius:'50%',overflow:'hidden',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#065f46',border:'1px solid #16a34a'}}>
                      {avatar ? <img src={avatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (a.applicant?.name || a.applicant?.email || 'U')[0].toUpperCase()}
                    </div>
                  </a>
                  <div>
                    <div style={{fontWeight:700}}><a href={`/p/${a.applicant?.id}`} style={{color:'#065f46',textDecoration:'none'}}>{a.applicant?.name || a.applicant?.email}</a></div>
                    <div style={{color:'#64748b'}}>{a.applicant?.profile?.headline || a.applicant?.profile?.jobTitle || ''}</div>
                    <div style={{marginTop:6,display:'flex',gap:8,flexWrap:'wrap'}}>
                      {a.rating && <span style={{padding:'4px 8px',border:'1px solid #16a34a',borderRadius:999,color:'#065f46'}}>Score: {a.rating}%</span>}
                      <span style={{padding:'4px 8px',border:'1px solid #94a3b8',borderRadius:999}}>{a.status}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button disabled={accepted} onClick={()=>accept(a)} className="btn" style={{background: accepted? '#16a34a':'#16a34a', opacity: accepted?0.6:1}}>{accepted? 'Accepted':'Accept for interview'}</button>
                </div>
              </div>
              <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{a.proposal}</div>
              {a.comment && <div style={{marginTop:8, fontStyle:'italic'}}>Comment: {JSON.stringify(a.comment)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
