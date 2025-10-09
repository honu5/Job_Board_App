import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function ApplyJob(){
  const [job, setJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [experiencers, setExperiencers] = useState([]);
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');

  useEffect(()=>{
    (async()=>{
      try{
        if (jobId){
          const { data } = await api.get(`/jobs/${jobId}`);
          setJob(data.job);
          if (data.job?.companyName){
            try{
              const ex = await api.get(`/companies/${encodeURIComponent(data.job.companyName)}/experiencers`);
              setExperiencers(ex.data?.experiencers||[]);
            }catch{/* ignore */}
          }
        }
      }catch(e){ setError(e.response?.data?.message || 'Failed to load job'); }
    })();
  },[jobId]);

  const submit = async (e)=>{
    e.preventDefault(); setError(''); setSuccess('');
    try{
      await api.post('/applications', { jobId, proposal });
      setSuccess('Application sent! Redirecting...');
      setTimeout(()=> window.location.href = '/dashboard/applied-jobs', 800);
    }catch(e){ setError(e.response?.data?.message || 'Failed to apply'); }
  };

  return (
    <div className="container" style={{paddingTop:24,paddingBottom:24}}>
      <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
        <h2 style={{marginTop:0}}>Apply to job</h2>
        {job && <p style={{marginTop:-8, color:'#64748b'}}>{job.title} · {job.companyName}</p>}
        {error && <p style={{color:'red'}}>{error}</p>}
        {success && <p style={{color:'green'}}>{success}</p>}
        {experiencers.length>0 && (
          <div style={{marginBottom:16,background:'#f0fdf4',border:'1px solid #bbf7d0',padding:12,borderRadius:10}}>
            <div style={{fontWeight:600,marginBottom:6}}>Talk to pioneers from {job?.companyName}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
              {experiencers.map(ex => (
                <div key={ex.id} style={{display:'flex',alignItems:'center',gap:8,border:'1px solid #e2e8f0',padding:'6px 10px',borderRadius:8,background:'#fff'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#065f46'}}>
                    {ex.avatarUrl ? <img src={ex.avatarUrl} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (ex.name||'U')[0].toUpperCase()}
                  </div>
                  <div style={{display:'flex',flexDirection:'column'}}>
                    <span style={{fontWeight:600,fontSize:13}}>{ex.name}</span>
                    {ex.headline && <span style={{fontSize:11,color:'#64748b'}}>{ex.headline}</span>}
                  </div>
                  <button type="button" className="btn secondary" style={{marginLeft:4}} onClick={()=>window.location.href=`/dashboard/chat?userId=${ex.id}`}>Chat</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={submit} style={{display:'grid',gap:12}}>
          <label>Your proposal</label>
          <textarea rows={10} value={proposal} onChange={e=>setProposal(e.target.value)} required style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
          <div className="actions"><button className="btn" type="submit">Send application</button></div>
        </form>
      </div>
    </div>
  );
}
