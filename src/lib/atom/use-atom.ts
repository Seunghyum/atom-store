import { useSyncExternalStore } from 'react';
import { type Atom, set, subscribe } from './atom';

/**
 * React Hook: atom의 상태를 읽고 쓸 수 있는 훅
 */
export function useAtom<T>(atom: Atom<T>): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    // 구독 함수
    (callback) => {
      return subscribe(atom, () => {
        callback();
      });
    },
    
    // 현재 상태값 반환
    () => {
      if (atom._isAsync) {
        if (atom._status === 'pending') {
          throw atom._promise; // Suspense 트리거
        }
        if (atom._status === 'rejected') {
          throw atom._error; // Error Boundary 트리거
        }
        return atom._value;
      }
      
      return atom._value;
    },
    
    // SSR용 스냅샷
    () => {
      return atom._value;
    }
  );

  const setValue = (newValue: T) => {
    if (atom._isDerived) {
      throw new Error('Cannot set value on derived atom');
    }
    set(atom, newValue, true);
  };

  return [value, setValue];
}

/**
 * atom의 값만 읽는 훅
 */
export function useAtomValue<T>(atom: Atom<T>): T {
  const [value] = useAtom(atom);
  return value;
}

/**
 * atom의 setter만 사용하는 훅
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  const setValue = (newValue: T) => {
    if (atom._isDerived) {
      throw new Error('Cannot set value on derived atom');
    }
    set(atom, newValue, true);
  };

  return setValue;
} 