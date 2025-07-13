import { useProxyAtom } from '../../lib/proxy-atom';
import { proxyCountAtom } from '../../atoms/proxy';

function ProxyCounter() {
  const proxyCount = useProxyAtom(proxyCountAtom);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Proxy Atom 카운터</h3>
      <p>카운트: {proxyCount.value}</p>
      <button onClick={() => proxyCount.value++}>증가</button>
      <button onClick={() => proxyCount.value--}>감소</button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 사용법
const proxyCount = useProxyAtom(proxyCountAtom);
proxyCount.value++;`}
      </pre>
    </div>
  );
}

export default ProxyCounter; 