import { useAtom } from '../../lib/atom';
import { normalCountAtom } from '../../atoms/proxy';

function NormalCounter() {
  const [count, setCount] = useAtom(normalCountAtom);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>일반 Atom 카운터</h3>
      <p>카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={() => setCount(count - 1)}>감소</button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 사용법
const [count, setCount] = useAtom(countAtom);
setCount(count + 1);`}
      </pre>
    </div>
  );
}

export default NormalCounter; 