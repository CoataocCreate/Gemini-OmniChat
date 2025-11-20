import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { Copy, Check, ChevronDown, ChevronRight, BrainCircuit, Globe, ExternalLink, Search, Terminal } from 'lucide-react';
import { GeminiLogo } from './GeminiLogo';

interface MessageBubbleProps {
  message: Message;
}

const ThinkingWidget = () => {
  return (
    <div className="flex flex-col gap-3 max-w-[90%]">
      <div className="flex items-center gap-3 text-zinc-500 animate-pulse">
        <BrainCircuit className="w-4 h-4" />
        <span className="text-xs font-medium tracking-wide">Analyzing request...</span>
      </div>
      <div className="space-y-2 opacity-50">
        <div className="h-2 w-full bg-zinc-800 rounded overflow-hidden">
          <div className="h-full w-1/2 bg-zinc-700 animate-shimmer-bg" />
        </div>
        <div className="h-2 w-3/4 bg-zinc-800 rounded overflow-hidden">
          <div className="h-full w-1/2 bg-zinc-700 animate-shimmer-bg" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
};

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline) {
    return (
      <div className="my-6 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/50 shadow-sm group/code">
        {/* Code Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Window Controls */}
            <div className="flex gap-1.5 opacity-70 group-hover/code:opacity-100 transition-opacity">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover/code:bg-red-500/80 transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover/code:bg-yellow-500/80 transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover/code:bg-emerald-500/80 transition-colors" />
            </div>
            <span className="text-xs font-medium text-zinc-400 font-mono lowercase select-none ml-2">
              {language}
            </span>
          </div>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all focus:outline-none"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        
        {/* Code Body */}
        <div className="overflow-x-auto">
          <code className={`block p-4 font-mono text-[13px] leading-relaxed text-zinc-300 ${className}`} {...props}>
            {children}
          </code>
        </div>
      </div>
    );
  }

  return (
    <code className="px-1.5 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 font-mono text-[13px]" {...props}>
      {children}
    </code>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);
  const [isThoughtsOpen, setIsThoughtsOpen] = useState(true);

  const handleCopy = async () => {
    if (!message.content) return;
    
    try {
      // Strip thinking tags for copy
      const cleanContent = message.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
      await navigator.clipboard.writeText(cleanContent || message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'web';
    }
  };

  // Format timestamp
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(message.timestamp));

  // Content Parsing for Thinking Models
  let thoughtContent = '';
  let finalContent = message.content;

  // Regex to extract content between <thinking> tags
  const thoughtMatch = message.content.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/);
  
  if (thoughtMatch) {
    thoughtContent = thoughtMatch[1].trim();
    // Remove the thinking block from the displayed final content
    finalContent = message.content.replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/, '').trim();
  }

  if (!isUser && !message.isThinking && !finalContent && !thoughtContent) {
     finalContent = ""; 
  }

  const hasGrounding = 
    (message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0) ||
    (message.groundingMetadata?.webSearchQueries && message.groundingMetadata.webSearchQueries.length > 0);

  if (isUser) {
    return (
      <div className="flex w-full justify-end group">
        <div className="max-w-[85%] md:max-w-[75%] flex flex-col items-end gap-1">
          {/* User Attachments */}
          {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap justify-end gap-2 mb-1">
               {message.attachments.map((att, idx) => (
                 <div key={idx} className="rounded-xl overflow-hidden border border-zinc-700 shadow-sm max-w-[200px]">
                   <img 
                     src={`data:${att.mimeType};base64,${att.data}`} 
                     alt="attachment" 
                     className="w-full h-auto"
                   />
                 </div>
               ))}
             </div>
          )}

          {message.content && (
            <div className="bg-zinc-800 text-zinc-100 px-5 py-3.5 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm border border-zinc-700/50">
               {message.content}
            </div>
          )}
          
          <span className="text-[10px] text-zinc-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start group px-2 md:px-0">
      <div className="flex w-full max-w-full md:max-w-[95%] gap-4">
        
        {/* Avatar/Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-sm">
             <GeminiLogo className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-w-0 pt-1">
          
          {/* Initial Loading State */}
          {message.isThinking && !message.content && (
             <ThinkingWidget />
          )}

          {/* Parsed Thinking Block */}
          {thoughtContent && (
            <div className="mb-6 rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-900/30">
              <button 
                onClick={() => setIsThoughtsOpen(!isThoughtsOpen)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left group/header border-b border-zinc-800/30"
              >
                <div className="p-1 rounded bg-zinc-800 text-zinc-400 group-hover/header:text-zinc-300">
                  <BrainCircuit className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 group-hover/header:text-zinc-300 flex-1 uppercase tracking-wider">
                  Reasoning Process
                </span>
                {isThoughtsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>
              
              {isThoughtsOpen && (
                <div className="px-5 py-4 bg-zinc-950/30">
                   <div className="prose prose-invert prose-zinc max-w-none prose-p:text-xs prose-p:text-zinc-400 prose-p:leading-6 prose-li:text-xs prose-li:text-zinc-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                     <ReactMarkdown
                       components={{
                         code: CodeBlock
                       }}
                     >{thoughtContent}</ReactMarkdown>
                   </div>
                   {!finalContent && !message.isThinking && (
                     <div className="flex items-center gap-2 mt-2 text-zinc-600 text-xs animate-pulse">
                        <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                        Finalizing response...
                     </div>
                   )}
                </div>
              )}
            </div>
          )}

          {/* Final Response Content */}
          {finalContent ? (
            <>
              <div className="markdown-content prose prose-invert prose-zinc max-w-none 
                prose-p:text-[15px] prose-p:text-zinc-300 prose-p:leading-7
                prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-strong:text-white prose-strong:font-medium
                prose-ul:text-zinc-300 prose-ul:my-4 prose-li:my-1
                prose-ol:text-zinc-300 prose-ol:my-4
                prose-blockquote:border-l-2 prose-blockquote:border-zinc-700 prose-blockquote:bg-zinc-900/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-zinc-400 prose-blockquote:italic
                prose-a:text-blue-400 prose-a:underline prose-a:decoration-blue-400/30 prose-a:underline-offset-4 hover:prose-a:decoration-blue-400
                prose-table:w-full prose-table:text-sm prose-table:border-separate prose-table:border-spacing-0 prose-table:border prose-table:border-zinc-800 prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-6
                prose-thead:bg-zinc-900/80
                prose-th:border-b prose-th:border-zinc-800 prose-th:p-3 prose-th:text-left prose-th:text-zinc-200 prose-th:font-medium
                prose-td:border-b prose-td:border-zinc-800/50 prose-td:p-3 prose-td:text-zinc-400 prose-td:last:border-b-0
                prose-hr:border-zinc-800 prose-hr:my-8">
                <ReactMarkdown
                  components={{
                    code: CodeBlock
                  }}
                >
                  {finalContent}
                </ReactMarkdown>
              </div>
              
              {/* Search Grounding & Sources */}
              {hasGrounding && (
                <div className="mt-8 pt-5 border-t border-zinc-800/60">
                  
                  {/* Related Search Queries */}
                  {message.groundingMetadata?.webSearchQueries && message.groundingMetadata.webSearchQueries.length > 0 && (
                     <div className="mb-5">
                       <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                         <Search className="w-3.5 h-3.5" />
                         <span>Related Searches</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                        {message.groundingMetadata.webSearchQueries.map((query, idx) => (
                          <a 
                            key={idx}
                            href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:text-blue-400 transition-all text-xs text-zinc-400"
                          >
                            <span>{query}</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        ))}
                       </div>
                     </div>
                  )}

                  {/* Source Cards Grid */}
                  {message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Sources</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
                          if (!chunk.web?.uri) return null;
                          const favicon = getFaviconUrl(chunk.web.uri);
                          const domain = getDomain(chunk.web.uri);
                          
                          return (
                            <a
                              key={idx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all group/card h-full"
                            >
                              <div className="flex items-center gap-2">
                                {favicon ? (
                                  <img src={favicon} alt="" className="w-4 h-4 rounded-sm bg-white/10" />
                                ) : (
                                  <Globe className="w-4 h-4 text-zinc-600" />
                                )}
                                <span className="text-[10px] font-medium text-zinc-500 truncate group-hover/card:text-zinc-400">
                                  {domain}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-300 font-medium line-clamp-2 group-hover/card:text-blue-400 transition-colors leading-snug">
                                {chunk.web.title || chunk.web.uri}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors text-xs font-medium bg-zinc-900/50 px-2 py-1 rounded-md"
                  aria-label="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className={copied ? 'text-emerald-500' : ''}>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <span className="text-[10px] text-zinc-700 font-medium">
                  {formattedTime}
                </span>
              </div>
            </>
          ) : (
            /* If we have thoughts but no final content yet, show a subtle indicator */
             thoughtContent && !message.isThinking ? (
               <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-zinc-900/20 border border-zinc-800/50 rounded-lg animate-pulse">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                  <span className="text-xs text-zinc-500 font-medium">Generating answer...</span>
               </div>
             ) : null
          )}
        </div>
      </div>
    </div>
  );
};