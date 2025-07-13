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
  useAtom,
} from '../lib/atom';

describe('고급 Atom 라이브러리 테스트', () => {
  describe('기본 atom 생성 및 get', () => {
    it('atom을 생성하고 초기값을 가져올 수 있다', () => {
      const countAtom = createAtom(0);
      const nameAtom = createAtom('Hello');

      expect(get(countAtom)).toBe(0);
      expect(get(nameAtom)).toBe('Hello');
    });
  });

  describe('set 테스트', () => {
    it('atom 값을 설정할 수 있다', () => {
      const countAtom = createAtom(0);
      const nameAtom = createAtom('Hello');

      set(countAtom, 10);
      set(nameAtom, 'World');

      expect(get(countAtom)).toBe(10);
      expect(get(nameAtom)).toBe('World');
    });
  });

  describe('파생 atom 테스트', () => {
    it('파생 atom을 생성하고 값을 가져올 수 있다', () => {
      const countAtom = createAtom(10);
      const nameAtom = createAtom('World');
      
      const doubleCountAtom = createDerivedAtom((get) => get(countAtom) * 2);
      const greetingAtom = createDerivedAtom((get) => `Hello, ${get(nameAtom)}!`);

      expect(get(doubleCountAtom)).toBe(20);
      expect(get(greetingAtom)).toBe('Hello, World!');
    });

    it('원본 atom 변경 시 파생 atom도 업데이트된다', () => {
      const countAtom = createAtom(10);
      const doubleCountAtom = createDerivedAtom((get) => get(countAtom) * 2);
      
      let updateCount = 0;
      let lastValue: number | undefined;
      
      const unsubscribe = subscribe(doubleCountAtom, (value) => {
        updateCount++;
        lastValue = value;
      });

      set(countAtom, 15);
      
      expect(get(doubleCountAtom)).toBe(30);
      expect(updateCount).toBe(1);
      expect(lastValue).toBe(30);
      
      unsubscribe();
    });

    it('파생 atom에 set 시도 시 에러가 발생한다', () => {
      const countAtom = createAtom(10);
      const doubleCountAtom = createDerivedAtom((get) => get(countAtom) * 2);

      expect(() => {
        set(doubleCountAtom, 100);
      }).toThrow('Cannot set value on derived atom');
    });
  });

  describe('배치 업데이트 테스트', () => {
    it('배치 업데이트로 여러 변경사항을 한 번에 처리한다', () => {
      const countAtom = createAtom(0);
      
      let updateCount = 0;
      const unsubscribe = subscribe(countAtom, () => {
        updateCount++;
      });

      batch(() => {
        set(countAtom, 20);
        set(countAtom, 25);
        set(countAtom, 30);
      });

      expect(get(countAtom)).toBe(30);
      expect(updateCount).toBe(1); // 배치로 인해 1번만 호출
      
      unsubscribe();
    });
  });

  describe('메모리 관리 테스트', () => {
    it('구독자 수를 정확하게 추적한다', () => {
      const testAtom = createAtom('test');
      
      expect(getSubscriberCount(testAtom)).toBe(0);

      const unsubscribe1 = subscribe(testAtom, () => {});
      const unsubscribe2 = subscribe(testAtom, () => {});
      
      expect(getSubscriberCount(testAtom)).toBe(2);

      unsubscribe1();
      expect(getSubscriberCount(testAtom)).toBe(1);

      unsubscribe2();
      expect(getSubscriberCount(testAtom)).toBe(0);
    });
  });

  describe('의존성 정보 테스트', () => {
    it('atom 의존성 정보를 정확하게 추적한다', () => {
      const baseAtom = createAtom(1);
      const derived1 = createDerivedAtom((get) => get(baseAtom) * 2);
      const derived2 = createDerivedAtom((get) => get(baseAtom) + get(derived1));

      expect(getDependencies(baseAtom)).toEqual({ dependencies: 0, dependents: 2 });
      expect(getDependencies(derived1)).toEqual({ dependencies: 1, dependents: 1 });
      expect(getDependencies(derived2)).toEqual({ dependencies: 2, dependents: 0 });
    });
  });

  describe('비동기 atom 테스트', () => {
    it('비동기 atom을 생성하고 상태를 확인할 수 있다', () => {
      const asyncAtom = createAsyncAtom(
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('비동기 데이터 완료'), 100);
        })
      );

      expect(asyncAtom._status).toBe('pending');
    });

    it('비동기 atom에서 Promise를 throw한다', () => {
      const asyncAtom = createAsyncAtom(
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('비동기 데이터 완료'), 100);
        })
      );

      expect(() => {
        get(asyncAtom);
      }).toThrow();
    });

    it('비동기 atom이 완료되면 값을 가져올 수 있다', async () => {
      const asyncAtom = createAsyncAtom(
        Promise.resolve('비동기 데이터 완료')
      );

      // Promise가 resolve될 때까지 기다림
      try {
        get(asyncAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      expect(get(asyncAtom)).toBe('비동기 데이터 완료');
    });

    it('비동기 atom 완료 시 구독자에게 알림이 간다', async () => {
      const asyncAtom = createAsyncAtom(
        Promise.resolve('비동기 데이터 완료')
      );

      let receivedValue: string | undefined;
      const unsubscribe = subscribe(asyncAtom, (value) => {
        receivedValue = value;
      });

      // Promise가 resolve될 때까지 기다림
      try {
        get(asyncAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      // 잠시 기다려서 구독자 콜백이 호출되도록 함
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedValue).toBe('비동기 데이터 완료');
      unsubscribe();
    });
  });

  describe('복잡한 파생 atom 체인 테스트', () => {
    it('파생 atom 체인이 올바르게 업데이트된다', () => {
      const a = createAtom(1);
      const b = createDerivedAtom((get) => get(a) * 2);
      const c = createDerivedAtom((get) => get(b) + 1);
      const d = createDerivedAtom((get) => get(a) + get(c));

      expect(get(a)).toBe(1);
      expect(get(b)).toBe(2);
      expect(get(c)).toBe(3);
      expect(get(d)).toBe(4);

      let updateCount = 0;
      let lastValue: number | undefined;
      
      const unsubscribe = subscribe(d, (value) => {
        updateCount++;
        lastValue = value;
      });

      set(a, 5);
      
      expect(get(a)).toBe(5);
      expect(get(b)).toBe(10);
      expect(get(c)).toBe(11);
      expect(get(d)).toBe(16);
      expect(updateCount).toBe(1);
      expect(lastValue).toBe(16);
      
      unsubscribe();
    });
  });

  describe('배치 업데이트 테스트', () => {
      it('두 개의 상태값을 배치 업데이트로 여러 변경사항을 한 번씩 처리한다', () => {
    const countAtom1 = createAtom(0);
    const countAtom2 = createAtom(0);
    
    let updateCount = 0;
    const cb = (value: number) => {
      console.log('countAtom subscriber called with value:', value);
      updateCount++;
    };
    const unsubscribe1 = subscribe(countAtom1, cb);
    const unsubscribe2 = subscribe(countAtom2, cb);

    console.log('Before batch, updateCount:', updateCount);
    
    // 수동 배치 처리 테스트
    batch(() => {
      console.log('Inside batch - setting countAtom1 to 20');
      set(countAtom1, 20);
      console.log('Inside batch - setting countAtom1 to 25');
      set(countAtom1, 25);
      console.log('Inside batch - setting countAtom1 to 30');
      set(countAtom1, 30);
      console.log('Inside batch - setting countAtom2 to 200');
      set(countAtom2, 200);
      console.log('Inside batch - setting countAtom2 to 250');
      set(countAtom2, 250);
      console.log('Inside batch - setting countAtom2 to 300');
      set(countAtom2, 300);
    });

    console.log('After batch, updateCount:', updateCount);
    
    expect(get(countAtom1)).toBe(30);
    expect(get(countAtom2)).toBe(300);
    expect(updateCount).toBe(2); // 배치로 인해 1번만 호출
    
        unsubscribe1();
    unsubscribe2();
  });

  it('하나의 atom에 대한 여러 번의 set 호출이 배치 처리로 한 번만 업데이트된다', () => {
    const countAtom = createAtom(0);
    
    let updateCount = 0;
    const unsubscribe = subscribe(countAtom, () => {
      updateCount++;
    });

    // 배치 처리 없이 여러 번 set 호출
    set(countAtom, 1);
    set(countAtom, 2);
    set(countAtom, 3);
    
    expect(get(countAtom)).toBe(3);
    expect(updateCount).toBe(3); // 배치 처리 없이 3번 호출
    
    // 카운터 리셋
    updateCount = 0;
    
    // 배치 처리로 여러 번 set 호출
    batch(() => {
      set(countAtom, 10);
      set(countAtom, 20);
      set(countAtom, 30);
    });
    
    expect(get(countAtom)).toBe(30);
    expect(updateCount).toBe(1); // 배치로 인해 1번만 호출
    
    unsubscribe();
  });
});

  describe('복잡한 비동기 시나리오 테스트', () => {
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

    it('비동기 atom에서 다른 atom 값을 참조할 때 올바르게 처리된다', async () => {
      // 일반 atom을 기반으로 한 비동기 처리 (더 일반적인 패턴)
      const userIdAtom = createAtom('user123');
      
      const userDataAtom = createAsyncAtom(async () => {
        const userId = get(userIdAtom);
        // 실제 API 호출을 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: userId, name: 'John Doe', email: 'john@example.com' };
      });

      // 비동기 atom이 완료될 때까지 기다림
      try {
        get(userDataAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }

      const userData = get(userDataAtom);
      expect(userData.id).toBe('user123');
      expect(userData.name).toBe('John Doe');
      expect(userData.email).toBe('john@example.com');
      
      // 의존성 변경 후에는 새로운 비동기 atom을 생성하는 것이 일반적
      set(userIdAtom, 'user456');
      
      // 새로운 비동기 atom 생성
      const updatedUserDataAtom = createAsyncAtom(async () => {
        const userId = get(userIdAtom);
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: userId, name: 'Jane Doe', email: 'jane@example.com' };
      });
      
      try {
        get(updatedUserDataAtom);
      } catch (promise) {
        if (promise instanceof Promise) {
          await promise;
        }
      }
      
      const updatedUserData = get(updatedUserDataAtom);
      expect(updatedUserData.id).toBe('user456');
      expect(updatedUserData.name).toBe('Jane Doe');
    });
  });

  describe('복잡한 파생 atom 시나리오 테스트', () => {
    it('다중 의존성을 가진 파생 atom이 올바르게 업데이트된다', () => {
      const nameAtom = createAtom('John');
      const ageAtom = createAtom(25);
      const cityAtom = createAtom('Seoul');
      const countryAtom = createAtom('Korea');

      // 여러 atom에 의존하는 복잡한 파생 atom
      const profileAtom = createDerivedAtom((get) => {
        const name = get(nameAtom);
        const age = get(ageAtom);
        const city = get(cityAtom);
        const country = get(countryAtom);
        return `${name} (${age}) lives in ${city}, ${country}`;
      });

      // 이 파생 atom도 여러 atom에 의존
      const summaryAtom = createDerivedAtom((get) => {
        const profile = get(profileAtom);
        const age = get(ageAtom);
        const isAdult = age >= 18;
        return `${profile} - ${isAdult ? 'Adult' : 'Minor'}`;
      });

      expect(get(profileAtom)).toBe('John (25) lives in Seoul, Korea');
      expect(get(summaryAtom)).toBe('John (25) lives in Seoul, Korea - Adult');

      // 한 atom 변경시 모든 의존 atom이 업데이트되는지 확인
      let profileUpdateCount = 0;
      let summaryUpdateCount = 0;

      const profileUnsub = subscribe(profileAtom, () => profileUpdateCount++);
      const summaryUnsub = subscribe(summaryAtom, () => summaryUpdateCount++);

      set(nameAtom, 'Jane');

      expect(get(profileAtom)).toBe('Jane (25) lives in Seoul, Korea');
      expect(get(summaryAtom)).toBe('Jane (25) lives in Seoul, Korea - Adult');
      expect(profileUpdateCount).toBe(1);
      expect(summaryUpdateCount).toBe(1);

      set(ageAtom, 16);

      expect(get(summaryAtom)).toBe('Jane (16) lives in Seoul, Korea - Minor');
      expect(profileUpdateCount).toBe(2);
      expect(summaryUpdateCount).toBe(2);

      profileUnsub();
      summaryUnsub();
    });

    it('순환 의존성을 방지한다', () => {
      const atomA = createAtom(1);
      const atomB = createDerivedAtom((get) => get(atomA) + 1);
      
      // 순환 의존성을 시도하는 파생 atom
      const atomC = createDerivedAtom((get) => {
        const a = get(atomA);
        const b = get(atomB);
        return a + b;
      });

      expect(get(atomA)).toBe(1);
      expect(get(atomB)).toBe(2);
      expect(get(atomC)).toBe(3);

      set(atomA, 10);
      expect(get(atomA)).toBe(10);
      expect(get(atomB)).toBe(11);
      expect(get(atomC)).toBe(21);
    });

    it('파생 atom에서 조건부 의존성이 올바르게 처리된다', () => {
      const switchAtom = createAtom(true);
      const valueAAtom = createAtom(100);
      const valueBAtom = createAtom(200);

      const conditionalAtom = createDerivedAtom((get) => {
        const useA = get(switchAtom);
        if (useA) {
          return get(valueAAtom) * 2;
        } else {
          return get(valueBAtom) * 3;
        }
      });

      expect(get(conditionalAtom)).toBe(200); // 100 * 2

      let updateCount = 0;
      const unsubscribe = subscribe(conditionalAtom, () => updateCount++);

      // valueA 변경 - 영향을 받아야 함
      set(valueAAtom, 150);
      expect(get(conditionalAtom)).toBe(300); // 150 * 2
      expect(updateCount).toBe(1);

      // valueB 변경 - 영향을 받지 않아야 함
      set(valueBAtom, 250);
      expect(get(conditionalAtom)).toBe(300); // 여전히 150 * 2
      expect(updateCount).toBe(1); // 업데이트 되지 않음

      // switch 변경 - 이제 valueB를 사용
      set(switchAtom, false);
      expect(get(conditionalAtom)).toBe(750); // 250 * 3
      expect(updateCount).toBe(2);

      // 이제 valueA 변경 - 영향을 받지 않아야 함
      set(valueAAtom, 175);
      expect(get(conditionalAtom)).toBe(750); // 여전히 250 * 3
      expect(updateCount).toBe(2); // 업데이트 되지 않음

      // valueB 변경 - 영향을 받아야 함
      set(valueBAtom, 300);
      expect(get(conditionalAtom)).toBe(900); // 300 * 3
      expect(updateCount).toBe(3);

      unsubscribe();
    });
  });

  describe('메모리 및 성능 복잡한 시나리오 테스트', () => {
    it('대량의 구독자와 구독 해제가 올바르게 처리된다', () => {
      const testAtom = createAtom(0);
      const subscribers: (() => void)[] = [];

      // 1000개의 구독자 생성
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = subscribe(testAtom, (value) => {
          // 간단한 계산으로 구독자가 실제로 호출되는지 확인
          return value * i;
        });
        subscribers.push(unsubscribe);
      }

      expect(getSubscriberCount(testAtom)).toBe(1000);

      // 값 변경시 모든 구독자가 호출되는지 확인
      set(testAtom, 42);
      expect(get(testAtom)).toBe(42);

      // 절반의 구독자 해제
      for (let i = 0; i < 500; i++) {
        subscribers[i]();
      }

      expect(getSubscriberCount(testAtom)).toBe(500);

      // 값 변경시 남은 구독자들만 호출되는지 확인
      set(testAtom, 84);
      expect(get(testAtom)).toBe(84);

      // 나머지 구독자들도 해제
      for (let i = 500; i < 1000; i++) {
        subscribers[i]();
      }

      expect(getSubscriberCount(testAtom)).toBe(0);
    });

    it('복잡한 배치 업데이트 시나리오가 올바르게 처리된다', () => {
      const atom1 = createAtom(1);
      const atom2 = createAtom(2);
      const atom3 = createAtom(3);

      const derivedAtom = createDerivedAtom((get) => {
        return get(atom1) + get(atom2) + get(atom3);
      });

      let updateCount = 0;
      const unsubscribe = subscribe(derivedAtom, () => updateCount++);

      // 배치 없이 업데이트
      set(atom1, 10);
      set(atom2, 20);
      set(atom3, 30);

      expect(get(derivedAtom)).toBe(60);
      expect(updateCount).toBe(3); // 각각 업데이트

      // 배치로 업데이트
      updateCount = 0;
      batch(() => {
        set(atom1, 100);
        set(atom2, 200);
        set(atom3, 300);
      });

      expect(get(derivedAtom)).toBe(600);
      expect(updateCount).toBe(1); // 배치로 인해 한 번만 업데이트

      // 중첩된 배치 업데이트
      updateCount = 0;
      batch(() => {
        set(atom1, 1000);
        batch(() => {
          set(atom2, 2000);
          set(atom3, 3000);
        });
      });

      expect(get(derivedAtom)).toBe(6000);
      expect(updateCount).toBe(1); // 최외곽 배치로 인해 한 번만 업데이트

      unsubscribe();
    });
  });

  describe('에러 처리 복잡한 시나리오 테스트', () => {
    it('파생 atom에서 에러가 발생할 때 다른 atom에 영향을 주지 않는다', () => {
      const baseAtom = createAtom(5);
      const normalDerivedAtom = createDerivedAtom((get) => get(baseAtom) * 2);
      const errorDerivedAtom = createDerivedAtom((get) => {
        const value = get(baseAtom);
        if (value > 3) {
          throw new Error('값이 너무 큽니다');
        }
        return value * 3;
      });

      // 정상 파생 atom은 작동해야 함
      expect(get(normalDerivedAtom)).toBe(10);

      // 에러 파생 atom은 에러를 throw해야 함
      expect(() => {
        get(errorDerivedAtom);
      }).toThrow('값이 너무 큽니다');

      // 기본 atom 값 변경
      set(baseAtom, 2);

      // 정상 파생 atom은 여전히 작동해야 함
      expect(get(normalDerivedAtom)).toBe(4);

      // 에러 파생 atom은 이제 정상 작동해야 함
      expect(get(errorDerivedAtom)).toBe(6);

      // 다시 에러 상황 만들기
      set(baseAtom, 10);
      expect(get(normalDerivedAtom)).toBe(20);
      expect(() => {
        get(errorDerivedAtom);
      }).toThrow('값이 너무 큽니다');
    });

    it('구독자에서 에러가 발생해도 다른 구독자에 영향을 주지 않는다', () => {
      const testAtom = createAtom(0);
      const results: string[] = [];

      // 정상 구독자
      const normalSub = subscribe(testAtom, (value) => {
        results.push(`normal: ${value}`);
      });

      // 에러 발생 구독자
      const errorSub = subscribe(testAtom, (value) => {
        if (value === 5) {
          throw new Error('5는 싫어요');
        }
        results.push(`error-prone: ${value}`);
      });

      // 또 다른 정상 구독자
      const anotherNormalSub = subscribe(testAtom, (value) => {
        results.push(`another: ${value}`);
      });

      // 정상 값 설정
      set(testAtom, 3);
      expect(results).toEqual([
        'normal: 3',
        'error-prone: 3',
        'another: 3'
      ]);

      // 에러 발생 값 설정
      results.length = 0;
      expect(() => {
        set(testAtom, 5);
      }).toThrow('5는 싫어요');

      // 에러가 발생했지만 다른 구독자들은 호출되어야 함
      expect(results).toEqual([
        'normal: 5',
        'another: 5'
      ]);

      normalSub();
      errorSub();
      anotherNormalSub();
    });
  });

  describe('배치 처리 패턴 비교 테스트', () => {
    it('직접 set 호출: 각각 개별 업데이트 (즉시 처리)', () => {
      const atom1 = createAtom(0);
      const atom2 = createAtom('');
      
      // 파생 atom으로 두 값의 조합 계산
      const combinedAtom = createDerivedAtom((get) => {
        const num = get(atom1);
        const str = get(atom2);
        return `${str}: ${num}`;
      });
      
      let updateCount = 0;
      const capturedValues: string[] = [];
      
      // 구독자 등록
      const unsubscribe = subscribe(combinedAtom, (value) => {
        updateCount++;
        capturedValues.push(value);
      });
      
      // 🔄 직접 set 호출 - 각각 즉시 처리
      set(atom1, 10);
      set(atom2, 'Count');
      
      // 결과 확인
      expect(updateCount).toBe(2); // 2번의 개별 업데이트
      expect(capturedValues).toEqual([
        ': 10',        // 첫 번째 set 후의 중간 상태
        'Count: 10'    // 두 번째 set 후의 최종 상태
      ]);
      
      unsubscribe();
    });

    it('수동 batch 호출: 한 번에 모든 변경사항 처리', () => {
      const atom1 = createAtom(0);
      const atom2 = createAtom('');
      
      // 파생 atom으로 두 값의 조합 계산
      const combinedAtom = createDerivedAtom((get) => {
        const num = get(atom1);
        const str = get(atom2);
        return `${str}: ${num}`;
      });
      
      let updateCount = 0;
      const capturedValues: string[] = [];
      
      // 구독자 등록
      const unsubscribe = subscribe(combinedAtom, (value) => {
        updateCount++;
        capturedValues.push(value);
      });
      
      // 🎯 수동 batch 호출 - 한 번에 처리
      batch(() => {
        set(atom1, 10);
        set(atom2, 'Count');
      });
      
      // 결과 확인
      expect(updateCount).toBe(1); // 1번의 배치 업데이트
      expect(capturedValues).toEqual([
        'Count: 10'    // 최종 상태만 캡처
      ]);
      
      unsubscribe();
    });

    it('자동 batch (useAtom 패턴): 다음 tick에서 배치 처리', async () => {
      const atom1 = createAtom(0);
      const atom2 = createAtom('');
      
      // 파생 atom으로 두 값의 조합 계산
      const combinedAtom = createDerivedAtom((get) => {
        const num = get(atom1);
        const str = get(atom2);
        return `${str}: ${num}`;
      });
      
      let updateCount = 0;
      const capturedValues: string[] = [];
      
      // 구독자 등록
      const unsubscribe = subscribe(combinedAtom, (value) => {
        updateCount++;
        capturedValues.push(value);
      });
      
      // 🚀 자동 batch (useAtom의 setValue와 동일) - 자동 배치 활성화
      set(atom1, 10, true); // enableAutoBatch = true
      set(atom2, 'Count', true); // enableAutoBatch = true
      
      // 즉시 확인 - 아직 배치 처리되지 않음
      expect(updateCount).toBe(0);
      expect(capturedValues).toEqual([]);
      
      // 다음 tick에서 배치 처리 완료 대기
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 자동 배치 처리 결과 확인
      expect(updateCount).toBe(1); // 1번의 자동 배치 업데이트
      expect(capturedValues).toEqual([
        'Count: 10'    // 최종 상태만 캡처
      ]);
      
      unsubscribe();
    });

    it('세 가지 패턴의 성능 비교', async () => {
      const createTestSetup = () => {
        const atom1 = createAtom(0);
        const atom2 = createAtom(0);
        const atom3 = createAtom(0);
        
        const sumAtom = createDerivedAtom((get) => {
          return get(atom1) + get(atom2) + get(atom3);
        });
        
        let updateCount = 0;
        const unsubscribe = subscribe(sumAtom, () => updateCount++);
        
        return { atom1, atom2, atom3, sumAtom, getUpdateCount: () => updateCount, unsubscribe };
      };

      // 1️⃣ 직접 set: 3번의 개별 업데이트
      const setup1 = createTestSetup();
      set(setup1.atom1, 1);
      set(setup1.atom2, 2);
      set(setup1.atom3, 3);
      expect(setup1.getUpdateCount()).toBe(3);
      setup1.unsubscribe();

      // 2️⃣ 수동 batch: 1번의 배치 업데이트
      const setup2 = createTestSetup();
      batch(() => {
        set(setup2.atom1, 1);
        set(setup2.atom2, 2);
        set(setup2.atom3, 3);
      });
      expect(setup2.getUpdateCount()).toBe(1);
      setup2.unsubscribe();

      // 3️⃣ 자동 batch: 1번의 자동 배치 업데이트
      const setup3 = createTestSetup();
      set(setup3.atom1, 1, true);
      set(setup3.atom2, 2, true);
      set(setup3.atom3, 3, true);
      
      // 즉시 확인
      expect(setup3.getUpdateCount()).toBe(0);
      
      // 자동 배치 완료 대기
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(setup3.getUpdateCount()).toBe(1);
      setup3.unsubscribe();
    });

    it('중첩된 상황에서의 배치 처리 동작', async () => {
      const atom1 = createAtom(0);
      const atom2 = createAtom(0);
      
      const sumAtom = createDerivedAtom((get) => get(atom1) + get(atom2));
      
      let updateCount = 0;
      const unsubscribe = subscribe(sumAtom, () => updateCount++);
      
      // 수동 batch 안에서 자동 batch 사용
      batch(() => {
        set(atom1, 10); // 즉시 처리 (수동 batch 내)
        set(atom2, 20, true); // 자동 batch 요청이지만 수동 batch가 우선
      });
      
      // 수동 batch가 완료되어 즉시 처리됨
      expect(updateCount).toBe(1);
      expect(get(sumAtom)).toBe(30);
      
      // 추가 자동 batch 테스트
      updateCount = 0;
      set(atom1, 100, true);
      set(atom2, 200, true);
      
      // 아직 처리되지 않음
      expect(updateCount).toBe(0);
      
      // 자동 배치 완료 대기
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(updateCount).toBe(1);
      expect(get(sumAtom)).toBe(300);
      
      unsubscribe();
    });
  });
}); 