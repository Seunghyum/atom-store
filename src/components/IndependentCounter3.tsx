import { useAtom } from '../lib/atom';
import { counter3Atom } from '../atoms';

function IndependentCounter3() {
  const [count, setCount] = useAtom(counter3Atom);

  console.log('🟢 IndependentCounter3 렌더링됨 - count:', count);

  return (
    <div style={{ 
      border: '2px solid green', 
      padding: '15px', 
      margin: '10px', 
      borderRadius: '8px',
      backgroundColor: '#e6ffe6'
    }}>
      <h3>🟢 Independent Counter 3</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default IndependentCounter3; 