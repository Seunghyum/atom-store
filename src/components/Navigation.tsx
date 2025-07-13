import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Medistream Atom</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link 
            to="/" 
            style={{ 
              textDecoration: 'none', 
              color: '#007bff', 
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#e7f3ff'
            }}
          >
            🏠 메인 데모
          </Link>
          <Link 
            to="/proxy-demo" 
            style={{ 
              textDecoration: 'none', 
              color: '#6f42c1', 
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#f3e8ff'
            }}
          >
            🎭 Proxy vs 일반 Atom 비교
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation; 