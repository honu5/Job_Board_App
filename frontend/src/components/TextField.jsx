import React, { useState } from 'react';

export default function TextField({ label, type = 'text', value, onChange, name, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div style={{position:'relative'}}>
        <input
          id={name}
          name={name}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{paddingRight:isPassword?40:14}}
        />
        {isPassword && (
          <button
            type="button"
            onClick={()=>setShow(s=>!s)}
            aria-label={show? 'Hide password':'Show password'}
            style={{
              position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
              background:'transparent',border:'none',color:'#9ca3af',cursor:'pointer'
            }}
          >
            {show? '🙈':'👁️'}
          </button>
        )}
      </div>
    </div>
  );
}
