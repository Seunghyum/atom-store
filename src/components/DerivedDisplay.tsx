import { useAtomValue } from '../lib/atom';
import { doubleCountAtom, greetingAtom, complexAtom } from '../atoms';

function DerivedDisplay() {
  const doubleCount = useAtomValue(doubleCountAtom);
  const greeting = useAtomValue(greetingAtom);
  const complex = useAtomValue(complexAtom);
  
  console.log('DerivedDisplay rendered');
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>파생 Atom 표시</h2>
      <p>더블 카운트: {doubleCount}</p>
      <p>인사말: {greeting}</p>
      <p>복합 정보: {complex}</p>
    </div>
  );
}

export default DerivedDisplay; 