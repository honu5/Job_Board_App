import React from 'react';

export default function Chat(){
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appId');
  return (
    <div className="container" style={{paddingTop:24}}>
      <div className="card">
        <h2>Chat</h2>
        <p>This is a placeholder chat for application ID: {appId}</p>
        <p>In a future iteration, this will be replaced with real-time messaging.</p>
      </div>
    </div>
  );
}
