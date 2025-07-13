import { useAtom } from '../../lib/atom';
import { normalNestedAtom } from '../../atoms/proxy';

function NormalNestedObject() {
  const [nested, setNested] = useAtom(normalNestedAtom);
  
  const updateAvatar = () => {
    setNested({
      ...nested,
      user: {
        ...nested.user,
        profile: {
          ...nested.user.profile,
          avatar: 'avatar2.jpg'
        }
      }
    });
  };
  
  const toggleTheme = () => {
    setNested({
      ...nested,
      user: {
        ...nested.user,
        settings: {
          ...nested.user.settings,
          theme: nested.user.settings.theme === 'dark' ? 'light' : 'dark'
        }
      }
    });
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>일반 Atom 중첩 객체</h3>
      <p>이름: {nested.user.profile.name}</p>
      <p>아바타: {nested.user.profile.avatar}</p>
      <p>테마: {nested.user.settings.theme}</p>
      <p>버전: {nested.app.version}</p>
      <button onClick={updateAvatar}>아바타 변경</button>
      <button onClick={toggleTheme}>테마 토글</button>
      <pre style={{ fontSize: '12px', color: '#666' }}>
        {`// 복잡한 중첩 객체 업데이트
setNested({
  ...nested,
  user: {
    ...nested.user,
    profile: {
      ...nested.user.profile,
      avatar: 'avatar2.jpg'
    }
  }
});`}
      </pre>
    </div>
  );
}

export default NormalNestedObject; 