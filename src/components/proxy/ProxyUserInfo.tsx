import { useProxyAtom } from '../../lib/proxy-atom';
import { proxyUserAtom } from '../../atoms/proxy';

function ProxyUserInfo() {
  const proxyUser = useProxyAtom(proxyUserAtom);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Proxy Atom 사용자 정보</h3>
      <p>이름: {proxyUser.name}</p>
      <p>나이: {proxyUser.age}</p>
      <p>도시: {proxyUser.city}</p>
      <button onClick={() => proxyUser.name = 'Jane'}>이름 변경</button>
      <button onClick={() => proxyUser.age++}>나이 증가</button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 사용법 (자연스러운 변경)
proxyUser.name = 'Jane';
proxyUser.age++;`}
      </pre>
    </div>
  );
}

export default ProxyUserInfo; 