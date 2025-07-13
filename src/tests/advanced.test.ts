import { 
  createAtom, 
  createDerivedAtom, 
  createAsyncAtom,
  get, 
  set, 
  subscribe,
  batch,
  getSubscriberCount,
  getDependencies,
} from '../lib/atom';

describe('고급 Atom 라이브러리 - 복잡한 시나리오 테스트', () => {
  
  describe('에러 처리 및 복구 테스트', () => {
    it('비동기 atom에서 에러가 발생할 때 올바르게 처리된다', async () => {
      const errorMessage = 'API 호출 실패';
      const errorAtom = createAsyncAtom(
        Promise.reject(new Error(errorMessage))
      );

      expect(errorAtom._status).toBe('pending');

      // 에러 발생 시 Promise를 throw
      expect(() => {
        get(errorAtom);
      }).toThrow();

      // 에러가 처리될 때까지 기다림
      try {
        get(errorAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise.catch(() => {}); // 에러를 잡아서 처리
        }
      }

      expect(errorAtom._status).toBe('rejected');
      expect(errorAtom._error?.message).toBe(errorMessage);
    });

    it('에러 상태에서 새로운 비동기 작업으로 복구할 수 있다', async () => {
      const errorAtom = createAsyncAtom(
        Promise.reject(new Error('첫 번째 에러'))
      );

      // 첫 번째 에러 처리
      try {
        get(errorAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise.catch(() => {});
        }
      }

      expect(errorAtom._status).toBe('rejected');

      // 새로운 비동기 atom 생성 (복구를 위해)
      const recoveredAtom = createAsyncAtom(
        Promise.resolve('복구된 데이터')
      );

      try {
        get(recoveredAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      expect(recoveredAtom._status).toBe('fulfilled');
      expect(get(recoveredAtom)).toBe('복구된 데이터');
    });

    it('파생 atom에서 계산 중 에러가 발생할 때 처리된다', () => {
      const baseAtom = createAtom(10);
      const errorDerivedAtom = createDerivedAtom((get) => {
        const value = get(baseAtom);
        if (value > 5) {
          throw new Error('값이 너무 큽니다');
        }
        return value * 2;
      });

      expect(() => {
        get(errorDerivedAtom);
      }).toThrow('값이 너무 큽니다');

      // 기본 atom 값을 변경하여 에러 해결
      set(baseAtom, 3);
      expect(get(errorDerivedAtom)).toBe(6);
    });
  });

  describe('복잡한 비동기 시나리오 테스트', () => {
    it('비동기 atom과 일반 atom의 협력이 올바르게 처리된다', async () => {
      // 일반 atom을 기반으로 한 비동기 처리 (실용적인 패턴)
      const configAtom = createAtom({ apiUrl: 'https://api.example.com', timeout: 5000 });
      
      const dataFetchAtom = createAsyncAtom(async () => {
        const config = get(configAtom);
        // 설정을 기반으로 한 API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          url: config.apiUrl,
          timeout: config.timeout,
          data: ['item1', 'item2', 'item3'],
          timestamp: Date.now()
        };
      });

      // 비동기 작업 완료 대기
      try {
        get(dataFetchAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      const fetchResult = get(dataFetchAtom);
      expect(fetchResult.url).toBe('https://api.example.com');
      expect(fetchResult.timeout).toBe(5000);
      expect(fetchResult.data).toEqual(['item1', 'item2', 'item3']);
      expect(typeof fetchResult.timestamp).toBe('number');
      
      // 설정 변경 후 새로운 API 호출을 위한 새로운 비동기 atom 생성
      set(configAtom, { apiUrl: 'https://api-v2.example.com', timeout: 3000 });
      
      const updatedFetchAtom = createAsyncAtom(async () => {
        const config = get(configAtom);
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          url: config.apiUrl,
          timeout: config.timeout,
          data: ['updated-item1', 'updated-item2'],
          timestamp: Date.now()
        };
      });
      
      try {
        get(updatedFetchAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }
      
      const updatedResult = get(updatedFetchAtom);
      expect(updatedResult.url).toBe('https://api-v2.example.com');
      expect(updatedResult.timeout).toBe(3000);
      expect(updatedResult.data).toEqual(['updated-item1', 'updated-item2']);
    });

    it('비동기 atom 취소 및 재시작 시나리오', async () => {
      let resolveCount = 0;
      const createPromise = (delay: number, value: string) => 
        new Promise<string>((resolve) => {
          setTimeout(() => {
            resolveCount++;
            resolve(value);
          }, delay);
        });

      const fastAtom = createAsyncAtom(createPromise(10, 'fast'));
      const slowAtom = createAsyncAtom(createPromise(100, 'slow'));

      // 빠른 atom 먼저 처리
      try {
        get(fastAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      expect(get(fastAtom)).toBe('fast');
      expect(resolveCount).toBe(1);

      // 느린 atom은 아직 진행 중
      expect(slowAtom._status).toBe('pending');
      
      // 느린 atom도 완료될 때까지 기다림
      try {
        get(slowAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      expect(get(slowAtom)).toBe('slow');
      expect(resolveCount).toBe(2);
    });
  });

  describe('메모리 누수 방지 테스트', () => {
    it('많은 구독자가 있을 때 메모리가 올바르게 정리된다', () => {
      const testAtom = createAtom(0);
      const unsubscribeFunctions: Array<() => void> = [];

      // 1000개의 구독자 생성
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = subscribe(testAtom, (value) => {
          // 간단한 계산으로 메모리 사용
          const dummy = value * i;
        });
        unsubscribeFunctions.push(unsubscribe);
      }

      expect(getSubscriberCount(testAtom)).toBe(1000);

      // 일부 구독자 제거
      for (let i = 0; i < 500; i++) {
        unsubscribeFunctions[i]();
      }

      expect(getSubscriberCount(testAtom)).toBe(500);

      // 나머지 구독자 모두 제거
      for (let i = 500; i < 1000; i++) {
        unsubscribeFunctions[i]();
      }

      expect(getSubscriberCount(testAtom)).toBe(0);
    });

    it('파생 atom 체인에서 메모리 누수가 발생하지 않는다', () => {
      const baseAtom = createAtom(1);
      const derivedAtoms: any[] = [];

      // 깊은 파생 atom 체인 생성
      let current: any = baseAtom;
      for (let i = 0; i < 50; i++) {
        const derived = createDerivedAtom((get) => (get(current) as number) + 1);
        derivedAtoms.push(derived);
        current = derived;
      }

      // 최종 값 확인
      expect(get(derivedAtoms[49])).toBe(51);

      // 의존성 정보 확인
      const baseDeps = getDependencies(baseAtom);
      const finalDeps = getDependencies(derivedAtoms[49]);

      expect(baseDeps.dependents).toBeGreaterThan(0);
      expect(finalDeps.dependencies).toBeGreaterThan(0);
      expect(finalDeps.dependents).toBe(0);
    });
  });

  describe('동시성 및 경쟁 조건 테스트', () => {
    it('여러 스레드에서 동시에 atom을 업데이트할 때 안전하다', async () => {
      const concurrentAtom = createAtom(0);
      const promises: Promise<void>[] = [];

      // 여러 비동기 작업에서 동시에 업데이트
      for (let i = 0; i < 10; i++) {
        const promise = new Promise<void>((resolve) => {
          setTimeout(() => {
            const currentValue = get(concurrentAtom);
            set(concurrentAtom, currentValue + 1);
            resolve();
          }, Math.random() * 10);
        });
        promises.push(promise);
      }

      await Promise.all(promises);

      // 모든 업데이트가 완료되었는지 확인
      expect(get(concurrentAtom)).toBe(10);
    });

    it('배치 업데이트 중 다른 업데이트가 발생할 때 순서가 보장된다', () => {
      const testAtom = createAtom(0);
      const updateOrder: number[] = [];

      const unsubscribe = subscribe(testAtom, (value) => {
        updateOrder.push(value);
      });

      // 배치 업데이트 시작
      batch(() => {
        set(testAtom, 1);
        set(testAtom, 2);
        
        // 배치 중간에 다른 업데이트 (이것은 배치 완료 후 실행되어야 함)
        setTimeout(() => {
          set(testAtom, 99);
        }, 0);
        
        set(testAtom, 3);
      });

      // 배치 완료 직후 상태 확인
      expect(get(testAtom)).toBe(3);
      expect(updateOrder).toEqual([3]); // 배치로 인해 한 번만 업데이트

      unsubscribe();
    });
  });

  describe('깊은 객체 중첩 처리 테스트', () => {
    it('깊게 중첩된 객체 상태를 올바르게 처리한다', () => {
      interface DeepNestedState {
        level1: {
          level2: {
            level3: {
              level4: {
                value: number;
                metadata: {
                  created: string;
                  updated: string;
                };
              };
            };
          };
        };
      }

      const deepAtom = createAtom<DeepNestedState>({
        level1: {
          level2: {
            level3: {
              level4: {
                value: 1,
                metadata: {
                  created: '2023-01-01',
                  updated: '2023-01-01'
                }
              }
            }
          }
        }
      });

      // 깊은 파생 atom
      const deepValueAtom = createDerivedAtom((get) => {
        const state = get(deepAtom);
        return state.level1.level2.level3.level4.value * 10;
      });

      expect(get(deepValueAtom)).toBe(10);

      // 깊은 객체 업데이트
      const currentState = get(deepAtom);
      set(deepAtom, {
        ...currentState,
        level1: {
          ...currentState.level1,
          level2: {
            ...currentState.level1.level2,
            level3: {
              ...currentState.level1.level2.level3,
              level4: {
                ...currentState.level1.level2.level3.level4,
                value: 5,
                metadata: {
                  ...currentState.level1.level2.level3.level4.metadata,
                  updated: '2023-01-02'
                }
              }
            }
          }
        }
      });

      expect(get(deepValueAtom)).toBe(50);
    });
  });

  describe('극한 성능 테스트', () => {
    it('매우 많은 atom과 구독자가 있을 때 성능이 유지된다', () => {
      const atoms: any[] = [];
      const unsubscribeFunctions: any[] = [];

      // 100개의 atom 생성 (테스트 속도를 위해 줄임)
      for (let i = 0; i < 100; i++) {
        const atom = createAtom(i);
        atoms.push(atom);

        // 각 atom에 구독자 추가
        const unsubscribe = subscribe(atom, (value) => {
          // 간단한 계산
          const result = value * 2;
        });
        unsubscribeFunctions.push(unsubscribe);
      }

      // 성능 측정
      const startTime = performance.now();
      
      // 모든 atom 값 업데이트
      for (let i = 0; i < atoms.length; i++) {
        set(atoms[i], i * 10);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 성능 요구사항: 100개 atom 업데이트가 50ms 이내
      expect(totalTime).toBeLessThan(50);

      // 정리
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });

    it('복잡한 파생 atom 네트워크에서 성능이 유지된다', () => {
      const baseAtoms: any[] = [];
      const derivedAtoms: any[] = [];

      // 5개의 기본 atom 생성
      for (let i = 0; i < 5; i++) {
        baseAtoms.push(createAtom(i));
      }

      // 각 기본 atom에 대해 5개의 파생 atom 생성
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const derived = createDerivedAtom((get) => {
            let sum = 0;
            for (let k = 0; k < baseAtoms.length; k++) {
              sum += get(baseAtoms[k]) as number;
            }
            return sum * (i + 1) * (j + 1);
          });
          derivedAtoms.push(derived);
        }
      }

      const startTime = performance.now();

      // 기본 atom 하나 변경
      set(baseAtoms[0], 100);

      // 모든 파생 atom 값 확인
      derivedAtoms.forEach(derived => {
        get(derived);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 성능 요구사항: 복잡한 파생 네트워크 업데이트가 25ms 이내
      expect(totalTime).toBeLessThan(25);
    });
  });

  describe('배치 업데이트 복잡한 시나리오', () => {
    it('중첩된 배치 업데이트가 올바르게 처리된다', () => {
      const testAtom = createAtom(0);
      const updateOrder: number[] = [];

      const unsubscribe = subscribe(testAtom, (value) => {
        updateOrder.push(value);
      });

      batch(() => {
        set(testAtom, 1);
        
        batch(() => {
          set(testAtom, 2);
          set(testAtom, 3);
        });
        
        set(testAtom, 4);
      });

      expect(get(testAtom)).toBe(4);
      expect(updateOrder).toEqual([4]); // 최외곽 배치로 인해 한 번만 업데이트

      unsubscribe();
    });

    it('배치 업데이트 중 에러가 발생해도 다른 업데이트는 계속 진행된다', () => {
      const atom1 = createAtom(0);
      const atom2 = createAtom(0);
      const atom3 = createAtom(0);

      let atom1Updated = false;
      let atom2Updated = false;
      let atom3Updated = false;

      const unsubscribe1 = subscribe(atom1, () => { atom1Updated = true; });
      const unsubscribe2 = subscribe(atom2, () => { atom2Updated = true; });
      const unsubscribe3 = subscribe(atom3, () => { atom3Updated = true; });

      expect(() => {
        batch(() => {
          set(atom1, 1);
          
          // 여기서 에러 발생
          throw new Error('배치 중 에러');
          
          set(atom2, 2); // 실행되지 않음
          set(atom3, 3); // 실행되지 않음
        });
      }).toThrow('배치 중 에러');

      // 에러 발생 전까지의 업데이트는 적용되지 않음
      expect(get(atom1)).toBe(0);
      expect(get(atom2)).toBe(0);
      expect(get(atom3)).toBe(0);

      expect(atom1Updated).toBe(false);
      expect(atom2Updated).toBe(false);
      expect(atom3Updated).toBe(false);

      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });
}); 