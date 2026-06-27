import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import { useSettings } from './context/SettingsContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Logo from './components/Logo';

function App() {
  const { user, loading: authLoading, logout, authError, retryAuth } = useAuth();
  const { loading: chatLoading, socketConnecting, socketConnected } = useChat();
  const { loading: settingsLoading } = useSettings();
  const [page, setPage] = useState('landing'); // 'landing' | 'login' | 'register'

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  const handleAuthSuccess = async (authData) => {
    // Session state is loaded by provider, no need to do manual redirect here
  };

  useEffect(() => {
    console.log("[App Boot] authLoading:", authLoading, "chatLoading:", chatLoading, "socketConnecting:", socketConnecting, "socketConnected:", socketConnected);
  }, [authLoading, chatLoading, socketConnecting, socketConnected]);

  // Loading synchronization screen - depends ONLY on authLoading
  if (authLoading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem', padding: '2rem', textAlign: 'center' }}>
        <Logo size={48} showText={false} />
        <h4 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-headings)', margin: 0 }}>Synchronizing Space...</h4>
      </div>
    );
  }

  // Troubleshooting error screen on connection failure
  if (authError && !user) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem', padding: '2rem', textAlign: 'center' }}>
        <Logo size={48} showText={false} />
        <h4 style={{ color: 'var(--highlight)', fontFamily: 'var(--font-headings)', margin: 0 }}>Connection Failed</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{authError}</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={() => retryAuth()} 
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--secondary)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry Connection
          </button>
          <button 
            type="button" 
            onClick={() => logout()} 
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--highlight)', background: 'transparent', color: 'var(--highlight)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated, load dashboard immediately
  if (user) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  return (
    <>
      {page === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      {(page === 'login' || page === 'register') && (
        <AuthPage 
          mode={page} 
          onNavigate={handleNavigate} 
          onAuthSuccess={handleAuthSuccess} 
        />
      )}
    </>
  );
}

export default App;
