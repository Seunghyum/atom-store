# medistream-atom

고성능 상태 관리 라이브러리 - Atom 기반 상태 관리 시스템

## 주요 기능

- ✅ **기본 atom 생성 및 조작**
- ✅ **파생 atom (derived atom)**
- ✅ **비동기 atom (async atom)**
- ✅ **구독 시스템**
- ✅ **배치 업데이트 (수동 & 자동)**
- ✅ **메모리 관리**
- ✅ **React 훅 통합**
- ✅ **타입 안전성**
- ✅ **에러 처리**
- ✅ **성능 최적화**

## 설치

```bash
npm install medistream-atom
```

## 기본 사용법

### 1. 기본 Atom 생성 및 사용

```typescript
import { createAtom, get, set } from './src/lib/atom';

// 기본 atom 생성
const countAtom = createAtom(0);

// 값 읽기
const count = get(countAtom);

// 값 설정
set(countAtom, 10);
```

### 2. React 훅 통합

```typescript
import { useAtom, useAtomValue, useSetAtom } from './src/lib/atom';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 3. 자동 배치 처리

`useAtom`의 `setValue`는 자동으로 배치 처리되어 연속적인 상태 업데이트를 최적화합니다:

```typescript
function BatchExample() {
  const [atomA, setAtomA] = useAtom(atomAState);
  const [atomB, setAtomB] = useAtom(atomBState);
  
  const handleUpdate = () => {
    // 이 두 호출은 자동으로 배치 처리되어 한 번만 리렌더링됩니다
    setAtomA(10);
    setAtomB(20);
  };
  
  return <button onClick={handleUpdate}>Update Both</button>;
}
```

#### 배치 처리 패턴 비교

배치 처리에는 세 가지 주요 패턴이 있습니다:

```typescript
import { createAtom, get, set, batch, useAtom } from './src/lib/atom';

const countAtom = createAtom(0);
const nameAtom = createAtom('');
const derivedAtom = createDerivedAtom((get) => `Count: ${get(countAtom)}`);

// 1. 직접 set 호출 (즉시 처리, 여러 번 리렌더링)
set(countAtom, 10);
set(nameAtom, 'John');
// 결과: 2번의 리렌더링 발생

// 2. 수동 배치 처리 (즉시 처리, 한 번만 리렌더링)
batch(() => {
  set(countAtom, 10);
  set(nameAtom, 'John');
});
// 결과: 1번의 리렌더링 발생

// 3. 자동 배치 처리 (useAtom 패턴, 다음 틱에 한 번만 리렌더링)
function Component() {
  const [count, setCount] = useAtom(countAtom);
  const [name, setName] = useAtom(nameAtom);
  
  const handleClick = () => {
    setCount(10);
    setName('John');
    // 결과: 다음 마이크로태스크에서 1번의 리렌더링 발생
  };
  
  return <button onClick={handleClick}>Update</button>;
}
```

#### 배치 처리 동작 원리

- **직접 set 호출**: 각 호출마다 즉시 구독자에게 알림
- **수동 batch**: 배치 블록 내에서 모든 변경사항을 수집하고 블록 끝에서 한 번에 알림
- **자동 배치**: `useAtom`의 `setValue`가 마이크로태스크를 스케줄링하여 다음 틱에 자동으로 배치 처리

#### 중첩 배치 처리

```typescript
function complexUpdate() {
  batch(() => {
    set(atomA, 1);
    
    // 자동 배치 요청이 있어도 수동 배치가 우선
    setAtomB(2); // useAtom의 setValue
    
    set(atomC, 3);
  });
  // 결과: 수동 배치 완료 후 즉시 한 번만 리렌더링
}
```

직접 `set` 호출은 즉시 처리되며, 수동 배치 처리도 가능합니다:

```typescript
import { batch } from './src/lib/atom';

