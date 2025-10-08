import React, { useEffect, useState } from 'react';
import api from '../api.js';
import Jobs from './Jobs.jsx';
import PostedJobs from './PostedJobs.jsx';

// Helper to resolve media URLs coming from the API.
// If mediaUrl is relative like "/uploads/..", prefix with the server origin from axios baseURL.
const API_BASE = (api?.defaults?.baseURL) || '';
const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, '');
const resolveMedia = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${normalized}`;
};

const nav = [
  { key:'home', label:'Home', icon:'🏠' },
  { key:'jobs', label:'Jobs', icon:'💼' },
  { key:'applied', label:'Applied', icon:'📄' },
  { key:'on-demand', label:'On demand', icon:'⚡' },
  { key:'messages', label:'Messages', icon:'✉️' },
  { key:'notifications', label:'Notifications', icon:'🔔' },
  { key:'profile', label:'Profile', icon:'👤' },
  { key:'logout', label:'Logout', icon:'🚪' },
];

export default function Dashboard(){
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [active, setActive] = useState('home');
  const [showSidebar, setShowSidebar] = useState(true);
  const [feed, setFeed] = useState([]);

  // Role-aware label mapping: for CLIENT users, show "Posted jobs" instead of "Applied"
  const navLabel = (item, u) => {
    if (!item) return '';
    if (item.key === 'applied' && u?.role === 'CLIENT') return 'Posted jobs';
    return item.label;
  };

  useEffect(()=>{
    const url = new URL(window.location.href);
    const t = url.searchParams.get('token');
    if (t) {
      localStorage.setItem('access_token', t);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
    (async()=>{
      try{
        const { data } = await api.get('/auth/dashboard');
        setUser(data.user);
        try {
          const prof = await api.get('/user/profile');
          setProfile(prof.data?.profile || null);
          setSkills(prof.data?.skills || []);
        } catch {}
        try {
          const f = await api.get('/feed');
          setFeed(f.data?.posts || []);
        } catch {}
      }catch(err){
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    })();
  },[]);

  const Field = ({label, children}) => (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,color:'#16a34a',textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
      <div>{children}</div>
    </div>
  );

  const List = ({title, items, render}) => {
    if (!Array.isArray(items) || !items.length) return null;
    return (
      <div style={{marginTop:16}}>
        <h4 style={{margin:'10px 0'}}>{title}</h4>
        <div style={{display:'grid',gap:8}}>
          {items.map((it, i) => <div key={i} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:12}}>{render(it)}</div>)}
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    if (!user) return null;
    const r = user.role || 'USER';
    const EmployerCard = () => {
      if (r !== 'CLIENT' || !profile) return null;
      const fields = [
        { label: 'Company', value: profile.companyName },
        { label: 'Website', value: profile.companyWebsite },
        { label: 'Size', value: profile.companySize },
        { label: 'Industry', value: profile.industry },
        { label: 'Location', value: profile.location },
      ];
      return (
        <div style={{marginTop:16,padding:16,border:'1px solid #d1fae5',borderRadius:12,background:'#ecfdf5'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:56,height:56,borderRadius:8,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #bbf7d0'}}>
              {profile.logoUrl ? <img src={profile.logoUrl} alt="logo" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8}} /> : <span style={{color:'#16a34a'}}>🏢</span>}
            </div>
            <div>
              <div style={{fontWeight:700}}>{profile.companyName || 'Your company'}</div>
              <div style={{color:'#64748b'}}>{profile.industry || 'Industry'} · {profile.companySize || 'Size'}</div>
            </div>
          </div>
          <div style={{marginTop:12,color:'#064e3b'}}>
            {profile.aboutCompany || 'Tell talents about your company, culture, and mission.'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:12}}>
            {fields.map((f)=> (
              f.value ? <div key={f.label}><div style={{fontSize:12,color:'#16a34a'}}>{f.label}</div><div>{f.value}</div></div> : null
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        <h3 style={{marginTop:0}}>Profile</h3>
        <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:16,alignItems:'start'}}>
          <div>
            <div style={{width:140,height:140,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',color:'#065f46',fontSize:48}}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>{user.name || user.email}</div>
            <div style={{color:'#64748b',marginBottom:8}}>{user.email}</div>
            {profile?.headline && <div style={{marginTop:6}}>{profile.headline}</div>}
            {profile?.jobTitle && <div style={{color:'#64748b'}}>{profile.jobTitle}</div>}
            <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
              <button className="btn" onClick={()=>{
                const url = new URL(window.location.origin + '/onboarding');
                url.searchParams.set('role', r);
                window.location.href = url.toString();
              }}>Edit profile</button>
              <button className="btn secondary" onClick={()=>{
                const publicUrl = `${window.location.origin}/p/${user.id}`;
                navigator.clipboard?.writeText(publicUrl);
                alert('Public profile link copied to clipboard: ' + publicUrl);
              }}>Share profile</button>
            </div>
          </div>
        </div>
        <EmployerCard />
        {/* Resume style content */}
        {r !== 'CLIENT' && (
          <div style={{marginTop:16}}>
            {profile?.bio && <Field label="About"><div>{profile.bio}</div></Field>}
            {/* Skills as pills */}
            {Array.isArray(skills) && skills.length > 0 && (
              <div style={{marginTop:16}}>
                <h4 style={{margin:'10px 0'}}>Skills</h4>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {skills.map((s)=> (
                    <span key={s.id || s.name} style={{
                      padding:'8px 12px',
                      borderRadius:20,
                      border:'1px solid #16a34a',
                      color:'#065f46',
                      background:'#ffffff'
                    }}>{s.name || s}</span>
                  ))}
                </div>
              </div>
            )}
            <List title="Education" items={profile?.education} render={(ed)=> (
              <>
                <div style={{fontWeight:600}}>{ed.institution}</div>
                <div style={{color:'#64748b'}}>{ed.level}</div>
                {ed.certificateUrl && <a href={ed.certificateUrl} target="_blank" rel="noreferrer">Certificate</a>}
              </>
            )} />
            <List title="Experience" items={profile?.experiences} render={(ex)=> (
              <>
                <div style={{fontWeight:600}}>{ex.title} @ {ex.company}</div>
                <div style={{color:'#64748b'}}>{ex.duration}</div>
                {ex.description && <div>{ex.description}</div>}
              </>
            )} />
            <List title="Achievements" items={profile?.achievements} render={(ac)=> (
              <>
                <div>{ac.text}</div>
                {ac.link && <a href={ac.link} target="_blank" rel="noreferrer">Link</a>}
              </>
            )} />
            <List title="Featured projects" items={profile?.projects} render={(p)=> (
              <>
                <div>{p.description}</div>
                <div style={{display:'flex',gap:12}}>
                  {p.liveDemo && <a href={p.liveDemo} target="_blank" rel="noreferrer">Live</a>}
                  {p.github && <a href={p.github} target="_blank" rel="noreferrer">GitHub</a>}
                </div>
              </>
            )} />
            {profile?.links && Object.keys(profile.links).length > 0 && (
              <div style={{marginTop:16}}>
                <h4 style={{margin:'10px 0'}}>Links</h4>
                <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
                  {Object.entries(profile.links).map(([k,v]) => v ? <a key={k} href={v} target="_blank" rel="noreferrer" style={{color:'#16a34a'}}>{k}</a> : null)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      {showSidebar && (
      <aside style={{width:240,background:'#ecfdf5',borderRight:'1px solid #d1fae5',padding:16}}>
        <div style={{fontWeight:800,fontSize:20,color:'#065f46',marginBottom:12}}>Kihlot</div>
        <nav>
          {nav.map(n => (
            <button key={n.key} onClick={()=>{
                if (n.key === 'logout') return handleLogout();
                setActive(n.key);
              }}
              style={{
                display:'flex',gap:8,alignItems:'center',width:'100%',
                padding:'10px 12px',marginBottom:6,borderRadius:10,
                background: active===n.key? '#16a34a':'transparent',
                color: active===n.key? '#fff':'#065f46',
                border:'1px solid #16a34a', cursor:'pointer'
              }}>
              <span>{n.icon}</span>
              <span>{navLabel(n, user)}</span>
            </button>
          ))}
        </nav>
      </aside>
      )}
      <main style={{flex:1,padding:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{color:'#065f46',marginTop:0}}>{navLabel(nav.find(n=>n.key===active), user)}</h1>
          <button aria-label="Toggle menu" onClick={()=>setShowSidebar(s=>!s)} style={{
            border:'1px solid #16a34a', borderRadius:8, padding:'6px 10px', background:'#ecfdf5', color:'#065f46', cursor:'pointer'
          }}>☰</button>
        </div>
        {error && <p>{error}</p>}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:16}}>
          {user ? (
            active === 'profile' ? <ProfileView /> : active === 'home' ? (
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontWeight:600}}>Welcome, {user.name || user.email}</div>
                  <button className="btn" onClick={()=> window.location.href = '/dashboard/post'}>+ Post</button>
                </div>
                <div style={{
                  display:'grid',
                  gap:40,
                  gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1.5fr))',
                  maxHeight:'70%'

                }}>
                  {feed.length === 0 && <div>No posts yet. Be the first to post!</div>}
                  {feed.map(p => (
                    <div key={p.id} style={{
                      border:'1px solid #e2e8f0',
                      borderRadius:12,
                      display:'flex',
                      flexDirection:'column',
                      overflow:'hidden',
                      minHeight:160,
                    }}>
                      <div style={{display:'flex',gap:17,alignItems:'center',padding:12}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',color:'#065f46'}}>
                          {(p.author?.name || p.author?.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:600}}>{p.author?.name || p.author?.email}</div>
                          <div style={{fontSize:12,color:'#64748b'}}>{new Date(p.createdAt || Date.now()).toLocaleString()}</div>
                        </div>
                      </div>
                      {p.mediaUrl && (
                        p.mediaType === 'video' ? (
                          <div style={{ width:'100%', height:220, background:'#000' }}>
                            <video controls style={{ width:'100%', height:'100%', objectFit:'contain' }} src={resolveMedia(p.mediaUrl)} />
                          </div>
                        ) : (
                          <div style={{ width:'100%', height:220, background:'#f1f5f9' }}>
                            <img alt="post" style={{ width:'100%', height:'100%', objectFit:'contain' }} src={resolveMedia(p.mediaUrl)} />
                          </div>
                        )
                      )}
                      {p.content && <div style={{padding:12, flexGrow:1}}>{p.content}</div>}
                      <div style={{display:'flex',gap:8,alignItems:'center',padding:12, borderTop:'1px solid #e2e8f0'}}>
                        <button className="btn secondary" onClick={async()=>{ await api.post(`/posts/${p.id}/like`); const f = await api.get('/feed'); setFeed(f.data?.posts||[]); }}>👍 {p._count?.likes || 0}</button>
                        <button className="btn secondary" onClick={async()=>{
                          const text = prompt('Comment');
                          if (text) { await api.post(`/posts/${p.id}/comments`, { content: text }); const f = await api.get('/feed'); setFeed(f.data?.posts||[]); }
                        }}>💬 {p._count?.comments || 0}</button>
                        <button className="btn secondary" onClick={()=>{
                          const link = `${window.location.origin}/p/${p.author?.id}`; navigator.clipboard?.writeText(link); alert('Profile link copied: ' + link);
                        }}>↗ Share</button>
                        {(user?.id === p.author?.id || user?.role === 'ADMIN') && (
                          <>
                            
                            <button className="btn secondary" onClick={async()=>{
                              //eslint-disable-next-line no-restricted-globals
                                //eslint-disable-next-line no-restricted-globals
                              if (confirm('Delete this post?')) { await api.delete(`/posts/${p.id}`); const f = await api.get('/feed'); setFeed(f.data?.posts||[]); }
                            }}>🗑️ Delete</button>
                          </>
                        )}
                      </div>
                      {Array.isArray(p.comments) && p.comments.length > 0 && (
                        <div style={{padding:'8px 12px'}}>
                          {p.comments.map(c => (
                            <div key={c.id} style={{fontSize:14,marginBottom:4}}>
                              <b>{c.user?.name || 'User'}</b>: {c.content}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : active === 'jobs' ? (
              <Jobs />
            ) : active === 'applied' && (user.role === 'CLIENT' || user.role === 'ADMIN') ? (
              <PostedJobs />
            ) : (
              <p>Welcome, {user.name || user.email}. This is your {navLabel(nav.find(n=>n.key===active), user)} section.</p>
            )
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </main>
    </div>
  );
}
