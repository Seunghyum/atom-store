import React from 'react';

interface LoadingFallbackProps {
  children: React.ReactNode;
}

function LoadingFallback({ children }: LoadingFallbackProps) {
  return (
    <div style={{ padding: '20px', border: '1px dashed #ccc', margin: '10px' }}>
      <h2>로딩 중...</h2>
      {children}
    </div>
  );
}

export default LoadingFallback; 