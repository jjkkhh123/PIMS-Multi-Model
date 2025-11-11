import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { UploadIcon, MicIcon, SendIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, image: File | null) => void;
  isLoading: boolean;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
  </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text && !image) return;
    onSendMessage(text, image);
    setText('');
    handleRemoveImage();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(event as any);
    }
  };


  return (
    <div className="flex flex-col h-full bg-gray-900/50">
      <header className="p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-bold text-cyan-400">LifeOS Assistant</h1>
      </header>
      
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg lg:max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="upload" className="rounded-md mb-2 max-w-xs" />
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="p-3 rounded-lg bg-gray-700 text-gray-200">
                <TypingIndicator />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          {imagePreview && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 rounded-lg">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-black bg-opacity-70 text-white rounded-full p-1 leading-none text-xs"
                  aria-label="Remove image"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <textarea
            className="w-full p-3 pr-28 bg-gray-700 text-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
            placeholder="메시지를 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={isLoading}
            />
            <button
                type="button"
                onClick={handleUploadClick}
                className="p-2 text-gray-400 hover:text-cyan-400 disabled:opacity-50"
                aria-label="Upload image"
                disabled={isLoading}
            >
                <UploadIcon className="h-6 w-6" />
            </button>
            <button
                type="submit"
                className="flex items-center justify-center h-10 w-10 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-cyan-800"
                disabled={isLoading || (!text && !image)}
                aria-label="Send message"
            >
                <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
