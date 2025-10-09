import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function Jobs(){
  const [jobs, setJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const load = async ()=>{
    try{
      const dash = await api.get('/auth/dashboard');
      setMe(dash.data.user);
      const { data } = await api.get('/jobs');
      setJobs(data.jobs || []);
      // fetch my applications if user
      if (dash.data.user?.role === 'USER') {
        try {
          const apps = await api.get('/applications');
          const ids = new Set((apps.data.applications||[]).map(a=>a.jobId));
          setAppliedJobIds(ids);
        } catch {}
      }
    }catch(e){ setError(e.response?.data?.message || 'Failed to load jobs'); }
  };
  useEffect(()=>{ load(); },[]);

  const editJob = (job)=>{
    window.location.href = `/dashboard/post-job?id=${job.id}`;
  };

  const isClient = me?.role === 'CLIENT' || me?.role === 'ADMIN';
  const isUser = me?.role === 'USER';

  return (
    <div className="container" style={{paddingTop:16,paddingBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Jobs</h2>
        {isClient && (
          <div style={{display:'flex',gap:8}}>
            <a className="btn" href="/dashboard/post-job">Post job</a>
            <a className="btn secondary" href="/dashboard/posted-jobs">Posted jobs</a>
          </div>
        )}
      </div>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div style={{display:'grid', gap:12}}>
        {jobs.map(j => (
          <div key={j.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18}}>{j.title}</div>
                <div style={{color:'#64748b'}}>{j.companyName}</div>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.jobCategory?.replaceAll('_',' ')}</span>
                  <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.hireType === 'PERMANENT' ? 'Permanent' : 'Project'}</span>
                  {typeof j.numOpenings === 'number' && <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.numOpenings} openings</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{padding:'4px 8px',border:'1px solid #16a34a',borderRadius:999,color:'#065f46'}}>{j.workMode === 'IN_PERSON' ? 'In person' : 'Remote'}</span>
                {j.location && <span style={{padding:'4px 8px',border:'1px solid #94a3b8',borderRadius:999,color:'#334155'}}>{j.location}</span>}
                {typeof j.hoursPerWeek === 'number' && <span style={{padding:'4px 8px',border:'1px solid #94a3b8',borderRadius:999,color:'#334155'}}>{j.hoursPerWeek} hrs/wk</span>}
              </div>
            </div>
            <div style={{marginTop:8, color:'#0f172a'}}>{j.description}</div>
            {Array.isArray(j.skills) && j.skills.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
                {j.skills.map(s => <span key={s.id} style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{s.name}</span>)}
              </div>
            )}
            {(isClient && (me?.id === j.authorId || me?.role === 'ADMIN')) && (
              <div style={{marginTop:12}}>
                <button className="btn secondary" onClick={()=>editJob(j)}>Edit</button>
              </div>
            )}
            {isUser && !appliedJobIds.has(j.id) && (
              <div style={{marginTop:12}}>
                <a className="btn" href={`/dashboard/apply?jobId=${j.id}`}>Apply</a>
              </div>
            )}
            {isUser && appliedJobIds.has(j.id) && (
              <div style={{marginTop:12}}>
                <span style={{padding:'6px 12px',border:'1px solid #16a34a',borderRadius:8,background:'#f0fdf4',color:'#065f46',fontSize:14}}>Already applied</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
