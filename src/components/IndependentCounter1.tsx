import { useAtom } from '../lib/atom';
import { counter1Atom } from '../atoms';

function IndependentCounter1() {
  const [count, setCount] = useAtom(counter1Atom);

  console.log('🔴 IndependentCounter1 렌더링됨 - count:', count);

  return (
    <div style={{ 
      border: '2px solid red', 
      padding: '15px', 
      margin: '10px', 
      borderRadius: '8px',
      backgroundColor: '#ffe6e6'
    }}>
      <h3>🔴 Independent Counter 1</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default IndependentCounter1; 