import { createAtom } from '../lib/atom';
import { createProxyAtom, createSimpleProxyAtom } from '../lib/proxy-atom';

// 기존 atom 방식
export const normalCountAtom = createAtom(0);
export const normalUserAtom = createAtom({ name: 'John', age: 30, city: 'Seoul' });

// Proxy atom 방식
export const proxyCountAtom = createSimpleProxyAtom(0);
export const proxyUserAtom = createProxyAtom({ name: 'John', age: 30, city: 'Seoul' });

// 복잡한 중첩 객체
export const normalNestedAtom = createAtom({
  user: {
    profile: { name: 'John', avatar: 'avatar1.jpg' },
    settings: { theme: 'dark', notifications: true }
  },
  app: {
    version: '1.0.0',
    features: ['feature1', 'feature2']
  }
});

export const proxyNestedAtom = createProxyAtom({
  user: {
    profile: { name: 'John', avatar: 'avatar1.jpg' },
    settings: { theme: 'dark', notifications: true }
  },
  app: {
    version: '1.0.0',
    features: ['feature1', 'feature2']
  }
}); 