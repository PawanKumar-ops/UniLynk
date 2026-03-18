import React from 'react';
import { X, MessageCircle, Link as LinkIcon, Check, Search } from 'lucide-react';
import ReliableImage from './ReliableImage';
import './ShareModal.css';

const QUICK_CONTACT_LIMIT = 5;

const getDisplayName = (contact) => {
  const name = typeof contact?.name === 'string' ? contact.name.trim() : '';
  if (name) return name;

  const email = typeof contact?.email === 'string' ? contact.email.trim() : '';
  if (!email) return 'Unknown user';

  return email.split('@')[0];
};

const getInitials = (contact) => {
  const displayName = getDisplayName(contact);
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return '?';

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
};

const ShareModal = ({ isOpen, onClose, postContent, postUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState([]);
  const [topContacts, setTopContacts] = React.useState([]);
  const [loadingTopContacts, setLoadingTopContacts] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setChatMessage('');
      setSearchedContacts([]);
      setLoadingSearchedContacts(false);
      return undefined;
    }

    const controller = new AbortController();

    const loadTopContacts = async () => {
      try {
        setLoadingTopContacts(true);

        const response = await fetch(`/api/chat/top-contacts?limit=${QUICK_CONTACT_LIMIT}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load top contacts');
        }

        setTopContacts(Array.isArray(data.contacts) ? data.contacts : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('TOP CONTACTS LOAD ERROR:', error);
          setTopContacts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTopContacts(false);
        }
      }
    };

    loadTopContacts();

    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToApp = (platform) => {
    const encodedText = encodeURIComponent(postContent);
    const encodedUrl = encodeURIComponent(postUrl);

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
  };

  const handleSendChat = () => {
    if (chatMessage.trim()) {
      setChatMessages([...chatMessages, chatMessage]);
      setChatMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  };

  return (
    <>
      <div className="share-modal-overlay" onClick={onClose} />
      <div className="share-modal-shell">
        <div className="share-modal">
          <div className="share-modal-header">
            <h2>Share Post</h2>
            <button className="share-modal-close-button" onClick={onClose} aria-label="Close">
              <X size={24} />
            </button>
          </div>

          <div className="share-modal-body">
            <div className="share-section">
              <h3>Share to External Apps</h3>
              <div className="share-apps">
                <button className="share-modal-app-button" onClick={() => handleShareToApp('whatsapp')}>
                  <div className="share-modal-app-icon whatsapp">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </button>

                <button className="share-modal-app-button" onClick={() => handleShareToApp('facebook')}>
                  <div className="share-modal-app-icon facebook">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span>Facebook</span>
                </button>

                <button className="share-modal-app-button" onClick={() => handleShareToApp('twitter')}>
                  <div className="share-modal-app-icon twitter">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span>X</span>
                </button>

                <button className="share-modal-app-button" onClick={() => handleShareToApp('telegram')}>
                  <div className="share-modal-app-icon telegram">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <span>Telegram</span>
                </button>

                <button className="share-modal-app-button" onClick={() => handleShareToApp('linkedin')}>
                  <div className="share-modal-app-icon linkedin">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span>LinkedIn</span>
                </button>

                <button className="share-modal-app-button" onClick={() => handleShareToApp('email')}>
                  <div className="share-modal-app-icon email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <span>Email</span>
                </button>
              </div>
            </div>

            <div className="share-section">
              <h3>Copy Link</h3>
              <div className="copy-link-container">
                <input
                  type="text"
                  value={postUrl}
                  readOnly
                  className="link-input"
                />
                <button
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="share-section">
              <h3>Share in Chat</h3>
              <div className="chat-container">
                {chatMessages.length > 0 && (
                  <div className="chat-messages">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="chat-message">
                        <MessageCircle size={16} />
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="chat-input-container">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="chat-input"
                  />
                  <button
                    className="send-button"
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="share-modal-side-box" aria-label="Top contacts quick panel">
          <div className="share-modal-side-box-content">
            <span className="share-modal-side-box-label">Quick panel</span>

            {loadingTopContacts ? (
              <div className="share-modal-side-box-empty">
                <div className="userpostsloadani">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  </div>
                </div>
              </div>
            ) : topContacts.length > 0 ? (
              <div className="share-modal-top-users" role="list">
                {topContacts.map((contact) => {
                  const email = contact?.email || 'No email available';
                  const displayName = getDisplayName(contact);
                  const tooltipId = `share-contact-tooltip-${contact.id}`;

                  return (
                    <div key={contact.id} className="share-modal-top-user" role="listitem">
                      <div className="share-modal-top-user-hover-card">
                        <div className="share-modal-user-trigger-wrap">
                          <button
                            type="button"
                            className="share-modal-top-user-trigger share-modal-top-user-avatar"
                            aria-describedby={tooltipId}
                            title={email}
                          >
                            {contact.image ? (
                              <ReliableImage
                                src={contact.image}
                                alt={`${displayName} profile`}
                                className="share-modal-top-user-image"
                              />
                            ) : (
                              <span className="share-modal-top-user-fallback">{getInitials(contact)}</span>
                            )}
                          </button>

                          <button
                            type="button"
                            className="share-modal-top-user-trigger share-modal-top-user-name"
                            aria-describedby={tooltipId}
                            title={email}
                          >
                            {displayName}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {showQuickPanelEmpty ? (
                <div className="share-modal-side-box-empty">
                  <Search width={32} height={32} />
                  {quickPanelEmptyLabel}
                </div>
              ) : null}

              {quickPanelLoading ? (
                <div className="share-modal-side-box-loading-overlay" aria-hidden="true">
                  <div className="userpostsloadani">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="share-modal-side-box-empty">
                <Search width={32} height={32} />
                Search Users
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default ShareModal;
