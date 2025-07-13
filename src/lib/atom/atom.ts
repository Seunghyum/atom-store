// Atom 타입 정의
export interface Atom<T> {
  _value: T;
  _subscribers: Set<(value: T) => void>;
  _dependents?: Set<Atom<any>>; // 이 atom에 의존하는 파생 atom들
  _dependencies?: Set<Atom<any>>; // 이 atom이 의존하는 atom들
  _isDerived?: boolean;
  _isAsync?: boolean;
  _computeFn?: (get: GetFn) => T;
  _promise?: Promise<T>;
  _status?: 'pending' | 'fulfilled' | 'rejected';
  _error?: Error;
  _hasError?: boolean; // 파생 atom에서 에러 발생 여부
}

// 비동기 상태를 위한 특별한 심볼
export const SUSPENSE_SYMBOL = Symbol('SUSPENSE');
export const ERROR_SYMBOL = Symbol('ERROR');

export type GetFn = <T>(atom: Atom<T>) => T;

// 배치 처리 관련 전역 변수
let isBatching = false;
let batchedAtoms = new Set<Atom<any>>();
let batchedChanges = new Map<Atom<any>, any>();
let isAutoFlushScheduled = false;

/**
 * 초기값을 기반으로 새로운 atom 생성
 * @param initialValue 초기값
 * @returns 새로운 atom 객체
 */
export function createAtom<T>(initialValue: T): Atom<T> {
  return {
    _value: initialValue,
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: false,
    _isAsync: false,
    _hasError: false
  };
}

/**
 * 파생 atom 생성 - 다른 atom들의 값을 계산하여 새로운 상태 생성 (동적 의존성 추적 포함)
 * @param computeFn 계산 함수
 * @returns 새로운 파생 atom
 */
export function createDerivedAtom<T>(
  computeFn: (get: GetFn) => T
): Atom<T> {
  let currentDependencies = new Set<Atom<any>>();
  let subscriptions = new Map<Atom<any>, () => void>();
  
  const derivedAtom: Atom<T> = {
    _value: undefined as any, // 초기값은 아래에서 계산
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: true,
    _isAsync: false,
    _computeFn: computeFn,
    _hasError: false
  };

  // 동적 의존성 추적 및 값 계산
  const recompute = () => {
    const newDependencies = new Set<Atom<any>>();
    
    // 의존성 추적을 위한 get 함수
    const trackingGet: GetFn = <U>(atom: Atom<U>): U => {
      newDependencies.add(atom);
      return get(atom);
    };

    let newValue: T;
    let hasError = false;
    try {
      newValue = computeFn(trackingGet);
      // 에러가 해결되었으면 에러 상태 해제
      derivedAtom._hasError = false;
      derivedAtom._error = undefined;
    } catch (error) {
      // 계산 중 에러가 발생하면 에러 상태로 설정
      console.error('Derived atom computation error during recompute:', error);
      derivedAtom._hasError = true;
      derivedAtom._error = error instanceof Error ? error : new Error(String(error));
      hasError = true;
      // 에러가 발생해도 의존성 관계는 설정해야 함
      newValue = undefined as any;
    }

    // 의존성이 변경되었으면 구독 정리 및 재설정
    if (!setsEqual(currentDependencies, newDependencies)) {
      // 기존 구독 정리
      subscriptions.forEach(unsubscribe => unsubscribe());
      subscriptions.clear();
      
      // 기존 의존성 관계 정리
      currentDependencies.forEach(depAtom => {
        depAtom._dependents?.delete(derivedAtom);
      });

      // 새로운 의존성 관계 설정
      newDependencies.forEach(depAtom => {
        depAtom._dependents!.add(derivedAtom);
        
        // 새로운 구독 설정
        const unsubscribe = subscribe(depAtom, () => {
          recompute();
        });
        subscriptions.set(depAtom, unsubscribe);
      });

      currentDependencies = newDependencies;
      derivedAtom._dependencies = newDependencies;
    }

    // 값이 변경되었으면 업데이트 (에러가 없을 때만)
    if (!hasError && derivedAtom._value !== newValue) {
      derivedAtom._value = newValue;
      notifySubscribers(derivedAtom);
    }
  };

  // 초기 계산 (에러가 발생해도 atom은 생성되어야 함)
  try {
    recompute();
  } catch (error) {
    // Promise가 throw된 경우는 정상적인 비동기 동작
    if (error instanceof Promise) {
      // 비동기 의존성이 있는 경우 Promise를 던지지 않고 atom을 생성
      derivedAtom._hasError = false;
    } else {
      // 실제 에러가 발생한 경우
      console.error('Initial derived atom computation error:', error);
      derivedAtom._hasError = true;
      derivedAtom._error = error instanceof Error ? error : new Error(String(error));
    }
  }

  return derivedAtom;
}