// 수동 배치 처리
batch(() => {
  set(atomA, 10);
  set(atomB, 20);
});
```

### 4. 파생 Atom

```typescript
import { createDerivedAtom } from './src/lib/atom';

const countAtom = createAtom(0);
const doubleCountAtom = createDerivedAtom((get) => get(countAtom) * 2);

// 파생 atom의 값은 자동으로 업데이트됩니다
console.log(get(doubleCountAtom)); // 0
set(countAtom, 5);
console.log(get(doubleCountAtom)); // 10
```

### 5. 비동기 Atom

```typescript
import { createAsyncAtom } from './src/lib/atom';

const userAtom = createAsyncAtom(
  fetch('/api/user').then(res => res.json())
);

// React 컴포넌트에서 사용
function UserProfile() {
  const user = useAtomValue(userAtom); // Suspense 지원
  
  return <div>Welcome, {user.name}!</div>;
}
```

### 6. 구독 시스템

```typescript
import { subscribe } from './src/lib/atom';

const countAtom = createAtom(0);

// 구독
const unsubscribe = subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});

// 구독 해제
unsubscribe();
```

## 고급 기능

### 다중 의존성 파생 Atom

```typescript
const nameAtom = createAtom('John');
const ageAtom = createAtom(25);

const profileAtom = createDerivedAtom((get) => {
  const name = get(nameAtom);
  const age = get(ageAtom);
  return `${name} (${age})`;
});
```

### 비동기 의존성 체인

```typescript
const configAtom = createAtom({ apiUrl: '/api' });

const dataAtom = createAsyncAtom(async (get) => {
  const config = get(configAtom);
  const response = await fetch(config.apiUrl + '/data');
  return response.json();
});
```

### 에러 처리

```typescript
const errorProneAtom = createDerivedAtom((get) => {
  const value = get(baseAtom);
  if (value < 0) {
    throw new Error('Value cannot be negative');
  }
  return value * 2;
});

// 에러는 자동으로 격리되어 다른 atom에 영향을 주지 않습니다
```

## 프로젝트 구조

```
src/
├── lib/
│   ├── atom/
│   │   ├── atom.ts          # 핵심 atom 로직
│   │   ├── use-atom.ts      # React 훅
│   │   └── index.ts         # 공개 API
│   └── proxy-atom/
│       ├── proxy-atom.ts    # Proxy 기반 atom
│       └── use-proxy-atom.ts # Proxy atom 훅
├── components/              # 예제 컴포넌트
├── atoms/                   # 공유 atom 정의
├── pages/                   # 페이지 컴포넌트
└── tests/                   # 테스트 파일
```

## 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 실행
npm run test:atom
npm run test:comparison
npm run test:advanced 
npm run test:useAtomBatch # @testing-library/react를 써서 리랜더링 횟수 체크

# 테스트 감시 모드
npm run test:watch

# 테스트 커버리지
npm run test:coverage
```

## 성능 비교

이 라이브러리는 Proxy 기반 구현 대비 약 7-11배 빠른 성능을 보입니다:

- **일반 Atom**: ~5ms (1000회 업데이트)
- **Proxy Atom**: ~45ms (1000회 업데이트)

### 배치 처리 성능 개선

자동 배치 처리 시스템을 통해 리렌더링 횟수를 대폭 줄여 성능을 개선했습니다:

- **직접 set 호출**: 3번의 개별 업데이트 → 3번의 리렌더링
- **수동 배치**: 3번의 업데이트 → 1번의 리렌더링
- **자동 배치**: 3번의 업데이트 → 1번의 리렌더링 (다음 틱)

테스트 결과: **총 51개 테스트 통과 (100% 성공율)**

## 최근 개선사항

