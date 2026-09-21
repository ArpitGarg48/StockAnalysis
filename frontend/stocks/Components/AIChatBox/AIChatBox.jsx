import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Activity, Key, Loader2, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AIChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isApiKeySet, setIsApiKeySet] = useState(!!localStorage.getItem('gemini_api_key'));
  const [tempApiKey, setTempApiKey] = useState('');
  
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your AI Trading Assistant. How can I help you with your stock analysis today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini_api_key', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      setIsApiKeySet(true);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsApiKeySet(false);
    setTempApiKey('');
    setMessages([
      { role: 'model', text: 'Hello! I am your AI Trading Assistant. How can I help you with your stock analysis today?' }
    ]);
  };

  const getGeminiResponse = async (userText, chatHistory) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        systemInstruction: "You are an expert AI stock trading assistant. Guide the user on what stocks to buy, when to sell, and portfolio management. Give concise, professional, and actionable advice. Always add a disclaimer that you provide educational guidance, not financial advice.",
      });

      // Filter out the default greeting
      const rawHistory = chatHistory.filter(msg => msg.text !== 'Hello! I am your AI Trading Assistant. How can I help you with your stock analysis today?');
      
      // Build a strictly alternating history starting with 'user'
      let sanitizedHistory = [];
      for (const msg of rawHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        if (sanitizedHistory.length === 0 && role === 'model') {
          // Skip leading model messages
          continue;
        }
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === role) {
          // Combine consecutive messages of the same role
          sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\\n" + msg.text;
        } else {
          sanitizedHistory.push({ role, parts: [{ text: msg.text }] });
        }
      }

      // Add the new user message
      if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
        sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\\n" + userText;
      } else {
        sanitizedHistory.push({ role: 'user', parts: [{ text: userText }] });
      }

      const result = await model.generateContent({ contents: sanitizedHistory });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      if (error.message && error.message.includes("API key not valid")) {
        return "Error: Invalid API key. Please clear your API key and try again.";
      }
      return `Error from AI: ${error.message || "Unknown error occurred"}. Please try again.`;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const currentHistory = [...messages];
    
    // Add user message to UI immediately
    setMessages([...currentHistory, { role: 'user', text: userText }]);
    setInputValue('');
    setIsLoading(true);

    // Fetch AI response
    const aiResponseText = await getGeminiResponse(userText, currentHistory);

    // Add AI response to UI
    setMessages(prev => [...prev, { role: 'model', text: aiResponseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 flex flex-col border border-gray-200 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 animate-pulse" />
              <h3 className="font-semibold text-lg">AI Trading Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              {isApiKeySet && (
                <button 
                  onClick={handleClearApiKey}
                  title="Clear API Key"
                  className="text-blue-200 hover:text-white transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isApiKeySet ? (
            /* API Key Setup Screen */
            <div className="flex-1 p-6 flex flex-col justify-center items-center bg-gray-50 text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Setup Required</h4>
              <p className="text-sm text-gray-600 mb-6">
                Please enter your Google Gemini API key to activate the intelligent trading assistant.
              </p>
              <form onSubmit={handleSaveApiKey} className="w-full flex flex-col space-y-3">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter Gemini API Key..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Key
                </button>
              </form>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 text-xs text-blue-500 hover:underline"
              >
                Get a free API key here
              </a>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white self-end rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 self-start rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-white border border-gray-100 text-gray-800 p-3 rounded-lg text-sm shadow-sm self-start rounded-bl-none flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Analyzing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about buying or selling..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all transform flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium hidden sm:inline-block">AI Advisor</span>
        </button>
      )}
    </div>
  );
};

export default AIChatBox;
