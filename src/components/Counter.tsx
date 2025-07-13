import { useAtom } from '../lib/atom';
import { getSubscriberCount, getDependencies } from '../lib/atom';
import { countAtom } from '../atoms';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const subscriberCount = getSubscriberCount(countAtom);
  const dependencies = getDependencies(countAtom);
  
  console.log('🟦 Counter 컴포넌트 렌더링됨 - count:', count);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>카운터 컴포넌트</h2>
      <p>현재 카운트: {count}</p>
      <p>구독자 수: {subscriberCount}</p>
      <p>의존성: {dependencies.dependencies}, 의존하는 atom: {dependencies.dependents}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={() => setCount(count - 1)}>감소</button>
      <button onClick={() => setCount(0)}>초기화</button>
    </div>
  );
}

export default Counter; 