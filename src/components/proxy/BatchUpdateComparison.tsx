import React from 'react';
import { useAtom } from '../../lib/atom';
import { batch, get, set } from '../../lib/atom';
import { useProxyAtom } from '../../lib/proxy-atom';
import { batchProxy } from '../../lib/proxy-atom';
import { 
  normalUserAtom, 
  normalCountAtom, 
  proxyUserAtom, 
  proxyCountAtom 
} from '../../atoms/proxy';

function BatchUpdateComparison() {
  const [normalUser] = useAtom(normalUserAtom);
  const [normalCount] = useAtom(normalCountAtom);
  const proxyUser = useProxyAtom(proxyUserAtom);
  const proxyCount = useProxyAtom(proxyCountAtom);
  
  // 업데이트 로그 추적으로 배치 vs 순차 차이 시각화
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
  
  // atom 변경 감지 (개발용)
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🔄 일반 Atom 사용자 정보 리렌더링');
    }
  }, [normalUser, isLogging]);
  
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🔄 일반 Atom 카운터 리렌더링');
    }
  }, [normalCount, isLogging]);
  
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🎭 Proxy Atom 사용자 정보 리렌더링');
    }
  }, [proxyUser.name, isLogging]);
  
  React.useEffect(() => {
    if (isLogging) {
      addUpdateLog('🎭 Proxy Atom 카운터 리렌더링');
    }
  }, [proxyCount.value, isLogging]);
  
  const normalBatchUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🏛️ 일반 배치 업데이트 시작');
    
    batch(() => {
      set(normalUserAtom, { ...get(normalUserAtom), name: 'Batched' });
      set(normalCountAtom, get(normalCountAtom) + 10);
    });
    
    addUpdateLog('🏛️ 일반 배치 업데이트 완료');
  };
  
  const normalSequentialUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🐌 일반 순차 업데이트 시작');
    
    // 배치 없이 순차적으로 업데이트
    set(normalUserAtom, { ...get(normalUserAtom), name: 'Sequential' });
    setTimeout(() => {
      set(normalCountAtom, get(normalCountAtom) + 5);
      addUpdateLog('🐌 일반 순차 업데이트 완료');
    }, 10); // 약간의 지연으로 순차 업데이트 효과 강화
  };
  
  const proxyBatchUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🎭 Proxy 배치 업데이트 시작');
    
    batchProxy(() => {
      proxyUser.name = 'Batched';
      proxyCount.value += 10;
    });
    
    addUpdateLog('🎭 Proxy 배치 업데이트 완료');
  };
  
  const proxySequentialUpdate = () => {
    clearLogs();
    setIsLogging(true);
    addUpdateLog('🐌 Proxy 순차 업데이트 시작');
    
    // 배치 없이 순차적으로 업데이트
    proxyUser.name = 'Sequential';
    setTimeout(() => {
      proxyCount.value += 5;
      addUpdateLog('🐌 Proxy 순차 업데이트 완료');
    }, 10); // 약간의 지연으로 순차 업데이트 효과 강화
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>배치 업데이트 비교</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>📊 업데이트 로그</h4>
        {updateLogs.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>버튼을 클릭하여 업데이트 로그를 확인하세요</p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px' }}>
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
      
      <div style={{ marginBottom: '15px' }}>
        <h4>현재 상태</h4>
        <p>🏛️ 일반 - 이름: <strong>{normalUser.name}</strong>, 카운트: <strong>{normalCount}</strong></p>
        <p>🎭 Proxy - 이름: <strong>{proxyUser.name}</strong>, 카운트: <strong>{proxyCount.value}</strong></p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={normalBatchUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🏛️ 일반 배치 업데이트 (+10)
        </button>
        <button 
          onClick={normalSequentialUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🐌 일반 순차 업데이트 (+5)
        </button>
        <button 
          onClick={proxyBatchUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🎭 Proxy 배치 업데이트 (+10)
        </button>
        <button 
          onClick={proxySequentialUpdate}
          style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🐌 Proxy 순차 업데이트 (+5)
        </button>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <h4>💡 차이점 확인 방법</h4>
        <ul style={{ fontSize: '14px', margin: '5px 0' }}>
          <li><strong>배치 업데이트</strong>: 여러 상태 변경을 <strong>1번의 렌더링</strong>으로 처리</li>
          <li><strong>순차 업데이트</strong>: 각 상태 변경마다 <strong>별도의 렌더링</strong> 발생</li>
          <li><strong>업데이트 로그</strong>를 위에서 실시간으로 확인하세요!</li>
          <li><strong>개발자 콘솔</strong>에서 상세한 렌더링 로그를 확인하세요</li>
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

export default BatchUpdateComparison; 