// Set 비교 유틸리티 함수
function setsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

/**
 * 비동기 atom 생성 - Promise 기반 비동기 로직 처리 (체인 의존성 지원)
 * @param promiseOrFn Promise 또는 Promise를 반환하는 함수
 * @returns 새로운 비동기 atom
 */
export function createAsyncAtom<T>(
  promiseOrFn: Promise<T> | ((get: GetFn) => Promise<T>)
): Atom<T> {
  const asyncAtom: Atom<T> = {
    _value: SUSPENSE_SYMBOL as any, // 초기에는 Suspense 상태
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: false,
    _isAsync: true,
    _status: 'pending',
    _hasError: false
  };

    const executeAsync = async () => {
    try {
      let promise: Promise<T> | undefined;
      
      if (typeof promiseOrFn === 'function') {
        // 비동기 atom 체인을 위한 특별한 get 함수
        const asyncGet: GetFn = <U>(atom: Atom<U>): U => {
          if (atom._isAsync && atom._status === 'pending') {
            // 의존하는 비동기 atom이 아직 완료되지 않았으면 기다림
            throw atom._promise;
          }
          return get(atom);
        };
        
        // 의존성 해결을 위해 반복적으로 시도
        let resolved = false;
        let attempts = 0;
        const maxAttempts = 10; // 무한 루프 방지
        
        while (!resolved && attempts < maxAttempts) {
          try {
            promise = promiseOrFn(asyncGet);
            resolved = true;
          } catch (error) {
            if (error instanceof Promise) {
              // 의존하는 Promise를 기다림
              await error;
              attempts++;
              // 다시 시도
              continue;
            } else {
              // 실제 에러가 발생한 경우
              throw error;
            }
          }
        }
        
        if (!resolved) {
          throw new Error('Failed to resolve async atom dependencies after maximum attempts');
        }
      } else {
        promise = promiseOrFn;
      }
      
      if (!promise) {
        throw new Error('Promise not resolved');
      }
      
      asyncAtom._promise = promise;
      const value = await promise;
      
      asyncAtom._value = value;
      asyncAtom._status = 'fulfilled';
      // 모든 구독자에게 알림
      notifySubscribers(asyncAtom);
    } catch (error) {
      // Promise가 에러로 전달된 경우는 의존성 해결 실패가 아닌 대기 상태
      if (error instanceof Promise) {
        // 의존성 promise가 해결되면 다시 시도
        try {
          await error;
          // 의존성이 해결되었으므로 다시 executeAsync 호출
          executeAsync();
          return;
        } catch (depError) {
          // 의존성 자체에서 에러가 발생한 경우
          asyncAtom._value = ERROR_SYMBOL as any;
          asyncAtom._status = 'rejected';
          asyncAtom._error = depError instanceof Error ? depError : new Error(String(depError));
          notifySubscribers(asyncAtom);
          return;
        }
      }
      
      // 실제 에러 처리
      asyncAtom._value = ERROR_SYMBOL as any;
      asyncAtom._status = 'rejected';
      
      if (error instanceof Error) {
        asyncAtom._error = error;
      } else {
        asyncAtom._error = new Error(String(error));
      }
      
      notifySubscribers(asyncAtom);
    }
  };

  // 비동기 실행 시작 (Promise가 던져져도 atom은 생성되어야 함)
  executeAsync().catch((error) => {
    // executeAsync에서 Promise가 던져진 경우는 무시
    if (!(error instanceof Promise)) {
      console.error('Async atom execution error:', error);
    }
  });

  return asyncAtom;
}

