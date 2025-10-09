import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function JobApplications(){
  const [apps, setApps] = useState([]);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(null); // application being scheduled
  const [scheduleTime, setScheduleTime] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [evaluating, setEvaluating] = useState(null); // application being evaluated
  const [evalScore, setEvalScore] = useState('');
  const [passedInfo, setPassedInfo] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null); // application being rated
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingPeriod, setRatingPeriod] = useState('');
  const jobId = window.location.pathname.split('/').slice(-2)[0];

  const load = async ()=>{
    try{
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      setApps(data.applications || []);
      setPassedInfo(data.passedCandidate || null);
      const j = await api.get(`/jobs/${jobId}`);
      setJob(j.data.job);
    }catch(e){ setError(e.response?.data?.message || 'Failed to load'); }
  };
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    (async()=>{
      try { const r = await api.get('/meet/status'); setGoogleConnected(r.data.connected); } catch {}
    })();
  },[]);

  const accept = async (a)=>{
    await api.post(`/applications/${a.id}/accept-interview`);
    load();
  };

  const schedule = async (a) => {
    setScheduling(a);
    setScheduleTime('');
  };

  const submitSchedule = async () => {
    if (!scheduling || !scheduleTime) return;
    try {
      // Convert local datetime-local input to ISO
      const iso = new Date(scheduleTime).toISOString();
      await api.post(`/applications/${scheduling.id}/schedule-interview`, { scheduledAt: iso });
      setScheduling(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to schedule');
    }
  };

  const openEvaluate = (a) => {
    setEvaluating(a);
    setEvalScore(a.rating ? String(a.rating) : '');
  };

  const submitEvaluation = async (result) => {
    if (!evaluating) return;
    try {
      const payload = { result, scorePercent: evalScore? Number(evalScore): undefined };
      await api.post(`/applications/${evaluating.id}/interview-result`, payload);
      setEvaluating(null); setEvalScore('');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to set result');
    }
  };

  const startWork = async (a) => {
    try {
      await api.post(`/applications/${a.id}/start`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to start');
    }
  };

  const finishWork = async (a) => {
    try {
      await api.post(`/applications/${a.id}/finish`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to finish');
    }
  };

  const openRate = (a) => {
    setRatingTarget(a);
    setRatingValue(5);
    setRatingComment('');
    setRatingPeriod('');
  };

  const submitRating = async () => {
    if (!ratingTarget) return;
    try {
      const body = { rating: Number(ratingValue), comment: ratingComment || undefined, period: ratingPeriod || undefined };
      await api.post(`/applications/${ratingTarget.id}/rate`, body);
      setRatingTarget(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to rate');
    }
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
          const isHired = a.status === 'HIRED';
          const started = !!a.startedAt;
          const finished = !!a.finishedAt;
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
                <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <button disabled={accepted} onClick={()=>accept(a)} className="btn" style={{background: accepted? '#16a34a':'#16a34a', opacity: accepted?0.6:1}}>{accepted? 'Accepted':'Accept'}</button>
                  {accepted && <button className="btn secondary" onClick={()=>schedule(a)}>Schedule</button>}
                  {a.interview?.meetLink && <a href={a.interview.meetLink} target="_blank" rel="noreferrer" className="btn" style={{background:'#0ea5e9'}}>Join Meet</a>}
                  {a.status === 'INTERVIEW' && <>
                    <button className="btn secondary" onClick={()=>openEvaluate(a)}>Evaluate</button>
                    <button className="btn" onClick={()=> window.location.href = `/dashboard/chat?appId=${a.id}`}>Open Chat</button>
                  </>}
                  {isHired && !started && <button className="btn" onClick={()=>startWork(a)} style={{background:'#0d9488'}}>Start Work</button>}
                  {isHired && started && !finished && (
                    <>
                      <button className="btn" onClick={()=> window.location.href = `/dashboard/chat?appId=${a.id}`}>Open Chat</button>
                      {job?.hireType === 'PROJECT' && <button className="btn secondary" onClick={()=>finishWork(a)} style={{background:'#f97316'}}>Finish</button>}
                    </>
                  )}
                  {isHired && ((job?.hireType === 'PROJECT' && finished) || (job?.hireType === 'PERMANENT' && started)) && <button className="btn secondary" onClick={()=>openRate(a)} style={{background:'#6366f1'}}>Rate</button>}
                </div>
              </div>
              <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{a.proposal}</div>
              {a.interview?.scheduledAt && (
                <div style={{marginTop:8,fontSize:14,color:'#065f46'}}>
                  Scheduled: {new Date(a.interview.scheduledAt).toLocaleString()} {a.interview?.meetLink ? '· Meet link ready' : (!googleConnected ? '· (Connect Google to generate Meet link)' : '· (Meet link pending)')}
                </div>
              )}
              {isHired && (
                <div style={{marginTop:8,fontSize:12,color:'#334155'}}>
                  {started && <span style={{marginRight:8}}>Started {new Date(a.startedAt).toLocaleDateString()}</span>}
                  {finished && <span>Finished {new Date(a.finishedAt).toLocaleDateString()}</span>}
                  {!started && 'Not started'}
                </div>
              )}
              {!googleConnected && a.status === 'INTERVIEW' && !a.interview?.meetLink && (
                <div style={{marginTop:8}}>
                  <button className="btn secondary" onClick={async()=>{
                    try { const { data } = await api.get('/meet/auth'); window.location.href = data.url; } catch { alert('Failed to start Google auth'); }
                  }}>Connect Google for Meet</button>
                </div>
              )}
              {a.comment && <div style={{marginTop:8, fontStyle:'italic'}}>Comment: {JSON.stringify(a.comment)}</div>}
            </div>
          );
        })}
      </div>
      {scheduling && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
          <div style={{background:'#fff',padding:24,borderRadius:16,minWidth:360}}>
            <h3 style={{marginTop:0}}>Schedule Interview</h3>
            <p style={{marginTop:0}}>Candidate: <strong>{scheduling.applicant?.name || scheduling.applicant?.email}</strong></p>
            <label style={{display:'block',fontSize:14,marginBottom:8}}>Choose date & time
              <input type="datetime-local" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} style={{display:'block',marginTop:6,padding:8,border:'1px solid #94a3b8',borderRadius:8,width:'100%'}} />
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="btn secondary" onClick={()=>{ setScheduling(null); }}>Cancel</button>
              <button className="btn" onClick={submitSchedule} disabled={!scheduleTime}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {evaluating && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
          <div style={{background:'#fff',padding:24,borderRadius:16,minWidth:360}}>
            <h3 style={{marginTop:0}}>Evaluate Candidate</h3>
            <p style={{marginTop:0}}>Candidate: <strong>{evaluating.applicant?.name || evaluating.applicant?.email}</strong></p>
            <label style={{display:'block',fontSize:14,marginBottom:12}}>Score (%)
              <input type="number" min="0" max="100" value={evalScore} onChange={e=>setEvalScore(e.target.value)} placeholder="e.g. 85" style={{display:'block',marginTop:6,padding:8,border:'1px solid #94a3b8',borderRadius:8,width:'100%'}} />
            </label>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
              <div style={{display:'flex',gap:8}}>
                <button className="btn" onClick={()=>submitEvaluation('PASSED')}>Mark Passed</button>
                <button className="btn secondary" onClick={()=>submitEvaluation('FAILED')}>Mark Failed</button>
              </div>
              <button className="btn secondary" onClick={()=>{ setEvaluating(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {passedInfo && (
        <div style={{marginTop:32,padding:16,border:'2px solid #16a34a',borderRadius:16,background:'#f0fdf4'}}>
          <h3 style={{marginTop:0}}>Selected Candidate</h3>
            <p style={{margin:'4px 0'}}><strong>{passedInfo.name}</strong> {passedInfo.scorePercent != null && <span style={{color:'#065f46'}}>· Score {passedInfo.scorePercent}%</span>}</p>
            {passedInfo.resumeContent && (
              <div style={{marginTop:12}}>
                <div style={{fontSize:12,color:'#065f46',fontWeight:600,marginBottom:4}}>Resume Snapshot</div>
                <div style={{maxHeight:200,overflowY:'auto',whiteSpace:'pre-wrap',background:'#fff',padding:12,border:'1px solid #bbf7d0',borderRadius:12}}>{passedInfo.resumeContent.slice(0,400)}{passedInfo.resumeContent.length>400?'...':''}</div>
              </div>
            )}
            <p style={{marginTop:12,fontSize:12,color:'#64748b'}}>All applicants can view the selected candidate's score and resume snapshot.</p>
        </div>
      )}
      {ratingTarget && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:70}}>
          <div style={{background:'#fff',padding:24,borderRadius:16,minWidth:380}}>
            <h3 style={{marginTop:0}}>Rate Talent</h3>
            <p style={{marginTop:0}}>Talent: <strong>{ratingTarget.applicant?.name || ratingTarget.applicant?.email}</strong></p>
            <label style={{display:'block',fontSize:14,marginBottom:12}}>Rating (1-5)
              <input type="number" min="1" max="5" value={ratingValue} onChange={e=>setRatingValue(e.target.value)} style={{display:'block',marginTop:6,padding:8,border:'1px solid #94a3b8',borderRadius:8,width:'100%'}} />
            </label>
            {job?.hireType === 'PERMANENT' && (
              <label style={{display:'block',fontSize:14,marginBottom:12}}>Period (e.g. 2025-10)
                <input value={ratingPeriod} onChange={e=>setRatingPeriod(e.target.value)} placeholder="YYYY-MM" style={{display:'block',marginTop:6,padding:8,border:'1px solid #94a3b8',borderRadius:8,width:'100%'}} />
              </label>
            )}
            <label style={{display:'block',fontSize:14,marginBottom:12}}>Comment (optional)
              <textarea value={ratingComment} onChange={e=>setRatingComment(e.target.value)} rows={3} style={{display:'block',marginTop:6,padding:8,border:'1px solid #94a3b8',borderRadius:8,width:'100%'}} />
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn secondary" onClick={()=>setRatingTarget(null)}>Cancel</button>
              <button className="btn" onClick={submitRating}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
