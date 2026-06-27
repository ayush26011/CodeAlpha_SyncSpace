import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Code, Globe, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './AuthPage.css';

export default function AuthPage({ mode = 'login', onNavigate }) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState(mode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let tempErrors = {};
    if (!email) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long";
    }

    if (authMode === 'register' && !name) {
      tempErrors.name = "Full name is required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (validate()) {
      setLoading(true);
      try {
        if (authMode === 'login') {
          await login(email, password);
        } else {
          await register(name, email, password);
        }
      } catch (err) {
        console.error("Auth action failed:", err);
        setApiError(err.message || "Authentication failed. Please verify credentials.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOAuthClick = async () => {
    try {
      // Direct mock login for testing ease
      await login('ayush@syncspace.io', 'password123');
    } catch (err) {
      setApiError("Mock account not ready, please sign up above!");
    }
  };

  return (
    <div className="auth-container">
      {/* Left side: Premium media illustration */}
      <div className="auth-sidebar">
        <div className="auth-sidebar-brand" onClick={() => onNavigate('landing')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        
        <div className="auth-sidebar-quote">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.1 }}
          >
            <h2>"Collaborate in space, not in noise."</h2>
            <p>SyncSpace brings quiet design and seamless synchronicity to active remote and local squads.</p>
          </motion.div>
        </div>

        <div style={{ opacity: 0.5, fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} SyncSpace Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form card */}
      <div className="auth-form-panel">
        {/* Floating background decorations */}
        <div className="blob blob-primary" style={{ top: '10%', right: '5%', width: '200px', height: '200px' }}></div>
        
        <motion.div 
          className="auth-form-card glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="auth-header">
            <h1>{authMode === 'login' ? 'Welcome Back' : 'Join SyncSpace'}</h1>
            <p>
              {authMode === 'login' 
                ? 'Sign in to access your calm collaborative workspaces.' 
                : 'Create your account and start team syncs in minutes.'}
            </p>
          </div>

          <div className="auth-social-group">
            <button className="btn-social" onClick={handleOAuthClick}>
              <Globe size={18} /> Google
            </button>
            <button className="btn-social" onClick={handleOAuthClick}>
              <Code size={18} /> GitHub
            </button>
          </div>

          <div className="auth-divider">Or continue with email</div>

          {apiError && (
            <div className="auth-validation-error flex-center" style={{ background: 'rgba(127,84,61,0.1)', padding: '0.65rem 1rem', borderRadius: '8px', marginBottom: '1rem', color: 'var(--highlight)', justifyContent: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {authMode === 'register' && (
                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="name-input">Full Name</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      id="name-input"
                      type="text"
                      className="form-input"
                      placeholder="Ayush Tiwari"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  {errors.name && (
                    <motion.div className="auth-validation-error flex-center" style={{ justifyContent: 'flex-start', gap: '4px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <AlertCircle size={12} /> {errors.name}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label htmlFor="email-input">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="ayush@syncspace.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <motion.div className="auth-validation-error flex-center" style={{ justifyContent: 'flex-start', gap: '4px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertCircle size={12} /> {errors.email}
                </motion.div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="password-input"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errors.password && (
                <motion.div className="auth-validation-error flex-center" style={{ justifyContent: 'flex-start', gap: '4px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertCircle size={12} /> {errors.password}
                </motion.div>
              )}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#" className="auth-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <a 
              href="#" 
              className="auth-link"
              onClick={(e) => {
                e.preventDefault();
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setErrors({});
                setApiError('');
              }}
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
