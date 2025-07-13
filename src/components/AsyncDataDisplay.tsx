import React from 'react';
import { useAtomValue } from '../lib/atom';
import { globalAsyncDataAtom, updateGlobalAsyncDataAtom } from '../atoms';

function AsyncDataDisplay() {
  const [asyncAtom, setAsyncAtom] = React.useState(() => globalAsyncDataAtom);
  const asyncData = useAtomValue(asyncAtom);
  
  const handleRefresh = () => {
    const newAtom = updateGlobalAsyncDataAtom();
    setAsyncAtom(newAtom);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>비동기 데이터</h2>
        <button 
          onClick={handleRefresh}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 리프레시
        </button>
      </div>
      <p>데이터: {asyncData}</p>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        💡 리프레시 버튼을 클릭하면 새로운 데이터를 로드합니다 (2초 소요)
      </div>
    </div>
  );
}

export default AsyncDataDisplay; 