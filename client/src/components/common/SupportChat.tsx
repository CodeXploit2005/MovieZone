import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiHeadphones, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import supportService from '../../services/supportService';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface Message {
  _id: string;
  content: string;
  isAdmin: boolean;
  isEdited?: boolean;
  createdAt: string;
}

const SupportChat = () => {
  const { user, theme, isModalOpen } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll visibility
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const fetchMessages = async () => {
    try {
      if (!user) return;
      const data = await supportService.getUserMessages(user.token);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user?.token || loading) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      setLoading(true);
      const data = await supportService.sendUserMessage(user.token, content);
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('send_failed'));
      setNewMessage(content);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage?.content.trim() || !user?.token) return;

    try {
      const data = await supportService.updateMessage(user.token, editingMessage.id, editingMessage.content);
      setMessages(messages.map(m => m._id === editingMessage.id ? data : m));
      setEditingMessage(null);
      toast.success(t('msg_updated'));
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_msg')) || !user?.token) return;
    try {
      await supportService.deleteMessage(user.token, id);
      setMessages(messages.filter(m => m._id !== id));
      toast.success(t('msg_withdrawn'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {isVisible && !isModalOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-28 right-10 z-[999] w-14 h-14 rounded-[1.2rem] shadow-[0_10px_30px_rgba(229,9,20,0.3)] transition-all duration-300 flex items-center justify-center border border-white/10 bg-primary text-white hover:scale-105 ${
              isOpen ? 'rotate-90' : ''
            }`}
          >
            {isOpen ? (
              <FiX size={28} />
            ) : (
              <div className="relative">
                <FiMessageCircle size={30} fill="white" className="text-white" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-primary"></span>
                </span>
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && !isModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            className={`fixed bottom-[180px] right-10 z-[998] w-[320px] h-[450px] rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border ${
              theme === 'dark' ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Header */}
            <div className="bg-primary p-3.5 px-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <FiHeadphones size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[12px] uppercase tracking-tight">{t('support_moviezone')}</h3>
                  <div className="flex items-center text-[8px] font-medium text-white/80 uppercase tracking-widest mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />
                    {t('online')}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <FiX size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className={`flex-grow overflow-y-auto p-3.5 space-y-3.5 scrollbar-none ${
                theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50/50'
              }`}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                  <FiMessageCircle size={40} className="mb-3 text-primary" />
                  <p className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{t('hello_user')}</p>
                  <p className={`text-[8px] mt-1 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{t('how_can_we_help')}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg._id}
                    className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-start space-x-2 w-full max-w-[90%] group">
                      {msg.isAdmin && (
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                          }`}>
                            <FiShield className="text-primary" size={10} />
                          </div>
                        </div>
                      )}
                      <div className={`relative px-5 py-3.5 shadow-xl transition-all min-w-[80px] ${
                        msg.isAdmin 
                          ? `${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-dark'} rounded-[1.2rem] rounded-bl-[0.3rem]` 
                          : 'bg-primary text-white rounded-[1.2rem] rounded-br-[0.3rem] ml-auto'
                      }`}>
                        {editingMessage?.id === msg._id ? (
                          <form onSubmit={handleUpdateMessage} className="flex flex-col space-y-1.5">
                            <textarea
                              value={editingMessage.content}
                              onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                              className={`p-2 rounded-lg resize-none outline-none text-[10px] border ${
                                theme === 'dark' ? 'bg-black/40 text-white border-white/10' : 'bg-white text-dark border-gray-200'
                              }`}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                              <button type="button" onClick={() => setEditingMessage(null)} className={`text-[8px] uppercase font-black opacity-60 hover:opacity-100 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                                {t('cancel')}
                              </button>
                              <button type="submit" className="text-[8px] uppercase font-black text-green-400 hover:text-green-300">
                                {t('save')}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="text-[13px] font-bold leading-tight whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center mt-1.5 ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                              {msg.isEdited && (
                                <span className="text-[8px] opacity-40 italic mr-1">{t('edited_label')}</span>
                              )}
                              <span className="text-[9px] font-bold opacity-40">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!msg.isAdmin && (
                              <div className="absolute top-0 right-full mr-2 hidden group-hover:flex items-center space-x-1">
                                <button 
                                  onClick={() => setEditingMessage({ id: msg._id, content: msg.content })}
                                  className={`p-1 rounded-full transition-colors ${
                                    theme === 'dark' ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/5 text-black/40 hover:text-black'
                                  }`}
                                >
                                  <FiEdit2 size={10} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    theme === 'dark' ? 'hover:bg-white/10 text-white/40 hover:text-red-400' : 'hover:bg-black/5 text-black/40 hover:text-red-500'
                                  }`}
                                >
                                  <FiTrash2 size={10} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className={`p-3 border-t ${
              theme === 'dark' ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'
            }`}>
              <form 
                onSubmit={handleSendMessage}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('type_support_message')}
                  className={`w-full border rounded-[1rem] py-2 px-4 pr-10 text-[12px] outline-none transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-primary/30 focus:border-primary text-white placeholder:text-neutral-600' 
                      : 'bg-gray-100 border-gray-200 focus:border-primary text-dark placeholder:text-gray-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || loading}
                  className={`absolute right-2.5 p-1 transition-all ${
                    newMessage.trim() && !loading
                      ? 'text-primary scale-110'
                      : 'text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <FiSend size={18} fill={newMessage.trim() && !loading ? "currentColor" : "none"} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;
