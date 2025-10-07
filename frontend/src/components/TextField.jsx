import React from 'react';

export default function TextField({ label, type = 'text', value, onChange, name, placeholder, autoComplete }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
    </div>
  );
}
