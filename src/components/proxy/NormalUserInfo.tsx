import { useAtom } from '../../lib/atom';
import { normalUserAtom } from '../../atoms/proxy';

function NormalUserInfo() {
  const [user, setUser] = useAtom(normalUserAtom);
  
  const updateName = (newName: string) => {
    setUser({ ...user, name: newName });
  };
  
  const updateAge = (newAge: number) => {
    setUser({ ...user, age: newAge });
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>일반 Atom 사용자 정보</h3>
      <p>이름: {user.name}</p>
      <p>나이: {user.age}</p>
      <p>도시: {user.city}</p>
      <button onClick={() => updateName('Jane')}>이름 변경</button>
      <button onClick={() => updateAge(user.age + 1)}>나이 증가</button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 사용법 (불변성 유지)
const updateName = (newName) => {
  setUser({ ...user, name: newName });
};`}
      </pre>
    </div>
  );
}

export default NormalUserInfo; 