import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';

export default function PublicProfile(){
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [avgRating, setAvgRating] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [interviewScore, setInterviewScore] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);

  useEffect(()=>{
    (async()=>{
      try{
  // Forward jobId query (if any) to reveal interviewScore for that specific job
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');
  const url = jobId ? `/profile/${id}?jobId=${jobId}` : `/profile/${id}`;
  const { data } = await api.get(url); // public endpoint
        setUser(data.user);
        setProfile(data.profile);
        setSkills(data.skills || []);
  setAvgRating(data.avgRating || null);
  setRatings(data.ratings || []);
  setInterviewScore(data.interviewScore || null);
  setActiveJobs(data.activeJobs || []);
  setCompletedJobs(data.completedJobs || []);
      }catch(err){
        setError(err.response?.data?.message || 'Failed to fetch profile');
      }
    })();
  },[id]);

  

  const r = user?.role || 'USER';
  const apiBase = (api?.defaults?.baseURL) || '';
  const apiOrigin = apiBase.replace(/\/?api\/?$/, '');
  const videoUrl = useMemo(()=>{
    const v = profile?.introVideoUrl;
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    const normalized = v.startsWith('/') ? v : `/${v}`;
    return `${apiOrigin}${normalized}`;
  }, [profile]);

  const Field = ({label, children}) => (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,color:'#16a34a',textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
      <div>{children}</div>
    </div>
  );

  

  if (error) return <div className="container"><p>{error}</p></div>;
  if (!user) return <div className="container"><p>Loading...</p></div>;

  

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
    <div className="container" style={{paddingTop:32,paddingBottom:32}}>
      <div className="card" style={{padding:'40px 48px',width:'100%',maxWidth:'100%'}}>
        <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:32,alignItems:'start'}}>
          <div>
            <div style={{width:140,height:140,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',color:'#065f46',fontSize:48}}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:700,display:'flex',alignItems:'center',gap:12}}>
              <span>{user.name || user.email}</span>
              {avgRating != null && (
                <span style={{background:'#fef3c7',color:'#92400e',padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>Avg Rating {avgRating.toFixed(1)}/5</span>
              )}
              {interviewScore != null && (
                <span style={{background:'#e0f2fe',color:'#075985',padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>Interview Score {interviewScore}%</span>
              )}
            </div>
            <div style={{color:'#64748b',marginBottom:8}}>{user.email}</div>
            {profile?.headline && <div style={{marginTop:6}}>{profile.headline}</div>}
            {profile?.jobTitle && <div style={{color:'#64748b'}}>{profile.jobTitle}</div>}
            {videoUrl && (
              <div style={{marginTop:12}}>
                <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5}}>Intro video</div>
                <video src={videoUrl} controls style={{width:'100%',maxHeight:320,borderRadius:12,marginTop:6}} />
              </div>
            )}
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
              {(() => {
                const platformEntries = [...activeJobs, ...completedJobs].map(j => ({
                  _platform: true,
                  title: j.jobTitle,
                  company: j.companyName,
                  duration: j.finishedAt ? `${new Date(j.startedAt).toLocaleDateString()} - ${new Date(j.finishedAt).toLocaleDateString()}` : `${j.startedAt ? new Date(j.startedAt).toLocaleDateString() : 'Started'} - Present`,
                  description: (j.ratings||[]).map(r => `${r.rating}★${r.comment ? ' – ' + r.comment : ''}${r.period ? ' ('+r.period+')' : ''}`).join('\n') || (j.hireType === 'PROJECT' ? 'Project in progress' : 'Role in progress')
                }));
                const merged = Array.isArray(profile?.experiences) ? [...platformEntries, ...profile.experiences] : platformEntries;
                return <List title="Experience" items={merged} render={(ex)=> (
                  <>
                    <div style={{fontWeight:600}}>{ex.title} @ {ex.company}</div>
                    {ex.duration && <div style={{color:'#64748b'}}>{ex.duration}</div>}
                    {ex.description && <div style={{whiteSpace:'pre-wrap'}}>{ex.description}</div>}
                    {ex._platform && <div style={{marginTop:4,fontSize:11,color:'#16a34a'}}>Platform engagement</div>}
                  </>
                )} />;
              })()}
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
              {skills.length>0 && <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:24}}>
                <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,width:'200px'}}>Skill Count</div>
                <div style={{marginTop:8,fontSize:36,fontWeight:700,color:'#065f46'}}>{skills.length}</div>
              </div>}
              {avgRating != null && (
                <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:24}}>
                  <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5}}>Average Rating</div>
                  <div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#065f46'}}>{avgRating.toFixed(1)} / 5</div>
                  <div style={{marginTop:4,fontSize:12,color:'#64748b'}}>{ratings.length} review{ratings.length===1?'':'s'}</div>
                </div>
              )}
              {ratings && ratings.length>0 && (
                <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16}}>
                  <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Ratings</div>
                  <div style={{display:'flex',flexDirection:'column',gap:12,maxHeight:360,overflowY:'auto'}}>
                    {ratings.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)).map((rt,i)=>(
                      <div key={i} style={{border:'1px solid #f1f5f9',borderRadius:8,padding:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <strong style={{color:'#065f46'}}>{rt.rating}★</strong>
                          <span style={{fontSize:11,color:'#64748b'}}>{new Date(rt.createdAt).toLocaleDateString()}</span>
                        </div>
                        {rt.period && <div style={{fontSize:11,color:'#475569',marginTop:2}}>Period: {rt.period}</div>}
                        {rt.comment && <div style={{marginTop:6,fontSize:13,lineHeight:1.4}}>{rt.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(activeJobs.length>0 || completedJobs.length>0) && (
                <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginTop:24}}>
                  <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Jobs & Feedback</div>
                  {activeJobs.length>0 && (
                    <div style={{marginBottom:16}}>
                      <div style={{fontWeight:600,marginBottom:6}}>Active Jobs</div>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {activeJobs.map(j => (
                          <div key={j.applicationId} style={{border:'1px solid #f1f5f9',borderRadius:8,padding:10}}>
                            <div style={{display:'flex',justifyContent:'space-between'}}>
                              <span style={{fontWeight:600}}>{j.jobTitle}</span>
                              <span style={{fontSize:12,color:'#64748b'}}>{j.companyName}</span>
                            </div>
                            <div style={{fontSize:12,color:'#475569',marginTop:4}}>Started {j.startedAt ? new Date(j.startedAt).toLocaleDateString() : 'N/A'}</div>
                            {j.ratings && j.ratings.length>0 && (
                              <div style={{marginTop:6,fontSize:12}}>
                                {j.ratings.map(r => <span key={r.id} style={{marginRight:6}}>{r.rating}★</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {completedJobs.length>0 && (
                    <div>
                      <div style={{fontWeight:600,marginBottom:6}}>Completed Jobs</div>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {completedJobs.map(j => (
                          <div key={j.applicationId} style={{border:'1px solid #f1f5f9',borderRadius:8,padding:10}}>
                            <div style={{display:'flex',justifyContent:'space-between'}}>
                              <span style={{fontWeight:600}}>{j.jobTitle}</span>
                              <span style={{fontSize:12,color:'#64748b'}}>{j.companyName}</span>
                            </div>
                            <div style={{fontSize:12,color:'#475569',marginTop:4}}>Finished {j.finishedAt ? new Date(j.finishedAt).toLocaleDateString() : 'N/A'}</div>
                            {j.ratings && j.ratings.length>0 && (
                              <div style={{marginTop:6,display:'flex',flexDirection:'column',gap:4}}>
                                {j.ratings.map(r => (
                                  <div key={r.id} style={{fontSize:12,color:'#065f46'}}>{r.rating}★ {r.comment && <span style={{color:'#334155'}}>— {r.comment}</span>} {r.period && <span style={{color:'#64748b'}}>({r.period})</span>}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
