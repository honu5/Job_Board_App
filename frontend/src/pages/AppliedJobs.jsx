import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function AppliedJobs(){
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

  const load = async ()=>{
    try{
      const { data } = await api.get('/applications');
      setApps(data.applications || []);
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
        {apps.map(a => (
          <div key={a.id} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
              <div>
                <div style={{fontWeight:700,fontSize:18}}>{a.job?.title}</div>
                <div style={{color:'#64748b'}}>{a.job?.companyName}</div>
                <div style={{marginTop:6}}><span style={{padding:'4px 8px',border:'1px solid #94a3b8',borderRadius:999}}>{a.status}</span></div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={()=>editProposal(a)} className="btn secondary">Edit</button>
                <button onClick={()=>toggleClose(a)} className="btn secondary">{a.status==='REJECTED'?'Re-open':'Close'}</button>
                <button onClick={()=>del(a)} className="btn secondary" style={{borderColor:'#ef4444', color:'#ef4444'}}>Delete</button>
                {a.status==='INTERVIEW' && <button onClick={()=>chat(a)} className="btn">Chat</button>}
              </div>
            </div>
            <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{a.proposal}</div>
            {a.status==='INTERVIEW' && (
              <div style={{marginTop:10}}>
                <label style={{marginRight:8}}>Willing to share info with peers?</label>
                <button className="btn secondary" onClick={()=>consent(a, true)}>Yes</button>
                <button className="btn secondary" onClick={()=>consent(a, false)} style={{marginLeft:6}}>No</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
