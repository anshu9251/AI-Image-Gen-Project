import React, { useState } from 'react';
import {
  Plus, Trash2, Edit2, LogOut, Image, MessageSquare,
  Check, X, Menu, ChevronLeft, ChevronRight, Sparkles, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ─── Animation variants ────────────────────────────────────────────────────── */
const sidebarVariants = {
  expanded: { width: 'var(--sidebar-width-expanded)' },
  collapsed: { width: 'var(--sidebar-width-collapsed)' },
};

const labelVariants = {
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.05 } },
  hidden: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

const listContainerVariants = {
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
export const Sidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
  viewMode,
  setViewMode,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  /* Rename helpers — unchanged logic */
  const startEditing = (e, session) => { e.stopPropagation(); setEditingId(session._id); setEditTitle(session.title); };
  const cancelEditing = (e) => { e.stopPropagation(); setEditingId(null); setEditTitle(''); };
  const saveEditing = async (e, sessionId) => {
    e.stopPropagation();
    if (editTitle.trim()) await onUpdateSession(sessionId, editTitle.trim());
    setEditingId(null); setEditTitle('');
  };
  const handleKeyDown = (e, sessionId) => {
    if (e.key === 'Enter') saveEditing(e, sessionId);
    else if (e.key === 'Escape') cancelEditing(e);
  };

  const isGalleryActive = viewMode === 'history';

  return (
    <>
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <motion.div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        variants={sidebarVariants}
        animate={collapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sparkles size={18} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="sidebar-brand-name gradient-text"
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  ImagiFlow
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle — hidden on mobile */}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* ── New session button ─────────────────────────────────────────── */}
        <div className="sidebar-new-btn-wrap">
          <motion.button
            type="button"
            className="sidebar-new-btn"
            onClick={() => {
              onCreateSession();
              setViewMode('chat');
              if (window.innerWidth <= 768) setIsOpen(false);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            title="New Generation"
          >
            <Plus size={16} className="sidebar-new-icon" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  New Generation
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Nav items ─────────────────────────────────────────────────── */}
        <div className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-nav-item ${isGalleryActive ? 'active' : ''}`}
            onClick={() => {
              setViewMode('history');
              onSelectSession(null);
              if (window.innerWidth <= 768) setIsOpen(false);
            }}
            title="Global Gallery"
          >
            <Image size={17} className="sidebar-nav-icon" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="sidebar-nav-label"
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  Global Gallery
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {!collapsed && (
            <div className="sidebar-section-label">Sessions</div>
          )}
          {collapsed && <div className="sidebar-divider" />}
        </div>

        {/* ── Session list ───────────────────────────────────────────────── */}
        <div className="sidebar-list">
          {sessions.length === 0 ? (
            !collapsed && (
              <div className="sidebar-empty">
                <MessageSquare size={20} className="sidebar-empty-icon" />
                <span>No sessions yet</span>
                <span className="sidebar-empty-hint">Click "New Generation" to start</span>
              </div>
            )
          ) : (
            <motion.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="sidebar-list-inner"
            >
              {sessions.map((session) => {
                const isActive = activeSessionId === session._id && viewMode === 'chat';
                const isEditing = editingId === session._id;

                return (
                  <motion.div
                    key={session._id}
                    variants={listItemVariants}
                    className={`sidebar-session ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        setViewMode('chat');
                        onSelectSession(session._id);
                        if (window.innerWidth <= 768) setIsOpen(false);
                      }
                    }}
                    title={collapsed ? session.title : undefined}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <MessageSquare size={15} className="session-icon" />

                    {!collapsed && (
                      isEditing ? (
                        <div className="session-edit-wrap" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            className="session-edit-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, session._id)}
                            autoFocus
                          />
                          <button type="button" className="session-edit-btn confirm" onClick={(e) => saveEditing(e, session._id)}>
                            <Check size={13} />
                          </button>
                          <button type="button" className="session-edit-btn cancel" onClick={cancelEditing}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="session-title">{session.title}</span>
                          <div className="session-actions">
                            <button
                              type="button"
                              className="session-action edit"
                              onClick={(e) => startEditing(e, session)}
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="session-action delete"
                              onClick={(e) => { e.stopPropagation(); onDeleteSession(session._id); }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="sidebar-user-info"
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <span className="sidebar-username">{user?.username || 'User'}</span>
                  <span className="sidebar-email">{user?.email || ''}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="sidebar-footer-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={logout}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        .sidebar {
          height: 100%;
          border-right: 1px solid var(--border-soft);
          background: var(--bg-sidebar);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* ─ Mobile toggle ─ */
        .mobile-nav-toggle {
          display: none;
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          z-index: 110;
          padding: 8px;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
        }

        /* ─ Header ─ */
        .sidebar-header {
          padding: var(--space-5) var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          border-bottom: 1px solid var(--border-soft);
          flex-shrink: 0;
          min-height: 64px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          overflow: hidden;
          min-width: 0;
        }

        .sidebar-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: rgba(124,58,237,0.18);
          border: 1px solid rgba(124,58,237,0.3);
          color: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 16px rgba(124,58,237,0.15);
        }

        .sidebar-brand-name {
          font-family: var(--font-display);
          font-size: var(--font-size-lg);
          font-weight: 800;
          letter-spacing: var(--tracking-tight);
          white-space: nowrap;
        }

        .sidebar-collapse-btn {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-xs);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .sidebar-collapse-btn:hover {
          color: var(--text-primary);
          background: var(--bg-sidebar-item);
        }

        /* ─ New button ─ */
        .sidebar-new-btn-wrap {
          padding: var(--space-4) var(--space-3);
          flex-shrink: 0;
        }

        .sidebar-new-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--grad-accent);
          color: #fff;
          font-weight: 600;
          font-size: var(--font-size-sm);
          box-shadow: var(--shadow-accent);
          white-space: nowrap;
          overflow: hidden;
          transition: box-shadow var(--transition-fast);
        }
        .sidebar-new-btn:hover { box-shadow: var(--shadow-accent-lg); filter: brightness(1.08); }

        .sidebar-new-icon { flex-shrink: 0; }

        /* ─ Nav ─ */
        .sidebar-nav {
          padding: 0 var(--space-3);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: var(--font-size-sm);
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          transition: all var(--transition-fast);
          border: 1px solid transparent;
        }
        .sidebar-nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-sidebar-item);
        }
        .sidebar-nav-item.active {
          background: var(--grad-accent);
          color: #fff;
          border-color: transparent;
          box-shadow: var(--shadow-accent);
        }

        .sidebar-nav-icon { flex-shrink: 0; }
        .sidebar-nav-label { flex: 1; }

        .sidebar-section-label {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          color: var(--text-muted);
          font-weight: 600;
          padding: var(--space-4) var(--space-3) var(--space-1);
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border-soft);
          margin: var(--space-3) var(--space-2);
        }

        /* ─ Session list ─ */
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 var(--space-3) var(--space-3);
        }

        .sidebar-list-inner {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sidebar-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-8) 0;
          color: var(--text-muted);
          font-size: var(--font-size-sm);
          text-align: center;
        }
        .sidebar-empty-icon { opacity: 0.4; margin-bottom: var(--space-1); }
        .sidebar-empty-hint {
          font-size: var(--font-size-xs);
          color: var(--text-disabled);
          max-width: 160px;
        }

        .sidebar-session {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 9px 10px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background var(--transition-fast), color var(--transition-fast);
          border: 1px solid transparent;
        }
        .sidebar-session:hover {
          color: var(--text-primary);
          background: var(--bg-sidebar-item);
        }
        .sidebar-session.active {
          color: var(--text-primary);
          background: rgba(124,58,237,0.16);
          border-color: rgba(124,58,237,0.35);
          font-weight: 600;
        }
        [data-theme='dark'] .sidebar-session.active {
          color: #ffffff;
        }

        .session-icon { flex-shrink: 0; opacity: 0.6; }
        .sidebar-session.active .session-icon { opacity: 1; color: var(--accent-soft); }

        .session-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .session-actions {
          display: none;
          gap: 2px;
          position: absolute;
          right: 8px;
          background: linear-gradient(90deg, transparent 0%, var(--bg-sidebar) 30%);
          padding-left: 20px;
          height: 100%;
          align-items: center;
          top: 0;
        }
        .sidebar-session:hover .session-actions { display: flex; }

        .session-action {
          color: var(--text-muted);
          padding: 4px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .session-action:hover { color: var(--text-primary); background: var(--bg-sidebar-item); }
        .session-action.delete:hover { color: var(--status-error); background: rgba(239,68,68,0.12); }

        .session-edit-wrap {
          display: flex;
          align-items: center;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .session-edit-input {
          flex: 1;
          min-width: 0;
          background: var(--bg-input);
          border: 1px solid var(--border-focus);
          border-radius: var(--radius-xs);
          padding: 2px 6px;
          font-family: var(--font-sans);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          outline: none;
        }
        .session-edit-btn {
          padding: 3px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .session-edit-btn.confirm { color: var(--status-success); }
        .session-edit-btn.confirm:hover { background: rgba(16,185,129,0.12); }
        .session-edit-btn.cancel { color: var(--text-muted); }
        .session-edit-btn.cancel:hover { background: var(--bg-sidebar-item); }

        /* ─ Footer ─ */
        .sidebar-footer {
          padding: var(--space-3) var(--space-3);
          border-top: 1px solid var(--border-soft);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          flex-shrink: 0;
          min-height: 60px;
        }

        .sidebar-footer-actions {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          flex-shrink: 0;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }

        .sidebar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--grad-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--font-size-xs);
          flex-shrink: 0;
          letter-spacing: 0.04em;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .sidebar-username {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-email {
          font-size: var(--font-size-xs);
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout-btn {
          color: var(--text-muted);
          padding: 7px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .sidebar-logout-btn:hover { color: var(--status-error); background: rgba(239,68,68,0.1); }

        /* ─ Mobile ─ */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            bottom: 0;
            height: 100dvh;
            transform: translateX(-105%);
            width: min(285px, 86vw) !important;
            box-shadow: 12px 0 40px rgba(0, 0, 0, 0.5);
            transition: transform var(--transition-normal) !important;
            padding-top: max(var(--space-2), var(--sat));
            padding-bottom: max(var(--space-2), var(--sab));
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .sidebar-collapse-btn { display: none; }
          .sidebar-session { padding: 11px 12px; min-height: 42px; }
          .sidebar-nav-item { padding: 12px 14px; min-height: 44px; }
          .sidebar-new-btn { padding: 12px 16px; min-height: 44px; }
          .sidebar-logout-btn { width: 40px; height: 40px; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
