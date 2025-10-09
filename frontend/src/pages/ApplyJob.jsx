import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function ApplyJob(){
  const [job, setJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');

  useEffect(()=>{
    (async()=>{
      try{
        if (jobId){
          const { data } = await api.get(`/jobs/${jobId}`);
          setJob(data.job);
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
        <form onSubmit={submit} style={{display:'grid',gap:12}}>
          <label>Your proposal</label>
          <textarea rows={10} value={proposal} onChange={e=>setProposal(e.target.value)} required style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
          <div className="actions"><button className="btn" type="submit">Send application</button></div>
        </form>
      </div>
    </div>
  );
}
