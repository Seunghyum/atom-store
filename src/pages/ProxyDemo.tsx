import Navigation from '../components/Navigation';
import NormalCounter from '../components/proxy/NormalCounter';
import ProxyCounter from '../components/proxy/ProxyCounter';
import NormalUserInfo from '../components/proxy/NormalUserInfo';
import ProxyUserInfo from '../components/proxy/ProxyUserInfo';
import NormalNestedObject from '../components/proxy/NormalNestedObject';
import ProxyNestedObject from '../components/proxy/ProxyNestedObject';
import BatchUpdateComparison from '../components/proxy/BatchUpdateComparison';

function ProxyDemo() {
  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px' }}>
        <h1>🎭 Proxy vs 일반 Atom 비교 데모</h1>
        <p>
          두 가지 다른 Atom 구현 방식을 비교해보세요. 
          <strong>일반 Atom</strong>은 불변성을 유지하며, 
          <strong>Proxy Atom</strong>은 자연스러운 객체 접근을 제공합니다.
        </p>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
          <h3>💡 사용법 비교</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>🏛️ 일반 Atom</h4>
              <pre style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
{`const [user, setUser] = useAtom(userAtom);
setUser({ ...user, name: 'John' });`}
              </pre>
            </div>
            <div>
              <h4>🎭 Proxy Atom</h4>
              <pre style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
{`const user = useProxyAtom(userAtom);
user.name = 'John';`}
              </pre>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
          <h3>🔧 각 방식의 장단점</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>🏛️ 일반 Atom</h4>
              <ul style={{ fontSize: '14px' }}>
                <li>✅ 명시적인 불변성 패턴</li>
                <li>✅ 예측 가능한 상태 변경</li>
                <li>✅ 타입 안정성</li>
                <li>❌ 중첩 객체 업데이트 복잡</li>
                <li>❌ 보일러플레이트 코드 증가</li>
              </ul>
            </div>
            <div>
              <h4>🎭 Proxy Atom</h4>
              <ul style={{ fontSize: '14px' }}>
                <li>✅ 자연스러운 객체 조작</li>
                <li>✅ 간단한 중첩 객체 업데이트</li>
                <li>✅ 코드 간결성</li>
                <li>❌ 암묵적인 상태 변경</li>
                <li>❌ 디버깅 복잡성</li>
              </ul>
            </div>
          </div>
        </div>
        
        <h2>📊 실제 사용 비교</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>🏛️ 일반 Atom 방식</h3>
            <NormalCounter />
            <NormalUserInfo />
            <NormalNestedObject />
          </div>
          <div>
            <h3>🎭 Proxy Atom 방식</h3>
            <ProxyCounter />
            <ProxyUserInfo />
            <ProxyNestedObject />
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <BatchUpdateComparison />
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3>🧪 테스트 가이드</h3>
          <ol style={{ fontSize: '14px' }}>
            <li>각 방식의 카운터 버튼을 클릭하여 상태 변경을 확인하세요</li>
            <li>사용자 정보와 중첩 객체에서 업데이트 방식의 차이를 관찰하세요</li>
            <li>배치 업데이트 섹션에서 성능 차이를 확인하세요</li>
            <li>개발자 콘솔에서 렌더링 로그를 확인하세요</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ProxyDemo; 