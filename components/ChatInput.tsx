import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Paperclip, X, Globe, MapPin } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[], useSearch: boolean) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    
    onSend(text, attachments, useSearch);
    
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simple size limit check (1MB)
      if (file.size > 1024 * 1024) {
        alert("File too large. Please select an image under 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        // Extract base64 data part (remove data:image/xyz;base64,)
        const base64Data = base64String.split(',')[1];
        
        setAttachments(prev => [...prev, {
          mimeType: file.type,
          data: base64Data
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent sticky bottom-0 z-10">
      <div className="max-w-3xl mx-auto relative">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                <div className="w-16 h-16 rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900">
                  <img 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    alt="preview" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-full p-0.5 border border-zinc-700 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className={`relative flex items-end gap-2 bg-zinc-900 p-2 rounded-[26px] border transition-all duration-300 shadow-lg shadow-black/20 ${
            useSearch ? 'border-blue-900/50 ring-1 ring-blue-900/30' : 'border-zinc-800 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700'
          }`}
        >
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Attach Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setUseSearch(!useSearch)}
            disabled={disabled}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 relative ${
              useSearch 
                ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50 hover:bg-blue-600/30' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title={useSearch ? "Internet Access On" : "Enable Internet Access"}
          >
            {useSearch ? <Globe className="w-5 h-5" /> : <Globe className="w-5 h-5 opacity-70" />}
            {useSearch && <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_4px_rgba(96,165,250,0.8)]" />}
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={useSearch ? "Ask anything on the web..." : "Message Gemini..."}
            className="w-full bg-transparent text-zinc-200 placeholder-zinc-500 px-2 py-3 focus:outline-none resize-none max-h-[200px] overflow-y-auto rounded-xl text-[15px] leading-relaxed scrollbar-hide"
            rows={1}
          />
          
          <button
            type="submit"
            disabled={(!text.trim() && attachments.length === 0) || disabled}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              (text.trim() || attachments.length > 0) && !disabled
                ? 'bg-white text-black hover:bg-zinc-200 shadow-md'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
          </button>
        </form>
        
        <div className="text-center mt-3 h-4">
          {useSearch ? (
            <div className="inline-flex items-center gap-1.5 text-[10px] text-blue-400/80 font-medium px-2 py-0.5 rounded-full bg-blue-950/30 border border-blue-900/30">
              <Globe className="w-3 h-3" />
              <span>Searching Google & Maps enabled</span>
            </div>
          ) : (
             <p className="text-[10px] text-zinc-600 font-medium">Gemini can make mistakes. Check important info.</p>
          )}
        </div>
      </div>
    </div>
  );
};