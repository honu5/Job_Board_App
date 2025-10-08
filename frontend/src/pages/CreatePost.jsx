import React, { useState } from 'react';
import api from '../api.js';

export default function CreatePost(){
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try{
      // If a file is provided, send multipart/form-data
      if (file) {
        const form = new FormData();
        form.append('content', content || '');
        form.append('media', file);
        // mediaType derived on server from mimetype
        await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/posts', { content, mediaUrl: mediaUrl || null, mediaType: mediaUrl ? mediaType : null });
      }
      setSuccess('Posted! Redirecting to Home...');
      setTimeout(()=> window.location.href = '/dashboard', 800);
    }catch(err){
      setError(err.response?.data?.message || 'Failed to post');
    }
  };

  return (
    <div className="container" style={{paddingTop:24,paddingBottom:24}}>
      <div className="card">
        <h2>Create a post</h2>
        {error && <p style={{color:'red'}}>{error}</p>}
        {success && <p style={{color:'green'}}>{success}</p>}
        <form onSubmit={submit}>
          <div className="field">
            <label>What's on your mind?</label>
            <textarea rows={5} value={content} onChange={(e)=>setContent(e.target.value)} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #94a3b8'}} />
          </div>
          <div className="field" style={{display:'grid', gap:12}}>
            <div>
              <label>Upload image/video (optional)</label>
              <input type="file" accept="image/*,video/*" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label>Or paste image/video URL</label>
              <input value={mediaUrl} onChange={(e)=>setMediaUrl(e.target.value)} placeholder="https://..." />
              <div style={{marginTop:8}}>
                <label style={{marginRight:12}}><input type="radio" name="type" checked={mediaType==='image'} onChange={()=>setMediaType('image')} /> Image</label>
                <label><input type="radio" name="type" checked={mediaType==='video'} onChange={()=>setMediaType('video')} /> Video</label>
              </div>
            </div>
            {(file || mediaUrl) && (
              <div>
                <div style={{fontSize:12,color:'#64748b', marginBottom:6}}>Preview</div>
                {file ? (
                  file.type.startsWith('video/') ? (
                    <video controls style={{maxWidth:'100%',borderRadius:8}} src={URL.createObjectURL(file)} />
                  ) : (
                    <img alt="preview" style={{maxWidth:'100%',borderRadius:8}} src={URL.createObjectURL(file)} />
                  )
                ) : mediaUrl ? (
                  mediaType === 'video' ? (
                    <video controls style={{maxWidth:'100%',borderRadius:8}} src={mediaUrl} />
                  ) : (
                    <img alt="preview" style={{maxWidth:'100%',borderRadius:8}} src={mediaUrl} />
                  )
                ) : null}
              </div>
            )}
          </div>
          <div className="actions"><button className="btn" type="submit">Post</button></div>
        </form>
      </div>
    </div>
  );
}
