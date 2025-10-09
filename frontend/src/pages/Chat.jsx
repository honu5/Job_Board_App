import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api.js';

export default function Chat(){
  const params = new URLSearchParams(window.location.search);
  const applicationId = params.get('appId');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const token = useMemo(()=> localStorage.getItem('access_token'), []);
  const bottomRef = useRef(null);

  useEffect(()=>{
    if (!applicationId || !token) return;
    (async()=>{
      try {
        const hist = await api.get(`/applications/${applicationId}/chat`);
        setMessages(hist.data?.messages || []);
      } catch {}
    })();
    const s = io(process.env.REACT_APP_API_BASE?.replace('/api','') || 'http://localhost:5000', { auth: { token } });
    socketRef.current = s;
    s.emit('join', { applicationId });
    s.on('message', (msg)=>{
      setMessages(prev=>[...prev, msg]);
      setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}), 0);
    });
    return ()=>{ s.disconnect(); };
  }, [applicationId, token]);

  const send = ()=>{
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('message', { applicationId, content: text.trim() });
    setText('');
  };

  return (
    <div className="container" style={{paddingTop:24}}>
      <div className="card" style={{display:'flex',flexDirection:'column',height:'70vh'}}>
        <h2 style={{marginBottom:12}}>Chat</h2>
        {!applicationId && <p>No application context provided.</p>}
        {applicationId && (
          <>
            <div style={{flex:1, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:10, padding:12, marginBottom:12}}>
              {messages.map(m=> (
                <div key={m.id || Math.random()} style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:'#475569'}}>{new Date(m.createdAt).toLocaleTimeString()} • {m.senderId?.slice(0,6)}</div>
                  <div style={{background:'#f8fafc',display:'inline-block',padding:'8px 12px',borderRadius:10}}>{m.content}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type a message" style={{flex:1}} onKeyDown={(e)=>{ if (e.key==='Enter') send(); }} />
              <button className="btn" type="button" onClick={send}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
