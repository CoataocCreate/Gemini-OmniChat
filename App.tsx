import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ModelId, ChatSession, Attachment } from './types';
import { streamMessage, hasApiKey } from './services/geminiService';
import { loadSessions, saveSession, deleteSession, createNewSession } from './services/chatStorage';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { Sidebar } from './components/Sidebar';
import { GeminiLogo } from './components/GeminiLogo';
import { AlertCircle, Menu } from 'lucide-react';

const App: React.FC = () => {
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    
    if (loadedSessions.length > 0) {
      setCurrentSession(loadedSessions[0]);
    } else {
      const newSession = createNewSession(ModelId.FLASH);
      setCurrentSession(newSession);
      setSessions([newSession]); // Don't save to local storage yet until message sent
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleNewChat = () => {
    const newSession = createNewSession(ModelId.FLASH);
    setCurrentSession(newSession);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const updatedSessions = deleteSession(sessionId);
    setSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSession(updatedSessions[0]);
      } else {
        handleNewChat();
      }
    }
  };

  const handleModelChange = (modelId: ModelId) => {
    if (currentSession) {
      const updatedSession = { ...currentSession, modelId };
      setCurrentSession(updatedSession);
      
      // Only save if session already exists in history
      if (sessions.find(s => s.id === updatedSession.id)) {
         const savedSessions = saveSession(updatedSession);
         setSessions(savedSessions);
      }
    }
  };

  const handleSendMessage = useCallback(async (content: string, attachments: Attachment[], useSearch: boolean) => {
    if (!hasApiKey()) {
      setError("API Key is missing. Please set process.env.API_KEY.");
      return;
    }
    
    if (!currentSession) return;

    setError(null);
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      attachments, // Store attachments
      timestamp: Date.now()
    };

    // Create optimistic updated session
    let updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMsg],
      updatedAt: Date.now()
    };

    // Generate title if it's the first message
    if (currentSession.messages.length === 0) {
       const titleText = content ? content.slice(0, 30) : "Image Message";
       const title = titleText + (content.length > 30 ? '...' : '');
       updatedSession.title = title;
    }

    setCurrentSession(updatedSession);
    
    // Save immediately to ensure user message is persisted
    const savedSessionsAfterUser = saveSession(updatedSession);
    setSessions(savedSessionsAfterUser);

    const botMsgId = (Date.now() + 1).toString();
    const botMsgPlaceholder: Message = {
      id: botMsgId,
      role: Role.MODEL,
      content: '',
      isThinking: true,
      timestamp: Date.now()
    };

    // Add placeholder
    updatedSession = {
      ...updatedSession,
      messages: [...updatedSession.messages, botMsgPlaceholder]
    };
    setCurrentSession(updatedSession);

    try {
      // streamMessage now accepts attachments and useSearch flag
      const stream = streamMessage(
        content || " ", // ensure content is not empty string if only image sent
        updatedSession.modelId, 
        updatedSession.messages.slice(0, -1),
        attachments,
        useSearch
      );
      
      let accumulatedText = '';
      let accumulatedMetadata: any = undefined;

      for await (const chunk of stream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
        }
        
        if (chunk.groundingMetadata) {
          accumulatedMetadata = chunk.groundingMetadata;
        }
        
        // Update local state for animation
        setCurrentSession(prev => {
          if (!prev) return null;
          const newMessages = prev.messages.map(msg => {
            if (msg.id === botMsgId) {
              return {
                ...msg,
                content: accumulatedText,
                isThinking: false,
                groundingMetadata: accumulatedMetadata
              };
            }
            return msg;
          });
          return { ...prev, messages: newMessages };
        });
      }

      // Final save after streaming is complete
      setCurrentSession(prev => {
        if (!prev) return null;
        const finalSession = { ...prev, updatedAt: Date.now() };
        const savedSessionsFinal = saveSession(finalSession);
        setSessions(savedSessionsFinal);
        return finalSession;
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with Gemini.");
      // Remove the bot placeholder on error
      setCurrentSession(prev => {
        if (!prev) return null;
        const newMessages = prev.messages.filter(msg => msg.id !== botMsgId);
        return { ...prev, messages: newMessages };
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, sessions]);

  if (!hasApiKey()) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-400">
        <div className="max-w-md text-center space-y-4 border border-zinc-800 p-8 rounded-2xl bg-zinc-900/50">
          <AlertCircle className="w-10 h-10 text-zinc-200 mx-auto" />
          <h1 className="text-xl font-medium text-white">Configuration Required</h1>
          <p className="text-sm">Please configure <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-700 font-mono text-xs">process.env.API_KEY</code> to use this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-zinc-800 selection:text-white">
      
      {/* Sidebar (Drawer on Mobile, Persistent on Desktop) */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        currentModel={currentSession?.modelId || ModelId.FLASH}
        onSelectModel={handleModelChange}
        isModelLoading={isLoading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Compact Header (Mobile Only for Menu, Desktop for Title/Status) */}
        <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            
            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-3 md:hidden">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop Spacer / Current Chat Title */}
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-400">
              <GeminiLogo className="w-4 h-4 opacity-50" />
              <span className="truncate max-w-xs">{currentSession?.title || 'New Chat'}</span>
            </div>
            
            {/* Right Side Status */}
            <div className="flex items-center gap-3">
               {isLoading && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Generating</span>
                 </div>
               )}
            </div>

          </div>
        </header>

        {/* Chat Scroll Area */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="max-w-3xl mx-auto px-4 py-8 min-h-full flex flex-col">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 mt-[-5vh] space-y-6">
                <div className="w-16 h-16 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center shadow-2xl shadow-black">
                  <GeminiLogo className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-zinc-200 font-medium text-lg">Gemini OmniChat</h2>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Select a model from the sidebar and start a conversation. You can now upload images!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 pb-4 space-y-8">
                {currentSession.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {error && (
                  <div className="flex justify-center my-4">
                    <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default App;