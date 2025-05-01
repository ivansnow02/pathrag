import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'rsuite';
import Layout from '../components/Layout';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { chatAPI } from '../services/api';
import '../styles/chat.css';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchContext, setSearchContext] = useState('hybrid');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);

      try {
        const response = await chatAPI.getChats();

        // Format messages
        const formattedMessages = response.data.chats.map((chat) => [
          {
            id: `${chat.id}-user`,
            content: chat.message,
            isUser: true,
          },
          {
            id: `${chat.id}-ai`,
            content: chat.response,
            isUser: false,
          },
        ]).flat();

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }

    // Alternative method using the container
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Send message
  const handleSendMessage = async (message) => {
    if (!message.trim() || sending) return;

    // Add user message to state
    const userMessage = {
      id: `temp-${Date.now()}-user`,
      content: message,
      isUser: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setSending(true);

    try {
      // Send message to API with search mode
      console.log(`Sending message with search mode: ${searchContext}`);
      const response = await chatAPI.createChat({
        message: message,
        mode: searchContext
      });

      // Add AI response to state
      const aiMessage = {
        id: `${response.data.id}-ai`,
        content: response.data.response,
        isUser: false,
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, there was an error processing your request.',
        isUser: false,
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setSending(false);
    }
  };


  return (
    <Layout>
      <div className="chat-page">
        <div className="chat-content">
          <div className="messages-container" id="chat-messages" ref={messagesContainerRef}>
            {loading ? (
              <div className="loading-message">
                <Loader content="Loading chat history..." vertical />
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="conversation-thread">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-wrapper ${message.isUser ? 'user-message-wrapper' : 'ai-message-wrapper'}`}
                  >
                    <ChatMessage
                      message={message.content}
                      isUser={message.isUser}
                    />
                  </div>
                ))}

                {sending && (
                  <div className="message-wrapper ai-message-wrapper">
                    <div className="loading-message">
                      <Loader size="md" content="Thinking..." vertical />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} style={{ height: 1, clear: 'both' }} />
              </div>
            )}
          </div>
        </div>

        <div className="chat-input-container">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={sending}
            searchContext={searchContext}
            setSearchContext={setSearchContext}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
