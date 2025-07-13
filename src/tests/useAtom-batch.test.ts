import { createAtom, createDerivedAtom, get, set, subscribe } from '../lib/atom/atom';
import { useAtom } from '../lib/atom/use-atom';
import { renderHook, act } from '@testing-library/react';

describe('useAtom 자동 일괄 처리 테스트', () => {
  it('✅ useAtom의 setValue로 연속 호출시 1번만 리렌더링된다', async () => {
    const atomA = createAtom(0);
    const atomB = createAtom('');
    
    // 파생 atom으로 두 값의 조합 계산
    const combinedAtom = createDerivedAtom((get) => {
      const numA = get(atomA);
      const strB = get(atomB);
      return `${strB}: ${numA}`;
    });
    
    let renderCount = 0;
    
    // useAtom 훅 렌더링
    const { result } = renderHook(() => {
      renderCount++;
      const [valueA, setValueA] = useAtom(atomA);
      const [valueB, setValueB] = useAtom(atomB);
      const [combined] = useAtom(combinedAtom);
      
      return { valueA, setValueA, valueB, setValueB, combined };
    });
    
    // 초기 렌더링 확인
    expect(renderCount).toBe(1);
    expect(result.current.combined).toBe(': 0');
    
    // 🚀 핵심 테스트: 연속된 setValue 호출 (자동 일괄 처리)
    await act(async () => {
      result.current.setValueA(10);
      result.current.setValueB('Count');
      
      // 다음 마이크로태스크에서 일괄 처리 완료 대기
      await new Promise(resolve => Promise.resolve().then(resolve));
    });
    
    // ✅ 핵심 검증: 1번만 추가 리렌더링되었는지 확인
    expect(renderCount).toBe(2); // 초기 1번 + 배치 업데이트 1번
    expect(result.current.combined).toBe('Count: 10');
    expect(result.current.valueA).toBe(10);
    expect(result.current.valueB).toBe('Count');
    
    console.log('🎯 핵심 결과: useAtom setValue 연속 호출 → 1번만 리렌더링 ✅');
  });

  it('여러 atom을 동시에 변경할 때 useAtom의 자동 일괄 처리', async () => {
    const atom1 = createAtom(1);
    const atom2 = createAtom(2);
    const atom3 = createAtom(3);
    
    const sumAtom = createDerivedAtom((get) => {
      return get(atom1) + get(atom2) + get(atom3);
    });
    
    let renderCount = 0;
    const renderHistory: number[] = [];
    
    const { result } = renderHook(() => {
      renderCount++;
      const [value1, setValue1] = useAtom(atom1);
      const [value2, setValue2] = useAtom(atom2);
      const [value3, setValue3] = useAtom(atom3);
      const [sum] = useAtom(sumAtom);
      
      renderHistory.push(sum);
      
      return { value1, setValue1, value2, setValue2, value3, setValue3, sum };
    });
    
    expect(renderCount).toBe(1);
    expect(result.current.sum).toBe(6); // 1 + 2 + 3
    
    // 🚀 핵심 테스트: 3개 atom을 동시에 변경
    await act(async () => {
      result.current.setValue1(10);
      result.current.setValue2(20);
      result.current.setValue3(30);
      
      // 자동 일괄 처리 완료 대기
      await new Promise(resolve => Promise.resolve().then(resolve));
    });
    
    // ✅ 핵심 검증: 1번만 추가 리렌더링되었는지 확인
    expect(renderCount).toBe(2);
    expect(result.current.sum).toBe(60); // 10 + 20 + 30
    
    // 렌더링 히스토리 확인
    expect(renderHistory).toEqual([
      6,  // 초기 렌더링
      60  // 배치 업데이트 후
    ]);
    
    console.log('📊 3개 atom 동시 변경: 2번 리렌더링 (초기 1번 + 배치 1번)');
    console.log('📈 렌더링 히스토리:', renderHistory);
  });

  it('구독자 레벨에서 자동 일괄 처리 확인', async () => {
    const atomA = createAtom(0);
    const atomB = createAtom('');
    
    const combinedAtom = createDerivedAtom((get) => {
      const numA = get(atomA);
      const strB = get(atomB);
      return `${strB}: ${numA}`;
    });
    
    let subscribeCallCount = 0;
    const capturedValues: string[] = [];
    
    // 구독자 등록
    const unsubscribe = subscribe(combinedAtom, (value) => {
      subscribeCallCount++;
      capturedValues.push(value);
    });
    
    // useAtom 훅 생성
    const { result } = renderHook(() => {
      const [valueA, setValueA] = useAtom(atomA);
      const [valueB, setValueB] = useAtom(atomB);
      return { setValueA, setValueB };
    });
    
    // 🚀 핵심 테스트: 연속된 setValue 호출
    await act(async () => {
      result.current.setValueA(5);
      result.current.setValueB('Test');
      
      // 자동 일괄 처리 완료 대기
      await new Promise(resolve => Promise.resolve().then(resolve));
    });
    
    // ✅ 핵심 검증: 구독자가 1번만 호출되었는지 확인
    expect(subscribeCallCount).toBe(1);
    expect(capturedValues).toEqual(['Test: 5']);
    
    console.log('🎯 구독자 호출 횟수:', subscribeCallCount);
    console.log('📝 캡처된 값:', capturedValues);
    
    unsubscribe();
  });

  it('React 컴포넌트에서의 실제 리렌더링 최적화 시뮬레이션', async () => {
    const nameAtom = createAtom('');
    const ageAtom = createAtom(0);
    const cityAtom = createAtom('');
    
    const profileAtom = createDerivedAtom((get) => {
      const name = get(nameAtom);
      const age = get(ageAtom);
      const city = get(cityAtom);
      return `${name}, ${age}세, ${city} 거주`;
    });
    
    let componentRenderCount = 0;
    const renderTimestamps: number[] = [];
    
    // React 컴포넌트 시뮬레이션
    const { result } = renderHook(() => {
      componentRenderCount++;
      renderTimestamps.push(Date.now());
      
      const [name, setName] = useAtom(nameAtom);
      const [age, setAge] = useAtom(ageAtom);
      const [city, setCity] = useAtom(cityAtom);
      const [profile] = useAtom(profileAtom);
      
      return { name, setName, age, setAge, city, setCity, profile };
    });
    
    expect(componentRenderCount).toBe(1);
    expect(result.current.profile).toBe(', 0세,  거주');
    
    // 🚀 핵심 테스트: 사용자 정보를 한 번에 업데이트 (폼 제출 시뮬레이션)
    await act(async () => {
      const startTime = Date.now();
      
      result.current.setName('김철수');
      result.current.setAge(25);
      result.current.setCity('서울');
      
      // 자동 일괄 처리 완료 대기
      await new Promise(resolve => Promise.resolve().then(resolve));
      
      const endTime = Date.now();
      console.log(`⚡ 배치 처리 완료 시간: ${endTime - startTime}ms`);
    });
    
    // ✅ 핵심 검증: 최적화된 리렌더링 확인
    expect(componentRenderCount).toBe(2); // 초기 1번 + 배치 1번
    expect(result.current.profile).toBe('김철수, 25세, 서울 거주');
    
    // 렌더링 간격 확인
    if (renderTimestamps.length >= 2) {
      const renderInterval = renderTimestamps[1] - renderTimestamps[0];
      console.log(`🕐 렌더링 간격: ${renderInterval}ms`);
    }
    
    console.log('🎯 최종 결과:');
    console.log(`  - 총 리렌더링 횟수: ${componentRenderCount}번`);
    console.log(`  - 최종 프로필: ${result.current.profile}`);
    console.log('  - 3개 상태 변경 → 1번 리렌더링 (최적화 성공!) ✅');
  });

  it('직접 set vs useAtom setValue 성능 비교', async () => {
    const atom1 = createAtom(0);
    const atom2 = createAtom('');
    
    const combinedAtom = createDerivedAtom((get) => {
      const num = get(atom1);
      const str = get(atom2);
      return `${str}: ${num}`;
    });
    
    // 🔄 직접 set 호출 테스트
    let directSetUpdateCount = 0;
    const directSetValues: string[] = [];
    
    const directUnsubscribe = subscribe(combinedAtom, (value) => {
      directSetUpdateCount++;
      directSetValues.push(value);
    });
    
    // 직접 set 호출 (각각 즉시 처리)
    set(atom1, 100);
    set(atom2, 'Direct');
    
    expect(directSetUpdateCount).toBe(2); // 2번 개별 업데이트
    expect(directSetValues).toEqual([': 100', 'Direct: 100']); // 중간 상태 포함
    
    directUnsubscribe();
    
    // 상태 초기화
    set(atom1, 0);
    set(atom2, '');
    
    // 🚀 useAtom setValue 테스트
    let useAtomUpdateCount = 0;
    const useAtomValues: string[] = [];
    
    const useAtomUnsubscribe = subscribe(combinedAtom, (value) => {
      useAtomUpdateCount++;
      useAtomValues.push(value);
    });
    
    const { result } = renderHook(() => {
      const [, setValue1] = useAtom(atom1);
      const [, setValue2] = useAtom(atom2);
      return { setValue1, setValue2 };
    });
    
    // useAtom setValue 호출 (자동 일괄 처리)
    await act(async () => {
      result.current.setValue1(200);
      result.current.setValue2('UseAtom');
      
      // 자동 일괄 처리 완료 대기
      await new Promise(resolve => Promise.resolve().then(resolve));
    });
    
    expect(useAtomUpdateCount).toBe(1); // 1번 배치 업데이트
    expect(useAtomValues).toEqual(['UseAtom: 200']); // 최종 상태만
    
    useAtomUnsubscribe();
    
    console.log('📊 성능 비교 결과:');
    console.log(`🔄 직접 set: ${directSetUpdateCount}번 업데이트, 중간 상태 포함`);
    console.log(`🚀 useAtom: ${useAtomUpdateCount}번 업데이트, 최종 상태만`);
    console.log('✅ useAtom이 더 효율적! (불필요한 중간 렌더링 방지)');
  });
}); 