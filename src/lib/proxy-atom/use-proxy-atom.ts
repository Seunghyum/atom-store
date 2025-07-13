import { useState, useEffect } from 'react';
import { subscribeProxy, getProxyAtomVersion } from './proxy-atom';

/**
 * Proxy 기반 atom을 위한 React 훅
 */
export function useProxyAtom<T>(proxyAtom: T): T {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = subscribeProxy(proxyAtom, () => {
      // 강제 리렌더링을 위해 새로운 객체 생성
      forceUpdate({});
    });

    return unsubscribe;
  }, [proxyAtom]);

  // 실제 프록시 객체 반환
  return proxyAtom;
}

/**
 * Proxy atom의 특정 속성만 구독하는 훅
 */
export function useProxyAtomSelector<T, K extends keyof T>(
  proxyAtom: T, 
  selector: (value: T) => T[K]
): T[K] {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = subscribeProxy(proxyAtom, () => {
      // 강제 리렌더링을 위해 새로운 객체 생성
      forceUpdate({});
    });

    return unsubscribe;
  }, [proxyAtom]);

  return selector(proxyAtom);
} 