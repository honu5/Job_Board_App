import React, { useState } from 'react';

// Interview practice UI (front-end only mock)
export default function Interview(){
  const [active, setActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const start = () => {
    if (active) return;
    setActive(true);
    const id = setInterval(()=> setTimer(t=>t+1), 1000);
    setIntervalId(id);
  };
  const stop = () => {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setActive(false);
  };
  const reset = () => { stop(); setTimer(0); setNotes(''); };

  const mm = String(Math.floor(timer/60)).padStart(2,'0');
  const ss = String(timer%60).padStart(2,'0');

  return (
    <div className="container" style={{paddingTop:32,paddingBottom:32}}>
      <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <h1 style={{margin:'0 0 8px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{display:'inline-flex',width:54,height:54,borderRadius:'50%',background: active? '#dc2626':'#f1f5f9',alignItems:'center',justifyContent:'center',border:'3px solid #16a34a',color: active? '#fff':'#065f46',fontSize:24,boxShadow: active? '0 0 0 6px rgba(220,38,38,0.2)':'none',transition:'all .3s'}}>
            {active ? '🎙️' : '🎤'}
          </span>
          <span>Interview Practice</span>
        </h1>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {!active && <button className="btn" onClick={start}>Start Interview</button>}
          {active && <button className="btn secondary" onClick={stop}>Pause</button>}
          <button className="btn secondary" onClick={reset}>Reset</button>
          <button className="btn secondary" onClick={()=> window.location.href='/dashboard'}>Dashboard</button>
        </div>
      </div>
      <div style={{marginTop:8,fontSize:14,color:'#64748b'}}>Timer: {mm}:{ss}</div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:32,marginTop:32,alignItems:'start'}}>
        <div style={{border:'1px solid #e2e8f0',borderRadius:16,padding:24,background:'#ffffff'}}>
          <h3 style={{marginTop:0}}>Prompt & Notes</h3>
          <p style={{marginTop:0,fontSize:14,color:'#475569'}}>Use this space to simulate interview questions. Jot down bullet answers, STAR method, or improvement points.</p>
          <textarea
            value={notes}
            onChange={e=>setNotes(e.target.value)}
            placeholder={active? 'Type your talking points or transcript here...' : 'Click Start Interview to begin timing and note-taking...'}
            rows={12}
            style={{width:'100%',padding:14,border:'1px solid #94a3b8',borderRadius:12,resize:'vertical',fontFamily:'inherit'}}
          />
          <div style={{marginTop:12,fontSize:12,color:'#64748b'}}>Nothing is saved yet (mock). Add persistence later if needed.</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{border:'1px solid #e2e8f0',borderRadius:16,padding:20,background:'#f8fafc'}}>
            <div style={{fontSize:12,textTransform:'uppercase',letterSpacing:0.5,color:'#64748b',fontWeight:600,marginBottom:8}}>Practice Tips</div>
            <ul style={{margin:0,paddingLeft:18,lineHeight:1.5,fontSize:14,color:'#334155'}}>
              <li>Describe impact with metrics (%, time saved, revenue).</li>
              <li>Use STAR: Situation, Task, Action, Result.</li>
              <li>Pause briefly after each question to structure your answer.</li>
              <li>Record yourself (coming soon) to review tone and clarity.</li>
            </ul>
          </div>
          <div style={{border:'2px dashed #16a34a',borderRadius:16,padding:20,background:'#f0fdf4'}}>
            <h4 style={{margin:'0 0 8px'}}>Upcoming Features 🚀</h4>
            <ul style={{margin:0,paddingLeft:18,lineHeight:1.5,fontSize:14,color:'#065f46'}}>
              <li>Live Meet integration</li>
              <li>Automatic transcript & keyword insights</li>
              <li>Structured feedback rubric</li>
              <li>AI-generated follow-up suggestions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
