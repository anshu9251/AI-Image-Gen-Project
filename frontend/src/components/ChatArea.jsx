import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Download, RefreshCw, Search, Loader2,
  Sparkles, AlertCircle, X, ChevronRight, Image, Wand2, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

/* ─── Prompt suggestions ─────────────────────────────────────────────────────── */
const PROMPT_SUGGESTIONS = [
  "A futuristic cyberpunk cityscape at night, neon holographic billboards, flying cars, rainy streets with reflections, cinematic lighting",
  "An oil painting of a cute astronaut cat floating in deep space, holding a tiny glowing star, mystical galaxy background, vibrant colors",
  "A cozy glass cabin in the middle of a snowy pine forest, warm yellow lights glowing from inside, northern lights in the starry sky",
  "Macro photography of a fantasy glass butterfly sitting on a glowing crystal flower, magical sparkles, soft purple and blue ambient lighting",
];

/* ─── Animation variants ─────────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const imageRevealVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const galleryContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const galleryCardVariants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const errorVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const lightboxVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ─── Component ──────────────────────────────────────────────────────────────── */
export const ChatArea = ({ activeSessionId, viewMode, activeSessionTitle, onToggleSidebar }) => {
  const [messages, setMessages] = useState([]);
  const [historyImages, setHistoryImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gallery Pagination & Search States
  const [historyLimit] = useState(12);
  const [historySkip, setHistorySkip] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Lightbox View State
  const [lightboxImage, setLightboxImage] = useState(null);

  const messagesEndRef = useRef(null);

  /* ── Data loading — logic UNCHANGED ─────────────────────────────────────── */
  useEffect(() => {
    if (viewMode === 'chat' && activeSessionId) loadSessionMessages();
  }, [activeSessionId, viewMode]);

  useEffect(() => {
    if (viewMode === 'history') loadHistory(true);
  }, [viewMode, searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionMessages = async () => {
    setError('');
    try {
      const images = await api.images.getSessionImages(activeSessionId);
      const formattedMessages = [];
      images.forEach((img, idx) => {
        formattedMessages.push({ id: `prompt-${img._id || idx}`, type: 'user', content: img.prompt, timestamp: img.created_at });
        formattedMessages.push({ id: `image-${img._id || idx}`, type: 'ai', content: img.image_url, prompt: img.prompt, timestamp: img.created_at, imageObj: img });
      });
      setMessages(formattedMessages);
    } catch (err) {
      setError('Failed to load messages: ' + err.message);
    }
  };

  const loadHistory = async (reset = false) => {
    setGalleryLoading(true);
    setError('');
    const newSkip = reset ? 0 : historySkip;
    try {
      const list = await api.images.getHistory(historyLimit, newSkip);
      if (reset) { setHistoryImages(list); setHistorySkip(list.length); }
      else { setHistoryImages(prev => [...prev, ...list]); setHistorySkip(newSkip + list.length); }
      setHasMoreHistory(list.length === historyLimit);
    } catch (err) {
      setError('Failed to load gallery: ' + err.message);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSend = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || prompt;
    if (!promptToSend.trim() || !activeSessionId || loading) return;
    setError('');
    setLoading(true);
    if (!customPrompt) setPrompt('');
    const tempUserMsgId = `temp-user-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempUserMsgId, type: 'user', content: promptToSend, timestamp: new Date().toISOString() }]);
    try {
      const generatedImage = await api.images.generate(activeSessionId, promptToSend);
      setMessages(prev => [...prev, { id: `image-${generatedImage._id}`, type: 'ai', content: generatedImage.image_url, prompt: generatedImage.prompt, timestamp: generatedImage.created_at, imageObj: generatedImage }]);
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = (originalPrompt) => handleSend(null, originalPrompt);

  const handleDownload = (base64Data, filenamePrompt) => {
    const link = document.createElement('a');
    link.href = base64Data;
    const name = filenamePrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    link.download = `imagiflow-${name || 'image'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = historyImages.filter(img =>
    img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="chat-container">

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            className="lightbox-overlay"
            variants={lightboxVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setLightboxImage(null)}
          >
            <motion.button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxImage(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.93 }}
            >
              <X size={20} />
            </motion.button>
            <motion.div
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2 } }}
            >
              <img src={lightboxImage.image_url} alt={lightboxImage.prompt} />
              <div className="lightbox-footer glass-panel">
                <p className="lightbox-prompt">{lightboxImage.prompt}</p>
                <div className="lightbox-meta">
                  <span>{new Date(lightboxImage.created_at).toLocaleString()}</span>
                  <button
                    type="button"
                    className="btn-primary lightbox-dl-btn"
                    onClick={() => handleDownload(lightboxImage.image_url, lightboxImage.prompt)}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="chat-header">
        <button
          type="button"
          className="mobile-header-toggle"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        <div className="chat-header-info">
          {viewMode === 'chat' ? (
            <>
              <div className="chat-header-icon">
                <Wand2 size={16} />
              </div>
              <h3 className="chat-header-title">
                {activeSessionTitle || 'Select or create a session'}
              </h3>
              <span className="chat-model-badge">FLUX.1 Active</span>
            </>
          ) : (
            <>
              <div className="chat-header-icon gallery-icon">
                <Image size={16} />
              </div>
              <h3 className="chat-header-title">Global Creative Gallery</h3>
            </>
          )}
        </div>

        {viewMode === 'history' && (
          <div className="chat-search-bar">
            <Search size={14} className="chat-search-icon" />
            <input
              type="text"
              placeholder="Search prompts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </header>

      {/* ── Main workspace ─────────────────────────────────────────────────── */}
      <div className="workspace-area">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CHAT MODE ─────────────────────────────────────────────────── */}
        {viewMode === 'chat' ? (
          !activeSessionId ? (
            /* No session selected */
            <motion.div
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="empty-state-icon">🌌</div>
              <h2>Create a session to start generating</h2>
              <p>Your session stores your prompt history so you can iterate on visual ideas.</p>
            </motion.div>
          ) : messages.length === 0 && !loading ? (
            /* Welcome / empty session */
            <motion.div
              className="welcome-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="welcome-hero">
                <motion.div
                  className="welcome-sparkle"
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles size={32} />
                </motion.div>
                <h1 className="welcome-title gradient-text">Create Magic</h1>
                <p className="welcome-desc">
                  Describe what you want to see. The AI engine will render high-fidelity art instantly.
                </p>
              </div>

              <motion.div
                className="suggestions-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <motion.div
                    key={idx}
                    className="suggestion-card"
                    variants={cardVariants}
                    onClick={() => handleSend(null, sug)}
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-glass-hover)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="suggestion-text">{sug}</p>
                    <ChevronRight size={15} className="suggestion-arrow" />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* Messages list */
            <div className="messages-list">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`message-bubble ${msg.type}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    {msg.type === 'user' ? (
                      <div className="bubble-text">{msg.content}</div>
                    ) : (
                      <motion.div
                        className="image-bubble-card glass-panel"
                        variants={imageRevealVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <div
                          className="image-wrapper"
                          onClick={() => setLightboxImage(msg.imageObj)}
                          title="Click to expand"
                        >
                          <img src={msg.content} alt={msg.prompt} loading="lazy" />
                          <div className="image-expand-hint">
                            <Search size={16} />
                          </div>
                        </div>
                        <div className="image-card-footer">
                          <span className="card-prompt">{msg.prompt}</span>
                          <div className="image-actions">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleRegenerate(msg.prompt)}
                              title="Regenerate"
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleDownload(msg.content, msg.prompt)}
                              title="Download"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Skeleton loader while generating */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    className="message-bubble ai"
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <div className="image-bubble-card glass-panel skeleton-card">
                      <div className="skeleton-body">
                        <div className="skeleton-spinner-wrap">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles size={28} className="skeleton-spark" />
                          </motion.div>
                        </div>
                        <div className="skeleton-lines">
                          <div className="skeleton-line shimmer-bg" style={{ width: '60%' }} />
                          <div className="skeleton-line shimmer-bg" style={{ width: '40%' }} />
                        </div>
                        <p className="skeleton-text">Generating with FLUX.1<span className="skeleton-ellipsis" /></p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )
        ) : (
          /* ── GALLERY MODE ───────────────────────────────────────────────── */
          <div className="gallery-view">
            {galleryLoading && filteredHistory.length === 0 ? (
              <div className="empty-state">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-soft)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>
                  Loading gallery…
                </p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="empty-state-icon">🎨</div>
                <h2>No generations found</h2>
                <p>
                  {searchQuery
                    ? 'Try modifying your search query.'
                    : 'Generate images in chat sessions to build your gallery.'}
                </p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="gallery-grid"
                  variants={galleryContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredHistory.map((img) => (
                    <motion.div
                      key={img._id}
                      className="gallery-card glass-panel"
                      variants={galleryCardVariants}
                      whileHover={{ y: -6, boxShadow: 'var(--shadow-glass-hover)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="gallery-img-wrap" onClick={() => setLightboxImage(img)}>
                        <img src={img.image_url} alt={img.prompt} loading="lazy" />
                        <div className="gallery-img-overlay">
                          <Search size={18} />
                        </div>
                      </div>
                      <div className="gallery-card-info">
                        <span className="gallery-prompt">{img.prompt}</span>
                        <button
                          type="button"
                          className="btn-icon gallery-dl-btn"
                          onClick={() => handleDownload(img.image_url, img.prompt)}
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {hasMoreHistory && !searchQuery && (
                  <div className="gallery-load-more">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => loadHistory(false)}
                      disabled={galleryLoading}
                    >
                      {galleryLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                      {galleryLoading ? 'Loading…' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Prompt input footer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {viewMode === 'chat' && activeSessionId && (
          <motion.footer
            className="chat-footer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSend} className="prompt-form">
              <textarea
                className="prompt-textarea"
                placeholder="Describe the image you want to create…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                disabled={loading}
              />
              <motion.button
                type="submit"
                className={`generate-btn ${loading ? 'generating' : ''}`}
                disabled={loading || !prompt.trim()}
                whileTap={{ scale: 0.96 }}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={15} />
                    </motion.div>
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-primary) 100%);
    position: relative;
    min-width: 0;
  }

  /* ─ Header ─ */
  .chat-header {
    padding: 0 var(--space-8);
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    border-bottom: 1px solid var(--border-soft);
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    flex-shrink: 0;
    z-index: 10;
  }

  .mobile-header-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--bg-sidebar-item);
    border: 1px solid var(--border);
    color: var(--text-primary);
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .mobile-header-toggle:hover {
    background: var(--border-soft);
  }

  .chat-header-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    flex: 1;
  }

  .chat-header-icon {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    background: rgba(124,58,237,0.15);
    border: 1px solid rgba(124,58,237,0.25);
    color: var(--accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .gallery-icon {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.22);
    color: #60a5fa;
  }

  .chat-header-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: var(--tracking-normal);
  }

  .chat-model-badge {
    flex-shrink: 0;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.25);
    color: var(--accent-soft);
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .chat-search-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 7px 14px;
    width: 240px;
    flex-shrink: 0;
    transition: border-color var(--transition-fast);
  }
  .chat-search-bar:focus-within {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }
  .chat-search-icon { color: var(--text-muted); flex-shrink: 0; }
  .chat-search-bar input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-family: var(--font-sans);
    width: 100%;
  }
  .chat-search-bar input::placeholder { color: var(--text-muted); }

  /* ─ Workspace ─ */
  .workspace-area {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-8);
    display: flex;
    flex-direction: column;
  }

  /* ─ Error banner ─ */
  .error-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    color: #fca5a5;
    padding: 12px 18px;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-6);
    flex-shrink: 0;
  }

  /* ─ Empty / no-session state ─ */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-secondary);
    gap: var(--space-3);
  }
  .empty-state-icon { font-size: 3.5rem; line-height: 1; margin-bottom: var(--space-2); }
  .empty-state h2 { font-size: var(--font-size-xl); color: var(--text-primary); }
  .empty-state p  { max-width: 380px; font-size: var(--font-size-sm); line-height: var(--leading-relaxed); }

  /* ─ Welcome state ─ */
  .welcome-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    gap: var(--space-10);
  }

  .welcome-hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .welcome-sparkle {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    background: rgba(124,58,237,0.15);
    border: 1px solid rgba(124,58,237,0.3);
    color: var(--accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 24px rgba(124,58,237,0.2);
    margin-bottom: var(--space-2);
  }

  .welcome-title {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-1);
  }

  .welcome-desc {
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    max-width: 440px;
    line-height: var(--leading-relaxed);
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    width: 100%;
  }

  .suggestion-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-backdrop);
    -webkit-backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    text-align: left;
    transition: border-color var(--transition-fast);
  }
  .suggestion-card:hover { border-color: rgba(124,58,237,0.35); }

  .suggestion-text {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
    flex: 1;
  }
  .suggestion-card:hover .suggestion-text { color: var(--text-primary); }

  .suggestion-arrow {
    color: var(--text-muted);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .suggestion-card:hover .suggestion-arrow { color: var(--accent-soft); }

  /* ─ Messages ─ */
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
  }

  .message-bubble {
    display: flex;
    flex-direction: column;
  }
  .message-bubble.user { align-items: flex-end; }
  .message-bubble.ai   { align-items: flex-start; }

  .bubble-text {
    background: var(--bg-bubble-user);
    border: 1px solid rgba(124,58,237,0.2);
    padding: 12px 18px;
    border-radius: var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg);
    max-width: 78%;
    font-size: var(--font-size-base);
    line-height: var(--leading-relaxed);
    color: var(--text-primary);
  }

  .image-bubble-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    width: 460px;
    max-width: 100%;
  }

  .image-wrapper {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(0,0,0,0.2);
    cursor: pointer;
    overflow: hidden;
    position: relative;
  }
  .image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);
  }
  .image-wrapper:hover img { transform: scale(1.04); }

  .image-expand-hint {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0);
    color: #fff;
    opacity: 0;
    transition: all var(--transition-normal);
  }
  .image-wrapper:hover .image-expand-hint {
    background: rgba(0,0,0,0.3);
    opacity: 1;
  }

  .image-card-footer {
    padding: var(--space-4);
    background: var(--bg-glass);
    border-top: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .card-prompt {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .image-actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  /* ─ Skeleton loader ─ */
  .skeleton-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    width: 460px;
    max-width: 100%;
  }

  .skeleton-body {
    padding: var(--space-10) var(--space-8);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    background: rgba(0,0,0,0.25);
    min-height: 200px;
    justify-content: center;
  }

  .skeleton-spinner-wrap {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    background: rgba(124,58,237,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .skeleton-spark { color: var(--accent-soft); }

  .skeleton-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
  }

  .skeleton-line {
    height: 10px;
    border-radius: var(--radius-full);
    margin: 0 auto;
  }

  .skeleton-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  .skeleton-ellipsis::after {
    content: '...';
    display: inline-block;
    animation: ellipsis 1.5s steps(3, end) infinite;
    width: 1.2em;
    text-align: left;
  }
  @keyframes ellipsis {
    0%  { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }

  /* ─ Gallery ─ */
  .gallery-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    width: 100%;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: var(--space-5);
    width: 100%;
  }

  .gallery-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }
  .gallery-card:hover { border-color: var(--border-strong); }

  .gallery-img-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    position: relative;
  }
  .gallery-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);
  }
  .gallery-card:hover .gallery-img-wrap img { transform: scale(1.06); }

  .gallery-img-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0);
    color: #fff;
    opacity: 0;
    transition: all var(--transition-normal);
  }
  .gallery-card:hover .gallery-img-overlay {
    background: rgba(0,0,0,0.35);
    opacity: 1;
  }

  .gallery-card-info {
    padding: 10px 12px;
    background: var(--bg-glass);
    border-top: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .gallery-prompt {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .gallery-dl-btn { opacity: 0.55; }
  .gallery-dl-btn:hover { opacity: 1; color: var(--accent-soft); }

  .gallery-load-more {
    display: flex;
    justify-content: center;
    padding: var(--space-4) 0;
  }

  /* ─ Prompt footer ─ */
  .chat-footer {
    padding: var(--space-4) var(--space-8);
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border-soft);
    flex-shrink: 0;
    z-index: 10;
  }

  .prompt-form {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    gap: var(--space-3);
    align-items: flex-end;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-2) var(--space-3);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
  .prompt-form:focus-within {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  .prompt-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    resize: none;
    font-family: var(--font-sans);
    font-size: var(--font-size-base);
    max-height: 120px;
    min-height: 26px;
    line-height: var(--leading-normal);
    padding: 7px var(--space-2);
  }
  .prompt-textarea::placeholder { color: var(--text-muted); }

  /* Generate button */
  .generate-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 9px 18px;
    border-radius: var(--radius-md);
    background: var(--grad-accent);
    color: #fff;
    font-weight: 600;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
    box-shadow: var(--shadow-accent);
    overflow: hidden;
    transition: box-shadow var(--transition-fast), filter var(--transition-fast), opacity var(--transition-fast);
  }
  .generate-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-accent-lg);
  }
  .generate-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .generate-btn.generating {
    opacity: 0.85;
  }
  .generate-btn.generating::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  /* ─ Lightbox ─ */
  .lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
  }

  .lightbox-close {
    position: absolute;
    top: var(--space-6);
    right: var(--space-6);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast);
  }
  .lightbox-close:hover { background: rgba(255,255,255,0.2); }

  .lightbox-content {
    max-width: min(90vw, 680px);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .lightbox-content img {
    max-height: 70vh;
    width: 100%;
    object-fit: contain;
    border-radius: var(--radius-lg);
    box-shadow: 0 16px 60px rgba(0,0,0,0.6);
  }

  .lightbox-footer {
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-lg);
  }

  .lightbox-prompt {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    margin-bottom: var(--space-3);
    line-height: var(--leading-snug);
  }

  .lightbox-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .lightbox-dl-btn {
    padding: 8px 16px;
    font-size: var(--font-size-sm);
  }

  /* ─ Mobile ─ */
  @media (max-width: 768px) {
    .chat-container {
      height: 100vh;
      height: 100dvh;
    }
    .chat-header {
      padding: 0 var(--space-3);
      padding-top: var(--sat);
      height: calc(56px + var(--sat));
    }
    .mobile-header-toggle {
      display: flex;
    }
    .chat-model-badge {
      display: none;
    }
    .workspace-area {
      padding: var(--space-3);
    }
    .welcome-state {
      padding: var(--space-4) 0;
      gap: var(--space-6);
    }
    .welcome-title {
      font-size: 1.4rem;
    }
    .welcome-desc {
      font-size: var(--font-size-xs);
    }
    .suggestions-grid {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }
    .suggestion-card {
      padding: var(--space-3);
    }
    .message-bubble.user .bubble-text {
      max-width: 88%;
      font-size: var(--font-size-sm);
      padding: 10px 14px;
    }
    .image-bubble-card, .skeleton-card {
      width: 100%;
    }
    .image-card-footer {
      padding: var(--space-3);
      gap: var(--space-2);
    }
    .chat-search-bar {
      display: none;
    }
    .chat-footer {
      padding: var(--space-2) var(--space-3) calc(var(--space-2) + var(--sab)) var(--space-3);
    }
    .prompt-form {
      padding: 6px var(--space-2);
      gap: 6px;
    }
    .prompt-textarea {
      font-size: 16px !important;
      padding: 5px var(--space-1);
    }
    .generate-btn {
      padding: 8px 14px;
      font-size: var(--font-size-xs);
    }
    .lightbox-overlay {
      padding: 12px;
      padding-top: max(16px, var(--sat));
      padding-bottom: max(16px, var(--sab));
    }
    .lightbox-close {
      top: max(12px, var(--sat));
      right: 12px;
      width: 36px;
      height: 36px;
    }
    .lightbox-content {
      max-width: 100%;
      gap: var(--space-2);
    }
    .lightbox-content img {
      max-height: 60dvh;
    }
    .lightbox-footer {
      padding: var(--space-3);
    }
    .lightbox-prompt {
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-2);
    }
  }

  @media (max-width: 640px) {
    .gallery-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }
    .gallery-card-info {
      padding: 6px 8px;
    }
  }
`}</style>
    </div>
  );
};

export default ChatArea;