/**
 * atom의 현재 상태 값 반환
 * @param atom 상태를 읽을 atom
 * @returns 현재 상태값
 */
export function get<T>(atom: Atom<T>): T {
  if (atom._isAsync) {
    if (atom._status === 'pending') {
      throw atom._promise; // Suspense를 위한 Promise throw
    }
    if (atom._status === 'rejected') {
      throw atom._error; // Error Boundary를 위한 에러 throw
    }
  }
  
  // 파생 atom에서 에러가 발생한 경우
  if (atom._hasError && atom._error) {
    throw atom._error;
  }
  
  return atom._value;
}

/**
 * 자동 배치 처리를 위한 플러시 함수
 */
function flushAutoBatch(): void {
  if (batchedAtoms.size === 0) return;
  
  // 배치된 atom들 복사
  const atomsToNotify = Array.from(batchedAtoms);
  batchedAtoms.clear();
  batchedChanges.clear();
  
  // 1. 모든 파생 atom들을 먼저 업데이트 (중복 제거)
  const updatedDerivedAtoms = new Set<Atom<any>>();
  
  atomsToNotify.forEach(atom => {
    atom._dependents?.forEach(dependentAtom => {
      if (dependentAtom._isDerived && dependentAtom._computeFn && !updatedDerivedAtoms.has(dependentAtom)) {
        try {
          const newValue = dependentAtom._computeFn(get);
          if (dependentAtom._value !== newValue) {
            dependentAtom._value = newValue;
            dependentAtom._hasError = false;
            dependentAtom._error = undefined;
            updatedDerivedAtoms.add(dependentAtom);
          }
        } catch (error) {
          console.error('Derived atom computation error:', error);
          dependentAtom._hasError = true;
          dependentAtom._error = error instanceof Error ? error : new Error(String(error));
        }
      }
    });
  });
  
  // 2. 모든 구독자를 하나의 동기적인 블록에서 실행
  const allCallbacks = new Set<() => void>();
  
  // 원본 atom들의 구독자들 수집
  atomsToNotify.forEach(atom => {
    atom._subscribers.forEach(callback => {
      allCallbacks.add(() => callback(atom._value));
    });
  });
  
  // 파생 atom들의 구독자들 수집 (중복 제거)
  updatedDerivedAtoms.forEach(dependentAtom => {
    dependentAtom._subscribers.forEach(callback => {
      allCallbacks.add(() => callback(dependentAtom._value));
    });
  });
  
  // 모든 구독자를 한 번에 실행
  allCallbacks.forEach(callbackWrapper => {
    try {
      callbackWrapper();
    } catch (error) {
      console.error('Subscriber error:', error);
    }
  });
}

/**
 * 자동 배치 처리 스케줄링
 */
function scheduleAutoFlush(): void {
  if (isAutoFlushScheduled) return;
  
  isAutoFlushScheduled = true;
  
  // 다음 tick에서 플러시 (React의 setState처럼)
  const scheduleFlush = () => {
    isAutoFlushScheduled = false;
    flushAutoBatch();
  };
  
  // setTimeout 대신 Promise.resolve를 사용하여 더 빠른 실행
  Promise.resolve().then(scheduleFlush);
}

/**
 * atom의 값을 newValue로 갱신
 * 값이 변한 경우에만 구독자에게 알림
 * @param atom 상태를 설정할 atom
 * @param newValue 새로운 값
 * @param enableAutoBatch 자동 배치 처리 활성화 여부
 */
