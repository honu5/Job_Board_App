import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function AppliedJobs(){
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [globalHired, setGlobalHired] = useState(null); // legacy single job view

  const load = async ()=>{
    try{
  const { data } = await api.get('/applications');
  setApps(data.applications || []);
  setGlobalHired(data.hiredTalent || null);
    }catch(e){ setError(e.response?.data?.message || 'Failed to load applications'); }
  };
  useEffect(()=>{ load(); },[]);

  const editProposal = async (a)=>{
    const text = prompt('Edit your proposal', a.proposal || '');
    if (text===null) return;
    await api.put(`/applications/${a.id}`, { proposal: text });
    load();
  };

  const toggleClose = async (a)=>{
    const newStatus = a.status === 'REJECTED' ? 'PENDING' : 'REJECTED';
    await api.put(`/applications/${a.id}`, { status: newStatus });
    load();
  };

  const del = async (a)=>{
    //eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this application?')) return;
    await api.delete(`/applications/${a.id}`);
    load();
  };

  const consent = async (a, val)=>{
    await api.post(`/applications/${a.id}/consent`, { consented: val });
    load();
  };

  const chat = (a)=>{
    window.location.href = `/dashboard/chat?appId=${a.id}`;
  };

  return (
    <div className="container" style={{paddingTop:16,paddingBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Applied jobs</h2>
      </div>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div style={{display:'grid', gap:12}}>
        {apps.map(a => {
          const isRejected = a.status === 'REJECTED';
          const hiredTalent = a.hiredTalent; // per-application hired candidate info
          const canEdit = !hiredTalent && !isRejected;
          const canChat = a.status === 'INTERVIEW' || (a.status === 'HIRED' && a.startedAt && !a.finishedAt);
          return (
          <div key={a.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18}}>{a.job?.title}</div>
                <div style={{color:'#64748b'}}>{a.job?.companyName}</div>
                <div style={{marginTop:6}}><span style={{padding:'4px 8px',border:'1px solid #94a3b8',borderRadius:999}}>{a.status}</span></div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {canEdit && <button onClick={()=>editProposal(a)} className="btn secondary">Edit</button>}
                {canEdit && <button onClick={()=>toggleClose(a)} className="btn secondary">{a.status==='REJECTED'?'Re-open':'Close'}</button>}
                {hiredTalent && isRejected && (
                  <button onClick={()=>{ window.location.href = `/p/${hiredTalent.userId}?jobId=${a.job.id}`; }} className="btn secondary">View Passed Talent</button>
                )}
                <button onClick={()=>del(a)} className="btn secondary" style={{borderColor:'#ef4444', color:'#ef4444'}}>Delete</button>
                {canChat && <button onClick={()=>chat(a)} className="btn">Chat</button>}
                {hiredTalent && !isRejected && a.status !== 'HIRED' && a.status !== 'PENDING' && (
                  <button onClick={()=>{ window.location.href = `/p/${hiredTalent.userId}?jobId=${a.job.id}`; }} className="btn secondary">View Hired Talent</button>
                )}
              </div>
            </div>
            <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{a.proposal}</div>
            {/* Show hired talent summary if eligible (was INTERVIEW stage or rejected after interview visibility flag) */}
            {hiredTalent && (a.status === 'INTERVIEW' || isRejected) && (
              <div style={{marginTop:12,padding:12,border:'1px solid #16a34a',borderRadius:12,background:'#f0fdf4'}}>
                <div style={{fontWeight:600}}>Selected Candidate: <a href={`/p/${hiredTalent.userId}?jobId=${a.job.id}`} style={{color:'#065f46',textDecoration:'none'}}>{hiredTalent.name}</a></div>
                {hiredTalent.scorePercent != null && <div style={{color:'#065f46'}}>Interview Score: {hiredTalent.scorePercent}%</div>}
                {hiredTalent.resumeVisible && hiredTalent.resumeContent && <div style={{marginTop:8,fontSize:13,whiteSpace:'pre-wrap'}}>{hiredTalent.resumeContent}</div>}
                <button className="btn secondary" style={{marginTop:8}} onClick={()=>{ window.location.href = `/p/${hiredTalent.userId}?jobId=${a.job.id}`; }}>View Full Profile</button>
              </div>
            )}
            {a.status==='INTERVIEW' && !a.sharedExperiences?.length && (
              <div style={{marginTop:10}}>
                <label style={{marginRight:8}}>Share experience with future applicants? (Earn coins)</label>
                <button className="btn secondary" onClick={()=>consent(a, true)}>Yes</button>
                <button className="btn secondary" onClick={()=>consent(a, false)} style={{marginLeft:6}}>No</button>
              </div>
            )}
            {a.status==='INTERVIEW' && a.sharedExperiences?.length>0 && (
              <div style={{marginTop:10,fontSize:13,color:'#065f46'}}>
                Sharing preference saved: {a.sharedExperiences[0].consented ? 'Willing to help peers.' : 'Opted out.'}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
