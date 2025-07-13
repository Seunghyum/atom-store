// Proxy 기반 Atom 구현
export interface ProxyAtom<T> {
  _id: number;
  _target: T;
  _subscribers: Set<(value: T) => void>;
  _dependents: Set<ProxyAtom<any>>;
  _dependencies: Set<ProxyAtom<any>>;
  _isDerived: boolean;
  _computeFn?: () => T;
  _proxy?: T;
  _version: number; // 변경 감지를 위한 버전 카운터
}

// 전역 상태
let atomIdCounter = 0;
let currentTracking: ProxyAtom<any> | null = null;
let isBatching = false;
let batchedAtoms = new Set<ProxyAtom<any>>();

/**
 * Proxy를 사용한 기본 atom 생성
 */
export function createProxyAtom<T extends object>(initialValue: T): T {
  const atom: ProxyAtom<T> = {
    _id: atomIdCounter++,
    _target: initialValue,
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: false,
    _version: 0
  };

  // Proxy 생성
  const proxy = new Proxy(initialValue, {
    get(target, key, receiver) {
      // 의존성 추적
      if (currentTracking && currentTracking !== atom) {
        atom._dependents.add(currentTracking);
        currentTracking._dependencies.add(atom);
      }
      
      const value = Reflect.get(target, key, receiver);
      
      // 중첩 객체도 proxy로 감싸기
      if (typeof value === 'object' && value !== null) {
        return createNestedProxy(value, atom);
      }
      
      return value;
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      
      if (atom._isDerived) {
        throw new Error('Cannot set value on derived atom');
      }
      
      if (oldValue !== value) {
        Reflect.set(target, key, value, receiver);
        atom._version++; // 버전 증가
        
        if (isBatching) {
          batchedAtoms.add(atom);
        } else {
          notifySubscribers(atom);
        }
      }
      
      return true;
    }
  });

  atom._proxy = proxy;
  registerProxyAtom(proxy, atom);
  return proxy;
}

/**
 * 중첩 객체를 위한 프록시 생성
 */
function createNestedProxy(target: any, parentAtom: ProxyAtom<any>): any {
  return new Proxy(target, {
    get(target, key, receiver) {
      if (currentTracking && currentTracking !== parentAtom) {
        parentAtom._dependents.add(currentTracking);
        currentTracking._dependencies.add(parentAtom);
      }
      
      const value = Reflect.get(target, key, receiver);
      
      if (typeof value === 'object' && value !== null) {
        return createNestedProxy(value, parentAtom);
      }
      
      return value;
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      
      if (oldValue !== value) {
        Reflect.set(target, key, value, receiver);
        parentAtom._version++; // 버전 증가
        
        if (isBatching) {
          batchedAtoms.add(parentAtom);
        } else {
          notifySubscribers(parentAtom);
        }
      }
      
      return true;
    }
  });
}

/**
 * 파생 atom 생성 (computed)
 */
export function createProxyDerived<T extends object>(computeFn: () => T): T {
  const atom: ProxyAtom<T> = {
    _id: atomIdCounter++,
    _target: {} as T,
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: true,
    _computeFn: computeFn,
    _version: 0
  };

  // 초기값 계산하면서 의존성 추적
  currentTracking = atom;
  const initialValue = computeFn();
  currentTracking = null;

  atom._target = initialValue;

  // 의존성들에 업데이트 콜백 등록
  atom._dependencies.forEach(dep => {
    subscribeProxy(dep._proxy!, () => {
      const newValue = computeFn();
      if (JSON.stringify(atom._target) !== JSON.stringify(newValue)) {
        atom._target = newValue;
        Object.assign(atom._proxy!, newValue);
        atom._version++; // 버전 증가
        notifySubscribers(atom);
      }
    });
  });

  const proxy = new Proxy(initialValue, {
    get(target, key, receiver) {
      if (currentTracking && currentTracking !== atom) {
        atom._dependents.add(currentTracking);
        currentTracking._dependencies.add(atom);
      }
      
      return Reflect.get(target, key, receiver);
    },

    set() {
      throw new Error('Cannot set value on derived atom');
    }
  });

  atom._proxy = proxy;
  registerProxyAtom(proxy, atom);
  return proxy;
}

/**
 * Proxy atom 구독
 */
