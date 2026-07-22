import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Eye, EyeOff, Loader2, Zap, Image, Layers, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Static showcase cards on the right panel ──────────────────────────────── */
const SHOWCASE_ITEMS = [
  {
    emoji: '🌌',
    label: 'Cyberpunk cityscape at night, neon lights',
    color: 'rgba(124,58,237,0.7)',
    delay: 0,
    rot: '-3deg',
    top: '12%',
    left: '8%',
  },
  {
    emoji: '🚀',
    label: 'Astronaut cat floating in deep space',
    color: 'rgba(59,130,246,0.7)',
    delay: 0.7,
    rot: '2deg',
    top: '38%',
    left: '20%',
  },
  {
    emoji: '🏔️',
    label: 'Glass cabin in a snowy pine forest',
    color: 'rgba(139,92,246,0.7)',
    delay: 1.4,
    rot: '-1.5deg',
    top: '63%',
    left: '5%',
  },
];

const FEATURES = [
  { icon: Zap,    label: 'FLUX.1 & SDXL models' },
  { icon: Image,  label: 'Instant HD generation' },
  { icon: Layers, label: 'Session-based history' },
];

/* ─── Animation variants ────────────────────────────────────────────────────── */
const panelVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const fieldVariants = {
  hidden:  { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', marginBottom: 16, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
};

const errorVariants = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
export const AuthPage = () => {
  const [isLogin, setIsLogin]           = useState(true);
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username.trim()) throw new Error('Username is required');
        await register(username.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-root">
      {/* Theme toggle — top right corner */}
      <motion.button
        type="button"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </motion.button>
      {/* ── Left: Form Panel ───────────────────────────────────────────────── */}
      <motion.div
        className="auth-form-panel"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="auth-inner">
          {/* Logo */}
          <div className="auth-logo-row">
            <div className="auth-logo-badge">
              <Sparkles size={22} />
            </div>
            <span className="auth-logo-name gradient-text">ImagiFlow</span>
          </div>

          {/* Heading */}
          <div className="auth-heading">
            <h1>{isLogin ? 'Welcome back' : 'Create account'}</h1>
            <p className="auth-sub">
              {isLogin
                ? 'Sign in to continue generating'
                : 'Join thousands creating AI art daily'}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-error"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  key="username-field"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="input-group"
                  style={{ overflow: 'hidden', marginBottom: 0 }}
                >
                  <label className="input-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="input-field"
                    placeholder="e.g. johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>

          <div className="auth-footer-row">
            <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
            <button type="button" className="auth-link-btn" onClick={toggleMode}>
              {isLogin ? 'Create one now' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Right: Showcase Panel ──────────────────────────────────────────── */}
      <div className="auth-showcase-panel">
        {/* Animated gradient orbs */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        {/* Floating example cards */}
        {SHOWCASE_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="auth-showcase-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + item.delay * 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              top: item.top,
              left: item.left,
              '--rot': item.rot,
              animationDelay: `${item.delay}s`,
            }}
          >
            <div className="auth-showcase-emoji" style={{ background: item.color }}>
              {item.emoji}
            </div>
            <p className="auth-showcase-label">{item.label}</p>
          </motion.div>
        ))}

        {/* Center content */}
        <div className="auth-showcase-center">
          <motion.div
            className="auth-showcase-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sparkles size={28} className="animate-pulse-glow" />
          </motion.div>
          <motion.h2
            className="auth-showcase-headline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Create stunning<br />AI images instantly
          </motion.h2>
          <motion.p
            className="auth-showcase-desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Powered by FLUX.1, SDXL, and Dreamshaper
          </motion.p>
          <motion.div
            className="auth-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
          >
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="auth-feature-item">
                <Icon size={14} />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        .auth-root {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: var(--bg-primary);
          background-image: var(--grad-mesh);
        }

        /* ─ Form panel ─ */
        .auth-form-panel {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          position: relative;
          z-index: 2;
          border-right: 1px solid var(--border-soft);
          background: rgba(8, 9, 16, 0.6);
          backdrop-filter: blur(24px);
        }

        .auth-inner {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .auth-logo-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }

        .auth-logo-badge {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: rgba(124,58,237,0.18);
          border: 1px solid rgba(124,58,237,0.35);
          color: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(124,58,237,0.2);
        }

        .auth-logo-name {
          font-family: var(--font-display);
          font-size: var(--font-size-xl);
          font-weight: 800;
          letter-spacing: var(--tracking-tight);
        }

        .auth-heading {
          margin-bottom: var(--space-6);
        }

        .auth-heading h1 {
          font-size: var(--font-size-2xl);
          color: #fff;
          margin-bottom: var(--space-1);
        }

        .auth-sub {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }

        .auth-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-4);
          line-height: var(--leading-snug);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }

        .auth-password-wrap {
          position: relative;
        }

        .auth-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: var(--radius-xs);
          transition: color var(--transition-fast);
        }
        .auth-eye-btn:hover { color: var(--text-secondary); }

        .auth-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 13px;
          margin-top: var(--space-2);
          font-size: var(--font-size-base);
          border-radius: var(--radius-md);
        }

        .auth-footer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--text-muted);
        }

        .auth-link-btn {
          color: var(--accent-soft);
          font-weight: 500;
          transition: color var(--transition-fast);
        }
        .auth-link-btn:hover { color: #fff; text-decoration: underline; }

        /* ─ Showcase panel ─ */
        .auth-showcase-panel {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0d0b1a 0%, #0a0f1e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .auth-orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%);
          top: -10%; left: -5%;
          animation: meshFloat 12s ease-in-out infinite;
        }
        .auth-orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
          bottom: 5%; right: 0%;
          animation: meshFloat 16s ease-in-out infinite reverse;
        }
        .auth-orb-3 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
          top: 50%; left: 40%;
          animation: meshFloat 10s ease-in-out infinite;
          animation-delay: -5s;
        }

        .auth-showcase-center {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-5);
        }

        .auth-showcase-badge {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-xl);
          background: rgba(124,58,237,0.2);
          border: 1px solid rgba(124,58,237,0.35);
          color: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(124,58,237,0.25);
        }

        .auth-showcase-headline {
          font-size: var(--font-size-2xl);
          color: #fff;
          font-weight: 800;
          letter-spacing: var(--tracking-tight);
          line-height: var(--leading-tight);
        }

        .auth-showcase-desc {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          letter-spacing: 0.01em;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          align-items: flex-start;
        }

        .auth-feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-soft);
        }
        .auth-feature-item svg { color: var(--accent-soft); }

        /* Floating cards */
        .auth-showcase-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: rgba(14,16,28,0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-glass);
          max-width: 240px;
          animation: float 5s ease-in-out infinite;
          transform: rotate(var(--rot, 0deg));
          z-index: 2;
        }

        .auth-showcase-emoji {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .auth-showcase-label {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          line-height: var(--leading-snug);
        }

        /* ─ Theme toggle on auth page ─ */
        .auth-theme-toggle {
          position: fixed;
          top: max(var(--space-4), var(--sat));
          right: max(var(--space-4), var(--sar));
          z-index: 100;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-glass);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .auth-theme-toggle:hover {
          color: var(--accent-soft);
          border-color: rgba(124,58,237,0.35);
          background: rgba(124,58,237,0.1);
        }

        /* ─ Light-mode showcase tweaks ─ */
        [data-theme='light'] .auth-showcase-panel {
          background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
        }
        [data-theme='light'] .auth-orb-1 {
          background: radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%);
        }
        [data-theme='light'] .auth-orb-2 {
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
        }
        [data-theme='light'] .auth-showcase-headline { color: #1a1b2e; }
        [data-theme='light'] .auth-showcase-desc { color: #4b5068; }
        [data-theme='light'] .auth-showcase-card {
          background: rgba(255,255,255,0.8);
          border-color: rgba(0,0,0,0.08);
        }
        [data-theme='light'] .auth-showcase-label { color: #4b5068; }
        [data-theme='light'] .auth-form-panel {
          background: rgba(255,255,255,0.75);
          border-right-color: var(--border);
        }

        /* ─ Responsive ─ */
        @media (max-width: 900px) {
          .auth-root { height: 100vh; height: 100dvh; }
          .auth-form-panel {
            width: 100%;
            border-right: none;
            padding: var(--space-6) var(--space-4);
            padding-top: max(var(--space-6), var(--sat));
            padding-bottom: max(var(--space-6), var(--sab));
            overflow-y: auto;
          }
          .auth-showcase-panel { display: none; }
        }

        @media (max-width: 480px) {
          .auth-form-panel { padding: var(--space-5) var(--space-4); }
          .auth-inner { max-width: 100%; }
          .auth-logo-row { margin-bottom: var(--space-5); }
          .auth-heading { margin-bottom: var(--space-4); }
          .auth-heading h1 { font-size: var(--font-size-xl); }
          .input-field { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
