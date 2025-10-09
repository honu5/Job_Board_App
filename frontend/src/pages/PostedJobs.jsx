import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function PostedJobs(){
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  const load = async ()=>{
    try{
      const { data } = await api.get('/jobs/posted');
      setJobs(data.jobs || []);
    }catch(e){ setError(e.response?.data?.message || 'Failed to load posted jobs'); }
  };
  useEffect(()=>{ load(); },[]);

  const editJob = (job)=>{
    window.location.href = `/dashboard/post-job?id=${job.id}`;
  };

  const toggleStatus = async (job)=>{
    const newStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await api.put(`/jobs/${job.id}`, { status: newStatus });
    load();
  };

  const deleteJob = async (job)=>{
    //eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this job permanently?')) return;
    await api.delete(`/jobs/${job.id}`);
    load();
  };

  return (
    <div className="container" style={{paddingTop:16,paddingBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Posted jobs</h2>
        <a className="btn" href="/dashboard/post-job">Post job</a>
      </div>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div style={{display:'grid', gap:12}}>
        {jobs.map(j => (
          <div key={j.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18}}>{j.title}</div>
                <div style={{color:'#64748b'}}>{j.companyName}</div>
                <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.jobCategory?.replaceAll('_',' ')}</span>
                  <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.hireType === 'PERMANENT' ? 'Permanent' : 'Project'}</span>
                  <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.workMode === 'REMOTE' ? 'Remote' : 'In-person'}</span>
                  {j.location && j.workMode === 'IN_PERSON' && (
                    <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.location}</span>
                  )}
                  {typeof j.numOpenings === 'number' && (
                    <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{j.numOpenings} openings</span>
                  )}
                  {j.salaryRange && (
                    <span style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>Comp: {j.salaryRange}</span>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>editJob(j)} style={{padding:'6px 10px',border:'1px solid #cbd5e1',borderRadius:6,background:'#fff'}}>Edit</button>
                <button onClick={()=>toggleStatus(j)} style={{padding:'6px 10px',border:'1px solid #cbd5e1',borderRadius:6,background:j.status==='OPEN'?'#fff':'#f0fdf4'}}>{j.status==='OPEN'?'Close':'Re-open'}</button>
                <button onClick={()=>deleteJob(j)} style={{padding:'6px 10px',border:'1px solid #ef4444',color:'#ef4444',borderRadius:6,background:'#fff'}}>Delete</button>
                <a href={`/dashboard/jobs/${j.id}/applications`} style={{padding:'6px 10px',border:'1px solid #16a34a',borderRadius:6,background:'#16a34a', color:'#fff', textDecoration:'none'}}>View applications</a>
              </div>
            </div>
            <div style={{marginTop:8, color:'#0f172a'}}>{j.description}</div>
            {Array.isArray(j.skills) && j.skills.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
                {j.skills.map(s => <span key={s.id} style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:999,background:'#f8fafc'}}>{s.name}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
