import React from 'react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div>
          <h1>Kihlot Jobs</h1>
          <p>Find your next opportunity, faster.</p>
        </div>
      </aside>
      <main className="auth-card">
        <div className="card">
          <h2>{title}</h2>
          {subtitle && <p className="subtitle">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
