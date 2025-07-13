// 일반 Atom vs Proxy Atom 성능 비교 테스트

import { createAtom, get, set, subscribe, batch } from '../lib/atom';
import { 
  createProxyAtom, 
  createSimpleProxyAtom,
  subscribeProxy,
  batchProxy,
  getProxyAtomInfo 
} from '../lib/proxy-atom';

describe('Atom vs Proxy Atom 비교 테스트', () => {
  describe('기본 기능 테스트', () => {
    it('일반 atom과 proxy atom을 생성하고 초기값을 가져올 수 있다', () => {
      const normalAtom = createAtom({ value: 0 });
      const proxyAtom = createProxyAtom({ value: 0 });

      expect(get(normalAtom)).toEqual({ value: 0 });
      expect(proxyAtom.value).toBe(0);
    });

    it('일반 atom과 proxy atom의 값을 설정할 수 있다', () => {
      const normalAtom = createAtom({ value: 0 });
      const proxyAtom = createProxyAtom({ value: 0 });

      set(normalAtom, { value: 10 });
      proxyAtom.value = 10;

      expect(get(normalAtom)).toEqual({ value: 10 });
      expect(proxyAtom.value).toBe(10);
    });
  });

  describe('구독 테스트', () => {
    it('일반 atom과 proxy atom의 구독이 정상적으로 작동한다', () => {
      const normalAtom = createAtom({ value: 0 });
      const proxyAtom = createProxyAtom({ value: 0 });

      let normalUpdateCount = 0;
      let proxyUpdateCount = 0;
      let normalLastValue: any;
      let proxyLastValue: any;

      const normalUnsub = subscribe(normalAtom, (value) => {
        normalUpdateCount++;
        normalLastValue = value;
      });

      const proxyUnsub = subscribeProxy(proxyAtom, (value) => {
        proxyUpdateCount++;
        proxyLastValue = value;
      });

      set(normalAtom, { value: 20 });
      proxyAtom.value = 20;

      expect(normalUpdateCount).toBe(1);
      expect(proxyUpdateCount).toBe(1);
      expect(normalLastValue).toEqual({ value: 20 });
      expect(proxyLastValue.value).toBe(20);

      normalUnsub();
      proxyUnsub();
    });
  });

  describe('성능 비교 테스트', () => {
    it('일반 atom이 proxy atom보다 빠르다', () => {
      const normalPerfAtom = createAtom({ value: 0 });
      const proxyPerfAtom = createProxyAtom({ value: 0 });

      const iterations = 100000;

      // 일반 atom 성능 테스트
      const normalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        set(normalPerfAtom, { value: i });
      }
      const normalTime = performance.now() - normalStart;

      // Proxy atom 성능 테스트
      const proxyStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        proxyPerfAtom.value = i;
      }
      const proxyTime = performance.now() - proxyStart;

      // 성능 결과를 로그로 출력
      console.log(`일반 Atom: ${normalTime.toFixed(2)}ms`);
      console.log(`Proxy Atom: ${proxyTime.toFixed(2)}ms`);
      console.log(`Proxy가 ${(proxyTime / normalTime).toFixed(1)}배 느림`);

      // Proxy atom이 일반 atom보다 느려야 함
      expect(proxyTime).toBeGreaterThan(normalTime);
      
      // 최종 값 확인
      expect(get(normalPerfAtom)).toEqual({ value: iterations - 1 });
      expect(proxyPerfAtom.value).toBe(iterations - 1);
    });

    it('성능 차이가 예상 범위 내에 있다', () => {
      const normalPerfAtom = createAtom({ value: 0 });
      const proxyPerfAtom = createProxyAtom({ value: 0 });

      const iterations = 50000; // 더 빠른 테스트를 위해 반으로 줄임

      // 일반 atom 성능 테스트
      const normalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        set(normalPerfAtom, { value: i });
      }
      const normalTime = performance.now() - normalStart;

      // Proxy atom 성능 테스트
      const proxyStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        proxyPerfAtom.value = i;
      }
      const proxyTime = performance.now() - proxyStart;

      const ratio = proxyTime / normalTime;
      
      // Proxy atom이 일반 atom보다 2배 이상 느려야 함 (일반적으로 5배 정도)
      expect(ratio).toBeGreaterThan(2);
      
      // 너무 차이가 나지 않아야 함 (50배 미만)
      expect(ratio).toBeLessThan(50);
    });
  });

  describe('배치 업데이트 테스트', () => {
    it('일반 atom과 proxy atom의 배치 업데이트가 작동한다', () => {
      const normalBatchAtom = createAtom(0);
      const proxyBatchAtom = createSimpleProxyAtom(0);

      let normalBatchCount = 0;
      let proxyBatchCount = 0;

      const normalUnsub = subscribe(normalBatchAtom, () => normalBatchCount++);
      const proxyUnsub = subscribeProxy(proxyBatchAtom, () => proxyBatchCount++);

      // 일반 배치
      batch(() => {
        set(normalBatchAtom, 1);
        set(normalBatchAtom, 2);
        set(normalBatchAtom, 3);
      });

      // Proxy 배치
      batchProxy(() => {
        proxyBatchAtom.value = 1;
        proxyBatchAtom.value = 2;
        proxyBatchAtom.value = 3;
      });

      expect(normalBatchCount).toBe(1); // 배치로 인해 1번만 호출
      expect(proxyBatchCount).toBe(1); // 배치로 인해 1번만 호출
      
      expect(get(normalBatchAtom)).toBe(3);
      expect(proxyBatchAtom.value).toBe(3);

      normalUnsub();
      proxyUnsub();
    });
  });

  describe('메모리 및 디버깅 정보 테스트', () => {
    it('proxy atom의 디버깅 정보를 가져올 수 있다', () => {
      const proxyAtom = createProxyAtom({ value: 0 });
      
      const debugInfo = getProxyAtomInfo(proxyAtom);
      
      expect(debugInfo).toHaveProperty('id');
      expect(debugInfo).toHaveProperty('subscribers');
      expect(debugInfo).toHaveProperty('dependencies');
      expect(debugInfo).toHaveProperty('dependents');
      expect(debugInfo).toHaveProperty('isDerived');
      expect(debugInfo).toHaveProperty('version');
      
      expect(typeof debugInfo.id).toBe('number');
      expect(typeof debugInfo.subscribers).toBe('number');
      expect(typeof debugInfo.dependencies).toBe('number');
      expect(typeof debugInfo.dependents).toBe('number');
      expect(typeof debugInfo.isDerived).toBe('boolean');
      expect(typeof debugInfo.version).toBe('number');
    });

    it('구독자 수가 올바르게 추적된다', () => {
      const proxyAtom = createProxyAtom({ value: 0 });
      
      let initialInfo = getProxyAtomInfo(proxyAtom);
      expect(initialInfo.subscribers).toBe(0);

      const unsubscribe1 = subscribeProxy(proxyAtom, () => {});
      const unsubscribe2 = subscribeProxy(proxyAtom, () => {});
      
      let withSubscribersInfo = getProxyAtomInfo(proxyAtom);
      expect(withSubscribersInfo.subscribers).toBe(2);

      unsubscribe1();
      let afterUnsubscribe1Info = getProxyAtomInfo(proxyAtom);
      expect(afterUnsubscribe1Info.subscribers).toBe(1);

      unsubscribe2();
      let afterUnsubscribe2Info = getProxyAtomInfo(proxyAtom);
      expect(afterUnsubscribe2Info.subscribers).toBe(0);
    });
  });

  describe('기능 동등성 테스트', () => {
    it('일반 atom과 proxy atom이 동일한 결과를 생성한다', () => {
      const normalAtom = createAtom({ count: 0, name: 'test' });
      const proxyAtom = createProxyAtom({ count: 0, name: 'test' });

      // 초기 상태 비교
      expect(get(normalAtom)).toEqual({ count: 0, name: 'test' });
      expect({ count: proxyAtom.count, name: proxyAtom.name }).toEqual({ count: 0, name: 'test' });

      // 값 변경
      set(normalAtom, { count: 10, name: 'updated' });
      proxyAtom.count = 10;
      proxyAtom.name = 'updated';

      // 변경된 상태 비교
      expect(get(normalAtom)).toEqual({ count: 10, name: 'updated' });
      expect({ count: proxyAtom.count, name: proxyAtom.name }).toEqual({ count: 10, name: 'updated' });
    });
  });
}); 