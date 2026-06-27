import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Logo from './components/Logo';

function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [page, setPage] = useState('landing'); // 'landing' | 'login' | 'register'

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  const handleAuthSuccess = async (authData) => {
    // Session state is loaded by provider, no need to do manual redirect here
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem' }}>
        <Logo size={48} showText={false} />
        <h4 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-headings)' }}>Synchronizing Space...</h4>
      </div>
    );
  }

  // If user is authenticated, load dashboard
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
