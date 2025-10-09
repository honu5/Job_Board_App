import React, { useState } from 'react';
import api from '../api.js';

// Mock scoring templates
const MOCKS = [
  {
    label: 'VeryGood',
    score: () => 90 + Math.floor(Math.random()*10),
    summary: 'Strong alignment with role requirements, clear impact statements, and quantified achievements.',
    recommendations: [
      'Add a concise professional summary tailored to the target role.',
      'Highlight measurable outcomes (e.g., % improvements, cost savings).',
      'Showcase leadership or mentoring experience explicitly.',
      'Ensure consistency in tense and formatting throughout bullets.',
      'Consider a dedicated “Key Skills” section above experience.'
    ]
  },
  {
    label: 'Good',
    score: () => 70 + Math.floor(Math.random()*15),
    summary: 'Good structure and relevant experience. Some points can be sharpened to emphasize impact.',
    recommendations: [
      'Refine bullet points to start with strong action verbs.',
      'Quantify more results where possible.',
      'Group related technologies to save space and improve readability.',
      'Remove older or less relevant experience to keep resume concise.',
      'Unify date formats and spacing for professional polish.'
    ]
  },
  {
    label: 'Developing',
    score: () => 50 + Math.floor(Math.random()*15),
    summary: 'Foundational resume with potential. Needs clearer structure and stronger achievement framing.',
    recommendations: [
      'Restructure sections: Summary · Skills · Experience · Projects · Education.',
      'Use bullet points instead of paragraphs for responsibilities.',
      'Add context: scale, team size, stack, or problem solved.',
      'Introduce metrics: performance gains, adoption rates, automation benefits.',
      'Eliminate filler words and keep bullets under 2 lines.'
    ]
  }
];

export default function ResumeScorer(){
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState('');

  const extractText = async (f) => {
    // For mock: just read as text if plain or show placeholder if PDF
    if (f.type === 'application/pdf') {
      return '(PDF content extraction could not beimplemented. please try again if you have not found your score.)';
    }
    return await f.text();
  };

  const handleScore = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const text = await extractText(file);
      setRawText(text.slice(0, 5000));
      // Pick a random template
      const tmpl = MOCKS[Math.floor(Math.random()*MOCKS.length)];
      const score = tmpl.score();
      setResult({
        label: tmpl.label,
        score,
        summary: tmpl.summary,
        recommendations: tmpl.recommendations,
        tokens: Math.ceil(text.length / 4)
      });
    } catch (e) {
      alert('Failed to score resume (mock).' );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{padding:'32px 0', maxWidth:900}}>
      <h2 style={{marginTop:0}}>Resume Scorer (Mock)</h2>
      <p style={{color:'#475569',fontSize:14}}>Upload a resume (.pdf or .txt). A mock model will generate a score and suggestions (no data leaves your browser).</p>
      <div style={{marginTop:16,display:'flex',gap:12,alignItems:'center'}}>
        <input type="file" accept=".pdf,.txt,.md" onChange={e=> setFile(e.target.files?.[0] || null)} />
        <button className="btn" disabled={!file || loading} onClick={handleScore}>{loading? 'Scoring...':'Score Resume'}</button>
        {file && !loading && <button className="btn secondary" onClick={()=>{ setFile(null); setResult(null); setRawText(''); }}>Reset</button>}
      </div>
      {result && (
        <div style={{marginTop:32,display:'grid',gap:24,gridTemplateColumns:'1fr 320px'}}>
          <div>
            <div style={{border:'2px solid #16a34a',borderRadius:16,padding:20,background:'#f0fdf4'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <h3 style={{margin:'0 0 8px'}}>{result.label} Resume</h3>
                <div style={{fontSize:32,fontWeight:700,color:'#065f46'}}>{result.score}</div>
              </div>
              <p style={{marginTop:4,whiteSpace:'pre-wrap'}}>{result.summary}</p>
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,color:'#065f46',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginBottom:6}}>Recommendations</div>
                <ul style={{margin:0,paddingLeft:20}}>
                  {result.recommendations.map((r,i)=>(<li key={i} style={{marginBottom:6}}>{r}</li>))}
                </ul>
              </div>
            </div>
            {rawText && (
              <div style={{marginTop:24}}>
                <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:6}}>Extracted Text (preview)</div>
                <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:16,maxHeight:300,overflowY:'auto',whiteSpace:'pre-wrap'}}>{rawText.slice(0,4000)}{rawText.length>4000?'...':''}</div>
              </div>
            )}
          </div>
          <div>
            <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:16}}>
              <div style={{fontSize:12,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5}}>Meta</div>
              <div style={{marginTop:8}}>Tokens (approx): <strong>{result.tokens}</strong></div>
              <div style={{marginTop:4}}>File: <strong>{file?.name}</strong></div>
              <div style={{marginTop:4}}>Size: <strong>{file ? (file.size/1024).toFixed(1)+' KB' : '-'}</strong></div>
              <div style={{marginTop:12,fontSize:12,color:'#64748b'}}>This is a deterministic mock. Real scoring would use an ML model and structured extraction.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
