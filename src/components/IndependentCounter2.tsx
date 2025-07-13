import { useAtom } from '../lib/atom';
import { counter2Atom } from '../atoms';

function IndependentCounter2() {
  const [count, setCount] = useAtom(counter2Atom);

  console.log('🟡 IndependentCounter2 렌더링됨 - count:', count);

  return (
    <div style={{ 
      border: '2px solid orange', 
      padding: '15px', 
      margin: '10px', 
      borderRadius: '8px',
      backgroundColor: '#fff0e6'
    }}>
      <h3>🟡 Independent Counter 2</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default IndependentCounter2; 