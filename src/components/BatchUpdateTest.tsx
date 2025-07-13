import React from 'react';
import { useAtom, useSetAtom } from '../lib/atom';
import { batch } from '../lib/atom';
import { countAtom, nameAtom } from '../atoms';

function BatchUpdateTest() {
  const [count] = useAtom(countAtom);
  const [name] = useAtom(nameAtom);
  const setCount = useSetAtom(countAtom);
  const setName = useSetAtom(nameAtom);
  
  // 업데이트 로그 추적
  const [updateLogs, setUpdateLogs] = React.useState<string[]>([]);
  const [isLogging, setIsLogging] = React.useState(false);
  
  // 업데이트 로그 추가 함수
  const addUpdateLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setUpdateLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };
  
  // 로그 초기화 함수
  const clearLogs = () => {
    setUpdateLogs([]);
    setIsLogging(false);
  };
  
  // atom 변경 감지
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🔄 카운터 atom 리렌더링');
    }
  }, [count, isLogging]);
  
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🔄 이름 atom 리렌더링');
    }
  }, [name, isLogging]);
  
  const handleBatchUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🏛️ 배치 업데이트 시작');
    
    batch(() => {
      setCount(count + 10);
      setName(`${name}_batch`);
    });
    
    addUpdateLog('🏛️ 배치 업데이트 완료');
  };
  
  const handleSequentialUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🐌 순차 업데이트 시작');
    
    // 명확한 순차 업데이트를 위해 setTimeout 사용
    setCount(count + 10);
    setTimeout(() => {
      setName(`${name}_sequential`);
      addUpdateLog('🐌 순차 업데이트 완료');
    }, 10);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>배치 업데이트 테스트</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>현재 상태</h4>
        <p>카운트: <strong>{count}</strong>, 이름: <strong>{name}</strong></p>
      </div>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>📊 업데이트 로그</h4>
        {updateLogs.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>버튼을 클릭하여 업데이트 로그를 확인하세요</p>
        ) : (
          <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
            {updateLogs.map((log, index) => (
              <div key={index} style={{ margin: '2px 0', padding: '2px 6px', backgroundColor: '#fff', borderRadius: '3px' }}>
                {log}
              </div>
            ))}
          </div>
        )}
        <button 
          onClick={clearLogs}
          style={{ marginTop: '10px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          로그 지우기
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button 
          onClick={handleBatchUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🏛️ 배치 업데이트 (+10)
        </button>
        <button 
          onClick={handleSequentialUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🐌 순차 업데이트 (+10)
        </button>
      </div>
      
      <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <h4>💡 차이점 확인 방법</h4>
        <ul style={{ fontSize: '14px', margin: '5px 0' }}>
          <li><strong>배치 업데이트</strong>: 여러 상태 변경을 <strong>1번의 렌더링</strong>으로 처리</li>
          <li><strong>순차 업데이트</strong>: 각 상태 변경마다 <strong>별도의 렌더링</strong> 발생</li>
          <li><strong>업데이트 로그</strong>를 위에서 실시간으로 확인하세요!</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '4px', border: '1px solid #bee5eb' }}>
        <h4>🔧 더 명확한 차이 확인 팁</h4>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Chrome 개발자 도구의 CPU Throttling 사용:</strong>
        </p>
        <ol style={{ fontSize: '14px', margin: '5px 0', paddingLeft: '20px' }}>
          <li><kbd>F12</kbd> 또는 <kbd>Cmd+Option+I</kbd>로 개발자 도구 열기</li>
          <li><strong>Performance</strong> 탭으로 이동</li>
          <li>⚙️ 설정 아이콘 클릭</li>
          <li><strong>CPU</strong> 드롭다운에서 <strong>"20x slowdown"</strong> 선택</li>
          <li>배치 업데이트와 순차 업데이트 버튼을 다시 테스트해보세요!</li>
        </ol>
        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#d1ecf1', borderRadius: '3px', fontSize: '13px' }}>
          💡 <strong>CPU 느려짐 효과:</strong> 배치 업데이트는 여전히 빠르게 처리되지만, 
          순차 업데이트는 각 렌더링 사이의 지연이 더 명확하게 보입니다.
        </div>
      </div>
    </div>
  );
}

export default BatchUpdateTest; 