import { useProxyAtom } from '../../lib/proxy-atom';
import { proxyNestedAtom } from '../../atoms/proxy';

function ProxyNestedObject() {
  const proxyNested = useProxyAtom(proxyNestedAtom);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Proxy Atom 중첩 객체</h3>
      <p>이름: {proxyNested.user.profile.name}</p>
      <p>아바타: {proxyNested.user.profile.avatar}</p>
      <p>테마: {proxyNested.user.settings.theme}</p>
      <p>버전: {proxyNested.app.version}</p>
      <button onClick={() => proxyNested.user.profile.avatar = 'avatar2.jpg'}>
        아바타 변경
      </button>
      <button onClick={() => {
        proxyNested.user.settings.theme = 
          proxyNested.user.settings.theme === 'dark' ? 'light' : 'dark';
      }}>
        테마 토글
      </button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 간단한 중첩 객체 업데이트
proxyNested.user.profile.avatar = 'avatar2.jpg';
proxyNested.user.settings.theme = 'light';`}
      </pre>
    </div>
  );
}

export default ProxyNestedObject; 