export function subscribeProxy<T>(
  proxyAtom: T, 
  callback: (value: T) => void
): () => void {
  // proxyAtom에서 실제 atom 찾기
  const atom = findAtomByProxy(proxyAtom);
  if (!atom) {
    throw new Error('Invalid proxy atom');
  }

  atom._subscribers.add(callback);
  
  return () => {
    atom._subscribers.delete(callback);
    if (atom._subscribers.size === 0) {
      cleanupProxyAtom(atom);
    }
  };
}

/**
 * 배치 업데이트
 */
export function batchProxy(fn: () => void): void {
  if (isBatching) {
    fn();
    return;
  }

  isBatching = true;
  batchedAtoms.clear();
  
  try {
    fn();
  } finally {
    isBatching = false;
    batchedAtoms.forEach(atom => notifySubscribers(atom));
    batchedAtoms.clear();
  }
}

/**
 * 구독자들에게 알림
 */
function notifySubscribers<T>(atom: ProxyAtom<T>): void {
  atom._subscribers.forEach(callback => {
    callback(atom._proxy!);
  });
  
  // 파생 atom들 업데이트
  atom._dependents.forEach(dependentAtom => {
    if (dependentAtom._isDerived && dependentAtom._computeFn) {
      currentTracking = dependentAtom;
      const newValue = dependentAtom._computeFn();
      currentTracking = null;
      
      if (JSON.stringify(dependentAtom._target) !== JSON.stringify(newValue)) {
        dependentAtom._target = newValue;
        Object.assign(dependentAtom._proxy!, newValue);
        dependentAtom._version++; // 버전 증가
        notifySubscribers(dependentAtom);
      }
    }
  });
}

/**
 * 메모리 정리
 */
function cleanupProxyAtom<T>(atom: ProxyAtom<T>): void {
  atom._dependencies.forEach(dep => {
    dep._dependents.delete(atom);
  });
  
  atom._dependents.forEach(dep => {
    dep._dependencies.delete(atom);
  });
  
  atom._dependencies.clear();
  atom._dependents.clear();
}

/**
 * Proxy에서 atom 찾기 (실제 구현에서는 WeakMap 사용 권장)
 */
const proxyToAtomMap = new WeakMap<any, ProxyAtom<any>>();

function findAtomByProxy(proxy: any): ProxyAtom<any> | null {
  return proxyToAtomMap.get(proxy) || null;
}

// WeakMap에 등록하는 헬퍼
function registerProxyAtom<T>(proxy: T, atom: ProxyAtom<T>): void {
  proxyToAtomMap.set(proxy, atom);
}

/**
 * 간단한 atom 생성 (원시값용)
 */
export function createSimpleProxyAtom<T>(initialValue: T): { value: T } {
  const atom: ProxyAtom<{ value: T }> = {
    _id: atomIdCounter++,
    _target: { value: initialValue },
    _subscribers: new Set(),
    _dependents: new Set(),
    _dependencies: new Set(),
    _isDerived: false,
    _version: 0
  };

  // 간단한 Proxy 생성
  const proxy = new Proxy({ value: initialValue }, {
    get(target, key, receiver) {
      // 의존성 추적
      if (currentTracking && currentTracking !== atom) {
        atom._dependents.add(currentTracking);
        currentTracking._dependencies.add(atom);
      }
      
      return Reflect.get(target, key, receiver);
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      
      if (oldValue !== value) {
        Reflect.set(target, key, value, receiver);
        // atom._target도 업데이트
        Reflect.set(atom._target, key, value, receiver);
        atom._version++; // 버전 증가
        
        if (isBatching) {
          batchedAtoms.add(atom);
        } else {
          notifySubscribers(atom);
        }
      }
      
      return true;
    }
  });

  atom._proxy = proxy;
  registerProxyAtom(proxy, atom);
  return proxy;
}

/**
 * 디버깅용 유틸리티
 */
export function getProxyAtomInfo(proxy: any): any {
  const atom = findAtomByProxy(proxy);
  if (!atom) return null;
  
  return {
    id: atom._id,
    subscribers: atom._subscribers.size,
    dependencies: atom._dependencies.size,
    dependents: atom._dependents.size,
    isDerived: atom._isDerived,
    version: atom._version
  };
}

/**
 * Proxy atom의 버전을 가져오는 함수
 */
export function getProxyAtomVersion(proxy: any): number {
  const atom = findAtomByProxy(proxy);
  return atom?._version || 0;
} 