export function set<T>(atom: Atom<T>, newValue: T, enableAutoBatch: boolean = false): void {
  if (atom._isDerived) {
    throw new Error('Cannot set value on derived atom');
  }

  // 현재 값과 새 값이 다른 경우에만 업데이트
  if (atom._value !== newValue) {
    if (isBatching) {
      // 수동 배치 중이면 변경된 atom과 새 값을 저장하고 실제 변경은 지연
      if (!batchedChanges.has(atom)) {
        batchedChanges.set(atom, atom._value); // 원본 값 저장
      }
      atom._value = newValue;
      batchedAtoms.add(atom);
    } else if (enableAutoBatch) {
      // 자동 배치 처리: 값 변경 후 다음 tick에서 플러시
      if (!batchedChanges.has(atom)) {
        batchedChanges.set(atom, atom._value); // 원본 값 저장
      }
      atom._value = newValue;
      batchedAtoms.add(atom);
      
      // 자동 배치 처리 스케줄링
      scheduleAutoFlush();
    } else {
      // 즉시 업데이트
      atom._value = newValue;
      notifySubscribers(atom);
    }
  }
}

/**
 * 구독자들에게 알림 전송 (에러 격리 포함)
 * @param atom 알림을 보낼 atom
 * @param isFromAutoFlush 자동 플러시에서 호출되었는지 여부 (무한루프 방지)
 */
function notifySubscribers<T>(atom: Atom<T>): void {
  let lastError: any = null;
  
  // 구독자에게 알림 (에러 격리)
  atom._subscribers.forEach(callback => {
    try {
      callback(atom._value);
    } catch (error) {
      // 구독자에서 에러가 발생해도 다른 구독자들은 계속 실행
      console.error('Subscriber error:', error);
      lastError = error; // 마지막 에러만 기록
    }
  });
  
  // 의존하는 파생 atom들 업데이트 (에러 격리)
  // 파생 atom들은 동기적으로 즉시 업데이트되어야 함
  atom._dependents?.forEach(dependentAtom => {
    if (dependentAtom._isDerived && dependentAtom._computeFn) {
      try {
        const newValue = dependentAtom._computeFn(get);
        if (dependentAtom._value !== newValue) {
          dependentAtom._value = newValue;
          // 에러 상태 초기화 (값이 성공적으로 계산됨)
          dependentAtom._hasError = false;
          dependentAtom._error = undefined;
          // 파생 atom들은 동기적으로 즉시 업데이트 (자동 배치 처리에 포함되지 않음)
          notifySubscribers(dependentAtom);
        }
      } catch (error) {
        // 파생 atom에서 에러가 발생해도 다른 파생 atom들은 계속 업데이트
        console.error('Derived atom computation error:', error);
        // 에러 상태로 설정하지만 다른 atom에는 영향을 주지 않음
        dependentAtom._hasError = true;
        dependentAtom._error = error instanceof Error ? error : new Error(String(error));
      }
    }
  });
  
  // 마지막에 에러가 있었다면 던지기 (테스트에서 에러 검증을 위해)
  if (lastError) {
    throw lastError;
  }
}

/**
 * 배치 업데이트 실행 - 여러 set 호출을 일괄 처리 (수동 배치)
 * @param fn 배치 내에서 실행할 함수
 */
