import React, { useState, useRef, useEffect } from "react";
import { askQuestion } from "../api/api";
import ReactMarkdown from "react-markdown";
import "./Chat.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await askQuestion(userMessage.text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.answer,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Ask the Paper</h2>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <p>
              Start a conversation by asking a question about the uploaded PDF.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${
              message.sender === "user" ? "user-message" : "ai-message"
            }`}
          >
            <div className={`message-bubble ${message.sender}`}>
              {message.sender === "ai" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="markdown-p">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="markdown-ul">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="markdown-ol">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="markdown-li">{children}</li>
                    ),
                    code: ({ children }) => (
                      <code className="markdown-code">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="markdown-pre">{children}</pre>
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-wrapper ai-message">
            <div className="message-bubble ai loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask any question about the uploaded PDF..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
