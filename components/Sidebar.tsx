import React from 'react';
import { MessageSquare, Plus, Trash2, X, MessageCircle, Clock, Settings2 } from 'lucide-react';
import { ChatSession, ModelId } from '../types';
import { ModelSelector } from './ModelSelector';
import { GeminiLogo } from './GeminiLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
  currentModel: ModelId;
  onSelectModel: (modelId: ModelId) => void;
  isModelLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  currentModel,
  onSelectModel,
  isModelLoading
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-950 border-r border-zinc-900 
        transform transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 md:static md:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-tight">
             <GeminiLogo className="w-6 h-6 text-white" />
             <span>Gemini Chat</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 bg-zinc-100 hover:bg-white text-zinc-950 font-medium py-2.5 px-4 rounded-lg transition-all active:scale-[0.98] shadow-sm border border-transparent"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Chat</span>
          </button>
        </div>

        {/* History Label */}
        <div className="px-4 py-2 mt-2">
          <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Recent History
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-sm px-4 text-center">
              <MessageCircle className="w-8 h-8 mb-3 opacity-20" />
              <p>No chat history yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Start a new conversation to see it here.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all border border-transparent ${
                  currentSessionId === session.id
                    ? 'bg-zinc-900 text-zinc-100 border-zinc-800 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                    currentSessionId === session.id ? 'text-zinc-100' : 'text-zinc-600'
                  }`} />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[13px] font-medium truncate pr-2 block">
                      {session.title || 'New Chat'}
                    </span>
                  </div>
                </div>
                
                <div 
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 hover:text-red-400 rounded-md text-zinc-600 transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer / Model Selector */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950 shrink-0 z-10">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Model Selection</span>
          </div>
          <ModelSelector 
            currentModel={currentModel}
            onSelect={onSelectModel}
            disabled={isModelLoading}
            compact={true}
            direction="top"
          />
        </div>
      </aside>
    </>
  );
};