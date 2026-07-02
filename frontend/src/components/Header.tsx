import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { logout } from '../api/auth';

export default function Header() {
  const navigate = useNavigate();
  const { logout: logoutStore } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  const handleLogout = async () => {
    try { await logout(); } finally {
      logoutStore();
      navigate('/login');
    }
  };

  const openSearch = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    window.dispatchEvent(event);
  };

  return (
    <header
      style={{
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 24px',
        borderRadius: '12px', margin: '12px 12px 0 12px',
        background: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        width:'95%',alignSelf:'center'
      }}
    >
      <h1 style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 600 }}>
        PMinds
      </h1>

      <button
        onClick={openSearch}
        style={{
          flex: 1, maxWidth: '400px', margin: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
        }}
      >
        <span style={{ color: isDark ? '#e2e2d6' : 'black', fontSize: '13px' }}>Search...</span>
        <kbd style={{
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          color: isDark ? '#e2e2d6' : 'black', fontSize: '11px',
          padding: '2px 6px', borderRadius: '4px',
        }}>⌘K</kbd>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '8px', padding: '6px 14px',
            color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
