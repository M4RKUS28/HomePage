import React, { useState, useEffect, useCallback } from 'react';
import { getMessagesApi, markMessageAsReadApi, deleteMessageApi } from '../../api/messages';
import Spinner from '../UI/Spinner';
import { Mail, MailOpen, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns'; 
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const MessageItem = ({ message, onMarkAsRead, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format the date
  const formattedDate = format(new Date(message.timestamp), 'MMM d, yyyy - h:mm a');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y:10 }}
      animate={{ opacity: 1, y:0 }}
      exit={{ opacity: 0 }}
      className={`message-item ${!message.is_read ? 'unread' : ''}`}
    >
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center mb-1">
            {message.is_read ? 
              <MailOpen size={18} className="mr-2 text-gray-500 dark:text-gray-500 light:text-gray-400" /> : 
              <Mail size={18} className="mr-2 text-primary animate-pulse-fast" />
            }
            <span className={`message-sender ${!message.is_read ? 'unread' : ''}`}>
              From: {message.sender_username}
            </span>
          </div>
          <p className="message-timestamp">
            {formattedDate} ({formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!message.is_read && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkAsRead(message.id);}} 
              title="Mark as Read"
              className="p-1 dark:text-green-400 dark:hover:text-green-300 light:text-green-600 light:hover:text-green-500 transition-colors"
            >
              <MailOpen size={18} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(message.id); }} 
            title="Delete Message"
            className="p-1 dark:text-red-400 dark:hover:text-red-300 light:text-red-500 light:hover:text-red-600 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t dark:border-gray-700 light:border-gray-300"
          >
            <h4 className="text-sm font-medium dark:text-gray-300 light:text-gray-700 mb-2">Message:</h4>
            <div className="message-content">
              {message.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMessagesApi();
      setMessages(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); // Sort newest first
    } catch (err) {
      setError('Failed to load messages.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAsRead = async (messageId) => {
    try {
      const updatedMessage = await markMessageAsReadApi(messageId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
    } catch (err) {
      alert('Failed to mark message as read.');
    }
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessageApi(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } catch (err) {
        alert('Failed to delete message.');
      }
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return <p className="text-red-400 text-center py-10">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-mode-primary">Received Messages ({messages.filter(m => !m.is_read).length} unread)</h3>
        <button onClick={fetchMessages} className="btn btn-secondary btn-sm !py-1 !px-2" title="Refresh Messages">
          <RefreshCw size={16} />
        </button>
      </div>
      {messages.length === 0 ? (
        <p className="text-mode-secondary text-center py-6">No messages yet.</p>
      ) : (
        <AnimatePresence>
        {messages.map(message => (
          <MessageItem 
            key={message.id} 
            message={message} 
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default MessageList;