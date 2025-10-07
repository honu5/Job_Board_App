import React from 'react';

export default function GoogleButton() {
  const handleClick = () => {
    window.location.href = `${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/auth/google`;
  };
  return (
    <button type="button" className="btn full google" onClick={handleClick}>
      Continue with Google
    </button>
  );
}
