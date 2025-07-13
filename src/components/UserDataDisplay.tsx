import React from 'react';
import { useAtomValue } from '../lib/atom';
import { globalUserDataAtom, updateGlobalUserDataAtom } from '../atoms';

function UserDataDisplay() {
  const [userAtom, setUserAtom] = React.useState(() => globalUserDataAtom);
  const userData = useAtomValue(userAtom);
  
  const handleRefresh = () => {
    const newAtom = updateGlobalUserDataAtom();
    setUserAtom(newAtom);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>사용자 데이터</h2>
        <button 
          onClick={handleRefresh}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#17a2b8', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 리프레시
        </button>
      </div>
      <p>사용자 이름: {userData}</p>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        💡 리프레시 버튼을 클릭하면 JSONPlaceholder API에서 사용자 데이터를 다시 가져옵니다
      </div>
    </div>
  );
}

export default UserDataDisplay; 