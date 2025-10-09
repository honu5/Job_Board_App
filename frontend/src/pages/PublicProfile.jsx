import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';

export default function PublicProfile(){
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');

  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get(`/profile/${id}`); // public endpoint
        setUser(data.user);
        setProfile(data.profile);
        setSkills(data.skills || []);
      }catch(err){
        setError(err.response?.data?.message || 'Failed to fetch profile');
      }
    })();
  },[id]);

  if (error) return <div className="container"><p>{error}</p></div>;
  if (!user) return <div className="container"><p>Loading...</p></div>;

  const r = user.role || 'USER';

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

  return (
    <div className="container" style={{paddingTop:32,paddingBottom:32,maxWidth:1100}}>
      <div className="card" style={{padding:'32px 40px',width:'100%'}}>
        <div style={{display:'grid',gridTemplateColumns:'160px 2fr',gap:16,alignItems:'start'}}>
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
          </div>
        </div>

        {r === 'CLIENT' ? (
          <div style={{marginTop:16,padding:16,border:'1px solid #d1fae5',borderRadius:12,background:'#ecfdf5'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:56,height:56,borderRadius:8,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #bbf7d0'}}>
                {profile?.logoUrl ? <img src={profile.logoUrl} alt="logo" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8}} /> : <span style={{color:'#16a34a'}}>🏢</span>}
              </div>
              <div>
                <div style={{fontWeight:700}}>{profile?.companyName || 'Company'}</div>
                <div style={{color:'#64748b'}}>{profile?.industry || 'Industry'} · {profile?.companySize || 'Size'}</div>
              </div>
            </div>
            <div style={{marginTop:12,color:'#064e3b'}}>
              {profile?.aboutCompany}
            </div>
          </div>
        ) : (
          <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 320px',gap:40}}>
            <div>
              {profile?.bio && <Field label="About"><div style={{lineHeight:1.55}}>{profile.bio}</div></Field>}
              {skills.length>0 && (
                <div style={{marginTop:24}}>
                  <h4 style={{margin:'0 0 10px'}}>Skills</h4>
                  <ul style={{margin:0,paddingLeft:22,columns:2,gap:24,listStyle:'disc'}}>
                    {skills.map(s => <li key={s.id||s.name||s} style={{marginBottom:4}}>{s.name||s}</li>)}
                  </ul>
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
            <div>
              {profile?.headline && <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:24}}>
                <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5}}>Headline</div>
                <div style={{marginTop:6,fontWeight:600}}>{profile.headline}</div>
              </div>}
              {skills.length>0 && <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16}}>
                <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5}}>Skill Count</div>
                <div style={{marginTop:8,fontSize:36,fontWeight:700,color:'#065f46'}}>{skills.length}</div>
              </div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
