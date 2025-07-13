import { useAtom } from '../lib/atom';
import { nameAtom } from '../atoms';

function NameInput() {
  const [name, setName] = useAtom(nameAtom);
  
  console.log('NameInput rendered with name:', name);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>이름 입력 컴포넌트</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름을 입력하세요"
      />
    </div>
  );
}

export default NameInput; 