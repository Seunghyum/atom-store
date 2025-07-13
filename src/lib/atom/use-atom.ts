import { useSyncExternalStore } from 'react';
import { type Atom, set, subscribe } from './atom';

/**
 * React Hook: atom의 상태를 읽고 쓸 수 있는 훅
 * @param atom 상태를 관리할 atom
 * @returns [현재 상태값, setter 함수]
 */
export function useAtom<T>(atom: Atom<T>): [T, (value: T) => void] {
  // useSyncExternalStore로 외부 상태(atom)와 동기화
  const value = useSyncExternalStore(
    // subscribe 함수: 상태 변경 시 컴포넌트 리렌더링 트리거
    (callback) => {
      return subscribe(atom, () => {
        // 상태 변경 시 콜백 호출
        callback();
      });
    },
    
    // getSnapshot 함수: 현재 상태값 반환
    () => {
      // 비동기 atom의 경우 상태에 따라 처리
      if (atom._isAsync) {
        if (atom._status === 'pending') {
          throw atom._promise; // Suspense 트리거
        }
        if (atom._status === 'rejected') {
          throw atom._error; // Error Boundary 트리거
        }
        // fulfilled 상태에서는 값 반환
        return atom._value;
      }
      
      // 일반 atom의 경우 직접 값 반환
      return atom._value;
    },
    
    // getServerSnapshot 함수: SSR용
    () => {
      // SSR에서는 초기 값 반환
      return atom._value;
    }
  );

  // setter 함수 생성
  const setValue = (newValue: T) => {
    if (atom._isDerived) {
      throw new Error('Cannot set value on derived atom');
    }
    // useAtom의 setValue는 자동 배치 처리 활성화
    set(atom, newValue, true);
  };

  return [value, setValue];
}

/**
 * atom의 값만 읽는 훅 (setter 없음)
 * @param atom 상태를 읽을 atom
 * @returns 현재 상태값
 */
export function useAtomValue<T>(atom: Atom<T>): T {
  const [value] = useAtom(atom);
  return value;
}

/**
 * atom의 setter만 사용하는 훅 (value 없음)
 * @param atom 상태를 설정할 atom
 * @returns setter 함수
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  // useAtom 대신 직접 setter 함수만 생성하여 중복 구독 방지
  const setValue = (newValue: T) => {
    if (atom._isDerived) {
      throw new Error('Cannot set value on derived atom');
    }
    // useAtom의 setValue는 자동 배치 처리 활성화
    set(atom, newValue, true);
  };

  return setValue;
} 