### 자동 배치 처리 시스템 (v2.0)
- **마이크로태스크 기반 자동 배치**: `useAtom`의 `setValue`가 마이크로태스크를 스케줄링하여 자동으로 배치 처리
- **패턴별 최적화**: 직접 set 호출, 수동 배치, 자동 배치의 세 가지 패턴으로 다양한 사용 케이스 지원
- **중첩 배치 처리**: 수동 배치 처리와 자동 배치 처리의 완벽한 호환성, 중첩 상황에서 수동 배치가 우선
- **성능 개선**: 연속적인 상태 업데이트 시 리렌더링 횟수를 1/3로 감소

### 강화된 테스트 커버리지
- **배치 처리 패턴 비교 테스트**: 직접 set, 수동 배치, 자동 배치 각각의 동작 검증
- **성능 비교 테스트**: 각 패턴의 성능 차이 측정 및 검증
- **중첩 시나리오 테스트**: 복잡한 배치 처리 상황에서의 동작 검증
- **총 51개 테스트 통과**: 기존 46개 테스트 + 5개 배치 처리 테스트 추가

### 파생 atom 최적화
- **중간 상태 캡처 방지**: 배치 처리 중 파생 atom이 중간 상태를 캡처하지 않도록 최적화
- **의존성 추적 개선**: 배치 처리 시 의존성 체인에서 불필요한 재계산 방지
- **메모리 효율성**: 배치 처리 중 임시 상태를 최소화하여 메모리 사용량 감소

### 개발자 경험 개선
- **명확한 API 구분**: 각 배치 처리 패턴의 사용 사례와 장단점 명확히 정의
- **타입 안전성 강화**: 자동 배치 처리 함수의 타입 정의 개선
- **에러 처리 강화**: 배치 처리 중 발생하는 에러의 격리 및 디버깅 정보 제공

## API 참조

### Core Functions

- `createAtom<T>(initialValue: T): Atom<T>` - 기본 atom 생성
- `createDerivedAtom<T>(computeFn: (get: GetFn) => T): Atom<T>` - 파생 atom 생성
- `createAsyncAtom<T>(promise: Promise<T> | ((get: GetFn) => Promise<T>)): Atom<T>` - 비동기 atom 생성
- `get<T>(atom: Atom<T>): T` - atom 값 읽기
- `set<T>(atom: Atom<T>, value: T, enableAutoBatch?: boolean): void` - atom 값 설정
  - `enableAutoBatch`: true면 자동 배치 처리, false면 즉시 처리 (기본값: false)
- `batch(fn: () => void): void` - 수동 배치 처리 (즉시 실행)
- `subscribe<T>(atom: Atom<T>, callback: (value: T) => void): () => void` - 구독

### React Hooks

- `useAtom<T>(atom: Atom<T>): [T, (value: T) => void]` - 읽기/쓰기 훅
  - `setValue`: 자동 배치 처리되어 연속 호출 시 한 번만 리렌더링
- `useAtomValue<T>(atom: Atom<T>): T` - 읽기 전용 훅
- `useSetAtom<T>(atom: Atom<T>): (value: T) => void` - 쓰기 전용 훅
  - 자동 배치 처리 적용

### 유틸리티

- `getSubscriberCount<T>(atom: Atom<T>): number` - 구독자 수 확인
- `getDependencies<T>(atom: Atom<T>): { dependencies: number; dependents: number }` - 의존성 정보

## 라이선스

MIT License

## 기여하기

1. 이 저장소를 포크하세요
2. 새로운 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 사용 사례

이 라이브러리는 다음과 같은 프로젝트에 적합합니다:

- ✅ **중소규모 React 애플리케이션**
- ✅ **성능이 중요한 실시간 애플리케이션**
- ✅ **복잡한 상태 의존성이 있는 프로젝트**
- ✅ **메모리 사용량을 최소화해야 하는 환경**
- ✅ **타입 안전성이 중요한 TypeScript 프로젝트**
- ✅ **프로토타입 및 실험적 프로젝트**

대규모 엔터프라이즈 애플리케이션에서는 Redux Toolkit, Zustand, Jotai와 같은 검증된 라이브러리를 고려해보세요.
