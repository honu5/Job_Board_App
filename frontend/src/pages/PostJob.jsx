import React, { useState } from 'react';
import api from '../api.js';

export default function PostJob(){
  const [jobId, setJobId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [workMode, setWorkMode] = useState('REMOTE');
  const [location, setLocation] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [applicationLimit, setApplicationLimit] = useState('');
  const [jobCategory, setJobCategory] = useState('WEB_DEVELOPMENT');
  const [hireType, setHireType] = useState('PROJECT');
  const [numOpenings, setNumOpenings] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillOptions, setSkillOptions] = useState([]);

  React.useEffect(()=>{
    // mock skills from existing endpoint
    (async()=>{
      try{
        const { data } = await api.get('/user/skills');
 //eslint-disable-next-line no-restricted-globals
setSkillOptions(data.skills || []);
      }catch{}
    })();
    // detect edit mode via query param
    try{
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setJobId(id);
        (async()=>{
          try{
            const { data } = await api.get(`/jobs/${id}`);
            const j = data.job || {};
            setTitle(j.title || '');
            setDescription(j.description || '');
            setWorkMode(j.workMode || 'REMOTE');
            setLocation(j.location || '');
            setHoursPerWeek(typeof j.hoursPerWeek === 'number' ? String(j.hoursPerWeek) : '');
            setSalaryRange(j.salaryRange || '');
            setApplicationLimit(typeof j.applicationLimit === 'number' ? String(j.applicationLimit) : '');
            setJobCategory(j.jobCategory || 'WEB_DEVELOPMENT');
            setHireType(j.hireType || 'PROJECT');
            setNumOpenings(typeof j.numOpenings === 'number' ? String(j.numOpenings) : '');
            if (Array.isArray(j.skills)) {
              setSelectedSkills(j.skills.map(s=>s.name));
            }
          }catch(e){
            // ignore if cannot load
          }
        })();
      }
    }catch{}
  },[]);

  const toggleSkill = (name)=>{
    setSelectedSkills((prev)=> prev.includes(name) ? prev.filter(s=>s!==name) : [...prev, name]);
  };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try{
      const payload = {
        title, description,
        skills: selectedSkills,
        workMode,
        location: workMode === 'IN_PERSON' ? (location || null) : null,
        hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
        salaryRange: salaryRange || null,
        applicationLimit: applicationLimit ? Number(applicationLimit) : null,
        jobCategory,
        hireType,
        numOpenings: numOpenings ? Number(numOpenings) : null,
      };
      if (jobId) {
        await api.put(`/jobs/${jobId}`, payload);
        setSuccess('Job updated! Redirecting...');
        setTimeout(()=> window.location.href = '/dashboard/posted-jobs', 800);
      } else {
        await api.post('/jobs', payload);
        setSuccess('Job posted! Redirecting...');
        setTimeout(()=> window.location.href = '/dashboard?tab=jobs', 800);
      }
    }catch(err){
      setError(err.response?.data?.message || 'Failed to post job');
    }
  };

  return (
    <div className="container" style={{paddingTop:24,paddingBottom:24}}>
      <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
  <h2 style={{marginTop:0}}>{jobId ? 'Edit job' : 'Post a job'}</h2>
        {error && <p style={{color:'red'}}>{error}</p>}
        {success && <p style={{color:'green'}}>{success}</p>}
        <form onSubmit={submit} style={{display:'grid',gap:16}}>
          <div>
            <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Job title</div>
            <input value={title} onChange={e=>setTitle(e.target.value)} required style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
          </div>
          <div>
            <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Description</div>
            <textarea rows={8} value={description} onChange={e=>setDescription(e.target.value)} required style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
          </div>
          <div>
            <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Job category</div>
            <select value={jobCategory} onChange={e=>setJobCategory(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}}>
              {['AI','WEB_DEVELOPMENT','GRAPHIC_DESIGN','DATA_SCIENCE','MOBILE','DEVOPS','MARKETING','SALES','PRODUCT','CUSTOMER_SUPPORT'].map(c => (
                <option key={c} value={c}>{c.replaceAll('_',' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Required skills</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {skillOptions.map(s => (
                <button type="button" key={s.id || s.name || s} className="btn secondary" onClick={()=>toggleSkill(s.name || s)} style={{
                  borderColor: selectedSkills.includes(s.name || s) ? '#16a34a' : '#94a3b8',
                  color: selectedSkills.includes(s.name || s) ? '#065f46' : '#334155',
                  background:'#fff'
                }}>{s.name || s}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Work mode</div>
            <div style={{marginTop:6}}>
              <label style={{marginRight:16}}><input type="radio" name="wm" checked={workMode==='REMOTE'} onChange={()=>setWorkMode('REMOTE')} /> Remote</label>
              <label><input type="radio" name="wm" checked={workMode==='IN_PERSON'} onChange={()=>setWorkMode('IN_PERSON')} /> In person</label>
            </div>
          </div>
          {workMode==='IN_PERSON' && (
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Location</div>
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, Country" style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Hours per week (optional)</div>
              <input type="number" min="1" value={hoursPerWeek} onChange={e=>setHoursPerWeek(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
            </div>
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Compensation (optional)</div>
              <input value={salaryRange} onChange={e=>setSalaryRange(e.target.value)} placeholder="$2k-$4k or hourly" style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
            </div>
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Application limit (optional)</div>
              <input type="number" min="1" value={applicationLimit} onChange={e=>setApplicationLimit(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Hire type</div>
              <select value={hireType} onChange={e=>setHireType(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}}>
                <option value="PROJECT">Project</option>
                <option value="PERMANENT">Permanent</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:12, color:'#16a34a', textTransform:'uppercase'}}>Number of talents required</div>
              <input type="number" min="1" value={numOpenings} onChange={e=>setNumOpenings(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
            </div>
          </div>
          <div className="actions"><button className="btn" type="submit">{jobId ? 'Update job' : 'Post job'}</button></div>
        </form>
      </div>
    </div>
  );
}
