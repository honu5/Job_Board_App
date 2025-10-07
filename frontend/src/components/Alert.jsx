import React from 'react';

export default function Alert({ kind = 'error', children }) {
  return <div className={`alert ${kind}`}>{children}</div>;
}
