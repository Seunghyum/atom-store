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