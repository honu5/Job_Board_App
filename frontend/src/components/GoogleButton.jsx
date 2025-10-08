import React from 'react';

export default function GoogleButton({ role }) {
  const handleClick = () => {
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
    const url = role ? `${base}/auth/google?role=${encodeURIComponent(role)}` : `${base}/auth/google`;
    window.location.href = url;
  };
  return (
    <button type="button" className="btn full google" onClick={handleClick}>
      Continue with Google
    </button>
  );
}
