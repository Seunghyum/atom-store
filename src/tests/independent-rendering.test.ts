import { 
  createAtom, 
  get, 
  set, 
  subscribe,
  getSubscriberCount,
  getDependencies,
} from '../lib/atom';
import { counter1Atom, counter2Atom, counter3Atom } from '../atoms';

describe('독립적인 컴포넌트 렌더링 테스트', () => {
  describe('독립적인 atom 생성 및 격리', () => {
    it('독립적인 counter atom들이 서로 다른 초기값을 가진다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      expect(get(counter1Atom)).toBe(0);
      expect(get(counter2Atom)).toBe(0);
      expect(get(counter3Atom)).toBe(0);
    });

    it('각 atom들이 독립적으로 값을 변경할 수 있다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      set(counter1Atom, 10);
      set(counter2Atom, 20);
      set(counter3Atom, 30);

      expect(get(counter1Atom)).toBe(10);
      expect(get(counter2Atom)).toBe(20);
      expect(get(counter3Atom)).toBe(30);
    });
  });

  describe('독립적인 구독자 관리', () => {
    it('각 atom은 독립적인 구독자 집합을 가진다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      // 초기에는 구독자가 없어야 함
      expect(getSubscriberCount(counter1Atom)).toBe(0);
      expect(getSubscriberCount(counter2Atom)).toBe(0);
      expect(getSubscriberCount(counter3Atom)).toBe(0);
    });

    it('하나의 atom에 구독자를 추가해도 다른 atom들은 영향받지 않는다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      // counter1Atom에만 구독자 추가
      const unsubscribe1 = subscribe(counter1Atom, () => {});
      
      expect(getSubscriberCount(counter1Atom)).toBe(1);
      expect(getSubscriberCount(counter2Atom)).toBe(0);
      expect(getSubscriberCount(counter3Atom)).toBe(0);

      // counter2Atom에 구독자 추가
      const unsubscribe2 = subscribe(counter2Atom, () => {});
      
      expect(getSubscriberCount(counter1Atom)).toBe(1);
      expect(getSubscriberCount(counter2Atom)).toBe(1);
      expect(getSubscriberCount(counter3Atom)).toBe(0);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('독립적인 상태 변경 알림', () => {
    it('하나의 atom 변경 시 해당 atom의 구독자만 호출된다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const unsubscribe1 = subscribe(counter1Atom, callback1);
      const unsubscribe2 = subscribe(counter2Atom, callback2);
      const unsubscribe3 = subscribe(counter3Atom, callback3);

      // counter1Atom만 변경
      set(counter1Atom, 10);

      expect(callback1).toHaveBeenCalledWith(10);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      // counter2Atom만 변경
      set(counter2Atom, 20);

      expect(callback1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback2).toHaveBeenCalledWith(20);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();

      // counter3Atom만 변경
      set(counter3Atom, 30);

      expect(callback1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback2).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback3).toHaveBeenCalledWith(30);
      expect(callback3).toHaveBeenCalledTimes(1);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    it('여러 구독자를 가진 atom의 변경 시 해당 atom의 모든 구독자가 호출된다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);

      const callback1a = jest.fn();
      const callback1b = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1a = subscribe(counter1Atom, callback1a);
      const unsubscribe1b = subscribe(counter1Atom, callback1b);
      const unsubscribe2 = subscribe(counter2Atom, callback2);

      // counter1Atom 변경 - 두 개의 구독자 모두 호출되어야 함
      set(counter1Atom, 10);

      expect(callback1a).toHaveBeenCalledWith(10);
      expect(callback1a).toHaveBeenCalledTimes(1);
      expect(callback1b).toHaveBeenCalledWith(10);
      expect(callback1b).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      // counter2Atom 변경 - 하나의 구독자만 호출되어야 함
      set(counter2Atom, 20);

      expect(callback1a).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback1b).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback2).toHaveBeenCalledWith(20);
      expect(callback2).toHaveBeenCalledTimes(1);

      // 구독 해제
      unsubscribe1a();
      unsubscribe1b();
      unsubscribe2();
    });
  });

  describe('독립적인 의존성 관리', () => {
    it('각 atom은 독립적인 의존성 정보를 가진다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      const deps1 = getDependencies(counter1Atom);
      const deps2 = getDependencies(counter2Atom);
      const deps3 = getDependencies(counter3Atom);

      expect(deps1.dependencies).toBe(0);
      expect(deps1.dependents).toBe(0);
      expect(deps2.dependencies).toBe(0);
      expect(deps2.dependents).toBe(0);
      expect(deps3.dependencies).toBe(0);
      expect(deps3.dependents).toBe(0);
    });
  });

  describe('독립적인 렌더링 시뮬레이션', () => {
    it('컴포넌트 렌더링 시뮬레이션 - 각 컴포넌트가 독립적으로 렌더링된다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      // 각 컴포넌트의 렌더링을 시뮬레이션하는 함수들
      const renderCounter1 = jest.fn();
      const renderCounter2 = jest.fn();
      const renderCounter3 = jest.fn();

      // 컴포넌트들이 각각의 atom을 구독
      const unsubscribe1 = subscribe(counter1Atom, renderCounter1);
      const unsubscribe2 = subscribe(counter2Atom, renderCounter2);
      const unsubscribe3 = subscribe(counter3Atom, renderCounter3);

      // IndependentCounter1 컴포넌트의 버튼 클릭 시뮬레이션
      set(counter1Atom, 1);
      
      expect(renderCounter1).toHaveBeenCalledWith(1);
      expect(renderCounter1).toHaveBeenCalledTimes(1);
      expect(renderCounter2).not.toHaveBeenCalled();
      expect(renderCounter3).not.toHaveBeenCalled();

      // IndependentCounter2 컴포넌트의 버튼 클릭 시뮬레이션
      set(counter2Atom, 2);
      
      expect(renderCounter1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderCounter2).toHaveBeenCalledWith(2);
      expect(renderCounter2).toHaveBeenCalledTimes(1);
      expect(renderCounter3).not.toHaveBeenCalled();

      // IndependentCounter3 컴포넌트의 버튼 클릭 시뮬레이션
      set(counter3Atom, 3);
      
      expect(renderCounter1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderCounter2).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderCounter3).toHaveBeenCalledWith(3);
      expect(renderCounter3).toHaveBeenCalledTimes(1);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    it('동시에 여러 컴포넌트가 렌더링되어도 각각 독립적으로 처리된다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);
      const counter3Atom = createAtom(0);

      const renderCounter1 = jest.fn();
      const renderCounter2 = jest.fn();
      const renderCounter3 = jest.fn();

      const unsubscribe1 = subscribe(counter1Atom, renderCounter1);
      const unsubscribe2 = subscribe(counter2Atom, renderCounter2);
      const unsubscribe3 = subscribe(counter3Atom, renderCounter3);

      // 동시에 여러 atom 변경
      set(counter1Atom, 10);
      set(counter2Atom, 20);
      set(counter3Atom, 30);

      expect(renderCounter1).toHaveBeenCalledWith(10);
      expect(renderCounter1).toHaveBeenCalledTimes(1);
      expect(renderCounter2).toHaveBeenCalledWith(20);
      expect(renderCounter2).toHaveBeenCalledTimes(1);
      expect(renderCounter3).toHaveBeenCalledWith(30);
      expect(renderCounter3).toHaveBeenCalledTimes(1);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });

  describe('메모리 누수 방지', () => {
    it('구독 해제 시 올바르게 정리된다', () => {
      const counter1Atom = createAtom(0);
      const counter2Atom = createAtom(0);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = subscribe(counter1Atom, callback1);
      const unsubscribe2 = subscribe(counter2Atom, callback2);

      expect(getSubscriberCount(counter1Atom)).toBe(1);
      expect(getSubscriberCount(counter2Atom)).toBe(1);

      // 첫 번째 구독 해제
      unsubscribe1();

      expect(getSubscriberCount(counter1Atom)).toBe(0);
      expect(getSubscriberCount(counter2Atom)).toBe(1);

      // 구독 해제 후 변경 시 호출되지 않아야 함
      set(counter1Atom, 10);
      expect(callback1).not.toHaveBeenCalled();

      // 두 번째 atom은 여전히 작동해야 함
      set(counter2Atom, 20);
      expect(callback2).toHaveBeenCalledWith(20);

      // 두 번째 구독 해제
      unsubscribe2();
      expect(getSubscriberCount(counter2Atom)).toBe(0);
    });
  });

  describe('실제 App.tsx 독립적인 counter atom들', () => {
    beforeEach(() => {
      // 각 테스트 전에 atom 값을 초기화
      set(counter1Atom, 0);
      set(counter2Atom, 0);
      set(counter3Atom, 0);
    });

    it('실제 counter atom들이 독립적으로 작동한다', () => {
      expect(get(counter1Atom)).toBe(0);
      expect(get(counter2Atom)).toBe(0);
      expect(get(counter3Atom)).toBe(0);

      // 각각 다른 값으로 설정
      set(counter1Atom, 10);
      set(counter2Atom, 20);
      set(counter3Atom, 30);

      expect(get(counter1Atom)).toBe(10);
      expect(get(counter2Atom)).toBe(20);
      expect(get(counter3Atom)).toBe(30);
    });

    it('실제 counter atom들이 독립적인 구독자를 가진다', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const unsubscribe1 = subscribe(counter1Atom, callback1);
      const unsubscribe2 = subscribe(counter2Atom, callback2);
      const unsubscribe3 = subscribe(counter3Atom, callback3);

      // counter1Atom 변경
      set(counter1Atom, 5);

      expect(callback1).toHaveBeenCalledWith(5);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      // counter2Atom 변경
      set(counter2Atom, 15);

      expect(callback1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback2).toHaveBeenCalledWith(15);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();

      // counter3Atom 변경
      set(counter3Atom, 25);

      expect(callback1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback2).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(callback3).toHaveBeenCalledWith(25);
      expect(callback3).toHaveBeenCalledTimes(1);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    it('실제 counter atom들이 서로 의존하지 않는다', () => {
      const deps1 = getDependencies(counter1Atom);
      const deps2 = getDependencies(counter2Atom);
      const deps3 = getDependencies(counter3Atom);

      // 각 atom은 의존성이 없어야 함
      expect(deps1.dependencies).toBe(0);
      expect(deps1.dependents).toBe(0);
      expect(deps2.dependencies).toBe(0);
      expect(deps2.dependents).toBe(0);
      expect(deps3.dependencies).toBe(0);
      expect(deps3.dependents).toBe(0);
    });

    it('IndependentCounter 컴포넌트 사용 시나리오 시뮬레이션', () => {
      // IndependentCounter1 컴포넌트 렌더링 시뮬레이션
      const renderIndependentCounter1 = jest.fn();
      const renderIndependentCounter2 = jest.fn();
      const renderIndependentCounter3 = jest.fn();

      const unsubscribe1 = subscribe(counter1Atom, renderIndependentCounter1);
      const unsubscribe2 = subscribe(counter2Atom, renderIndependentCounter2);
      const unsubscribe3 = subscribe(counter3Atom, renderIndependentCounter3);

      // 시나리오 1: IndependentCounter1의 +1 버튼 클릭
      set(counter1Atom, get(counter1Atom) + 1);
      
      expect(renderIndependentCounter1).toHaveBeenCalledWith(1);
      expect(renderIndependentCounter1).toHaveBeenCalledTimes(1);
      expect(renderIndependentCounter2).not.toHaveBeenCalled();
      expect(renderIndependentCounter3).not.toHaveBeenCalled();

      // 시나리오 2: IndependentCounter2의 +1 버튼 클릭
      set(counter2Atom, get(counter2Atom) + 1);
      
      expect(renderIndependentCounter1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderIndependentCounter2).toHaveBeenCalledWith(1);
      expect(renderIndependentCounter2).toHaveBeenCalledTimes(1);
      expect(renderIndependentCounter3).not.toHaveBeenCalled();

      // 시나리오 3: IndependentCounter3의 Reset 버튼 클릭
      set(counter3Atom, 5); // 먼저 값 설정
      set(counter3Atom, 0); // Reset 클릭
      
      expect(renderIndependentCounter1).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderIndependentCounter2).toHaveBeenCalledTimes(1); // 여전히 1번만
      expect(renderIndependentCounter3).toHaveBeenCalledWith(5);
      expect(renderIndependentCounter3).toHaveBeenCalledWith(0);
      expect(renderIndependentCounter3).toHaveBeenCalledTimes(2);

      // 구독 해제
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });
}); 