export function batch(fn: () => void): void {
  if (isBatching) {
    // 이미 배치 중이면 그냥 실행
    fn();
    return;
  }

  // 수동 배치 시작 - 자동 배치 처리 비활성화
  const wasAutoFlushScheduled = isAutoFlushScheduled;
  if (wasAutoFlushScheduled) {
    isAutoFlushScheduled = false;
  }
  
  isBatching = true;
  const previousBatchedAtoms = new Set(batchedAtoms);
  const previousBatchedChanges = new Map(batchedChanges);
  
  try {
    fn();
    
    // 배치 처리 완료 후 모든 구독자를 한 번에 호출
    if (batchedAtoms.size > 0) {
      // 1. 모든 파생 atom들을 먼저 업데이트 (중복 제거)
      const updatedDerivedAtoms = new Set<Atom<any>>();
      
      batchedAtoms.forEach(atom => {
        atom._dependents?.forEach(dependentAtom => {
          if (dependentAtom._isDerived && dependentAtom._computeFn && !updatedDerivedAtoms.has(dependentAtom)) {
            try {
              const newValue = dependentAtom._computeFn(get);
              if (dependentAtom._value !== newValue) {
                dependentAtom._value = newValue;
                dependentAtom._hasError = false;
                dependentAtom._error = undefined;
                updatedDerivedAtoms.add(dependentAtom);
              }
            } catch (error) {
              console.error('Derived atom computation error:', error);
              dependentAtom._hasError = true;
              dependentAtom._error = error instanceof Error ? error : new Error(String(error));
            }
          }
        });
      });
      
      // 2. 모든 구독자를 하나의 동기적인 블록에서 실행
      // 이를 통해 하나의 업데이트 사이클로 간주
      const allCallbacks = new Set<() => void>();
      
      // 원본 atom들의 구독자들 수집
      batchedAtoms.forEach(atom => {
        atom._subscribers.forEach(callback => {
          allCallbacks.add(() => callback(atom._value));
        });
      });
      
      // 파생 atom들의 구독자들 수집 (중복 제거)
      updatedDerivedAtoms.forEach(dependentAtom => {
        dependentAtom._subscribers.forEach(callback => {
          allCallbacks.add(() => callback(dependentAtom._value));
        });
      });
      
      // 모든 구독자를 한 번에 실행
      allCallbacks.forEach(callbackWrapper => {
        try {
          callbackWrapper();
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      });
    }
  } catch (error) {
    // 에러가 발생하면 배치된 변경사항들을 롤백
    batchedChanges.forEach((originalValue, atom) => {
      atom._value = originalValue;
    });
    throw error;
  } finally {
    isBatching = false;
    batchedAtoms.clear();
    batchedChanges.clear();
    
    // 이전 상태 복구
    if (wasAutoFlushScheduled) {
      // 이전에 스케줄된 자동 배치가 있었다면 복구
      previousBatchedAtoms.forEach(atom => batchedAtoms.add(atom));
      previousBatchedChanges.forEach((value, atom) => batchedChanges.set(atom, value));
      scheduleAutoFlush();
    }
  }
}



/**
 * atom의 값 변경을 구독
 * @param atom 구독할 atom
 * @param callback 값이 변경될 때 실행할 콜백
 * @returns unsubscribe 함수
 */
export function subscribe<T>(
  atom: Atom<T>, 
  callback: (value: T) => void
): () => void {
  // 구독자 등록
  atom._subscribers.add(callback);
  
  // unsubscribe 함수 반환
  return () => {
    atom._subscribers.delete(callback);
    
    // 메모리 관리: 구독자가 없으면 의존성 정리
    if (atom._subscribers.size === 0) {
      cleanupAtom(atom);
    }
  };
}

/**
 * atom의 메모리 정리
 * @param atom 정리할 atom
 */
function cleanupAtom<T>(atom: Atom<T>): void {
  // 의존성 관계 정리
  atom._dependencies?.forEach(depAtom => {
    depAtom._dependents?.delete(atom);
  });
  
  // 의존하는 atom들 정리
  atom._dependents?.forEach(dependentAtom => {
    dependentAtom._dependencies?.delete(atom);
  });
  
  // 참조 정리
  atom._dependencies?.clear();
  atom._dependents?.clear();
}

/**
 * atom의 현재 구독자 수 반환 (디버깅용)
 * @param atom 확인할 atom
 * @returns 구독자 수
 */
export function getSubscriberCount<T>(atom: Atom<T>): number {
  return atom._subscribers.size;
}

/**
 * atom의 의존성 정보 반환 (디버깅용)
 * @param atom 확인할 atom
 * @returns 의존성 정보
 */
export function getDependencies<T>(atom: Atom<T>): {
  dependencies: number;
  dependents: number;
} {
  return {
    dependencies: atom._dependencies?.size || 0,
    dependents: atom._dependents?.size || 0
  };
} 