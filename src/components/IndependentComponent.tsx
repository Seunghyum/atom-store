function IndependentComponent() {
  console.log('IndependentComponent rendered');
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>독립적인 컴포넌트</h2>
      <p>이 컴포넌트는 atom을 사용하지 않으므로 다른 컴포넌트가 변경되어도 렌더링되지 않습니다.</p>
    </div>
  );
}

export default IndependentComponent; 