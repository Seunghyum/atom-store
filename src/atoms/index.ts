import { 
  createAtom, 
  createDerivedAtom, 
  createAsyncAtom 
} from '../lib/atom';

// 기본 atoms 생성
export const countAtom = createAtom(0);
export const nameAtom = createAtom('World');

// 파생 atoms 생성
export const doubleCountAtom = createDerivedAtom((get) => get(countAtom) * 2);
export const greetingAtom = createDerivedAtom((get) => `Hello, ${get(nameAtom)}!`);
export const complexAtom = createDerivedAtom((get) => {
  const count = get(countAtom);
  const name = get(nameAtom);
  return `${name} has ${count} items (double: ${get(doubleCountAtom)})`;
});

// 비동기 atom 생성 함수들
export const createAsyncDataAtom = () => createAsyncAtom(
  new Promise<string>((resolve) => {
    setTimeout(() => resolve(`Async data loaded at ${new Date().toLocaleTimeString()}!`), 2000);
  })
);

export const createUserDataAtom = () => createAsyncAtom(async () => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${Math.floor(Math.random() * 10) + 1}`);
  const user = await response.json();
  return `${user.name} (loaded at ${new Date().toLocaleTimeString()})`;
});

// 전역 비동기 atom 인스턴스들 (초기 생성)
export let globalAsyncDataAtom = createAsyncDataAtom();
export let globalUserDataAtom = createUserDataAtom();

// 전역 참조를 업데이트하는 함수들
export const updateGlobalAsyncDataAtom = () => {
  globalAsyncDataAtom = createAsyncDataAtom();
  return globalAsyncDataAtom;
};

export const updateGlobalUserDataAtom = () => {
  globalUserDataAtom = createUserDataAtom();
  return globalUserDataAtom;
}; 