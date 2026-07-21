import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import api from './services/api';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Page transition variants ──────────────────────────────────────────────── */
const pageVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

/* ─── Premium loading screen ─────────────────────────────────────────────────── */
const AppLoader = ({ text = 'Loading…' }) => (
  <motion.div
    className="app-loader"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="app-loader-logo"
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Sparkles size={28} />
    </motion.div>
    <span className="app-loader-title gradient-text">ImagiFlow</span>
    <div className="app-loader-bar">
      <div className="app-loader-bar-fill" />
    </div>
    <span className="app-loader-text">{text}</span>
  </motion.div>
);

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const [sessions, setSessions]             = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [viewMode, setViewMode]             = useState('chat'); // 'chat' | 'history'
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const list = await api.sessions.list();
      setSessions(list);
      // Auto-select the first session if available and no active session is selected
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const title = `New Generation ${sessions.length + 1}`;
      const newSession = await api.sessions.create(title);
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
    } catch (err) {
      alert('Error creating session: ' + err.message);
    }
  };

  const handleUpdateSession = async (sessionId, newTitle) => {
    try {
      const updated = await api.sessions.update(sessionId, newTitle);
      setSessions(prev => prev.map(s => s._id === sessionId ? updated : s));
    } catch (err) {
      alert('Error renaming session: ' + err.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session and all generated images?')) return;
    try {
      await api.sessions.delete(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));

      // If we deleted the currently active session, pick another one
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s._id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0]._id);
        } else {
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      alert('Error deleting session: ' + err.message);
    }
  };

  const activeSession = sessions.find(s => s._id === activeSessionId);

  if (initialLoading) {
    return <AppLoader text="Syncing sessions…" />;
  }

  return (
    <motion.div
      className="dashboard-container"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Mobile sidebar overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onUpdateSession={handleUpdateSession}
        onDeleteSession={handleDeleteSession}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <ChatArea
        activeSessionId={activeSessionId}
        activeSessionTitle={activeSession?.title}
        viewMode={viewMode}
      />
    </motion.div>
  );
};

/* ─── AppContent (auth gate) ─────────────────────────────────────────────────── */
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoader text="Authenticating…" />;
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <Dashboard key="dashboard" />
      ) : (
        <motion.div
          key="auth"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ width: '100%', height: '100%' }}
        >
          <AuthPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Root ───────────────────────────────────────────────────────────────────── */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
