import React, { useEffect, useMemo, useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import Alert from '../components/Alert.jsx';
import api from '../api.js';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Onboarding(){
  const [skillsList, setSkillsList] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [role, setRole] = useState('USER');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUpload, setAvatarUpload] = useState(null);
  const [introVideo, setIntroVideo] = useState(null);
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState([{ institution:'', level:'', certificateUrl:'' }]);
  const [experiences, setExperiences] = useState([{ company:'', title:'', duration:'', description:'' }]);
  const [achievements, setAchievements] = useState([{ text:'', link:'' }]);
  const [projects, setProjects] = useState([{ description:'', liveDemo:'', github:'' }]);
  const [links, setLinks] = useState({ github:'', linkedin:'', leetcode:'', website:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Employer fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [hiringNeeds, setHiringNeeds] = useState([{ role:'', count:1 }]);
  const [contact, setContact] = useState({ name:'', email:'', phone:'' });

  useEffect(()=>{
    // If redirected here with ?token= after email verification, store it and clean the URL
    const url = new URL(window.location.href);
  const tokenFromUrl = url.searchParams.get('token');
  const roleFromUrl = url.searchParams.get('role');
  if (roleFromUrl === 'CLIENT' || roleFromUrl === 'USER') setRole(roleFromUrl);
    if (tokenFromUrl) {
      localStorage.setItem('access_token', tokenFromUrl);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
    (async()=>{
      try{
        // Ensure we have an access token before hitting protected endpoints
        let token = localStorage.getItem('access_token');
        if (!token) {
          try {
            const { data: refreshData } = await api.post('/auth/refresh');
            token = refreshData?.token;
            if (token) localStorage.setItem('access_token', token);
          } catch {
            // No refresh cookie or failed refresh -> redirect to login with next
            return navigate('/login?next=' + encodeURIComponent('/onboarding' + (url.search ? url.search : '')));
          }
        }

        const { data } = await api.get('/user/skills');
        setSkillsList(data.skills || []);
        const prof = await api.get('/user/profile');
        if (prof.data?.profile) {
          const p = prof.data.profile;
          setFullName(prof.data.user?.name || '');
          setAvatarUrl(p.avatarUrl||'');
          setJobTitle(p.jobTitle||'');
          setHeadline(p.headline||'');
          setBio(p.bio||'');
          setEducation(Array.isArray(p.education)?p.education:[{ institution:'', level:'', certificateUrl:'' }]);
          setExperiences(Array.isArray(p.experiences)?p.experiences:[{ company:'', title:'', duration:'', description:'' }]);
          setAchievements(Array.isArray(p.achievements)?p.achievements:[{ text:'', link:'' }]);
          setProjects(Array.isArray(p.projects)?p.projects:[{ description:'', liveDemo:'', github:'' }]);
          setLinks(p.links||{ github:'', linkedin:'', leetcode:'', website:'' });
          setIntroVideoUrl(p.introVideoUrl || '');
          if (prof.data.skills) setSelectedSkills(prof.data.skills.map(s=>s.name).slice(0,15));
          // employer fields
          setCompanyName(p.companyName||'');
          setCompanyWebsite(p.companyWebsite||'');
          setCompanySize(p.companySize||'');
          setIndustry(p.industry||'');
          setLocation(p.location||'');
          setLogoUrl(p.logoUrl||'');
          setAboutCompany(p.aboutCompany||'');
          setHiringNeeds(Array.isArray(p.hiringNeeds)?p.hiringNeeds:[{ role:'', count:1 }]);
          setContact(p.contact||{ name:'', email:'', phone:'' });
        }
      }catch(e){/* ignore */}
    })();
  },[]);

  const canAddSkill = useMemo(()=> selectedSkills.length < 15, [selectedSkills]);

  const toggleSkill = (name) => {
    setSelectedSkills(prev => prev.includes(name) ? prev.filter(s=>s!==name) : (prev.length<15 ? [...prev,name] : prev));
  };

  const setEdu = (i, key, val) => setEducation(prev => prev.map((e,idx)=> idx===i?{...e,[key]:val}:e));
  const addEdu = ()=> setEducation(prev => [...prev,{ institution:'', level:'', certificateUrl:'' }]);
  const setExp = (i, key, val) => setExperiences(prev => prev.map((e,idx)=> idx===i?{...e,[key]:val}:e));
  const addExp = ()=> setExperiences(prev => [...prev,{ company:'', title:'', duration:'', description:'' }]);
  const setAch = (i, key, val) => setAchievements(prev => prev.map((e,idx)=> idx===i?{...e,[key]:val}:e));
  const addAch = ()=> setAchievements(prev => [...prev,{ text:'', link:'' }]);
  const setProj = (i, key, val) => setProjects(prev => prev.map((e,idx)=> idx===i?{...e,[key]:val}:e));
  const addProj = ()=> setProjects(prev => [...prev,{ description:'', liveDemo:'', github:'' }]);

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try{
      if (introVideo) {
        if (introVideo.size > 70 * 1024 * 1024) throw new Error('Video exceeds 70MB limit');
        const ok = ['video/mp4','video/webm','video/quicktime'];
        if (!ok.includes(introVideo.type)) throw new Error('Only MP4, WEBM, MOV allowed');
        const fd = new FormData(); fd.append('video', introVideo);
        const res = await api.post('/user/profile/video', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setIntroVideoUrl(res.data?.introVideoUrl || '');
      }
      // If avatarUpload chosen, in future we can upload to storage; for now prefer avatarUrl field
      const payload = role === 'CLIENT'
        ? { fullName, avatarUrl, headline, bio,
            companyName, companyWebsite, companySize, industry, location, logoUrl, aboutCompany, hiringNeeds, contact }
        : { fullName, avatarUrl, jobTitle, selectedSkills, headline, bio, education, experiences, achievements, projects, links };
      await api.post('/user/profile', payload);
      setSuccess('Profile saved! Redirecting to your dashboard...');
      setTimeout(()=>navigate('/dashboard'), 800);
    }catch(err){
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    }
  };

  return (
    <div className="container" style={{paddingTop:24,paddingBottom:24}}>
      <div className="card">
  <h2>Build your Kihlot profile</h2>
  <p className="subtitle">{role==='CLIENT' ? 'Tell talents about your company and hiring needs.' : 'Complete your portfolio so clients can find you faster.'}</p>
        {error && <Alert>{error}</Alert>}
        {success && <Alert kind="success">{success}</Alert>}
        <form onSubmit={onSubmit}>
          <TextField label="Full name" name="fullName" value={fullName} onChange={(e)=>setFullName(e.target.value)} />

          <div className="field">
            <label>Profile image</label>
            <div className="row">
              <input type="file" accept="image/*" onChange={(e)=>setAvatarUpload(e.target.files?.[0]||null)} />
              <input placeholder="Or paste image URL" value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} />
            </div>
          </div>

          {role !== 'CLIENT' && (
            <TextField label="Role / Job title" name="jobTitle" value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} />
          )}
          <TextField label="Headline (optional)" name="headline" value={headline} onChange={(e)=>setHeadline(e.target.value)} />
          <div className="field">
            <label>Intro video (optional, up to 70MB; MP4/WEBM/MOV)</label>
            <div className="row">
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e)=>setIntroVideo(e.target.files?.[0]||null)} />
              {introVideoUrl && <button type="button" className="btn secondary" onClick={async()=>{ try{ await api.delete('/user/profile/video'); setIntroVideoUrl(''); setIntroVideo(null);}catch{}}}>Remove existing</button>}
            </div>
            {introVideo && (<p style={{fontSize:12,color:'#334155',marginTop:6}}>Selected: {introVideo.name} ({(introVideo.size/1024/1024).toFixed(1)} MB)</p>)}
            {introVideoUrl && (
              <div style={{marginTop:8}}>
                <video src={introVideoUrl} controls style={{width:'100%',maxHeight:260,borderRadius:10}} />
              </div>
            )}
          </div>
          {role !== 'CLIENT' && (
          <div className="field">
            <label>About you (Bio)</label>
            <textarea rows={4} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} value={bio} onChange={(e)=>setBio(e.target.value)} />
          </div>) }

          {role !== 'CLIENT' && (<div className="field">
            <label>Skills (choose up to 15)</label>
            <div className="row" style={{gap:8}}>
              {skillsList.map((s)=>{
                const active = selectedSkills.includes(s);
                const disabled = !active && !canAddSkill;
                return (
                  <button type="button" key={s} onClick={()=>toggleSkill(s)} className="btn" style={{background: active? '#16a34a':'#ffffff', color: active? '#fff':'#065f46', borderColor:'#16a34a', opacity: disabled? 0.6:1}} disabled={disabled}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>)}

          {role !== 'CLIENT' && (<div className="field">
            <label>Education</label>
            {education.map((ed, i)=> (
              <div key={i} className="row">
                <input placeholder="Institution" value={ed.institution} onChange={(e)=>setEdu(i,'institution',e.target.value)} />
                <input placeholder="Level (Diploma, Degree...)" value={ed.level} onChange={(e)=>setEdu(i,'level',e.target.value)} />
                <input placeholder="Certificate link (URL)" value={ed.certificateUrl} onChange={(e)=>setEdu(i,'certificateUrl',e.target.value)} />
              </div>
            ))}
            <div className="actions"><button type="button" className="btn secondary" onClick={addEdu}>Add education</button></div>
          </div>)}

          {role !== 'CLIENT' && (<div className="field">
            <label>Experience</label>
            {experiences.map((ex, i)=> (
              <div key={i} className="row">
                <input placeholder="Company" value={ex.company} onChange={(e)=>setExp(i,'company',e.target.value)} />
                <input placeholder="Title" value={ex.title} onChange={(e)=>setExp(i,'title',e.target.value)} />
                <input placeholder="Duration" value={ex.duration} onChange={(e)=>setExp(i,'duration',e.target.value)} />
              </div>
            ))}
            <div className="field"><label>Describe your experience</label>
              <textarea rows={3} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} value={experiences[0]?.description||''} onChange={(e)=>setExp(0,'description',e.target.value)} />
            </div>
            <div className="actions"><button type="button" className="btn secondary" onClick={addExp}>Add experience</button></div>
          </div>)}

          {role !== 'CLIENT' && (<div className="field">
            <label>Achievements</label>
            {achievements.map((ac, i)=> (
              <div key={i} className="row">
                <input placeholder="What did you achieve?" value={ac.text} onChange={(e)=>setAch(i,'text',e.target.value)} />
                <input placeholder="Link (optional)" value={ac.link} onChange={(e)=>setAch(i,'link',e.target.value)} />
              </div>
            ))}
            <div className="actions"><button type="button" className="btn secondary" onClick={addAch}>Add achievement</button></div>
          </div>)}

          {role !== 'CLIENT' && (<div className="field">
            <label>Featured projects</label>
            {projects.map((pr, i)=> (
              <div key={i} className="row">
                <input placeholder="Short description (required)" value={pr.description} onChange={(e)=>setProj(i,'description',e.target.value)} />
                <input placeholder="Live demo (optional)" value={pr.liveDemo} onChange={(e)=>setProj(i,'liveDemo',e.target.value)} />
                <input placeholder="GitHub (optional)" value={pr.github} onChange={(e)=>setProj(i,'github',e.target.value)} />
              </div>
            ))}
            <div className="actions"><button type="button" className="btn secondary" onClick={addProj}>Add project</button></div>
          </div>)}

          {role !== 'CLIENT' ? (
            <div className="field">
              <label>Professional links</label>
              <div className="row">
                <input placeholder="GitHub" value={links.github} onChange={(e)=>setLinks({...links, github:e.target.value})} />
                <input placeholder="LinkedIn" value={links.linkedin} onChange={(e)=>setLinks({...links, linkedin:e.target.value})} />
                <input placeholder="LeetCode" value={links.leetcode} onChange={(e)=>setLinks({...links, leetcode:e.target.value})} />
                <input placeholder="Website" value={links.website} onChange={(e)=>setLinks({...links, website:e.target.value})} />
              </div>
            </div>
          ) : (
            <>
              <div className="field"><label>Company Name</label><input placeholder="Kihlot Inc." value={companyName} onChange={(e)=>setCompanyName(e.target.value)} /></div>
              <div className="field"><label>Website</label><input placeholder="https://company.com" value={companyWebsite} onChange={(e)=>setCompanyWebsite(e.target.value)} /></div>
              <div className="row">
                <input placeholder="Company size (e.g., 11-50)" value={companySize} onChange={(e)=>setCompanySize(e.target.value)} />
                <input placeholder="Industry" value={industry} onChange={(e)=>setIndustry(e.target.value)} />
                <input placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
              </div>
              <div className="row">
                <input placeholder="Logo URL" value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} />
              </div>
              <div className="field"><label>About Company</label><textarea rows={4} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} value={aboutCompany} onChange={(e)=>setAboutCompany(e.target.value)} /></div>
              
              <div className="field">
                <label>Contact person</label>
                <div className="row">
                  <input placeholder="Name" value={contact.name} onChange={(e)=>setContact({...contact, name:e.target.value})} />
                  <input placeholder="Email" value={contact.email} onChange={(e)=>setContact({...contact, email:e.target.value})} />
                  <input placeholder="Phone" value={contact.phone} onChange={(e)=>setContact({...contact, phone:e.target.value})} />
                </div>
              </div>
            </>
          )}

          <div className="actions">
            <button className="btn" type="submit">Save and continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
