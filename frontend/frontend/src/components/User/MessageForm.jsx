import React, { useState } from 'react';
import { createMessageApi } from '../../api/messages';
import Spinner from '../UI/Spinner';
import { Send } from 'lucide-react';

const MessageForm = ({ onMessageSent }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await createMessageApi(content);
      setSuccess('Message sent successfully!');
      setContent('');
      if (onMessageSent) onMessageSent(); // Optional callback
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message.');
      console.error(err);
    } finally {
      setIsLoading(false);
      // Clear success/error messages after a few seconds
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-lg mx-auto">
      <h3 className="text-2xl font-semibold text-white mb-6 text-center">Send me a Message</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded text-center">{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-900/30 p-2 rounded text-center">{success}</p>}
        <div>
          <label htmlFor="messageContent" className="block text-sm font-medium text-gray-300 mb-1">
            Your Message
          </label>
          <textarea
            id="messageContent"
            name="content"
            rows="5"
            className="input-field w-full"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            required
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            className="w-full btn btn-primary flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="h-5 w-5" color="text-white" /> : <><Send size={18} className="mr-2" /> Send Message</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageForm;