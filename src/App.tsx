import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import Navigation from './components/Navigation';
import Counter from './components/Counter';
import DerivedDisplay from './components/DerivedDisplay';
import NameInput from './components/NameInput';
import BatchUpdateTest from './components/BatchUpdateTest';
import AsyncDataDisplay from './components/AsyncDataDisplay';
import UserDataDisplay from './components/UserDataDisplay';
import IndependentComponent from './components/IndependentComponent';
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary';
import IndependentCounter1 from './components/IndependentCounter1';
import IndependentCounter2 from './components/IndependentCounter2';
import IndependentCounter3 from './components/IndependentCounter3';

function App() {
  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px' }}>
        <h1>고급 Atom 기반 상태 관리 라이브러리 데모</h1>
        <p>개발자 콘솔을 열어서 각 컴포넌트의 렌더링 로그를 확인하세요.</p>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
          <h3>🔗 페이지 네비게이션</h3>
          <p>
            현재 페이지에서는 <strong>일반 Atom 방식</strong>의 고급 기능들을 확인할 수 있습니다.
            <br />
            <Link to="/proxy-demo" style={{ color: '#6f42c1', fontWeight: 'bold' }}>
              🎭 Proxy vs 일반 Atom 비교 페이지
            </Link>
            에서 두 구현 방식의 차이점을 직접 체험해보세요!
          </p>
        </div>

        {/* 독립적인 컴포넌트 렌더링 데모 섹션 */}
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2>🎯 독립적인 컴포넌트 렌더링 데모</h2>
          <p>
            아래 3개의 카운터는 각각 독립적인 상태를 가지고 있습니다. 
            <br />
            <strong>하나의 카운터를 클릭하면 해당 컴포넌트만 리렌더링됩니다.</strong>
            <br />
            개발자 콘솔에서 각각의 컴포넌트가 언제 렌더링되는지 확인해보세요!
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            <IndependentCounter1 />
            <IndependentCounter2 />
            <IndependentCounter3 />
          </div>
          
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
            <h4>🔍 테스트 방법:</h4>
            <ul>
              <li>개발자 콘솔(F12)을 열고 Console 탭을 확인하세요</li>
              <li>각 카운터의 버튼을 클릭하면 해당 컴포넌트만 콘솔에 렌더링 로그가 출력됩니다</li>
              <li>다른 카운터들은 렌더링되지 않아 로그가 출력되지 않습니다</li>
              <li>각 카운터의 상태는 서로 독립적으로 관리됩니다</li>
            </ul>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Counter />
          <DerivedDisplay />
          <NameInput />
          <BatchUpdateTest />
          <IndependentComponent />
          
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback>비동기 데이터 로딩 중...</LoadingFallback>}>
              <AsyncDataDisplay />
            </Suspense>
          </ErrorBoundary>
          
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback>사용자 데이터 로딩 중...</LoadingFallback>}>
              <UserDataDisplay />
            </Suspense>
          </ErrorBoundary>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <h3>새로운 기능 테스트:</h3>
          <ul>
            <li><strong>독립적인 렌더링:</strong> 각 컴포넌트는 자신의 상태값 변경에만 반응하여 렌더링됩니다.</li>
            <li><strong>파생 Atom:</strong> 카운터나 이름을 변경하면 파생 atom들도 자동으로 업데이트됩니다.</li>
            <li><strong>비동기 Atom:</strong> Suspense와 Error Boundary를 사용하여 비동기 데이터를 처리합니다.</li>
            <li><strong>배치 업데이트:</strong> 배치 업데이트 버튼을 클릭하면 여러 상태 변경이 한 번에 처리됩니다.</li>
            <li><strong>메모리 관리:</strong> 구독자 수와 의존성 정보를 확인할 수 있습니다.</li>
            <li><strong>선택적 렌더링:</strong> 관련 atom을 사용하는 컴포넌트만 렌더링됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App; 